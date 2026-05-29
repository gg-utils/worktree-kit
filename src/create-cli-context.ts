/**
 * @fileoverview Config-driven argv parsing and base context construction for worktree creation.
 *
 * Flow: argv + project config -> create options -> generic base create context. Project-specific
 * usage text, env seed paths, port bundles, and post-processing stay in the root adapter/config.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/create-cli-context.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create runner that imports `WorktreeStackKit_parseCreateArgs` and `WorktreeStackKit_buildCreateBaseContext` here, then merges slot ports, env orchestration, and git/realm steps before delegating to project services.
 * @see packages/worktree-kit/src/create-cli-context.unit.test.ts - Node:test regression file that asserts argv parsing, `--help` exits, required-flag errors, and base-context path resolution owned by this module.
 * @see worktrees.config.ts - Root `worktrees.config.ts` adapter that types `WorktreeStackKit_CreateCliContextConfig` and supplies env keys, usage text, and paths consumed when the configured create command builds the kit config object.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import fs from "node:fs";
import path from "node:path";

import {
  worktreeStackError,
  worktreeStackPrintKv,
} from "@gg-utils/worktree-core/foundation";
import { worktreeStackNormalizeBranchPrefix } from "@gg-utils/worktree-core/prefix";
import {
  worktreeStackFormatFolderDateToken,
  worktreeStackPrimaryWorktreePath,
  worktreeStackResolveDefaultWorktreesBase,
} from "@gg-utils/worktree-core/worktree-discovery";

export type WorktreeStackKit_CreateOptions = {
  baseBranch: string;
  branchPrefix: string;
  copyEnvFromMain: boolean;
  installPreferOffline: boolean;
  installSkipExisting: boolean;
  metadataSource: string;
  openWindsurf: boolean;
  requestedRealmSlug: string;
  rootBranch: string;
  runInstall: boolean;
  slot: number;
  stackName: string;
  startMode: "iterm" | "none" | "terminal";
  submoduleBranch: string;
  worktreeFolderDateToken: string;
  worktreePathOverride: string;
  worktreesBase: string;
};

export type WorktreeStackKit_CreateBaseContext = {
  antigravityRegistrationStatus: string;
  codexRegistrationStatus: string;
  currentStep: string;
  installCleanlinessStatus: string;
  localLogicalEnvironmentFile: string;
  localStateSourceWorkspacePath: string;
  machineRoot: string;
  options: WorktreeStackKit_CreateOptions;
  primaryWorkspaceEnvFile: string;
  primaryWorkspacePath: string;
  realmAssignmentSource: string;
  realmSlug: string;
  rootDir: string;
  worktreePath: string;
};

export type WorktreeStackKit_CreateCliContextConfig = {
  branchPrefixDefault: string;
  datePrefixEnvKey: string;
  defaultBaseBranch: string;
  defaultMetadataSource: string;
  defaultWorktreesDirectoryName: string;
  environment: NodeJS.ProcessEnv;
  localLogicalEnvironmentRelativePath: string;
  localStateSourceWorkspacePathEnvKey: string;
  machineRootRelativePath: string;
  primaryWorkspaceEnvRelativePath: string;
  projectRoot: string;
  usageText: string;
};

export type WorktreeStackKit_CreateBaseDebugContext = Pick<
  WorktreeStackKit_CreateBaseContext,
  | "currentStep"
  | "machineRoot"
  | "options"
  | "primaryWorkspaceEnvFile"
  | "primaryWorkspacePath"
  | "realmSlug"
  | "worktreePath"
>;

/** Prints the configured long-form create usage text. */
export function WorktreeStackKit_printCreateUsage(
  config: WorktreeStackKit_CreateCliContextConfig,
): void {
  console.log(config.usageText);
}

