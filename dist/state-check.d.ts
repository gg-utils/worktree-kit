/**
 * @fileoverview Config-driven checkout and submodule state-check command runner.
 *
 * Flow: explicit checkout context resolver + git probes -> checkout summary block -> matrix table.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see scripts/worktree-stack/commands/state-check.ts - Local-edge CLI adapter that resolves checkout contract context and invokes `WorktreeStackKit_runStateCheckCommand` with repo argv wiring.
 * @see packages/worktree-kit/src/state-check.unit.test.ts - Jest unit coverage for argv parsing, git-output parsers/formatters, and the stdout matrix owned by this runner.
 * @see packages/worktree-kit/src/index.ts - Package export surface that re-exports this module for `@gg-utils/worktree-kit/state-check` consumers.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export type WorktreeStackKit_StateCheckContext = {
    checkoutType: string;
    expectedRootBranch: string;
    expectedSubmoduleBranch: string;
    metadataError: string | null;
    metadataPath: string | null;
    metadataState: string;
};
export type WorktreeStackKit_StateCheckConfig = {
    canonicalRootBranch: string;
    developmentBranch: string;
    repoRoot: string;
    resolveContext: (repoRoot: string) => WorktreeStackKit_StateCheckContext;
    usageCommand: string;
};
export type WorktreeStackKit_RunStateCheckCommand_Options = {
    argv: readonly string[];
    config: WorktreeStackKit_StateCheckConfig;
};
/** Table row discriminator for the printed checkout matrix. */
type WorktreeStateCheck_RepoKind = "root" | "submodule";
/** Parsed CLI switches controlling fetch behavior and help display. */
export type WorktreeStateCheck_Options = {
    fetch: boolean;
    help: boolean;
};
/** Resolved checkout contract used to annotate the summary block. */
type WorktreeStateCheck_Context = WorktreeStackKit_StateCheckContext;
/** Normalized outcome from a spawned `git` child process for downstream parsing. */
export type WorktreeStateCheck_CommandResult = {
    ok: boolean;
    status: number | null;
    stdout: string;
    stderr: string;
};
/** Submodule entry parsed from `.gitmodules` for path and configured upstream branch. */
export type WorktreeStateCheck_SubmoduleDefinition = {
    name: string;
    path: string;
    configuredBranch: string;
};
/** Printed matrix row combining expected vs actual branch, dirtiness, and ahead/behind strings. */
export type WorktreeStateCheck_Row = {
    repo: string;
    kind: WorktreeStateCheck_RepoKind;
    configuredBranch: string;
    expectedCheckout: string;
    actualCheckout: string;
    status: string;
    vsOriginCurrent: string;
    vsOriginMain: string;
    vsOriginDevelopment: string;
};
/** Per-repo working tree facts gathered before row assembly. */
export type WorktreeStateCheck_RepoState = {
    actualCheckout: string;
    isDirty: boolean;
    vsOriginCurrent: string;
    vsOriginMain: string;
    vsOriginDevelopment: string;
};
/**
 * Runs the checkout matrix command using explicit project-supplied context.
 *
 * @remarks
 * I/O: Reads filesystem metadata, may run `git fetch` when `--fetch` is passed, writes
 * human-readable tables to stdout.
 */
export declare function WorktreeStackKit_runStateCheckCommand(options: WorktreeStackKit_RunStateCheckCommand_Options): Promise<number>;
/**
 * Parses supported CLI flags and rejects unknown tokens early.
 *
 * @remarks
 * PURITY: No I/O; throws on the first unrecognized argument so misuse fails fast.
 * @param argv - Process argv slice after the script path.
 */
export declare function WorktreeStateCheck_parseArgs(argv: readonly string[]): WorktreeStateCheck_Options;
/**
 * Interprets `git status --porcelain=v2 -b` output into HEAD branch and dirty flag.
 *
 * @remarks
 * PURITY: Pure string parsing aside from reading `result` fields; maps `(detached)` to the
 * sentinel `DETACHED`.
 * @param result - Captured git status invocation result.
 */
export declare function WorktreeStateCheck_parseStatusV2(result: WorktreeStateCheck_CommandResult): {
    branch: string;
    dirty: boolean;
};
/**
 * Formats `rev-list --left-right --count` output into table cells or error sentinels.
 *
 * @remarks
 * PURITY: Inspects stderr for missing refs/repos to emit `MISSING` vs generic `ERROR`.
 * @param result - Captured `rev-list` invocation result.
 */
export declare function WorktreeStateCheck_formatRevListResult(result: WorktreeStateCheck_CommandResult): string;
/**
 * Maps submodule paths to the leading `git submodule status` prefix character.
 *
 * @remarks
 * PURITY: Parses stdout lines only; returns an empty map when the command failed with no stdout.
 * @param result - Captured `git submodule status` output.
 */
export declare function WorktreeStateCheck_parseSubmoduleStatusOutput(result: WorktreeStateCheck_CommandResult): Map<string, string>;
/**
 * Combines submodule status prefix with working tree state into a human-readable status column.
 *
 * @remarks
 * PURITY: String selection only; encodes `NOT INIT`, conflict, pointer mismatch, and dirty
 * combinations.
 * @param prefix - First character from `git submodule status`, when known.
 * @param state - Gathered repo state for the submodule checkout.
 */
export declare function WorktreeStateCheck_resolveSubmoduleStatusFromState(prefix: string | undefined, state: WorktreeStateCheck_RepoState): string;
/**
 * Parses the two whitespace-separated integers from `rev-list --left-right --count` stdout.
 *
 * @remarks
 * PURITY: Validates integer pairs; returns null when the shape is unexpected.
 * @param rawCounts - Single-line stdout from `rev-list`.
 */
export declare function WorktreeStateCheck_parseAheadBehind(rawCounts: string): {
    ahead: number;
    behind: number;
} | null;
/**
 * Renders ahead/behind integers using the `aN/bM` legend convention.
 *
 * @remarks
 * PURITY: Pure string formatting.
 * @param ahead - Commits reachable from HEAD but not the remote ref.
 * @param behind - Commits reachable from the remote ref but not HEAD.
 */
export declare function WorktreeStateCheck_formatAheadBehind(ahead: number, behind: number): string;
/**
 * Builds the matrix row for the platform root from gathered repo state and contract expectations.
 *
 * @remarks
 * PURITY: Assembles the row object only; `configuredBranch` is `N/A` for the root entry.
 * @param state - Root working tree inspection snapshot.
 * @param context - Expected branches from the checkout contract.
 */
export declare function WorktreeStateCheck_buildRootRowFromState(state: WorktreeStateCheck_RepoState, context: WorktreeStateCheck_Context): WorktreeStateCheck_Row;
/**
 * Builds a submodule row combining `.gitmodules` configuration with live checkout diagnostics.
 *
 * @remarks
 * PURITY: Delegates status text to `WorktreeStateCheck_resolveSubmoduleStatusFromState`.
 * @param submodule - Parsed `.gitmodules` definition for path and configured branch.
 * @param state - Submodule working tree inspection snapshot.
 * @param prefix - Submodule status prefix from `git submodule status`, when parsing succeeded.
 * @param context - Expected submodule branch from the checkout contract.
 */
export declare function WorktreeStateCheck_buildSubmoduleRowFromState(submodule: WorktreeStateCheck_SubmoduleDefinition, state: WorktreeStateCheck_RepoState, prefix: string | undefined, context: WorktreeStateCheck_Context): WorktreeStateCheck_Row;
export {};
//# sourceMappingURL=state-check.d.ts.map