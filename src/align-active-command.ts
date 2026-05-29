/**
 * @fileoverview Config-driven sequential align-active command runner.
 *
 * Flow: argv + project worktree config -> prepared-worktree selection -> plan/normalization ->
 * merge/update execution -> final validation. Project command surfaces and required command policy
 * stay in root config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/align-active.ts - Core align-active factory whose plan builders, metadata reads, dirty normalization, refresh-mode selection, and alignment validation this command orchestrates from argv plus project config.
 * @see packages/worktree-kit/src/merge-command.ts - Merge-to-target batch runner invoked per prepared worktree after normalization when `--push` executes the sequential alignment.
 * @see packages/worktree-kit/src/update-from-main-command.ts - Update-from-main refresh runner invoked per worktree after root checkout sync finishes the merge batch under `--push`.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import path from "node:path";

import {
  worktreeStackError,
  worktreeStackInfo,
  worktreeStackPrintKv,
  worktreeStackRequireCommand,
} from "@gg-utils/worktree-core/foundation";
import {
  worktreeStackAcquireRepoWriterLock,
  worktreeStackReleaseAllNamedLocks,
  worktreeStackReleaseRepoWriterLock,
} from "@gg-utils/worktree-core/repo-locks";

import {
  WorktreeStackKit_createAlignActive,
  type WorktreeAlignActiveDirtyPolicy,
  type WorktreeAlignActiveExecutionMode,
  type WorktreeAlignActiveMetadata,
  type WorktreeAlignActiveRefreshMode,
  type WorktreeStackKit_AlignActiveConfig,
} from "./align-active.js";
import { WorktreeStackKit_createMergeCommand } from "./merge-command.js";
import { WorktreeStackKit_createUpdateFromMainCommand } from "./update-from-main-command.js";
import { WorktreeStackKit_syncRepoRootTargetCheckout } from "./repo-root-sync.js";

export type WorktreeStackKit_AlignActiveCommandUsageConfig = {
  commandLines: readonly string[];
};

export type WorktreeStackKit_AlignActiveCommandConfig = {
  alignActive: WorktreeStackKit_AlignActiveConfig;
  projectRoot: string;
  requiredCommandNames: readonly string[];
  usage: WorktreeStackKit_AlignActiveCommandUsageConfig;
};

/** Parsed argv for sequential align-active orchestration across one or more prepared worktrees. */
export type WorktreeAlignActiveOptions = {
  dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
  executionMode: WorktreeAlignActiveExecutionMode;
  refreshMode: WorktreeAlignActiveRefreshMode;
  targetBranch: string;
  worktreePaths: string[];
};

export type WorktreeStackKit_AlignActiveCommand = {
  buildAlignActivePlanReport: (
    metadata: WorktreeAlignActiveMetadata,
    state: Pick<
      WorktreeAlignActiveOptions,
      "dirtyPolicy" | "refreshMode" | "targetBranch"
    >,
  ) => string[];
  parseAlignActiveCliArgs: (
    argv: readonly string[],
  ) => WorktreeAlignActiveOptions | null;
  runAlignActive: (options: WorktreeAlignActiveOptions) => Promise<number>;
  runAlignActiveCli: (argv: readonly string[]) => Promise<number>;
};

/** Renders align-active CLI usage from project-supplied command lines. */
export function WorktreeStackKit_renderAlignActiveUsage(
  config: WorktreeStackKit_AlignActiveCommandConfig,
): string {
  return [
    "Usage:",
    ...config.usage.commandLines.map((line) => `  ${line}`),
    "",
    "Options:",
    "  --worktree <path>                Prepared worktree path to include.",
    "                                   Repeat to limit the batch to specific worktrees.",
    "  --target-branch <branch>         Counterpart branch to align around (default: main)",
    "  --dirty-policy <policy>          How to handle dirty worktree repos:",
    "                                   - commit-and-push (default)",
    "                                   - fail",
    "  --refresh-mode <mode>            Refresh mode after merges:",
    "                                   - auto (default)",
    "                                   - live-worktree",
    "                                   - pushed-only",
    "  --plan                           Print the alignment plan only",
    "  --push                           Execute the alignment",
    "  --help, -h                       Show this help",
  ].join("\n");
}

