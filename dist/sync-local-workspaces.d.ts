/**
 * @fileoverview Config-driven command runner for syncing local workspace state.
 *
 * Flow: argv -> source/target resolution -> package-owned local-state sync -> optional project
 * hook after each target receives copied files and directories.
 *
 * @testing Node test runner: npm run worktree-kit:test from the repo root executes packages/worktree-kit unit tests including src/sync-local-workspaces.unit.test.ts.
 *
 * @see packages/worktree-kit/src/local-state-sync.ts - Owns the file and directory copy helpers plus the typed local-state sync config this runner invokes for each resolved target workspace.
 * @see scripts/worktree-stack/commands/sync-local-files.ts - Worktree-stack CLI entrypoint that imports WorktreeStackKit_runSyncLocalWorkspacesCommand from this module to apply the root worktrees.config.ts adapter wiring.
 * @see worktrees.config.ts - Root repository adapter that supplies the WorktreeStackKit_SyncLocalWorkspacesConfig instance consumed when the sync-local command runs under project-owned wiring.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_LocalStateSyncConfig } from "./local-state-sync.js";
export type WorktreeStackKit_SyncLocalWorkspacesOptions = {
    sourceWorkspacePath: string;
    targetWorktrees: string[];
};
export type WorktreeStackKit_SyncLocalWorkspacesUsageConfig = {
    commandLines: readonly string[];
    examples: readonly string[];
    notes: readonly string[];
    syncedLocalStateLines: readonly string[];
};
export type WorktreeStackKit_AfterSyncLocalWorkspaceTarget_Options = {
    projectRoot: string;
    sourceWorkspacePath: string;
    targetWorkspacePath: string;
};
export type WorktreeStackKit_SyncLocalWorkspacesConfig = {
    afterSyncTarget?: (options: WorktreeStackKit_AfterSyncLocalWorkspaceTarget_Options) => void;
    defaultSourceWorkspacePath: string;
    defaultWorktreesDirectoryName: string;
    localStateSync: WorktreeStackKit_LocalStateSyncConfig;
    projectRoot: string;
    usage: WorktreeStackKit_SyncLocalWorkspacesUsageConfig;
};
export type WorktreeStackKit_RunSyncLocalWorkspacesCommand_Options = {
    argv: readonly string[];
    config: WorktreeStackKit_SyncLocalWorkspacesConfig;
};
/** Renders usage text from generic options plus project-supplied examples and content lines. */
export declare function WorktreeStackKit_renderSyncLocalWorkspacesUsage(usage: WorktreeStackKit_SyncLocalWorkspacesUsageConfig): string;
/** Parses sync-local-workspaces argv into source and explicit target options. */
export declare function WorktreeStackKit_parseSyncLocalWorkspacesArgs(options: {
    argv: readonly string[];
    defaultSourceWorkspacePath: string;
    usage: WorktreeStackKit_SyncLocalWorkspacesUsageConfig;
}): WorktreeStackKit_SyncLocalWorkspacesOptions | null;
/**
 * Resolves destination workspace paths that should receive copied local state.
 *
 * @remarks
 * Explicit targets are merged with the canonical root. Otherwise this combines prepared
 * worktrees registered in Git with sibling directories under the configured worktrees base that
 * contain a `.git` marker.
 */
export declare function WorktreeStackKit_resolveSyncLocalWorkspaceTargets(options: {
    canonicalRootWorkspacePath: string;
    defaultWorktreesBasePath: string;
    explicitTargets: readonly string[];
}): string[];
/** Syncs one target workspace and runs the configured post-sync hook if one exists. */
export declare function WorktreeStackKit_syncLocalWorkspaceTarget(options: {
    config: WorktreeStackKit_SyncLocalWorkspacesConfig;
    sourceWorkspacePath: string;
    targetWorkspacePath: string;
}): void;
/** Validates the source workspace, resolves target workspaces, and syncs each target. */
export declare function WorktreeStackKit_runSyncLocalWorkspacesCommand(options: WorktreeStackKit_RunSyncLocalWorkspacesCommand_Options): void;
