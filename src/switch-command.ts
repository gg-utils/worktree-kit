/**
 * @fileoverview Config-driven prepared-worktree switch command runner.
 *
 * Flow: argv + explicit command config -> normalized branch identity -> prepared-worktree metadata
 * lookup -> editor launch or configured create / interactive picker subprocess. Root adapters supply
 * npm script names and usage text so package code stays reusable.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/switch-command.unit.test.ts
 *
 * @see packages/worktree-core/src/worktree-discovery.ts - Prepared-worktree directory listing and per-worktree metadata path helpers consumed when this command scans stacks and reads stack JSON.
 * @see packages/worktree-kit/src/switch-command.unit.test.ts - Node test module asserting argv parsing, prepared-worktree discovery, prefix/name matching, editor command resolution, and usage text from this module.
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports WorktreeStackKit_runSwitchCommand and related switch types so root npm script adapters can import the kit entrypoint.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  WORKTREE_STACK_DEFAULT_BRANCH_PREFIX,
  WORKTREE_STACK_EDITOR_LAUNCH_MAP,
  WORKTREE_STACK_KNOWN_PREFIXES,
  worktreeStackBuildBranchName,
  worktreeStackExtractBranchPrefix,
  worktreeStackIsKnownPrefix,
  worktreeStackNormalizeBranchPrefix,
} from "@gg-utils/worktree-core/prefix";
import {
  worktreeStackError,
  worktreeStackInfo,
  worktreeStackRunCommand,
} from "@gg-utils/worktree-core/foundation";
import {
  worktreeStackListPreparedWorktrees,
  worktreeStackMetadataPathForWorktree,
  worktreeStackPrimaryWorktreePath,
} from "@gg-utils/worktree-core/worktree-discovery";

export type WorktreeStackKit_CommandInvocation = {
  args: readonly string[];
  command: string;
};

export type WorktreeStackKit_SwitchCommandConfig = {
  createCommand: WorktreeStackKit_CommandInvocation;
  interactiveCommand: WorktreeStackKit_CommandInvocation;
  projectRoot: string;
  usageCommandLines: readonly string[];
};

export type WorktreeStackKit_RunSwitchCommand_Options = {
  argv: readonly string[];
  config: WorktreeStackKit_SwitchCommandConfig;
};

/** Parsed CLI switches for locating or creating a prepared worktree and launching its editor. */
export type WorktreeStackKit_SwitchOptions = {
  branchPrefix: string;
  dryRun: boolean;
  editorOverride: string;
  environment: string;
  interactive: boolean;
  slot: number;
  stackName: string;
};

/** Prepared worktree identity synthesized from stack metadata beside each candidate directory. */
export type WorktreeStackKit_DiscoveredSwitchWorktree = {
  branchPrefix: string;
  slot: number;
  stackName: string;
  worktreePath: string;
};

/** Renders the extended switch command help text from configured command examples. */
export function WorktreeStackKit_renderSwitchUsage(
  config: WorktreeStackKit_SwitchCommandConfig,
): string {
  const exampleCommand = WorktreeStackKit_switchExampleCommand(config);
  return `Usage:
${config.usageCommandLines.map((line) => `  ${line}`).join("\n")}

Required:
  --name <stack-name>      Logical stack/worktree name (example: fix-auth)

Options:
  --prefix <prefix>        Branch prefix / editor tool name (default: codex)
  --editor <editor>        Override the editor to launch (ignores prefix→editor mapping)
  --slot <number>          Slot number for creation if the worktree doesn't exist yet
  --dry-run                Show what would happen without creating or launching
  --interactive             Launch interactive worktree picker
  --environment <realm>     Filter interactive picker by realm/environment slug
  --help                   Show this help

Known prefixes: ${WORKTREE_STACK_KNOWN_PREFIXES.join(", ")}

What this command does:
  1. Scans all prepared worktrees for a matching (prefix, stack-name) pair
  2. If found → launches the associated editor/tool
  3. If not found → runs the configured create command, then launches

  With --interactive:
  1. Launches the configured interactive worktree picker
  2. User selects a worktree from the list
  3. Selected worktree's editor is launched

Examples:
  Switch to an existing default-prefix worktree:
    ${exampleCommand} --name fix-auth

  Switch to (or create) an alternate-prefix variant:
    ${exampleCommand} --prefix antigravity --name fix-auth --slot 5

  Open in a custom editor regardless of prefix:
    ${exampleCommand} --prefix claude --name fix-auth --editor cursor

  Interactive picker with environment filter:
    ${exampleCommand} --interactive --environment worktree-01`;
}


