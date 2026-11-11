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
export type WorktreeStackKit_CreateBaseDebugContext = Pick<WorktreeStackKit_CreateBaseContext, "currentStep" | "machineRoot" | "options" | "primaryWorkspaceEnvFile" | "primaryWorkspacePath" | "realmSlug" | "worktreePath">;
/** Prints the configured long-form create usage text. */
export declare function WorktreeStackKit_printCreateUsage(config: WorktreeStackKit_CreateCliContextConfig): void;
/** Parses worktree create argv into normalized options. */
export declare function WorktreeStackKit_parseCreateArgs(argv: readonly string[], config: WorktreeStackKit_CreateCliContextConfig): WorktreeStackKit_CreateOptions | null;
/** Resolves an explicit destination worktree path, creating and realpathing its parent. */
export declare function WorktreeStackKit_resolveExplicitCreateWorktreePath(rawPath: string): string;
/** Builds the generic create context before project-specific fields are attached. */
export declare function WorktreeStackKit_buildCreateBaseContext(options: {
    config: WorktreeStackKit_CreateCliContextConfig;
    createOptions: WorktreeStackKit_CreateOptions;
}): WorktreeStackKit_CreateBaseContext;
/** Emits key-value debug lines for fields common to every create context. */
export declare function WorktreeStackKit_printCreateBaseDebugContext(context: WorktreeStackKit_CreateBaseDebugContext): void;
