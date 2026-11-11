/**
 * @fileoverview Package-owned inventory discovery for worktree Ink UI shells.
 *
 * This module owns product-neutral parsing, artifact coercion, issue derivation, health summary,
 * and inventory assembly for worktree-style Ink consoles. Project adapters provide checkout
 * identity resolution so package code does not import root scripts or project config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Ink UI contracts for inventory rows, issues, health summaries, and realm metadata that this module fills from git porcelain and local-edge artifacts.
 * @see scripts/worktree-stack/ui/cli-ink/load-discovery.ts - Root Ink CLI adapter that imports {@link WorktreeStackKit_loadInkInventory} from the package subpath and supplies project-root checkout identity for the interactive inventory shell.
 * @see packages/worktree-kit/src/ink-inventory-discovery.unit.test.ts - Node unit tests that stub git, filesystem, and registry collaborators to assert parsing, issue derivation, and {@link WorktreeStackKit_loadInkInventory} assembly owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiCheckoutKind, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRealmRecord } from "./ink-ui-contracts.js";
/**
 * One parsed row from `git worktree list --porcelain` output.
 *
 * @remarks
 * Populated by {@link parseGitWorktreeList}; null fields mean absent porcelain keys.
 */
export type WorktreeStackKit_InkParsedGitWorktreeEntry = {
    readonly worktreePath: string;
    readonly head: string | null;
    readonly branchRef: string | null;
    readonly detached: boolean;
};
/**
 * Normalized shape of the persisted local-edge healthcheck artifact for Ink rendering.
 *
 * @remarks
 * Values are coerced from JSON; nulls mean missing or mistyped fields in the file.
 */
export type WorktreeStackKit_InkHealthArtifact = {
    readonly runAt: string | null;
    readonly method: string | null;
    readonly probes: readonly {
        readonly realmSlug: string;
        readonly healthy: boolean;
        readonly statusCode: number | null;
        readonly failureDomain: string | null;
        readonly surface: string | null;
    }[];
};
/**
 * Resolved checkout identity used to classify the canonical root workspace during discovery.
 */
export type WorktreeStackKit_InkDiscoveryCheckoutIdentity = {
    readonly canonicalRootWorkspacePath: string;
    readonly checkoutKind: WorktreeStackKit_InkUiCheckoutKind;
};
/** Injectable collaborators so tests can stub git, filesystem, and realm discovery calls. */
export interface WorktreeStackKit_InkDiscoveryDependencies {
    listGitWorktrees: (projectRoot: string) => Promise<string>;
    readTextFile: (path: string) => Promise<string>;
    pathExists: (path: string) => boolean;
    resolveCheckoutIdentity: (projectRoot: string) => WorktreeStackKit_InkDiscoveryCheckoutIdentity;
    readRealmRecords: (projectRoot: string) => Promise<WorktreeStackKit_InkUiRealmRecord[]>;
    readHealthArtifact: (projectRoot: string) => Promise<WorktreeStackKit_InkHealthArtifact | null>;
}
export declare function WorktreeStackKit_createNodeInkDiscoveryDependencies(options: {
    readonly resolveCheckoutIdentity: (projectRoot: string) => WorktreeStackKit_InkDiscoveryCheckoutIdentity;
}): WorktreeStackKit_InkDiscoveryDependencies;
/**
 * Parses `git worktree list --porcelain` stdout into structured path/branch/detached records.
 */
export declare function WorktreeStackKit_parseInkGitWorktreeList(output: string): WorktreeStackKit_InkParsedGitWorktreeEntry[];
/**
 * Builds the full Ink inventory model for `projectRoot`, including git worktrees and realm health.
 *
 * @remarks
 * I/O: Reads multiple metadata files and may shell out to git unless dependencies are stubbed.
 */
export declare function WorktreeStackKit_loadInkInventory(options: {
    readonly projectRoot: string;
    readonly dependencies: WorktreeStackKit_InkDiscoveryDependencies;
}): Promise<WorktreeStackKit_InkUiInventory>;
