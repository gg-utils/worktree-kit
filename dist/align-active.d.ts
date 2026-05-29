/**
 * @fileoverview Config-driven align-active helpers for prepared worktree synchronization.
 *
 * Flow: explicit required-submodule config + worktree metadata -> refresh-mode selection,
 * merge/update planning, dirty normalization, and final validation without project package names in
 * reusable code.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/align-active.unit.test.ts
 *
 * @see packages/worktree-kit/src/align-active-command.ts - argv-driven sequential align-active runner that calls WorktreeStackKit_createAlignActive to plan, normalize, and validate prepared worktrees.
 * @see packages/worktree-kit/src/merge-command.ts - Injected merge plan builder whose steps are spliced into align-active operation lists after per-repo normalization.
 * @see packages/worktree-kit/src/update-from-main-command.ts - Injected update-from-main plan builder whose refresh steps follow merge plus batch-end repo-root sync in align-active plans.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_MergeCommandConfig } from "./merge-command.js";
import { type WorktreeUpdateFromMainRefreshMode, type WorktreeStackKit_UpdateFromMainCommandConfig } from "./update-from-main-command.js";
import { type WorktreeStackKit_RepoRootSyncConfig } from "./repo-root-sync.js";
export type WorktreeStackKit_AlignActiveConfig = {
    mergeCommand: WorktreeStackKit_MergeCommandConfig;
    metadataRelativePath: string;
    repoRootSync: WorktreeStackKit_RepoRootSyncConfig;
    requiredSubmodulePaths: readonly string[];
    updateFromMainCommand: WorktreeStackKit_UpdateFromMainCommandConfig;
};
/** Align-active execution mode: "plan" previews the operation list, "push" executes and pushes changes. */
export type WorktreeAlignActiveExecutionMode = "plan" | "push";
/** Policy for handling a dirty repo during align-active: "commit-and-push" checkpoints first, "fail" aborts. */
export type WorktreeAlignActiveDirtyPolicy = "commit-and-push" | "fail";
/** Refresh mode for align-active: "auto" selects based on dirty state, otherwise delegates to WorktreeUpdateFromMainRefreshMode. */
export type WorktreeAlignActiveRefreshMode = "auto" | WorktreeUpdateFromMainRefreshMode;
/** Worktree metadata loaded from the prepared worktree's metadata JSON file. */
export type WorktreeAlignActiveMetadata = {
    metadataPath: string;
    rootBranch: string;
    stackName: string;
    submoduleBranch: string;
    worktreePath: string;
};
/** Minimal logger interface required by align-active operations. */
export type WorktreeAlignActiveLogger = {
    info: (message: string) => void;
    printKv: (key: string, value: string) => void;
};
/** Input state for deciding how to handle a dirty repo with an existing remote. */
export type WorktreeAlignActiveNormalizeRepoRemoteState = {
    dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
    initialAheadCount: number;
    initialBehindCount: number;
    remoteBranchExists: boolean;
    repoIsDirty: boolean;
};
/** Decision produced by worktreeStackAlignActiveDecideDirtyRemoteHandling for a dirty repo. */
export type WorktreeAlignActiveNormalizeRepoRemoteDecision = {
    action: "continue";
} | {
    action: "error";
    message: "dirty-policy-fail" | "dirty-preexisting-divergence";
} | {
    action: "checkpoint-and-continue";
} | {
    action: "checkpoint-then-merge-remote";
};
/** Resolved refresh mode after consulting dirty state; aliases WorktreeUpdateFromMainRefreshMode. */
export type WorktreeAlignActiveResolvedRefreshMode = WorktreeUpdateFromMainRefreshMode;
/** A repo (root or submodule) that must be validated during align-active final checks. */
export type WorktreeAlignActiveValidationTarget = {
    branchName: string;
    label: string;
    repoDir: string;
};
export type WorktreeStackKit_AlignActive = {
    buildAlignActiveOperationPlan: (options: {
        metadata: WorktreeAlignActiveMetadata;
        refreshMode: WorktreeAlignActiveResolvedRefreshMode;
        rootDir: string;
        targetBranch: string;
    }) => string[];
    buildAlignActivePlanSummary: (options: {
        dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
        metadata: WorktreeAlignActiveMetadata;
        refreshMode: WorktreeAlignActiveResolvedRefreshMode;
        targetBranch: string;
    }) => string;
    worktreeStackAlignActiveBuildValidationTargets: (metadata: WorktreeAlignActiveMetadata) => WorktreeAlignActiveValidationTarget[];
    worktreeStackAlignActiveDecideDirtyRemoteHandling: (state: WorktreeAlignActiveNormalizeRepoRemoteState) => WorktreeAlignActiveNormalizeRepoRemoteDecision;
    worktreeStackAlignActiveDetermineRefreshMode: (worktreePath: string, requestedRefreshMode: WorktreeAlignActiveRefreshMode) => WorktreeAlignActiveResolvedRefreshMode;
    worktreeStackAlignActiveDetermineRefreshModeFromDirtyState: (options: {
        requestedRefreshMode: WorktreeAlignActiveRefreshMode;
        rootDirty: boolean;
        submoduleDirtyStates: Readonly<Record<string, boolean>>;
    }) => WorktreeAlignActiveResolvedRefreshMode;
    worktreeStackAlignActiveMetadataField: (worktreePath: string, fieldName: "rootBranch" | "stackName" | "submoduleBranch") => string;
    worktreeStackAlignActiveNormalizeRepoBranch: (options: {
        branchName: string;
        checkpointMessage: string;
        dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
        executionMode: WorktreeAlignActiveExecutionMode;
        label: string;
        logger?: WorktreeAlignActiveLogger;
        repoDir: string;
        rootDir: string;
    }) => Promise<void>;
    worktreeStackAlignActiveNormalizeWorktreeDomain: (options: {
        dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
        executionMode: WorktreeAlignActiveExecutionMode;
        logger?: WorktreeAlignActiveLogger;
        rootDir: string;
        worktreePath: string;
    }) => Promise<WorktreeAlignActiveMetadata>;
    worktreeStackAlignActiveReadMetadata: (worktreePath: string) => WorktreeAlignActiveMetadata;
    worktreeStackAlignActiveRepoDirty: (repoDir: string) => boolean;
    worktreeStackAlignActiveRequireTargetCheckoutReady: (rootDir: string, executionMode: WorktreeAlignActiveExecutionMode, targetBranch: string) => void;
    worktreeStackAlignActiveResolveRequestedWorktrees: (rootDir: string, requestedWorktreePaths: readonly string[]) => string[];
    worktreeStackAlignActiveValidateWorktreeAlignment: (targetBranch: string, worktreePath: string) => void;
};
export declare function WorktreeStackKit_createAlignActive(config: WorktreeStackKit_AlignActiveConfig): WorktreeStackKit_AlignActive;
//# sourceMappingURL=align-active.d.ts.map