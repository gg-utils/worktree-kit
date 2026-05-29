/**
 * @fileoverview Config-driven prepared-worktree merge command runner.
 *
 * Flow: argv + project branch/submodule config -> prepared-worktree validation -> submodule-first
 * merges -> root gitlink resolution -> optional repo-root sync. Project package paths, command
 * surfaces, temp-root layout, and repo-root sync policy stay in root config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/repo-root-sync.ts - Repo-root checkout sync helpers this merge runner calls after submodule-first merges when config requires aligning the repo-root checkout with resolved gitlinks.
 * @see scripts/worktree-stack/commands/merge.ts - Root `worktrees:merge` CLI adapter that constructs WorktreeStackKit_createMergeCommand from worktrees.config.ts and delegates argv, audit, plan, and push execution to this module.
 * @see worktrees.config.ts - Project-owned merge tmp paths, required submodules, command surfaces, and repo-root sync knobs the root merge script passes into WorktreeStackKit_MergeCommandConfig consumed here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_RepoRootSyncConfig } from "./repo-root-sync.js";
export type WorktreeStackKit_MergeRequiredSubmodule = {
    path: string;
    planLabel?: string;
};
export type WorktreeStackKit_MergeUsageConfig = {
    commandLines: readonly string[];
};
export type WorktreeStackKit_MergeCommandConfig = {
    mergeTmpRootRelativePath: string;
    metadataRelativePath: string;
    projectRoot: string;
    repoRootSync: WorktreeStackKit_RepoRootSyncConfig;
    requiredCommandNames: readonly string[];
    requiredSubmodules: readonly WorktreeStackKit_MergeRequiredSubmodule[];
    usage: WorktreeStackKit_MergeUsageConfig;
};
export type WorktreeStackKit_RunMergeCliOptions = {
    argv: readonly string[];
    config: WorktreeStackKit_MergeCommandConfig;
};
export type WorktreeStackKit_RunMergeOptions = {
    config: WorktreeStackKit_MergeCommandConfig;
    options: WorktreeMergeOptions;
};
export type WorktreeStackKit_MergePlanState = {
    mergeTmpRoot: string;
    rootBranch: string;
    stackName: string;
    submoduleBranch: string;
    targetBranch: string;
    worktreePath: string;
};
export type WorktreeStackKit_MergeOperationPlanOptions = {
    mergeTmpRoot: string;
    rootBranch: string;
    submoduleBranch: string;
    targetBranch: string;
    worktreePath: string;
};
export type WorktreeStackKit_MergeCommand = {
    buildMergeOperationPlan: (options: WorktreeStackKit_MergeOperationPlanOptions) => string[];
    buildMergePlanSummary: (state: WorktreeStackKit_MergePlanState) => string;
    parseMergeCliArgs: (argv: readonly string[]) => WorktreeMergeOptions | null;
    runMerge: (options: WorktreeMergeOptions) => Promise<number>;
    runMergeCli: (argv: readonly string[]) => Promise<number>;
};
/** High-level merge command behavior spanning dry audit, plan-only, and push execution. */
export type WorktreeMergeExecutionMode = "audit" | "plan" | "push";
/** Parsed CLI options controlling merge execution, locking, and safety toggles. */
export type WorktreeMergeOptions = {
    executionMode: WorktreeMergeExecutionMode;
    skipBatchWriterLock?: boolean;
    skipRootSync: boolean;
    targetBranch: string;
    trustWorktreeSubmoduleState: boolean;
    worktreePath: string;
};
/** Renders merge CLI usage from project-supplied command lines. */
export declare function WorktreeStackKit_renderMergeUsage(config: WorktreeStackKit_MergeCommandConfig): string;
export declare function WorktreeStackKit_createMergeCommand(config: WorktreeStackKit_MergeCommandConfig): WorktreeStackKit_MergeCommand;
//# sourceMappingURL=merge-command.d.ts.map