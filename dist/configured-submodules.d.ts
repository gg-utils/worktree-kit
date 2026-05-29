/**
 * @fileoverview Config-driven configured-submodule discovery and branch synchronization helpers.
 *
 * Flow: project app-submodule path config + `.gitmodules` + prepared-worktree metadata -> expected
 * submodule branch plans -> fetch/update/checkout operations.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/index.ts - Barrel re-export that surfaces this configured-submodule API through the primary `@gg-utils/worktree-kit` package entry and `./configured-submodules` export map.
 * @see packages/worktree-kit/src/update-from-main-command.ts - Update-from-main orchestration that invokes submodule fetch, sync, and update helpers from this module during prepared-worktree refresh.
 * @see packages/worktree-kit/src/configured-submodules.unit.test.ts - Jest unit tests that assert `.gitmodules` branch discovery and prepared-worktree `metadata.json` branch override behavior owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** A configured submodule with its branch, name, and workspace-relative path. */
export type WorktreeStackKit_ConfiguredSubmodule = {
    branchName: string;
    name: string;
    path: string;
};
/** Sync mode for configured submodule operations. */
export type WorktreeStackKit_ConfiguredSubmoduleSyncMode = "attach-only" | "ff-only";
export type WorktreeStackKit_ConfiguredSubmodulesConfig = {
    appSubmodulePaths: readonly string[];
};
export type WorktreeStackKit_ListConfiguredSubmodules_Options = {
    config: WorktreeStackKit_ConfiguredSubmodulesConfig;
    rootDir: string;
};
export type WorktreeStackKit_UpdateConfiguredSubmodules_Options = {
    config: WorktreeStackKit_ConfiguredSubmodulesConfig;
    rootDir: string;
};
export type WorktreeStackKit_SyncConfiguredSubmoduleBranches_Options = {
    config: WorktreeStackKit_ConfiguredSubmodulesConfig;
    remoteName?: string;
    rootDir: string;
    syncMode?: WorktreeStackKit_ConfiguredSubmoduleSyncMode;
};
/**
 * Lists all configured submodules from `.gitmodules` with their branch, name, and relative path.
 */
export declare function WorktreeStackKit_listConfiguredSubmodules(options: WorktreeStackKit_ListConfiguredSubmodules_Options): WorktreeStackKit_ConfiguredSubmodule[];
/** Returns just the paths of all configured submodules under `rootDir`. */
export declare function WorktreeStackKit_listConfiguredSubmodulePaths(options: WorktreeStackKit_ListConfiguredSubmodules_Options): string[];
/** Fetches and updates all configured submodules under `rootDir` to match configured branches. */
export declare function WorktreeStackKit_updateConfiguredSubmodules(options: WorktreeStackKit_UpdateConfiguredSubmodules_Options): void;
/** Syncs all configured submodules to their expected branches using the specified sync mode. */
export declare function WorktreeStackKit_syncConfiguredSubmoduleBranches(options: WorktreeStackKit_SyncConfiguredSubmoduleBranches_Options): void;
//# sourceMappingURL=configured-submodules.d.ts.map