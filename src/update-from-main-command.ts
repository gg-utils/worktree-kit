/**
 * @fileoverview Config-driven prepared-worktree update-from-main command runner.
 *
 * Flow: argv + project branch/submodule config -> prepared-worktree validation -> submodule-first
 * refresh -> root gitlink resolution -> optional push. Project package paths, command surfaces, and
 * temp-root layout stay in root config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/configured-submodules.ts - Configured-submodule reconcile invoked after live submodule pushes so tracked checkouts stay consistent with refreshed submodule SHAs.
 * @see packages/worktree-kit/src/repo-root-sync.ts - Required-submodule fast-forward sync invoked after refresh so app submodule branches match the stack submoduleBranch contract from metadata.
 * @see canonical-skills/worktrees-update-from-main/SKILL.md - Canonical prepared-worktree update-from-main workflow that orients operators on live-worktree versus pushed-only modes before running this command surface.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import fs from "node:fs";
import path from "node:path";

import {
  worktreeStackError,
  worktreeStackInfo,
  worktreeStackPrintKv,
  worktreeStackRequireCommand,
  worktreeStackRequireDirectory,
  worktreeStackRequireFile,
  worktreeStackRunGit,
  worktreeStackWarn,
} from "@gg-utils/worktree-core/foundation";
import {
  worktreeStackAttachExpectedBranch,
  worktreeStackCheckoutCanAttachExpectedBranch,
  worktreeStackCheckoutMatchesExpectedBranch,
  worktreeStackCurrentCheckoutDescription,
  worktreeStackResolveGitmodulesSubmoduleBranch,
} from "@gg-utils/worktree-core/git-worktree-sync";
import {
  worktreeStackAcquireRepoWriterLock,
  worktreeStackReleaseAllNamedLocks,
  worktreeStackReleaseRepoWriterLock,
  worktreeStackWithRepoMutationLock,
} from "@gg-utils/worktree-core/repo-locks";
import { worktreeStackReadJsonField } from "@gg-utils/worktree-core/worktree-discovery";

import {
  WorktreeStackKit_updateConfiguredSubmodules,
  type WorktreeStackKit_ConfiguredSubmodulesConfig,
} from "./configured-submodules.js";
import {
  WorktreeStackKit_syncRequiredSubmoduleBranches,
  type WorktreeStackKit_RepoRootSyncConfig,
} from "./repo-root-sync.js";

export type WorktreeStackKit_UpdateFromMainRequiredSubmodule = {
  path: string;
  planLabel?: string;
};

export type WorktreeStackKit_UpdateFromMainUsageConfig = {
  commandLines: readonly string[];
};

export type WorktreeStackKit_UpdateFromMainCommandConfig = {
  configuredSubmodules: WorktreeStackKit_ConfiguredSubmodulesConfig;
  metadataRelativePath: string;
  projectRoot: string;
  refreshTmpRootRelativePath: string;
  repoRootSync: WorktreeStackKit_RepoRootSyncConfig;
  requiredCommandNames: readonly string[];
  requiredSubmodules: readonly WorktreeStackKit_UpdateFromMainRequiredSubmodule[];
  usage: WorktreeStackKit_UpdateFromMainUsageConfig;
};

export type WorktreeStackKit_RunUpdateFromMainCliOptions = {
  argv: readonly string[];
  config: WorktreeStackKit_UpdateFromMainCommandConfig;
};

export type WorktreeStackKit_RunUpdateFromMainOptions = {
  config: WorktreeStackKit_UpdateFromMainCommandConfig;
  options: WorktreeUpdateFromMainOptions;
};

export type WorktreeStackKit_UpdateFromMainPlanState = {
  refreshMode: WorktreeUpdateFromMainRefreshMode;
  refreshTmpRoot: string;
  rootBranch: string;
  stackName: string;
  submoduleBranch: string;
  targetBranch: string;
  worktreePath: string;
};

export type WorktreeStackKit_UpdateFromMainOperationPlanOptions = Pick<
  WorktreeUpdateFromMainOptions,
  "refreshMode" | "targetBranch" | "worktreePath"
> & {
  refreshTmpRoot: string;
  rootBranch: string;
  submoduleBranch: string;
};

export type WorktreeStackKit_UpdateFromMainCommand = {
  buildUpdateFromMainOperationPlan: (
    options: WorktreeStackKit_UpdateFromMainOperationPlanOptions,
  ) => string[];
  buildUpdateFromMainPlanSummary: (
    state: WorktreeStackKit_UpdateFromMainPlanState,
  ) => string;
  parseUpdateFromMainCliArgs: (
    argv: readonly string[],
  ) => WorktreeUpdateFromMainOptions | null;
  runUpdateFromMain: (options: WorktreeUpdateFromMainOptions) => Promise<number>;
  runUpdateFromMainCli: (argv: readonly string[]) => Promise<number>;
};

/**
 * Domain error for parseUpdateFromMainCli argv mistakes, distinct from refresh failures.
 *
 * @remarks
 * The CLI runner treats this class as a usage hint: it prints help and avoids treating the exit
 * as an internal worktree-stack fault.
 */
class WorktreeStackKit_UpdateFromMainCliUsageError extends Error {}

/** Refresh mode: "live-worktree" fast-forwards, "pushed-only" requires remote state. */
export type WorktreeUpdateFromMainRefreshMode = "live-worktree" | "pushed-only";
/** Execution mode: "plan" shows the operation list, "push" executes and pushes. */
export type WorktreeUpdateFromMainExecutionMode = "plan" | "push";

/** Options passed to buildUpdateFromMainOperationPlan. */
export type WorktreeUpdateFromMainOptions = {
  executionMode: WorktreeUpdateFromMainExecutionMode;
  refreshMode: WorktreeUpdateFromMainRefreshMode;
  skipBatchWriterLock?: boolean;
  targetBranch: string;
  trustWorktreeSubmoduleState: boolean;
  worktreePath: string;
};

/**
 * Mutable orchestration state for a single update-from-main run.
 *
 * @remarks
 * I/O: carries paths into `.tmp/worktree-stack`, git temp worktrees, and metadata.json fields.
 * Updated incrementally across fetch/merge/push steps; surfaced on error via printDebugContext.
 */
type WorktreeUpdateFromMainState = {
  currentStep: string;
  currentTempRepo: string;
  currentTempWorktree: string;
  executionMode: WorktreeUpdateFromMainExecutionMode;
  metadataPath: string;
  refreshedSubmoduleShas: Partial<Record<string, string>>;
  refreshMode: WorktreeUpdateFromMainRefreshMode;
  refreshRunId: string;
  refreshTmpRoot: string;
  rootBranch: string;
  stackName: string;
  submoduleBranch: string;
  targetBranch: string;
  trustWorktreeSubmoduleState: boolean;
  worktreePath: string;
};


