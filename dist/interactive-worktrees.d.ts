/**
 * @fileoverview Reusable discovery and labeling helpers for classic worktree interactive pickers.
 *
 * Flow: git worktree porcelain + prepared-worktree metadata files -> stable picker rows, used slot
 * sets, and path validation. Project adapters provide the repo root and may wrap default arguments.
 *
 * @testing Node test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/interactive-flows.ts - Interactive lifecycle runners that import these helpers to build worktree rows, slot hints, and path validation for shared picker prompts.
 * @see scripts/worktree-stack/ui/cli-interactive/worktrees.ts - Root-repo CLI surface that forwards interactive worktree discovery to this package export for scripted prompts.
 * @see packages/worktree-kit/src/interactive-worktrees.unit.test.ts - Node test runner regression file asserting porcelain parsing, metadata summaries, and slot selection helpers owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Parsed prepared-worktree record enriched with metadata-derived summary text for menus. */
export type WorktreeStackKit_InteractiveKnownWorktree = {
    folderName: string;
    metadataPath: string;
    path: string;
    realmSlug: string;
    rootBranch: string;
    slot: number | null;
    stackName: string;
    summary: string;
};
/** Narrowed fields read from a prepared worktree metadata JSON file for interactive labeling. */
export type WorktreeStackKit_InteractiveMetadata = {
    realmSlug: string;
    rootBranch: string;
    slot: number | null;
    stackName: string;
};
/** Parses `git worktree list --porcelain` output into absolute paths excluding the main checkout. */
export declare function WorktreeStackKit_parseInteractiveGitWorktreeListPorcelain(output: string, rootDir: string): string[];
/** Loads and narrows worktree metadata from disk, or returns null when the file is missing. */
export declare function WorktreeStackKit_readInteractiveMetadata(metadataPath: string): WorktreeStackKit_InteractiveMetadata | null;
/** Builds the single-line human label shown beside a worktree in interactive pickers. */
export declare function WorktreeStackKit_describeInteractiveWorktree(options: {
    folderName: string;
    metadata: WorktreeStackKit_InteractiveMetadata | null;
}): string;
/** Lists prepared worktrees by combining git porcelain paths with metadata JSON hints. */
export declare function WorktreeStackKit_collectInteractiveKnownWorktrees(repoRoot: string): WorktreeStackKit_InteractiveKnownWorktree[];
/** Returns positive slot integers already claimed by known prepared worktrees. */
export declare function WorktreeStackKit_collectInteractiveUsedSlots(worktrees: readonly WorktreeStackKit_InteractiveKnownWorktree[]): number[];
/** Chooses the lowest unused positive integer slot not present in `usedSlots`. */
export declare function WorktreeStackKit_pickNextInteractiveSlot(usedSlots: readonly number[]): number;
/** Resolves a user-supplied filesystem path to its realpath after verifying it exists. */
export declare function WorktreeStackKit_resolveExistingInteractivePath(inputPath: string): string;
//# sourceMappingURL=interactive-worktrees.d.ts.map