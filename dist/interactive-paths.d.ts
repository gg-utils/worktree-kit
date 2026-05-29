/**
 * @fileoverview Reusable path-context resolver for classic worktree interactive CLIs.
 *
 * Flow: cwd + project marker segments -> package-owned upward repo-root walk -> configured
 * commands/UI directories and default worktree base. Project adapters provide marker/path segments
 * and default-base policy; this package owns filesystem walking and context assembly.
 *
 * @example
 * ```typescript
 * const context = WorktreeStackKit_resolveInteractivePathContext({
 *   commandsSegments: ["scripts", "worktree-stack", "commands"],
 *   cwd: process.cwd(),
 *   markerSegments: ["scripts", "worktree-stack", "commands", "create.ts"],
 *   resolveDefaultWorktreesBase: (repoRoot) => `${repoRoot}/.worktrees`,
 *   uiSegments: ["scripts", "worktree-stack", "ui", "cli-interactive"],
 * });
 * ```
 *
 * @testing Node.js test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting this module so `@gg-utils/worktree-kit` consumers resolve the interactive-path surface from the primary entrypoint.
 * @see scripts/worktree-stack/ui/cli-interactive/paths.ts - Classic worktree-stack adapter supplying marker segments, commands/ui path segments, and default worktree-base policy into the resolver owned here.
 * @see packages/worktree-kit/src/interactive-paths.unit.test.ts - Node test runner regression file asserting marker-based repo-root discovery and assembled absolute command, UI, and default-base paths.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Resolved absolute paths used by classic worktree interactive adapters. */
export type WorktreeStackKit_InteractivePathContext = {
    readonly commandsDir: string;
    readonly defaultWorktreesBase: string;
    readonly repoRoot: string;
    readonly uiDir: string;
};
export type WorktreeStackKit_ResolveInteractiveRepoRootOptions = {
    readonly cwd: string;
    readonly exists?: (candidatePath: string) => boolean;
    readonly markerSegments: readonly string[];
};
export type WorktreeStackKit_ResolveInteractivePathContextOptions = WorktreeStackKit_ResolveInteractiveRepoRootOptions & {
    readonly commandsSegments: readonly string[];
    readonly resolveDefaultWorktreesBase: (repoRoot: string) => string;
    readonly uiSegments: readonly string[];
};
/** Walks from cwd to the nearest ancestor containing the configured marker file. */
export declare function WorktreeStackKit_resolveInteractiveRepoRoot(options: WorktreeStackKit_ResolveInteractiveRepoRootOptions): string;
/** Builds the reusable interactive path context from project marker/path configuration. */
export declare function WorktreeStackKit_resolveInteractivePathContext(options: WorktreeStackKit_ResolveInteractivePathContextOptions): WorktreeStackKit_InteractivePathContext;
//# sourceMappingURL=interactive-paths.d.ts.map