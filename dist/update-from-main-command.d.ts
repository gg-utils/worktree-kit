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
import { type WorktreeStackKit_ConfiguredSubmodulesConfig } from "./configured-submodules.js";
import { type WorktreeStackKit_RepoRootSyncConfig } from "./repo-root-sync.js";
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
export type WorktreeStackKit_UpdateFromMainOperationPlanOptions = Pick<WorktreeUpdateFromMainOptions, "refreshMode" | "targetBranch" | "worktreePath"> & {
    refreshTmpRoot: string;
    rootBranch: string;
    submoduleBranch: string;
};
export type WorktreeStackKit_UpdateFromMainCommand = {
    buildUpdateFromMainOperationPlan: (options: WorktreeStackKit_UpdateFromMainOperationPlanOptions) => string[];
    buildUpdateFromMainPlanSummary: (state: WorktreeStackKit_UpdateFromMainPlanState) => string;
    parseUpdateFromMainCliArgs: (argv: readonly string[]) => WorktreeUpdateFromMainOptions | null;
    runUpdateFromMain: (options: WorktreeUpdateFromMainOptions) => Promise<number>;
    runUpdateFromMainCli: (argv: readonly string[]) => Promise<number>;
};
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
/** Renders update-from-main CLI usage from project-supplied command lines. */
export declare function WorktreeStackKit_renderUpdateFromMainUsage(config: WorktreeStackKit_UpdateFromMainCommandConfig): string;
export declare function WorktreeStackKit_createUpdateFromMainCommand(config: WorktreeStackKit_UpdateFromMainCommandConfig): WorktreeStackKit_UpdateFromMainCommand;
/** Runs the configured update-from-main CLI without callers needing to retain a command object. */
export declare function WorktreeStackKit_runUpdateFromMainCli(options: WorktreeStackKit_RunUpdateFromMainCliOptions): Promise<number>;
/** Runs a configured update-from-main workflow without callers needing to retain a command object. */
export declare function WorktreeStackKit_runUpdateFromMain(options: WorktreeStackKit_RunUpdateFromMainOptions): Promise<number>;
//# sourceMappingURL=update-from-main-command.d.ts.map