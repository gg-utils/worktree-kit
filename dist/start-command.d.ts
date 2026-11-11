/**
 * @fileoverview Config-driven prepared-worktree start command runner.
 *
 * Flow: argv + project config -> prepared-worktree validation -> optional repair -> configured
 * preflight/register/router commands -> configured long-running runtime command. Project-specific
 * submodule names, local-edge script paths, env keys, and editor launcher details stay in root config.
 *
 * @testing Node test runner: npm run worktree-kit:test --
 *
 * @see scripts/worktree-stack/commands/start.ts - Repository `worktrees:start` adapter that resolves the repo root, loads worktrees.config.ts, and delegates argv into WorktreeStackKit_createStartCommand from this module.
 * @see worktrees.config.ts - Root prepared-worktree configuration whose checkout contracts, submodule paths, env keys, and local-edge hook builders populate the config object this factory consumes.
 * @see packages/worktree-kit/src/start-command.unit.test.ts - Node test runner suite that exercises argv parsing, usage rendering, and the configured start pipeline behavior owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export type WorktreeStackKit_StartCommandSpec = {
    args: readonly string[];
    command: string;
    cwd?: string;
};
export type WorktreeStackKit_StartActionResult = {
    stderr?: string;
    stdout?: string;
} | void;
export type WorktreeStackKit_StartCommandContext = {
    projectRoot: string;
    realmSlug: string;
    worktreePath: string;
};
export type WorktreeStackKit_StartCommandCheckoutContractConfig = {
    buildFieldCommand: (options: {
        fieldName: string;
        projectRoot: string;
        worktreePath: string;
    }) => WorktreeStackKit_StartCommandSpec;
    expectedCheckoutKind: string;
};
export type WorktreeStackKit_StartCommandEditorConfig = {
    displayName: string;
    launcherCommand: string;
};
export type WorktreeStackKit_StartCommandEnvKeysConfig = {
    generatedDir: string;
    realmSlug: string;
    runtimeAliasBypass: string;
    runtimeAliasBypassValue: string;
    spawnedEnvFile: string;
    spawnedProjectRoot: string;
    spawnedRootEnvFile: string;
};
export type WorktreeStackKit_StartCommandRequiredFileConfig = {
    description: string;
    filePath: string;
};
export type WorktreeStackKit_StartCommandRequiredSubmoduleConfig = {
    packageManifestRelativePath: string;
    path: string;
};
export type WorktreeStackKit_StartCommandUsageConfig = {
    commandLines: readonly string[];
};
export type WorktreeStackKit_StartCommandConfig = {
    buildMarkRealmInactiveCommand?: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartCommandSpec;
    buildPreflightCommand: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartCommandSpec;
    buildRealmRegisterCommand?: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartCommandSpec;
    buildReconcileRouterCommand: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartCommandSpec;
    buildRepairCommand?: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartCommandSpec;
    buildRuntimeCommand: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartCommandSpec;
    canonicalRootWorkspacePathRelativePath: string;
    canonicalRootEnvRelativePath: string;
    checkoutContract: WorktreeStackKit_StartCommandCheckoutContractConfig;
    clearAfterRealmResolvedLogSuffixes: readonly string[];
    clearBeforeRepairLogSuffixes: readonly string[];
    defaultMachineRootRelativePath: string;
    editor: WorktreeStackKit_StartCommandEditorConfig;
    envKeys: WorktreeStackKit_StartCommandEnvKeysConfig;
    knownLogSuffixes: readonly string[];
    markRealmInactive?: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartActionResult;
    metadataRelativePath: string;
    projectRoot: string;
    registerRealm?: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartActionResult;
    repairWorktreeArtifacts?: (options: WorktreeStackKit_StartCommandContext) => WorktreeStackKit_StartActionResult;
    requiredCommandNames: readonly string[];
    requiredFiles: readonly WorktreeStackKit_StartCommandRequiredFileConfig[];
    requiredRuntimeDependencyRelativePaths: readonly string[];
    requiredSubmodules: readonly WorktreeStackKit_StartCommandRequiredSubmoduleConfig[];
    startLogDir: string;
    usage: WorktreeStackKit_StartCommandUsageConfig;
    worktreeAgentContextRelativePath: string;
    worktreeEnvRelativePath: string;
    worktreeInfoRelativePath: string;
    worktreeReadmeRelativePath: string;
};
/** Parsed argv for starting a prepared worktree runtime and optional editor launch. */
export type WorktreeStartOptions = {
    openWindsurf: boolean;
    worktreePath: string;
};
export type WorktreeStackKit_StartCommand = {
    parseStartCliArgs: (argv: readonly string[]) => WorktreeStartOptions | null;
    runWorktreeStart: (options: WorktreeStartOptions) => number;
    runWorktreeStartCli: (argv: readonly string[]) => number;
};
/** Renders start CLI usage from project-supplied command lines and editor label. */
export declare function WorktreeStackKit_renderStartUsage(config: WorktreeStackKit_StartCommandConfig): string;
export declare function WorktreeStackKit_createStartCommand(config: WorktreeStackKit_StartCommandConfig): WorktreeStackKit_StartCommand;
