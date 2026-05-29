/**
 * @fileoverview Config-driven local-state file and directory sync helpers for prepared worktrees.
 *
 * Flow: explicit sync file/directory config -> tracked-content filtering -> workspace path rewrite
 * for configured text files -> target workspace copy.
 *
 * @testing Node.js test: npm run worktree-kit:test from the repository root (tsx Node test runner for packages/worktree-kit, including local-state-sync.unit.test.ts).
 *
 * @see packages/worktree-kit/src/configured-submodules.ts - Submodule path resolver whose listing drives which repo root receives `git ls-files` when deciding whether a candidate local directory is untracked.
 * @see packages/worktree-core/src/foundation.ts - Shared `worktreeStackRunGit` and logging primitives used for allow-failure `ls-files` probes and user-visible sync progress lines.
 * @see packages/worktree-kit/src/sync-local-workspaces.ts - CLI-oriented orchestrator that imports the exported sync helpers to mirror configured local files and directories into each target prepared-worktree workspace.
 * @see worktrees.config.ts - Host adapter that builds `WorktreeStackKit_LocalStateSyncConfig` consumed by this module when the platform wires worktree-kit into root worktree automation.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_ConfiguredSubmodulesConfig } from "./configured-submodules.js";
export type WorktreeStackKit_LocalStateSyncConfig = {
    configuredSubmodules: WorktreeStackKit_ConfiguredSubmodulesConfig;
    detectableLocalDirectoryBasenames: readonly string[];
    rewriteWorkspacePathFiles: readonly string[];
    syncableLocalDirectories: readonly string[];
    syncableLocalFiles: readonly string[];
};
export type WorktreeStackKit_DetectLocalDirectories_Options = {
    config: WorktreeStackKit_LocalStateSyncConfig;
    sourceWorkspacePath: string;
};
export type WorktreeStackKit_SyncLocalFilesIntoTarget_Options = {
    config: WorktreeStackKit_LocalStateSyncConfig;
    sourceWorkspacePath: string;
    targetWorkspacePath: string;
};
export type WorktreeStackKit_SyncLocalDirectoriesIntoTarget_Options = {
    config: WorktreeStackKit_LocalStateSyncConfig;
    sourceWorkspacePath: string;
    targetWorkspacePath: string;
};
/** Detects gitignored local directories that exist in the source workspace. */
export declare function WorktreeStackKit_detectLocalDirectories(options: WorktreeStackKit_DetectLocalDirectories_Options): string[];
/** Copies configured syncable local files from the source workspace into the target workspace. */
export declare function WorktreeStackKit_syncLocalFilesIntoTarget(options: WorktreeStackKit_SyncLocalFilesIntoTarget_Options): void;
/** Syncs configured and detected local directories from the source workspace into the target. */
export declare function WorktreeStackKit_syncLocalDirectoriesIntoTarget(options: WorktreeStackKit_SyncLocalDirectoriesIntoTarget_Options): void;
//# sourceMappingURL=local-state-sync.d.ts.map