/** Returns the first configured usage command without a trailing option placeholder. */
function WorktreeStackKit_switchExampleCommand(
  config: WorktreeStackKit_SwitchCommandConfig,
): string {
  return (config.usageCommandLines[0] ?? "worktrees:switch").replace(
    /\s+\[options\]$/u,
    "",
  );
}

/** Parses post-`--` CLI tokens into switch options, normalizing prefixes and required flags. */
export function WorktreeStackKit_parseSwitchArgs(options: {
  argv: readonly string[];
  config: WorktreeStackKit_SwitchCommandConfig;
}): WorktreeStackKit_SwitchOptions | null {
  const { argv, config } = options;
  const parsedOptions: WorktreeStackKit_SwitchOptions = {
    branchPrefix: WORKTREE_STACK_DEFAULT_BRANCH_PREFIX,
    dryRun: false,
    editorOverride: "",
    environment: "",
    interactive: false,
    slot: Number.NaN,
    stackName: "",
  };

  for (let index = 0; index < argv.length; ) {
    const argument = argv[index];
    switch (argument) {
      case "--name":
        parsedOptions.stackName = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--prefix":
        parsedOptions.branchPrefix = worktreeStackNormalizeBranchPrefix(
          argv[index + 1] ?? "",
        );
        index += 2;
        break;
      case "--editor":
        parsedOptions.editorOverride = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--slot":
        parsedOptions.slot = Number.parseInt(argv[index + 1] ?? "", 10);
        index += 2;
        break;
      case "--dry-run":
        parsedOptions.dryRun = true;
        index += 1;
        break;
      case "--interactive":
        parsedOptions.interactive = true;
        index += 1;
        break;
      case "--environment":
        parsedOptions.environment = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--help":
        console.log(WorktreeStackKit_renderSwitchUsage(config));
        return null;
      default:
        worktreeStackError(`Unknown argument: ${String(argument)}`);
    }
  }

  if (!parsedOptions.interactive && !parsedOptions.stackName) {
    console.log(WorktreeStackKit_renderSwitchUsage(config));
    worktreeStackError("--name is required (or use --interactive for picker mode).");
  }

  return parsedOptions;
}

