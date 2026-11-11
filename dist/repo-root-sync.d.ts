/**
 * @fileoverview Config-driven repo-root branch sync helpers for worktree workflows.
 *
 * Flow: explicit submodule path config + git probes + repo locks -> clean repo-root main sync,
 * configured submodule update, and required submodule branch readiness without project literals in
 * reusable package code.
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/repo-root-sync.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-submodules.ts - Configured submodule update helpers this module invokes after fast-forwarding the repo-root checkout so optional submodule checkouts match project-owned path config.
 * @see packages/worktree-kit/src/merge-command.ts - Merge orchestration that calls `WorktreeStackKit_syncRepoRootTargetCheckout` when post-merge alignment must bring the repo-root checkout and required submodules in sync with `main`.
 * @see packages/worktree-kit/src/repo-root-sync.unit.test.ts - Jest regression coverage for repo-root fetch, ff-only merge, dirty-worktree guards, configured submodule refresh, and lock-wrapped checkout sequencing owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_ConfiguredSubmoduleSyncMode, type WorktreeStackKit_ConfiguredSubmodulesConfig } from "./configured-submodules.js";
export type WorktreeStackKit_RepoRootSyncConfig = {
    configuredSubmodules: WorktreeStackKit_ConfiguredSubmodulesConfig;
    requiredSubmodulePaths: readonly string[];
};
export type WorktreeStackKit_SyncRequiredSubmoduleBranches_Options = {
    branchName: string;
    config: WorktreeStackKit_RepoRootSyncConfig;
    remoteName?: string;
    rootDir: string;
    syncMode?: WorktreeStackKit_ConfiguredSubmoduleSyncMode;
};
export type WorktreeStackKit_SyncRepoRootTargetCheckout_Options = {
    config: WorktreeStackKit_RepoRootSyncConfig;
    remoteName?: string;
    rootDir: string;
    targetBranch: string;
};
export type WorktreeStackKit_SyncRepoRootTargetCheckoutWithLocks_Options = WorktreeStackKit_SyncRepoRootTargetCheckout_Options & {
    ownerLabel: string;
};
/** Fetches and checks out `branchName` across required configured submodule paths. */
export declare function WorktreeStackKit_syncRequiredSubmoduleBranches(options: WorktreeStackKit_SyncRequiredSubmoduleBranches_Options): void;
/** Fast-forwards the repo-root checkout on `main`, including configured submodule checkouts. */
export declare function WorktreeStackKit_syncRepoRootTargetCheckout(options: WorktreeStackKit_SyncRepoRootTargetCheckout_Options): void;
/** Wraps repo-root target checkout sync with root-main and per-repo mutation locks. */
export declare function WorktreeStackKit_syncRepoRootTargetCheckoutWithLocks(options: WorktreeStackKit_SyncRepoRootTargetCheckoutWithLocks_Options): Promise<void>;