/** Parses worktree create argv into normalized options. */
export function WorktreeStackKit_parseCreateArgs(
  argv: readonly string[],
  config: WorktreeStackKit_CreateCliContextConfig,
): WorktreeStackKit_CreateOptions | null {
  const options: WorktreeStackKit_CreateOptions = {
    baseBranch: config.defaultBaseBranch,
    branchPrefix: config.branchPrefixDefault,
    copyEnvFromMain: false,
    installPreferOffline: true,
    installSkipExisting: false,
    metadataSource: config.defaultMetadataSource,
    openWindsurf: false,
    requestedRealmSlug: "",
    rootBranch: "",
    runInstall: true,
    slot: Number.NaN,
    stackName: "",
    startMode: "none",
    submoduleBranch: "",
    worktreeFolderDateToken:
      config.environment[config.datePrefixEnvKey] ??
      worktreeStackFormatFolderDateToken(),
    worktreePathOverride: "",
    worktreesBase: worktreeStackResolveDefaultWorktreesBase({
      defaultWorktreesDirectoryName: config.defaultWorktreesDirectoryName,
      projectRoot: config.projectRoot,
    }),
  };

  for (let index = 0; index < argv.length; ) {
    const argument = argv[index];
    switch (argument) {
      case "--name":
        options.stackName = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--prefix":
        options.branchPrefix = worktreeStackNormalizeBranchPrefix(
          argv[index + 1] ?? "",
        );
        index += 2;
        break;
      case "--slot":
        options.slot = Number.parseInt(argv[index + 1] ?? "", 10);
        index += 2;
        break;
      case "--base-branch":
        options.baseBranch = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--root-branch":
        options.rootBranch = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--submodule-branch":
        options.submoduleBranch = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--metadata-source":
        options.metadataSource = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--realm":
        options.requestedRealmSlug = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--worktree-path":
        options.worktreePathOverride = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--worktrees-base":
        options.worktreesBase = argv[index + 1] ?? "";
        index += 2;
        break;
      case "--install":
        options.runInstall = true;
        index += 1;
        break;
      case "--no-install":
        options.runInstall = false;
        index += 1;
        break;
      case "--copy-env-from-main":
        options.copyEnvFromMain = true;
        index += 1;
        break;
      case "--install-skip-existing":
        options.installSkipExisting = true;
        index += 1;
        break;
      case "--install-prefer-online":
        options.installPreferOffline = false;
        index += 1;
        break;
      case "--start":
        options.startMode = "terminal";
        index += 1;
        break;
      case "--start-iterm":
        options.startMode = "iterm";
        index += 1;
        break;
      case "--open-windsurf":
        options.openWindsurf = true;
        index += 1;
        break;
      case "--no-open-windsurf":
        options.openWindsurf = false;
        index += 1;
        break;
      case "--no-start-iterm":
        options.startMode = "none";
        index += 1;
        break;
      case "--help":
        WorktreeStackKit_printCreateUsage(config);
        return null;
      default:
        worktreeStackError(`Unknown argument: ${argument}`);
    }
  }

  if (
    !options.stackName ||
    !Number.isInteger(options.slot) ||
    options.slot <= 0
  ) {
    WorktreeStackKit_printCreateUsage(config);
    worktreeStackError("--name and a positive integer --slot are required.");
  }

  if (!options.rootBranch) {
    options.rootBranch = `${options.branchPrefix}/${options.stackName}`;
  }
  if (!options.submoduleBranch) {
    options.submoduleBranch = `${options.branchPrefix}/${options.stackName}`;
  }

  return options;
}

/** Resolves an explicit destination worktree path, creating and realpathing its parent. */
export function WorktreeStackKit_resolveExplicitCreateWorktreePath(
  rawPath: string,
): string {
  const parentDir = path.dirname(rawPath);
  fs.mkdirSync(parentDir, { recursive: true });
  return path.join(fs.realpathSync(parentDir), path.basename(rawPath));
}

/** Builds the generic create context before project-specific fields are attached. */
export function WorktreeStackKit_buildCreateBaseContext(options: {
  config: WorktreeStackKit_CreateCliContextConfig;
  createOptions: WorktreeStackKit_CreateOptions;
}): WorktreeStackKit_CreateBaseContext {
  const { config, createOptions } = options;
  const primaryWorkspacePath = worktreeStackPrimaryWorktreePath(
    config.projectRoot,
  );
  const localStateSourceWorkspacePath =
    config.environment[config.localStateSourceWorkspacePathEnvKey] ||
    config.projectRoot;
  const primaryWorkspaceEnvFile = path.join(
    primaryWorkspacePath,
    config.primaryWorkspaceEnvRelativePath,
  );
  const localLogicalEnvironmentFile = path.join(
    localStateSourceWorkspacePath,
    config.localLogicalEnvironmentRelativePath,
  );
  const resolvedWorktreesBase = path.resolve(createOptions.worktreesBase);
  const worktreePath = createOptions.worktreePathOverride
    ? WorktreeStackKit_resolveExplicitCreateWorktreePath(
        createOptions.worktreePathOverride,
      )
    : "";

  return {
    antigravityRegistrationStatus: "not attempted",
    codexRegistrationStatus: "not attempted",
    currentStep: "initialization",
    installCleanlinessStatus: "not checked",
    localLogicalEnvironmentFile,
    localStateSourceWorkspacePath,
    machineRoot: path.join(
      primaryWorkspacePath,
      config.machineRootRelativePath,
    ),
    options: {
      ...createOptions,
      worktreesBase: worktreePath
        ? path.dirname(worktreePath)
        : resolvedWorktreesBase,
    },
    primaryWorkspaceEnvFile,
    primaryWorkspacePath,
    realmAssignmentSource: "stack-name",
    realmSlug: "",
    rootDir: config.projectRoot,
    worktreePath,
  };
}

/** Emits key-value debug lines for fields common to every create context. */
export function WorktreeStackKit_printCreateBaseDebugContext(
  context: WorktreeStackKit_CreateBaseDebugContext,
): void {
  worktreeStackPrintKv("step", context.currentStep);
  worktreeStackPrintKv("primary-workspace-path", context.primaryWorkspacePath);
  worktreeStackPrintKv(
    "primary-workspace-env-file",
    context.primaryWorkspaceEnvFile,
  );
  worktreeStackPrintKv("stack-name", context.options.stackName);
  worktreeStackPrintKv(
    "worktree-folder-date-token",
    context.options.worktreeFolderDateToken,
  );
  worktreeStackPrintKv("realm-slug", context.realmSlug);
  worktreeStackPrintKv("worktree-path", context.worktreePath);
  worktreeStackPrintKv("base-branch", context.options.baseBranch);
  worktreeStackPrintKv("root-branch", context.options.rootBranch);
  worktreeStackPrintKv("submodule-branch", context.options.submoduleBranch);
  worktreeStackPrintKv("metadata-source", context.options.metadataSource);
  worktreeStackPrintKv("slot", String(context.options.slot));
  worktreeStackPrintKv("machine-root", context.machineRoot);
  worktreeStackPrintKv("start-mode", context.options.startMode);
}