/** Enumerates prepared worktrees and attaches stack metadata read from disk. */
export function WorktreeStackKit_discoverSwitchPreparedWorktrees(
  rootDir: string,
): WorktreeStackKit_DiscoveredSwitchWorktree[] {
  const paths = worktreeStackListPreparedWorktrees(rootDir);
  const results: WorktreeStackKit_DiscoveredSwitchWorktree[] = [];

  for (const candidatePath of paths) {
    const metadataPath = worktreeStackMetadataPathForWorktree(candidatePath);
    if (!fs.existsSync(metadataPath)) {
      continue;
    }

    try {
      const raw = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      if (!WorktreeStackKit_switchMetadataIsRecord(raw)) {
        continue;
      }
      const stackName = WorktreeStackKit_readStringField(raw, "stackName");
      const rootBranch = WorktreeStackKit_readStringField(raw, "rootBranch");
      const slot = WorktreeStackKit_readNumberField(raw, "slot") ?? 0;
      const explicitPrefix = WorktreeStackKit_readStringField(raw, "branchPrefix");
      const parsedPrefix = explicitPrefix.length > 0
        ? explicitPrefix
        : worktreeStackExtractBranchPrefix(rootBranch).prefix;

      results.push({
        branchPrefix: parsedPrefix,
        slot,
        stackName,
        worktreePath: candidatePath,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      worktreeStackInfo(`Skipping malformed metadata: ${message}`);
    }
  }

  return results;
}

/** Selects the first discovered worktree whose normalized prefix and stack name match exactly. */
export function WorktreeStackKit_findMatchingSwitchWorktree(options: {
  branchPrefix: string;
  stackName: string;
  worktrees: readonly WorktreeStackKit_DiscoveredSwitchWorktree[];
}): WorktreeStackKit_DiscoveredSwitchWorktree | null {
  const { branchPrefix, stackName, worktrees } = options;
  return (
    worktrees.find(
      (candidate) =>
        candidate.branchPrefix === branchPrefix && candidate.stackName === stackName,
    ) ?? null
  );
}

/** Derives the shell command line for launching an editor, respecting explicit overrides. */
export function WorktreeStackKit_resolveSwitchEditorCommand(
  prefix: string,
  editorOverride: string,
): string | null {
  if (editorOverride.length > 0) {
    return editorOverride;
  }

  if (worktreeStackIsKnownPrefix(prefix)) {
    return WORKTREE_STACK_EDITOR_LAUNCH_MAP[prefix];
  }

  return null;
}

/** Runs the config-driven switch command and returns a process exit code. */
export function WorktreeStackKit_runSwitchCommand(
  options: WorktreeStackKit_RunSwitchCommand_Options,
): number {
  const { argv, config } = options;
  const parsedOptions = WorktreeStackKit_parseSwitchArgs({ argv, config });
  if (!parsedOptions) {
    return 0;
  }

  if (parsedOptions.interactive) {
    WorktreeStackKit_launchInteractiveSwitchPicker({
      config,
      environment: parsedOptions.environment,
    });
    return 0;
  }

  const primaryPath = worktreeStackPrimaryWorktreePath(config.projectRoot);
  const worktrees = WorktreeStackKit_discoverSwitchPreparedWorktrees(primaryPath);

  worktreeStackInfo(
    `Searching ${String(worktrees.length)} prepared worktrees for ` +
      `prefix='${parsedOptions.branchPrefix}' name='${parsedOptions.stackName}'…`,
  );

  const match = WorktreeStackKit_findMatchingSwitchWorktree({
    branchPrefix: parsedOptions.branchPrefix,
    stackName: parsedOptions.stackName,
    worktrees,
  });

  if (match) {
    worktreeStackInfo(
      `Found existing worktree at: ${match.worktreePath} (slot=${String(match.slot)})`,
    );
    if (parsedOptions.dryRun) {
      worktreeStackInfo("[dry-run] Would launch editor for this worktree.");
      return 0;
    }
    WorktreeStackKit_launchSwitchEditor({
      editorOverride: parsedOptions.editorOverride,
      prefix: parsedOptions.branchPrefix,
      worktreePath: match.worktreePath,
    });
    return 0;
  }

  worktreeStackInfo("No matching worktree found — initiating creation flow.");
  if (parsedOptions.dryRun) {
    worktreeStackInfo(
      `[dry-run] Would create worktree with prefix='${parsedOptions.branchPrefix}' ` +
        `name='${parsedOptions.stackName}' slot=${
          Number.isNaN(parsedOptions.slot) ? "<required>" : String(parsedOptions.slot)
        }`,
    );
    return 0;
  }

  WorktreeStackKit_createSwitchWorktree({ config, options: parsedOptions });

  const updatedWorktrees = WorktreeStackKit_discoverSwitchPreparedWorktrees(primaryPath);
  const created = WorktreeStackKit_findMatchingSwitchWorktree({
    branchPrefix: parsedOptions.branchPrefix,
    stackName: parsedOptions.stackName,
    worktrees: updatedWorktrees,
  });

  if (created) {
    worktreeStackInfo(`Created worktree at: ${created.worktreePath}`);
    WorktreeStackKit_launchSwitchEditor({
      editorOverride: parsedOptions.editorOverride,
      prefix: parsedOptions.branchPrefix,
      worktreePath: created.worktreePath,
    });
  } else {
    worktreeStackInfo("Create completed but worktree was not found on re-discovery. Check logs.");
  }

  return 0;
}

/** Returns true when a parsed JSON value can be read as metadata fields. */
function WorktreeStackKit_switchMetadataIsRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads a string metadata field, defaulting to blank when absent or differently typed. */
function WorktreeStackKit_readStringField(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
): string {
  const value = record[fieldName];
  return typeof value === "string" ? value : "";
}

/** Reads a number metadata field, returning null when absent or differently typed. */
function WorktreeStackKit_readNumberField(
  record: Readonly<Record<string, unknown>>,
  fieldName: string,
): number | null {
  const value = record[fieldName];
  return typeof value === "number" ? value : null;
}

/** Escapes a string for safe interpolation into a shell command passed to `sh -c`. */
function WorktreeStackKit_shellQuote(value: string): string {
  if (value.length === 0) {
    return "''";
  }
  return `'${value.replace(/'/gu, "'\\''")}'`;
}

/** Spawns the resolved editor subprocess inside the discovered worktree directory. */
function WorktreeStackKit_launchSwitchEditor(options: {
  editorOverride: string;
  prefix: string;
  worktreePath: string;
}): void {
  const { editorOverride, prefix, worktreePath } = options;
  const command = WorktreeStackKit_resolveSwitchEditorCommand(prefix, editorOverride);

  if (command === null) {
    worktreeStackInfo(
      `Prefix '${prefix}' uses a registration-based integration or is unknown. ` +
        `Worktree is ready at: ${worktreePath}`,
    );
    return;
  }

  const resolvedCommand = command.replace(
    /<PATH>/gu,
    WorktreeStackKit_shellQuote(worktreePath),
  );
  worktreeStackInfo(`Launching editor: ${resolvedCommand}`);

  try {
    spawnSync("sh", ["-c", resolvedCommand], {
      cwd: worktreePath,
      env: { ...process.env },
      stdio: "inherit",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    worktreeStackInfo(`Editor launch returned: ${message}`);
  }
}

/** Invokes the configured create command so a subsequent re-scan can locate the new stack. */
function WorktreeStackKit_createSwitchWorktree(options: {
  config: WorktreeStackKit_SwitchCommandConfig;
  options: WorktreeStackKit_SwitchOptions;
}): void {
  const { config, options: parsedOptions } = options;
  const createArgs = [
    ...config.createCommand.args,
    "--name",
    parsedOptions.stackName,
    "--prefix",
    parsedOptions.branchPrefix,
  ];

  if (Number.isInteger(parsedOptions.slot) && parsedOptions.slot > 0) {
    createArgs.push("--slot", String(parsedOptions.slot));
  } else {
    worktreeStackError(
      "A --slot is required when the switch creates a new worktree. " +
        "Pass --slot <number> to assign a port bundle.",
    );
  }

  worktreeStackInfo(
    `Creating new worktree: ${worktreeStackBuildBranchName(
      parsedOptions.branchPrefix,
      parsedOptions.stackName,
    )}`,
  );
  worktreeStackRunCommand(config.createCommand.command, createArgs, {
    cwd: config.projectRoot,
    env: { ...process.env },
    stdio: "inherit",
  });
}

/** Delegates to the configured interactive worktree picker command. */
function WorktreeStackKit_launchInteractiveSwitchPicker(options: {
  config: WorktreeStackKit_SwitchCommandConfig;
  environment: string;
}): void {
  const { config, environment } = options;
  const args = [...config.interactiveCommand.args];

  if (environment.length > 0) {
    args.push("--environment", environment);
  }

  worktreeStackInfo("Launching interactive worktree picker...");
  worktreeStackRunCommand(config.interactiveCommand.command, args, {
    cwd: config.projectRoot,
    env: { ...process.env },
    stdio: "inherit",
  });
}