/** Renders update-from-main CLI usage from project-supplied command lines. */
export function WorktreeStackKit_renderUpdateFromMainUsage(
  config: WorktreeStackKit_UpdateFromMainCommandConfig,
): string {
  return [
    "Usage:",
    ...config.usage.commandLines.map((line) => `  ${line}`),
    "",
    "Required:",
    "  --worktree <path>          Prepared worktree path to refresh",
    "  --mode <mode>              Explicit refresh mode:",
    "                             - live-worktree: update checked-out branches in place",
    "                             - pushed-only: refresh only origin/<worktree-branch> tips",
    "",
    "Options:",
    "  --target-branch <branch>   Counterpart branch to merge from (default: main)",
    "  --trust-worktree-submodule-state",
    "                             Skip .gitmodules branch validation for submodules",
    "  --push                     Execute the refresh and push updated branch tips",
    "  --plan                     Print the planned refresh only",
    "  --help, -h                 Show this help",
  ].join("\n");
}

function WorktreeStackKit_updateFromMainPlanLabel(
  submodule: WorktreeStackKit_UpdateFromMainRequiredSubmodule,
): string {
  return submodule.planLabel ?? submodule.path;
}

export function WorktreeStackKit_createUpdateFromMainCommand(
  config: WorktreeStackKit_UpdateFromMainCommandConfig,
): WorktreeStackKit_UpdateFromMainCommand {
  const requiredSubmodulePaths = config.requiredSubmodules.map(
    (submodule) => submodule.path,
  );

  /**
   * Prints the update-from-main CLI help text to stdout.
   */
  function printUsage(): void {
    console.log(WorktreeStackKit_renderUpdateFromMainUsage(config));
  }

  /**
   * Formats an exit-path error for stderr with a stable worktree-stack prefix when missing.
   *
   * @param error - Any thrown value from parsing or the refresh workflow.
   */
  function formatCliErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith("[worktree] ")
      ? message
      : `[worktree] ERROR: ${message}`;
  }

  /**
   * Parses update-from-main argv, requiring explicit refresh mode and mutually exclusive plan/push.
   *
   * @throws {WorktreeStackKit_UpdateFromMainCliUsageError} When argv is incomplete or contradictory.
   */
  function parseUpdateFromMainCliArgs(
    argv: readonly string[],
  ): WorktreeUpdateFromMainOptions | null {
    let executionMode: WorktreeUpdateFromMainExecutionMode | null = null;
    let refreshMode = "";
    let skipBatchWriterLock = false;
    let targetBranch = "main";
    let trustWorktreeSubmoduleState = false;
    let worktreePath = "";

    for (let index = 0; index < argv.length; ) {
      const argument = argv[index];
      switch (argument) {
        case "--worktree": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_UpdateFromMainCliUsageError("Missing value for --worktree");
          }
          worktreePath = value;
          index += 2;
          break;
        }
        case "--target-branch": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_UpdateFromMainCliUsageError(
              "Missing value for --target-branch",
            );
          }
          targetBranch = value;
          index += 2;
          break;
        }
        case "--mode": {
          const value = argv[index + 1];
          if (!value) {
            throw new WorktreeStackKit_UpdateFromMainCliUsageError("Missing value for --mode");
          }
          refreshMode = value;
          index += 2;
          break;
        }
        case "--skip-batch-writer-lock":
          skipBatchWriterLock = true;
          index += 1;
          break;
        case "--trust-worktree-submodule-state":
          trustWorktreeSubmoduleState = true;
          index += 1;
          break;
        case "--push":
          if (executionMode && executionMode !== "push") {
            throw new WorktreeStackKit_UpdateFromMainCliUsageError(
              "Choose exactly one execution mode: --plan or --push.",
            );
          }
          executionMode = "push";
          index += 1;
          break;
        case "--plan":
          if (executionMode && executionMode !== "plan") {
            throw new WorktreeStackKit_UpdateFromMainCliUsageError(
              "Choose exactly one execution mode: --plan or --push.",
            );
          }
          executionMode = "plan";
          index += 1;
          break;
        case "--help":
        case "-h":
          printUsage();
          return null;
        default:
          throw new WorktreeStackKit_UpdateFromMainCliUsageError(`Unknown argument: ${argument}`);
      }
    }

    if (!worktreePath) {
      throw new WorktreeStackKit_UpdateFromMainCliUsageError("--worktree is required.");
    }

    if (refreshMode !== "live-worktree" && refreshMode !== "pushed-only") {
      throw new WorktreeStackKit_UpdateFromMainCliUsageError(
        "Choose --mode live-worktree or --mode pushed-only.",
      );
    }

    if (!executionMode) {
      throw new WorktreeStackKit_UpdateFromMainCliUsageError(
        "Choose exactly one execution mode: --plan or --push.",
      );
    }

    return {
      executionMode,
      refreshMode,
      skipBatchWriterLock,
      targetBranch,
      trustWorktreeSubmoduleState,
      worktreePath: path.resolve(worktreePath),
    };
  }

  /**
   * Builds the initial run state from CLI options, including per-run temp roots and metadata paths.
   *
   * @param options - Normalized argv after parseUpdateFromMainCliArgs.
   */
  function createState(
    options: WorktreeUpdateFromMainOptions,
  ): WorktreeUpdateFromMainState {
    const refreshRunId = `update-from-main-${new Date().toISOString().replace(/[:.]/gu, "-")}`;
    return {
      currentStep: "initialization",
      currentTempRepo: "",
      currentTempWorktree: "",
      executionMode: options.executionMode,
      metadataPath: path.join(options.worktreePath, config.metadataRelativePath),
      refreshedSubmoduleShas: {},
      refreshMode: options.refreshMode,
      refreshRunId,
      refreshTmpRoot: path.join(
        config.projectRoot,
        config.refreshTmpRootRelativePath,
        refreshRunId,
      ),
      rootBranch: "",
      stackName: "",
      submoduleBranch: "",
      targetBranch: options.targetBranch,
      trustWorktreeSubmoduleState: options.trustWorktreeSubmoduleState,
      worktreePath: options.worktreePath,
    };
  }

  /**
   * Prints key-value debug fields for the active step, paths, and branch metadata on failure paths.
   *
   * @remarks
   * I/O: stdout via worktreeStackPrintKv; intended for operator triage after worktreeStackError.
   *
   * @param state - Current run state including currentStep and refreshTmpRoot.
   */
  function printDebugContext(state: WorktreeUpdateFromMainState): void {
    worktreeStackPrintKv("step", state.currentStep);
    worktreeStackPrintKv("worktree-path", state.worktreePath);
    worktreeStackPrintKv("metadata-path", state.metadataPath);
    worktreeStackPrintKv("stack-name", state.stackName);
    worktreeStackPrintKv("root-branch", state.rootBranch);
    worktreeStackPrintKv("submodule-branch", state.submoduleBranch);
    worktreeStackPrintKv("target-branch", state.targetBranch);
    worktreeStackPrintKv("refresh-mode", state.refreshMode);
    worktreeStackPrintKv("execution-mode", state.executionMode);
    worktreeStackPrintKv(
      "trust-worktree-submodule-state",
      String(state.trustWorktreeSubmoduleState),
    );
    worktreeStackPrintKv("tmp-root", state.refreshTmpRoot);
    if (state.currentTempWorktree) {
      worktreeStackPrintKv("current-temp-worktree", state.currentTempWorktree);
    }
  }

  /**
   * Emits refreshed submodule commit SHAs captured during push-mode refresh, when present.
   *
   * @param state - Run state whose refreshedSubmoduleShas map was populated by push flows.
   */
  function printRefreshedSubmoduleShas(state: WorktreeUpdateFromMainState): void {
    for (const submodule of requiredSubmodulePaths) {
      const value = state.refreshedSubmoduleShas[submodule];
      if (value) {
        worktreeStackPrintKv(`${submodule}-refreshed-sha`, value);
      }
    }
  }

  /**
   * Validates required host commands and worktree metadata exist before any git mutation.
   *
   * @remarks
   * PRE-CONDITION: state.metadataPath must join worktreePath with the stack metadata location.
   *
   * @param state - Run state advanced to the preflight step.
   */
  function requirePrerequisites(state: WorktreeUpdateFromMainState): void {
    state.currentStep = "preflight";
    for (const commandName of config.requiredCommandNames) {
      worktreeStackRequireCommand(commandName);
    }
    worktreeStackRequireFile(state.metadataPath, "worktree metadata");
  }

  /**
   * Ensures origin/<branchName> exists after fetch, or aborts via worktreeStackError.
   *
   * @remarks
   * I/O: `git fetch` and `git rev-parse` against refs/remotes/origin.
   *
   * @param repoDir - Git repository directory to probe.
   * @param branchName - Remote-tracking branch name without the origin/ prefix.
   */
  function requireRemoteBranch(repoDir: string, branchName: string): void {
    const fetchResult = worktreeStackRunGit(
      repoDir,
      ["fetch", "origin", branchName, "--prune"],
      { allowFailure: true, stdio: "ignore" },
    );
    const existsResult = worktreeStackRunGit(
      repoDir,
      ["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${branchName}`],
      { allowFailure: true, stdio: "ignore" },
    );
    if (fetchResult.status === 0 && existsResult.status === 0) {
      return;
    }

    worktreeStackError(
      `Remote branch does not exist: ${repoDir} :: origin/${branchName}`,
    );
  }

  /**
   * Ensures a local branch ref exists in repoDir, or aborts via worktreeStackError.
   *
   * @param repoDir - Git repository directory to probe.
   * @param branchName - Local branch name under refs/heads.
   */
  function requireLocalBranch(repoDir: string, branchName: string): void {
    const existsResult = worktreeStackRunGit(
      repoDir,
      ["rev-parse", "--verify", "--quiet", `refs/heads/${branchName}`],
      { allowFailure: true, stdio: "ignore" },
    );
    if (existsResult.status === 0) {
      return;
    }

    worktreeStackError(
      `Local branch does not exist: ${repoDir} :: ${branchName}`,
    );
  }

  /**
   * Requires an empty `git status --short` for live-worktree refresh safety.
   *
   * @param repoDir - Repository whose working tree must be clean.
   * @param label - Human-readable repo label included in the failure message.
   */
  function requireCleanWorkingTree(repoDir: string, label: string): void {
    const status = worktreeStackRunGit(repoDir, ["status", "--short"], {
      allowFailure: true,
    }).stdout.trim();
    if (!status.length) {
      return;
    }

    worktreeStackError(
      `Working tree is dirty and cannot be updated in live-worktree mode: ${label} :: ${repoDir}`,
    );
  }

  /**
   * Fetches targetBranch and sourceBranch tips from origin without submodule recursion.
   *
   * @remarks
   * I/O: `git fetch` with submodule.recurse=false for predictable shallow refresh boundaries.
   *
   * @param repoDir - Repository to fetch into.
   * @param targetBranch - Upstream branch to merge from (typically main).
   * @param sourceBranch - Branch tip being refreshed (worktree or submodule branch).
   */
  function fetchRefreshRefs(
    repoDir: string,
    targetBranch: string,
    sourceBranch: string,
  ): void {
    worktreeStackRunGit(
      repoDir,
      [
        "-c",
        "submodule.recurse=false",
        "fetch",
        "--quiet",
        "origin",
        targetBranch,
        sourceBranch,
        "--prune",
      ],
      { stdio: "ignore" },
    );
  }

  /**
   * Best-effort removal of a detached git worktree used for pushed-only refresh.
   *
   * @remarks
   * I/O: `git worktree remove --force`; failures are ignored to keep teardown non-fatal.
   *
   * @param repoDir - Main repo that registered the worktree.
   * @param tempWorktree - Absolute path passed to git worktree remove.
   */
  function cleanupTempWorktree(repoDir: string, tempWorktree: string): void {
    if (!tempWorktree || !fs.existsSync(tempWorktree)) {
      return;
    }

    worktreeStackRunGit(
      repoDir,
      ["worktree", "remove", "--force", tempWorktree],
      {
        allowFailure: true,
        stdio: "ignore",
      },
    );
  }

  /**
   * Lists paths still marked unmerged after a merge or conflict resolution attempt.
   *
   * @param repoDir - Repository whose index is inspected.
   */
  function listUnmergedPaths(repoDir: string): string[] {
    return worktreeStackRunGit(
      repoDir,
      ["diff", "--name-only", "--diff-filter=U"],
      {
        allowFailure: true,
      },
    )
      .stdout.split(/\r?\n/gu)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /**
   * Stages required submodule gitlinks in the live root worktree after submodule fast-forward.
   *
   * @remarks
   * I/O: `git add` per required submodule from the root worktreePath.
   *
   * @param state - Run state pointing at the prepared worktree root checkout.
   */
  function resolveRootGitlinksToRefreshedSubmodulesLive(
    state: WorktreeUpdateFromMainState,
  ): void {
    for (const submodule of requiredSubmodulePaths) {
      worktreeStackRunGit(state.worktreePath, ["add", submodule], {
        stdio: "ignore",
      });
    }
  }

  /**
   * Rewrites submodule index entries from refreshed SHAs using git update-index in a temp index context.
   *
   * @remarks
   * I/O: `git update-index --cacheinfo` for each required submodule; aborts if any SHA is missing.
   *
   * @param state - Run state holding refreshedSubmoduleShas from pushed-only submodule steps.
   * @param rootRepoDir - Git directory whose index is updated (often a detached temp root worktree).
   */
  function resolveRootGitlinksToRefreshedSubmodulesDetached(
    state: WorktreeUpdateFromMainState,
    rootRepoDir: string,
  ): void {
    for (const submodule of requiredSubmodulePaths) {
      const submoduleSha = state.refreshedSubmoduleShas[submodule];
      if (!submoduleSha) {
        worktreeStackError(`Missing refreshed submodule SHA for ${submodule}`);
      }
      worktreeStackRunGit(
        rootRepoDir,
        ["update-index", "--cacheinfo", "160000", submoduleSha, submodule],
        { stdio: "ignore" },
      );
    }
  }

  /**
   * Completes an in-progress merge or commits staged gitlink updates after root refresh resolution.
   *
   * @remarks
   * I/O: `git commit` when MERGE_HEAD exists or when status shows staged submodule pointer changes.
   *
   * @param state - Run state whose currentStep may advance to commit-root-refresh.
   * @param repoDir - Root repository (live or temp) receiving the commit.
   * @param branchName - Branch label embedded in the default commit subject.
   */
  function commitRootRefreshIfNeeded(
    state: WorktreeUpdateFromMainState,
    repoDir: string,
    branchName: string,
  ): void {
    if (
      worktreeStackRunGit(
        repoDir,
        ["rev-parse", "--verify", "--quiet", "MERGE_HEAD"],
        {
          allowFailure: true,
          stdio: "ignore",
        },
      ).status === 0
    ) {
      state.currentStep = "commit-root-refresh";
      worktreeStackRunGit(repoDir, ["commit", "--no-edit"], { stdio: "ignore" });
      return;
    }

    const status = worktreeStackRunGit(
      repoDir,
      ["status", "--short", "--untracked-files=no"],
      { allowFailure: true },
    ).stdout.trim();
    if (status.length > 0) {
      state.currentStep = "commit-root-refresh";
      worktreeStackRunGit(
        repoDir,
        [
          "commit",
          "-m",
          `chore(worktree-stack): update ${branchName} from ${state.targetBranch}`,
        ],
        { stdio: "ignore" },
      );
    }
  }

  /**
   * Verifies origin/<targetBranch> is an ancestor of origin/<branchName> after refresh.
   *
   * @remarks
   * Enforces the single-writer alignment contract: tips must not rewrite away from the merge base
   * expected by the stack metadata workflow.
   *
   * @param state - Run state carrying targetBranch for fetch and merge-base checks.
   * @param label - Submodule or root label included in diagnostics.
   * @param repoDir - Repository whose remotes are used.
   * @param branchName - Worktree branch whose remote tip is validated.
   */
  function validateRemoteAncestry(
    state: WorktreeUpdateFromMainState,
    label: string,
    repoDir: string,
    branchName: string,
  ): void {
    state.currentStep = `validate-${label}-ancestry`;
    worktreeStackRunGit(
      repoDir,
      [
        "-c",
        "submodule.recurse=false",
        "fetch",
        "--quiet",
        "origin",
        state.targetBranch,
        branchName,
        "--prune",
      ],
      { stdio: "ignore" },
    );

    if (
      worktreeStackRunGit(
        repoDir,
        [
          "merge-base",
          "--is-ancestor",
          `origin/${state.targetBranch}`,
          `origin/${branchName}`,
        ],
        { allowFailure: true, stdio: "ignore" },
      ).status === 0
    ) {
      worktreeStackPrintKv(
        `${label}-validated`,
        `origin/${state.targetBranch} <= origin/${branchName}`,
      );
      return;
    }

    worktreeStackError(
      `Ancestry validation failed: ${label} :: origin/${state.targetBranch} is not an ancestor of origin/${branchName}`,
    );
  }

  /**
   * Ensures the repository has no pending changes immediately after a live refresh.
   *
   * @param repoDir - Repository checked with git status --short.
   * @param label - Submodule or root label included in the failure message.
   */
  function validateRepoCleanAfterRefresh(repoDir: string, label: string): void {
    const status = worktreeStackRunGit(repoDir, ["status", "--short"], {
      allowFailure: true,
    }).stdout.trim();
    if (!status.length) {
      return;
    }

    worktreeStackError(
      `Refresh cleanliness validation failed: ${label} is still dirty after refresh: ${repoDir}`,
    );
  }

  /**
   * Loads stack metadata and validates root plus required submodule checkouts match policy.
   *
   * @remarks
   * PRE-CONDITION: metadata.json must define stackName, rootBranch, and submoduleBranch.
   * When trustWorktreeSubmoduleState is false, compares each checkout to .gitmodules tracking branch.
   *
   * @param state - Run state populated from metadata and live git.describe-style checkout info.
   */
  function validateWorktreeState(state: WorktreeUpdateFromMainState): void {
    state.currentStep = "validate-worktree-state";
    state.stackName =
      worktreeStackReadJsonField(state.metadataPath, "stackName") ?? "";
    state.rootBranch =
      worktreeStackReadJsonField(state.metadataPath, "rootBranch") ?? "";
    state.submoduleBranch =
      worktreeStackReadJsonField(state.metadataPath, "submoduleBranch") ?? "";

    const actualRootBranch = worktreeStackCurrentCheckoutDescription(
      state.worktreePath,
    );
    if (
      !worktreeStackCheckoutMatchesExpectedBranch(
        state.worktreePath,
        state.rootBranch,
      )
    ) {
      if (
        !worktreeStackCheckoutCanAttachExpectedBranch(
          state.worktreePath,
          state.rootBranch,
        )
      ) {
        worktreeStackError(
          `Root branch mismatch. metadata=${state.rootBranch} actual=${actualRootBranch}`,
        );
      }
      worktreeStackWarn(
        `validate_worktree_state: root is detached but can be reattached to ${state.rootBranch}`,
      );
    }

    for (const submodule of requiredSubmodulePaths) {
      const repoDir = path.join(state.worktreePath, submodule);
      worktreeStackRequireDirectory(repoDir, "required worktree submodule");
      const actualSubmoduleBranch =
        worktreeStackCurrentCheckoutDescription(repoDir);

      if (!state.trustWorktreeSubmoduleState) {
        const gitmodulesBranch = worktreeStackResolveGitmodulesSubmoduleBranch(
          path.join(state.worktreePath, ".gitmodules"),
          submodule,
        );
        if (
          !worktreeStackCheckoutMatchesExpectedBranch(repoDir, gitmodulesBranch)
        ) {
          worktreeStackError(
            `Submodule branch mismatch in ${submodule}. gitmodules=${gitmodulesBranch} actual=${actualSubmoduleBranch}`,
          );
        }
      } else {
        worktreeStackWarn(
          `validate_worktree_state: .gitmodules branch validation bypassed by --trust-worktree-submodule-state for ${submodule} (currently on ${actualSubmoduleBranch})`,
        );
      }
    }
  }

  /** Multi-line plan summary describing refresh mode, target branch, and repo ordering. */
  function buildUpdateFromMainPlanSummary(
    state: WorktreeStackKit_UpdateFromMainPlanState,
  ): string {
    const submoduleLines = config.requiredSubmodules.map((submodule) => {
      const label = WorktreeStackKit_updateFromMainPlanLabel(submodule);
      return `- ${label}: ${state.worktreePath}/${submodule.path}:${state.submoduleBranch} <= origin/${state.targetBranch}`;
    });

    return [
      `Update-from-main plan for stack '${state.stackName}':`,
      `- refresh mode: ${state.refreshMode}`,
      `- target branch: ${state.targetBranch}`,
      `- root repo: ${state.worktreePath}:${state.rootBranch} <= origin/${state.targetBranch}`,
      ...submoduleLines,
      "",
      "Execution model:",
      "- submodules refresh first, root repo refreshes last",
      "- live-worktree updates the checked-out worktree branches in place and requires clean repos",
      "- pushed-only refreshes only origin/<worktree-branch> tips through temp worktrees under " +
        state.refreshTmpRoot,
      "- validation requires origin/" +
        state.targetBranch +
        " to be an ancestor of each refreshed origin/<worktree-branch>",
    ].join("\n");
  }

  /** Builds the step-by-step operation plan for a worktree update-from-main run. */
  function buildUpdateFromMainOperationPlan(
    options: WorktreeStackKit_UpdateFromMainOperationPlanOptions,
  ): string[] {
    const sourceLabel =
      options.refreshMode === "live-worktree"
        ? "checked-out worktree branches"
        : `temp worktrees under ${options.refreshTmpRoot}`;
    return [
      ...config.requiredSubmodules.map(
        (submodule) =>
          `refresh ${submodule.path} ${options.worktreePath}/${submodule.path}:` +
          `${options.submoduleBranch} <= origin/${options.targetBranch} via ${sourceLabel}`,
      ),
      `refresh root ${options.worktreePath}:${options.rootBranch} <= ` +
        `origin/${options.targetBranch} via ${sourceLabel}`,
    ];
  }

  /**
   * live-worktree submodule path: merge target into branch and push without an outer repo lock.
   *
   * @remarks
   * I/O: git fetch/merge/push on repoDir; plan mode stops after printing source/target keys.
   * USAGE: Caller must hold sequencing appropriate for push mode; see refreshLiveRepoBranch for locking.
   *
   * @param state - Run state including executionMode, targetBranch, and step tracking.
   * @param label - Required submodule key used in logs and step names.
   * @param repoDir - Absolute path to the submodule repository inside the worktree.
   * @param branchName - Submodule branch aligned with stack metadata (typically submoduleBranch).
   */
  async function refreshLiveRepoBranchUnlocked(
    state: WorktreeUpdateFromMainState,
    label: string,
    repoDir: string,
    branchName: string,
  ): Promise<void> {
    state.currentStep = `fetch-${label}`;
    requireLocalBranch(repoDir, branchName);
    requireRemoteBranch(repoDir, branchName);
    requireRemoteBranch(repoDir, state.targetBranch);
    requireCleanWorkingTree(repoDir, label);
    fetchRefreshRefs(repoDir, state.targetBranch, branchName);
    worktreeStackAttachExpectedBranch(repoDir, branchName);

    worktreeStackPrintKv(`${label}-source`, `${repoDir}:${branchName}`);
    worktreeStackPrintKv(`${label}-target`, `origin/${state.targetBranch}`);

    if (state.executionMode === "plan") {
      return;
    }

    state.currentStep = `merge-${label}-live`;
    if (
      worktreeStackRunGit(
        repoDir,
        ["merge-base", "--is-ancestor", `origin/${state.targetBranch}`, "HEAD"],
        { allowFailure: true, stdio: "ignore" },
      ).status !== 0
    ) {
      worktreeStackRunGit(
        repoDir,
        [
          "-c",
          "submodule.recurse=false",
          "merge",
          "--no-ff",
          "--no-edit",
          `origin/${state.targetBranch}`,
        ],
        { stdio: "ignore" },
      );
    }

    state.currentStep = `push-${label}-live`;
    worktreeStackRunGit(
      repoDir,
      ["-c", "submodule.recurse=false", "push", "origin", `HEAD:${branchName}`],
      { stdio: "ignore" },
    );
  }

  /**
   * live-worktree submodule refresh; acquires a per-repo mutation lock only for push execution.
   *
   * @param state - Run state forwarded to the unlocked refresh implementation.
   * @param label - Submodule key under requiredSubmodulePaths.
   * @param repoDir - Submodule git directory.
   * @param branchName - Branch to attach, merge into, and push.
   */
  async function refreshLiveRepoBranch(
    state: WorktreeUpdateFromMainState,
    label: string,
    repoDir: string,
    branchName: string,
  ): Promise<void> {
    if (state.executionMode !== "push") {
      await refreshLiveRepoBranchUnlocked(state, label, repoDir, branchName);
      return;
    }

    await worktreeStackWithRepoMutationLock(
      config.projectRoot,
      repoDir,
      `worktree-stack-update-from-main:${state.targetBranch}:${label}:${branchName}:live`,
      "wait",
      async () => {
        await refreshLiveRepoBranchUnlocked(state, label, repoDir, branchName);
      },
    );
  }

  /**
   * pushed-only submodule path: detach temp worktree at origin tip, merge target, push, then remove temp.
   *
   * @remarks
   * I/O: creates refreshTmpRoot/<label>, runs merge and push from the temp checkout, records HEAD in
   * refreshedSubmoduleShas for root gitlink resolution.
   *
   * @param state - Run state with refreshTmpRoot, targetBranch, and executionMode.
   * @param label - Submodule key; temp directory name under refreshTmpRoot.
   * @param repoDir - Primary repo path that owns the added git worktree.
   * @param branchName - Remote branch tip checked out in the temp worktree before merging target.
   */
  async function refreshPushedOnlyRepoBranchUnlocked(
    state: WorktreeUpdateFromMainState,
    label: string,
    repoDir: string,
    branchName: string,
  ): Promise<void> {
    const tempWorktree = path.join(state.refreshTmpRoot, label);

    state.currentStep = `fetch-${label}`;
    requireRemoteBranch(repoDir, branchName);
    requireRemoteBranch(repoDir, state.targetBranch);
    fetchRefreshRefs(repoDir, state.targetBranch, branchName);

    worktreeStackPrintKv(`${label}-source`, `origin/${branchName}`);
    worktreeStackPrintKv(`${label}-target`, `origin/${state.targetBranch}`);

    if (state.executionMode === "plan") {
      return;
    }

    state.currentStep = `prepare-${label}-refresh-worktree`;
    fs.mkdirSync(state.refreshTmpRoot, { recursive: true });
    cleanupTempWorktree(repoDir, tempWorktree);
    worktreeStackRunGit(
      repoDir,
      [
        "-c",
        "submodule.recurse=false",
        "worktree",
        "add",
        "--detach",
        tempWorktree,
        `origin/${branchName}`,
      ],
      { stdio: "ignore" },
    );
    state.currentTempRepo = repoDir;
    state.currentTempWorktree = tempWorktree;

    state.currentStep = `merge-${label}-pushed-only`;
    if (
      worktreeStackRunGit(
        tempWorktree,
        ["merge-base", "--is-ancestor", `origin/${state.targetBranch}`, "HEAD"],
        { allowFailure: true, stdio: "ignore" },
      ).status !== 0
    ) {
      worktreeStackRunGit(
        tempWorktree,
        [
          "-c",
          "submodule.recurse=false",
          "merge",
          "--no-ff",
          "--no-edit",
          `origin/${state.targetBranch}`,
        ],
        { stdio: "ignore" },
      );
    }

    const repoHeadSha = worktreeStackRunGit(tempWorktree, [
      "rev-parse",
      "HEAD",
    ]).stdout.trim();
    worktreeStackPrintKv(`${label}-updated-head`, repoHeadSha);
    state.refreshedSubmoduleShas[label] = repoHeadSha;

    state.currentStep = `push-${label}-pushed-only`;
    worktreeStackRunGit(
      tempWorktree,
      ["-c", "submodule.recurse=false", "push", "origin", `HEAD:${branchName}`],
      { stdio: "ignore" },
    );
    cleanupTempWorktree(repoDir, tempWorktree);
    state.currentTempRepo = "";
    state.currentTempWorktree = "";
  }

  /**
   * pushed-only submodule refresh; serializes mutations with worktreeStackWithRepoMutationLock in push mode.
   *
   * @param state - Run state forwarded to the unlocked implementation.
   * @param label - Submodule key under requiredSubmodulePaths.
   * @param repoDir - Submodule git directory registered for temp worktrees.
   * @param branchName - Branch whose origin tip is refreshed through the detached worktree.
   */
  async function refreshPushedOnlyRepoBranch(
    state: WorktreeUpdateFromMainState,
    label: string,
    repoDir: string,
    branchName: string,
  ): Promise<void> {
    if (state.executionMode !== "push") {
      await refreshPushedOnlyRepoBranchUnlocked(
        state,
        label,
        repoDir,
        branchName,
      );
      return;
    }

    await worktreeStackWithRepoMutationLock(
      config.projectRoot,
      repoDir,
      `worktree-stack-update-from-main:${state.targetBranch}:${label}:${branchName}:pushed-only`,
      "wait",
      async () => {
        await refreshPushedOnlyRepoBranchUnlocked(
          state,
          label,
          repoDir,
          branchName,
        );
      },
    );
  }

  /**
   * live-worktree root: merge target (possibly without commit), stage submodule gitlinks, commit, push.
   *
   * @remarks
   * I/O: mutates the prepared worktree root; uses no-commit merge when needed so submodule pointers
   * resolve before a single commitRootRefreshIfNeeded pass.
   *
   * @param state - Run state with worktreePath, rootBranch, and submodule SHAs from prior steps.
   */
  async function refreshLiveRootBranchUnlocked(
    state: WorktreeUpdateFromMainState,
  ): Promise<void> {
    state.currentStep = "fetch-root";
    requireLocalBranch(state.worktreePath, state.rootBranch);
    requireRemoteBranch(state.worktreePath, state.rootBranch);
    requireRemoteBranch(state.worktreePath, state.targetBranch);
    fetchRefreshRefs(state.worktreePath, state.targetBranch, state.rootBranch);

    worktreeStackPrintKv(
      "root-source",
      `${state.worktreePath}:${state.rootBranch}`,
    );
    worktreeStackPrintKv("root-target", `origin/${state.targetBranch}`);

    if (state.executionMode === "plan") {
      return;
    }

    state.currentStep = "merge-root-live";
    if (
      worktreeStackRunGit(
        state.worktreePath,
        ["merge-base", "--is-ancestor", `origin/${state.targetBranch}`, "HEAD"],
        { allowFailure: true, stdio: "ignore" },
      ).status !== 0
    ) {
      worktreeStackRunGit(
        state.worktreePath,
        [
          "-c",
          "submodule.recurse=false",
          "merge",
          "--no-ff",
          "--no-commit",
          `origin/${state.targetBranch}`,
        ],
        { allowFailure: true, stdio: "ignore" },
      );
    }

    state.currentStep = "resolve-root-gitlinks-live";
    resolveRootGitlinksToRefreshedSubmodulesLive(state);
    const remainingConflicts = listUnmergedPaths(state.worktreePath);
    if (remainingConflicts.length > 0) {
      worktreeStackError("Root refresh still has unresolved conflicts.");
    }

    commitRootRefreshIfNeeded(state, state.worktreePath, state.rootBranch);

    state.currentStep = "push-root-live";
    worktreeStackRunGit(
      state.worktreePath,
      [
        "-c",
        "submodule.recurse=false",
        "push",
        "origin",
        `HEAD:${state.rootBranch}`,
      ],
      { stdio: "ignore" },
    );
  }

  /**
   * live-worktree root refresh entrypoint; wraps unlocked work with a root-repo mutation lock in push mode.
   *
   * @param state - Run state whose worktreePath is the root repository.
   */
  async function refreshLiveRootBranch(
    state: WorktreeUpdateFromMainState,
  ): Promise<void> {
    if (state.executionMode !== "push") {
      await refreshLiveRootBranchUnlocked(state);
      return;
    }

    await worktreeStackWithRepoMutationLock(
      config.projectRoot,
      state.worktreePath,
      `worktree-stack-update-from-main:${state.targetBranch}:root:${state.rootBranch}:live`,
      "wait",
      async () => {
        await refreshLiveRootBranchUnlocked(state);
      },
    );
  }

  /**
   * After live submodule pushes, reconciles .gitmodules and fast-forwards required app submodule branches.
   *
   * @remarks
   * In push mode, briefly acquires per-submodule locks (placeholder callbacks) then releases named locks
   * in finally; delegates actual sync to worktreeStackUpdateConfiguredSubmodules and ff-only branch sync.
   *
   * @param state - Run state with worktreePath, submoduleBranch, targetBranch, and executionMode.
   */
  async function syncLiveWorktreeConfiguredSubmodules(
    state: WorktreeUpdateFromMainState,
  ): Promise<void> {
    const acquiredRepoDirs: string[] = [];
    state.currentStep = "sync-live-configured-submodules";

    try {
      if (state.executionMode === "push") {
        for (const submodule of requiredSubmodulePaths) {
          const repoDir = path.join(state.worktreePath, submodule);
          if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
            continue;
          }
          if (
            worktreeStackRunGit(repoDir, ["remote", "get-url", "origin"], {
              allowFailure: true,
              stdio: "ignore",
            }).status !== 0
          ) {
            continue;
          }

          await worktreeStackWithRepoMutationLock(
            config.projectRoot,
            repoDir,
            `worktree-stack-update-from-main:${state.targetBranch}:sync-live-configured:${submodule}`,
            "wait",
            async () => {
              acquiredRepoDirs.push(repoDir);
            },
          );
        }
      }

      WorktreeStackKit_updateConfiguredSubmodules({
        config: config.configuredSubmodules,
        rootDir: state.worktreePath,
      });
      WorktreeStackKit_syncRequiredSubmoduleBranches({
        branchName: state.submoduleBranch,
        config: config.repoRootSync,
        rootDir: state.worktreePath,
        syncMode: "ff-only",
      });
    } finally {
      acquiredRepoDirs.reverse();
      for (let i = 0; i < acquiredRepoDirs.length; i++) {
        worktreeStackReleaseAllNamedLocks();
      }
    }
  }

  /**
   * pushed-only root: detached temp worktree from origin/rootBranch, merge target, rewrite gitlinks, push.
   *
   * @remarks
   * I/O: uses refreshTmpRoot/root; resolveRootGitlinksToRefreshedSubmodulesDetached applies submodule
   * SHAs gathered during pushed-only submodule refreshes.
   *
   * @param state - Run state with rootBranch, targetBranch, refreshedSubmoduleShas, and refreshTmpRoot.
   */
  async function refreshPushedOnlyRootBranchUnlocked(
    state: WorktreeUpdateFromMainState,
  ): Promise<void> {
    const tempWorktree = path.join(state.refreshTmpRoot, "root");

    state.currentStep = "fetch-root";
    requireRemoteBranch(state.worktreePath, state.rootBranch);
    requireRemoteBranch(state.worktreePath, state.targetBranch);
    fetchRefreshRefs(state.worktreePath, state.targetBranch, state.rootBranch);

    worktreeStackPrintKv("root-source", `origin/${state.rootBranch}`);
    worktreeStackPrintKv("root-target", `origin/${state.targetBranch}`);

    if (state.executionMode === "plan") {
      return;
    }

    state.currentStep = "prepare-root-refresh-worktree";
    fs.mkdirSync(state.refreshTmpRoot, { recursive: true });
    cleanupTempWorktree(state.worktreePath, tempWorktree);
    worktreeStackRunGit(
      state.worktreePath,
      [
        "-c",
        "submodule.recurse=false",
        "worktree",
        "add",
        "--detach",
        tempWorktree,
        `origin/${state.rootBranch}`,
      ],
      { stdio: "ignore" },
    );
    state.currentTempRepo = state.worktreePath;
    state.currentTempWorktree = tempWorktree;

    state.currentStep = "merge-root-pushed-only";
    if (
      worktreeStackRunGit(
        tempWorktree,
        ["merge-base", "--is-ancestor", `origin/${state.targetBranch}`, "HEAD"],
        { allowFailure: true, stdio: "ignore" },
      ).status !== 0
    ) {
      worktreeStackRunGit(
        tempWorktree,
        [
          "-c",
          "submodule.recurse=false",
          "merge",
          "--no-ff",
          "--no-commit",
          `origin/${state.targetBranch}`,
        ],
        { allowFailure: true, stdio: "ignore" },
      );
    }

    state.currentStep = "resolve-root-gitlinks-pushed-only";
    resolveRootGitlinksToRefreshedSubmodulesDetached(state, tempWorktree);
    const remainingConflicts = listUnmergedPaths(tempWorktree);
    if (remainingConflicts.length > 0) {
      worktreeStackError(
        "Root pushed-only refresh still has unresolved conflicts.",
      );
    }

    commitRootRefreshIfNeeded(state, tempWorktree, state.rootBranch);
    const rootHeadSha = worktreeStackRunGit(tempWorktree, [
      "rev-parse",
      "HEAD",
    ]).stdout.trim();
    worktreeStackPrintKv("root-updated-head", rootHeadSha);

    state.currentStep = "push-root-pushed-only";
    worktreeStackRunGit(
      tempWorktree,
      [
        "-c",
        "submodule.recurse=false",
        "push",
        "origin",
        `HEAD:${state.rootBranch}`,
      ],
      { stdio: "ignore" },
    );
    cleanupTempWorktree(state.worktreePath, tempWorktree);
    state.currentTempRepo = "";
    state.currentTempWorktree = "";
  }

  /**
   * pushed-only root refresh; acquires root mutation lock around refreshPushedOnlyRootBranchUnlocked for push mode.
   *
   * @param state - Run state for the prepared worktree root repository.
   */
  async function refreshPushedOnlyRootBranch(
    state: WorktreeUpdateFromMainState,
  ): Promise<void> {
    if (state.executionMode !== "push") {
      await refreshPushedOnlyRootBranchUnlocked(state);
      return;
    }

    await worktreeStackWithRepoMutationLock(
      config.projectRoot,
      state.worktreePath,
      `worktree-stack-update-from-main:${state.targetBranch}:root:${state.rootBranch}:pushed-only`,
      "wait",
      async () => {
        await refreshPushedOnlyRootBranchUnlocked(state);
      },
    );
  }

  /**
   * Acquires the repo writer lock when push mode runs with batch locking enabled.
   *
   * @remarks
   * I/O: delegates to worktreeStackAcquireRepoWriterLock; ordering matches the prior inline guard
   * at the start of runUpdateFromMain's try body.
   */
  async function acquireBatchWriterLockIfNeededForUpdateFromMain(options: {
    cliOptions: WorktreeUpdateFromMainOptions;
    state: WorktreeUpdateFromMainState;
  }): Promise<void> {
    if (
      options.state.executionMode === "push" &&
      !options.cliOptions.skipBatchWriterLock
    ) {
      await worktreeStackAcquireRepoWriterLock(
        config.projectRoot,
        `worktree-stack-update-from-main:${options.state.targetBranch}:${options.state.worktreePath}`,
      );
    }
  }

  /** Executes the full update-from-main workflow for a prepared worktree, returning 0 on success. */
  async function runUpdateFromMain(
    options: WorktreeUpdateFromMainOptions,
  ): Promise<number> {
    const state = createState(options);

    if (
      !fs.existsSync(state.worktreePath) ||
      !fs.statSync(state.worktreePath).isDirectory()
    ) {
      console.error(
        `[worktree] ERROR: Worktree path does not exist: ${state.worktreePath}`,
      );
      return 1;
    }

    try {
      await acquireBatchWriterLockIfNeededForUpdateFromMain({
        cliOptions: options,
        state,
      });

      requirePrerequisites(state);
      state.currentStep = "reattach-root-before-validation";
      state.rootBranch =
        worktreeStackReadJsonField(state.metadataPath, "rootBranch") ?? "";
      if (state.executionMode === "push") {
        try {
          worktreeStackAttachExpectedBranch(state.worktreePath, state.rootBranch);
        } catch (error) {
          worktreeStackWarn(
            `Root was detached; could not reattach to ${state.rootBranch}. Proceeding with validation anyway. (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }

      validateWorktreeState(state);
      if (state.refreshMode === "live-worktree") {
        requireCleanWorkingTree(state.worktreePath, "root");
      }
      console.log(buildUpdateFromMainPlanSummary(state));

      for (const submodule of requiredSubmodulePaths) {
        const repoDir = path.join(state.worktreePath, submodule);
        if (state.refreshMode === "live-worktree") {
          await refreshLiveRepoBranch(
            state,
            submodule,
            repoDir,
            state.submoduleBranch,
          );
          if (state.executionMode === "push") {
            state.refreshedSubmoduleShas[submodule] = worktreeStackRunGit(
              repoDir,
              ["rev-parse", "HEAD"],
            ).stdout.trim();
          }
        } else {
          await refreshPushedOnlyRepoBranch(
            state,
            submodule,
            repoDir,
            state.submoduleBranch,
          );
        }
      }

      if (state.refreshMode === "live-worktree") {
        await refreshLiveRootBranch(state);
        if (state.executionMode === "push") {
          WorktreeStackKit_updateConfiguredSubmodules({
            config: config.configuredSubmodules,
            rootDir: state.worktreePath,
          });
          WorktreeStackKit_syncRequiredSubmoduleBranches({
            branchName: state.submoduleBranch,
            config: config.repoRootSync,
            rootDir: state.worktreePath,
            syncMode: "ff-only",
          });
        }
      } else {
        await refreshPushedOnlyRootBranch(state);
      }

      if (state.executionMode === "plan") {
        worktreeStackInfo(
          "Plan only. Re-run with --push to execute the refresh.",
        );
        return 0;
      }

      for (const submodule of requiredSubmodulePaths) {
        validateRemoteAncestry(
          state,
          submodule,
          path.join(state.worktreePath, submodule),
          state.submoduleBranch,
        );
        if (state.refreshMode === "live-worktree") {
          validateRepoCleanAfterRefresh(
            path.join(state.worktreePath, submodule),
            submodule,
          );
        }
      }
      validateRemoteAncestry(state, "root", state.worktreePath, state.rootBranch);
      if (state.refreshMode === "live-worktree") {
        validateRepoCleanAfterRefresh(state.worktreePath, "root");
      }

      worktreeStackInfo(
        `Updated the worktree domain from origin/${state.targetBranch}.`,
      );
      printRefreshedSubmoduleShas(state);
      return 0;
    } catch (error: unknown) {
      console.error(formatCliErrorMessage(error));
      printDebugContext(state);
      printRefreshedSubmoduleShas(state);
      if (state.refreshMode === "pushed-only" && state.currentTempWorktree) {
        worktreeStackWarn(
          `Temporary refresh worktree preserved for inspection: ${state.currentTempWorktree}`,
        );
      }
      return 1;
    } finally {
      worktreeStackReleaseAllNamedLocks();
      if (state.executionMode === "push" && !options.skipBatchWriterLock) {
        worktreeStackReleaseRepoWriterLock(config.projectRoot);
      }
    }
  }

  /** CLI entry point for update-from-main: parses args and runs the update workflow. */
  async function runUpdateFromMainCli(
    argv: readonly string[],
  ): Promise<number> {
    try {
      const parsedOptions = parseUpdateFromMainCliArgs(argv);
      return parsedOptions === null ? 0 : await runUpdateFromMain(parsedOptions);
    } catch (error: unknown) {
      console.error(formatCliErrorMessage(error));
      if (error instanceof WorktreeStackKit_UpdateFromMainCliUsageError) {
        printUsage();
      }
      return 1;
    }
  }

  return {
    buildUpdateFromMainOperationPlan,
    buildUpdateFromMainPlanSummary,
    parseUpdateFromMainCliArgs,
    runUpdateFromMain,
    runUpdateFromMainCli,
  };
}

/** Runs the configured update-from-main CLI without callers needing to retain a command object. */
export async function WorktreeStackKit_runUpdateFromMainCli(
  options: WorktreeStackKit_RunUpdateFromMainCliOptions,
): Promise<number> {
  return WorktreeStackKit_createUpdateFromMainCommand(
    options.config,
  ).runUpdateFromMainCli(options.argv);
}

/** Runs a configured update-from-main workflow without callers needing to retain a command object. */
export async function WorktreeStackKit_runUpdateFromMain(
  options: WorktreeStackKit_RunUpdateFromMainOptions,
): Promise<number> {
  return WorktreeStackKit_createUpdateFromMainCommand(
    options.config,
  ).runUpdateFromMain(options.options);
}