export function WorktreeStackKit_createAlignActiveCommand(
  config: WorktreeStackKit_AlignActiveCommandConfig,
): WorktreeStackKit_AlignActiveCommand {
  const alignActive = WorktreeStackKit_createAlignActive(config.alignActive);
  const mergeCommand = WorktreeStackKit_createMergeCommand(
    config.alignActive.mergeCommand,
  );
  const updateFromMainCommand = WorktreeStackKit_createUpdateFromMainCommand(
    config.alignActive.updateFromMainCommand,
  );

  const {
    buildAlignActiveOperationPlan,
    buildAlignActivePlanSummary,
    worktreeStackAlignActiveDetermineRefreshMode,
    worktreeStackAlignActiveNormalizeWorktreeDomain,
    worktreeStackAlignActiveReadMetadata,
    worktreeStackAlignActiveRequireTargetCheckoutReady,
    worktreeStackAlignActiveResolveRequestedWorktrees,
    worktreeStackAlignActiveValidateWorktreeAlignment,
  } = alignActive;

  /**
   * Domain error for malformed or incomplete align-active CLI arguments.
   *
   * @remarks
   * Distinguishes argv validation failures from merge/refresh orchestration errors when the CLI wraps
   * `runAlignActive`.
   */
  class WorktreeStackKit_AlignActiveCliUsageError extends Error {}

  /**
   * Mutable orchestration snapshot for align-active progress and resolved worktree paths.
   *
   * @remarks
   * Tracks `currentStep` for structured debug output on failure and fills `resolvedWorktreePaths`
   * after argv paths are validated against prepared worktree metadata.
   */
  type WorktreeAlignActiveState = {
    currentStep: string;
    dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
    executionMode: WorktreeAlignActiveExecutionMode;
    refreshMode: WorktreeAlignActiveRefreshMode;
    resolvedWorktreePaths: string[];
    targetBranch: string;
    worktreePaths: string[];
  };

  /** Prints align-active CLI usage and flag reference to stdout. */
  function printUsage(): void {
    console.log(WorktreeStackKit_renderAlignActiveUsage(config));
  }

  /**
   * Normalizes unknown failures into a single stderr line with a stable `[worktree]` prefix.
   *
   * @remarks
   * Skips a second prefix when the message already begins with `[worktree] ` from shared helpers.
   */
  function formatCliErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith("[worktree] ")
      ? message
      : `[worktree] ERROR: ${message}`;
  }

  /**
   * Resolves `--plan` / `--push` mutual exclusion against any prior execution mode on the argv scan.
   *
   * @throws {WorktreeStackKit_AlignActiveCliUsageError} When a different execution mode was already selected.
   */
  function resolveExclusiveExecutionMode(
    current: WorktreeAlignActiveExecutionMode | null,
    requested: WorktreeAlignActiveExecutionMode,
  ): WorktreeAlignActiveExecutionMode {
    if (current !== null && current !== requested) {
      throw new WorktreeStackKit_AlignActiveCliUsageError(
        "Choose exactly one execution mode: --plan or --push.",
      );
    }
    return requested;
  }

  /**
   * Parses sequential align-active argv into options.
   *
   * @throws {WorktreeStackKit_AlignActiveCliUsageError} When argv is inconsistent or incomplete.
   */
  function parseAlignActiveCliArgs(
    argv: readonly string[],
  ): WorktreeAlignActiveOptions | null {
    let dirtyPolicy: WorktreeAlignActiveDirtyPolicy = "commit-and-push";
    let executionMode: WorktreeAlignActiveExecutionMode | null = null;
    let refreshMode: WorktreeAlignActiveRefreshMode = "auto";
    let targetBranch = "main";
    const worktreePaths: string[] = [];

    for (let index = 0; index < argv.length; ) {
      const argument = argv[index];
      switch (argument) {
        case "--worktree": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_AlignActiveCliUsageError(
              "Missing value for --worktree",
            );
          }
          worktreePaths.push(path.resolve(value));
          index += 2;
          break;
        }
        case "--target-branch": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_AlignActiveCliUsageError(
              "Missing value for --target-branch",
            );
          }
          targetBranch = value;
          index += 2;
          break;
        }
        case "--dirty-policy": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_AlignActiveCliUsageError(
              "Missing value for --dirty-policy",
            );
          }
          if (value !== "commit-and-push" && value !== "fail") {
            throw new WorktreeStackKit_AlignActiveCliUsageError(
              "Choose --dirty-policy commit-and-push or fail.",
            );
          }
          dirtyPolicy = value;
          index += 2;
          break;
        }
        case "--refresh-mode": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_AlignActiveCliUsageError(
              "Missing value for --refresh-mode",
            );
          }
          if (
            value !== "auto" &&
            value !== "live-worktree" &&
            value !== "pushed-only"
          ) {
            throw new WorktreeStackKit_AlignActiveCliUsageError(
              "Choose --refresh-mode auto, live-worktree, or pushed-only.",
            );
          }
          refreshMode = value;
          index += 2;
          break;
        }
        case "--plan":
          executionMode = resolveExclusiveExecutionMode(executionMode, "plan");
          index += 1;
          break;
        case "--push":
          executionMode = resolveExclusiveExecutionMode(executionMode, "push");
          index += 1;
          break;
        case "--help":
        case "-h":
          printUsage();
          return null;
        default:
          throw new WorktreeStackKit_AlignActiveCliUsageError(
            `Unknown argument: ${argument}`,
          );
      }
    }

    if (!executionMode) {
      throw new WorktreeStackKit_AlignActiveCliUsageError(
        "Choose exactly one execution mode: --plan or --push.",
      );
    }

    return {
      dirtyPolicy,
      executionMode,
      refreshMode,
      targetBranch,
      worktreePaths,
    };
  }

  /**
   * Seeds the mutable run state from parsed CLI options before preflight and worktree resolution.
   */
  function createState(
    options: WorktreeAlignActiveOptions,
  ): WorktreeAlignActiveState {
    return {
      currentStep: "initialization",
      dirtyPolicy: options.dirtyPolicy,
      executionMode: options.executionMode,
      refreshMode: options.refreshMode,
      resolvedWorktreePaths: [],
      targetBranch: options.targetBranch,
      worktreePaths: [...options.worktreePaths],
    };
  }

  /**
   * Emits structured key-value debug lines for the current step, policies, and resolved worktrees.
   *
   * @remarks
   * Invoked from the `runAlignActive` error path to aid triage without altering success-path output.
   */
  function printDebugContext(state: WorktreeAlignActiveState): void {
    worktreeStackPrintKv("step", state.currentStep);
    worktreeStackPrintKv("execution-mode", state.executionMode);
    worktreeStackPrintKv("target-branch", state.targetBranch);
    worktreeStackPrintKv("dirty-policy", state.dirtyPolicy);
    worktreeStackPrintKv("refresh-mode", state.refreshMode);
    if (state.resolvedWorktreePaths.length > 0) {
      worktreeStackPrintKv(
        "resolved-worktrees",
        state.resolvedWorktreePaths.join(", "),
      );
    }
  }

  /**
   * Verifies required host binaries exist before git-backed orchestration proceeds.
   *
   * @remarks
   * Uses `worktreeStackRequireCommand`, which throws when a command is missing from `PATH`.
   */
  function requirePrerequisites(): void {
    for (const commandName of config.requiredCommandNames) {
      worktreeStackRequireCommand(commandName);
    }
  }

  /** Multi-line plan text plus ordered operations for a single worktree alignment preview. */
  function buildAlignActivePlanReport(
    metadata: WorktreeAlignActiveMetadata,
    state: Pick<
      WorktreeAlignActiveState,
      "dirtyPolicy" | "refreshMode" | "targetBranch"
    >,
  ): string[] {
    const selectedRefreshMode = worktreeStackAlignActiveDetermineRefreshMode(
      metadata.worktreePath,
      state.refreshMode,
    );

    return [
      buildAlignActivePlanSummary({
        dirtyPolicy: state.dirtyPolicy,
        metadata,
        refreshMode: selectedRefreshMode,
        targetBranch: state.targetBranch,
      }),
      "Operation order:",
      ...buildAlignActiveOperationPlan({
        metadata,
        refreshMode: selectedRefreshMode,
        rootDir: config.projectRoot,
        targetBranch: state.targetBranch,
      }).map((operation) => `- ${operation}`),
    ];
  }

  /**
   * Prints the per-worktree plan and runs plan-mode normalization for that worktree's domain checkout.
   *
   * @remarks
   * Side effects: stdout plan lines plus async normalization matching `--plan` semantics (not push).
   */
  async function printPerWorktreePlan(
    metadata: WorktreeAlignActiveMetadata,
    state: WorktreeAlignActiveState,
  ): Promise<void> {
    for (const line of buildAlignActivePlanReport(metadata, state)) {
      console.log(line);
    }
    await worktreeStackAlignActiveNormalizeWorktreeDomain({
      dirtyPolicy: state.dirtyPolicy,
      executionMode: "plan",
      rootDir: config.projectRoot,
      worktreePath: metadata.worktreePath,
    });
  }

  /**
   * Runs sequential align-active across resolved worktrees with optional repo writer locking.
   */
  async function runAlignActive(
    options: WorktreeAlignActiveOptions,
  ): Promise<number> {
    const state = createState(options);

    try {
      if (state.executionMode === "push") {
        await worktreeStackAcquireRepoWriterLock(
          config.projectRoot,
          `worktree-stack-align-active:${state.targetBranch}`,
        );
      }

      state.currentStep = "preflight";
      requirePrerequisites();
      state.currentStep = "resolve-worktrees";
      state.resolvedWorktreePaths =
        worktreeStackAlignActiveResolveRequestedWorktrees(
          config.projectRoot,
          state.worktreePaths,
        );
      state.currentStep = "target-checkout-ready";
      worktreeStackAlignActiveRequireTargetCheckoutReady(
        config.projectRoot,
        state.executionMode,
        state.targetBranch,
      );

      worktreeStackInfo(
        `Selected ${state.resolvedWorktreePaths.length} prepared worktree(s) for align-active.`,
      );

      if (state.executionMode === "plan") {
        for (const worktreePath of state.resolvedWorktreePaths) {
          state.currentStep = `plan-${path.basename(worktreePath)}`;
          await printPerWorktreePlan(
            worktreeStackAlignActiveReadMetadata(worktreePath),
            state,
          );
        }
        worktreeStackInfo(
          "Plan only. Re-run with --push to execute the alignment.",
        );
        return 0;
      }

      for (const worktreePath of state.resolvedWorktreePaths) {
        state.currentStep = `normalize-${path.basename(worktreePath)}`;
        await worktreeStackAlignActiveNormalizeWorktreeDomain({
          dirtyPolicy: state.dirtyPolicy,
          executionMode: "push",
          rootDir: config.projectRoot,
          worktreePath,
        });
      }

      for (const worktreePath of state.resolvedWorktreePaths) {
        state.currentStep = `merge-${path.basename(worktreePath)}`;
        const exitCode = await mergeCommand.runMerge({
          executionMode: "push",
          skipBatchWriterLock: true,
          skipRootSync: true,
          targetBranch: state.targetBranch,
          trustWorktreeSubmoduleState: true,
          worktreePath,
        });
        if (exitCode !== 0) {
          worktreeStackError(`Merge batch failed for ${worktreePath}`);
        }
      }

      state.currentStep = "sync-root-after-merge-batch";
      WorktreeStackKit_syncRepoRootTargetCheckout({
        config: config.alignActive.repoRootSync,
        rootDir: config.projectRoot,
        targetBranch: state.targetBranch,
      });

      for (const worktreePath of state.resolvedWorktreePaths) {
        state.currentStep = `refresh-${path.basename(worktreePath)}`;
        const selectedRefreshMode =
          worktreeStackAlignActiveDetermineRefreshMode(
            worktreePath,
            state.refreshMode,
          );
        worktreeStackPrintKv(
          "refresh-mode",
          `${worktreePath} -> ${selectedRefreshMode}`,
        );
        const exitCode = await updateFromMainCommand.runUpdateFromMain({
          executionMode: "push",
          refreshMode: selectedRefreshMode,
          skipBatchWriterLock: true,
          targetBranch: state.targetBranch,
          trustWorktreeSubmoduleState: true,
          worktreePath,
        });
        if (exitCode !== 0) {
          worktreeStackError(`Refresh batch failed for ${worktreePath}`);
        }
      }

      for (const worktreePath of state.resolvedWorktreePaths) {
        state.currentStep = `validate-${path.basename(worktreePath)}`;
        worktreeStackAlignActiveValidateWorktreeAlignment(
          state.targetBranch,
          worktreePath,
        );
      }

      worktreeStackInfo(
        `Aligned ${state.resolvedWorktreePaths.length} prepared worktree(s) around origin/${state.targetBranch}.`,
      );
      return 0;
    } catch (error: unknown) {
      console.error(formatCliErrorMessage(error));
      printDebugContext(state);
      return 1;
    } finally {
      worktreeStackReleaseAllNamedLocks();
      if (state.executionMode === "push") {
        worktreeStackReleaseRepoWriterLock(config.projectRoot);
      }
    }
  }

  /** CLI entrypoint wiring argv parsing to `runAlignActive`. */
  async function runAlignActiveCli(argv: readonly string[]): Promise<number> {
    try {
      const parsedOptions = parseAlignActiveCliArgs(argv);
      if (parsedOptions === null) {
        return 0;
      }
      return await runAlignActive(parsedOptions);
    } catch (error: unknown) {
      console.error(formatCliErrorMessage(error));
      if (error instanceof WorktreeStackKit_AlignActiveCliUsageError) {
        printUsage();
      }
      return 1;
    }
  }

  return {
    buildAlignActivePlanReport,
    parseAlignActiveCliArgs,
    runAlignActive,
    runAlignActiveCli,
  };
}
