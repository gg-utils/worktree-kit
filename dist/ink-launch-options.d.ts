/**
 * @fileoverview Reusable argv parser and help text for worktree Ink launchers.
 *
 * Flow: forwarded CLI argv -> structured launch target or help request. View components and
 * project adapters own rendering, inventory resolution, and command execution; this package owns
 * documented flag aliases and draft-prefill normalization.
 *
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including ink-launch-options.unit.test.ts).
 *
 * @see packages/worktree-kit/src/ink-entrypoint.ts - Ink CLI entrypoint that calls WorktreeStackKit_parseInkLaunchOptions and WorktreeStackKit_getInkHelpText before routing help versus launch into the Ink renderer.
 * @see packages/worktree-kit/src/ink-launch-options.unit.test.ts - Node test module covering argv parsing, action-id alias normalization, mutually exclusive worktree selectors, and inferred default actions owned by this parser contract.
 * @see scripts/worktree-stack/ui/cli-ink/launch-options-core.ts - Script-layer compatibility re-export that preserves historical imports while delegating argv parsing and help text to this package-owned surface.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Supported Ink UI action IDs. */
export type WorktreeStackKit_InkActionId = "create" | "switch" | "repair" | "sync-local-files" | "platform-bootstrap" | "start" | "destroy" | "update-from-main" | "merge" | "list-active-realms" | "router-status" | "healthcheck" | "realm-pool-list" | "realm-pool-guide" | "realm-pool-prepare" | "realm-pool-next" | "realm-prune-stale" | "checkout-state-check";
/** Create draft fields that can be prefilled by launcher argv. */
export type WorktreeStackKit_InkCreateDraft = {
    branchPrefix: string;
    stackName: string;
    slotInput: string;
    baseBranch: string;
    rootBranch: string;
    submoduleBranch: string;
    worktreesBase: string;
    realmSlug: string;
    worktreePathOverride: string;
    metadataSource: string;
    copyEnvFromMain: boolean;
    runInstall: boolean;
    installSkipExisting: boolean;
    installPreferOnline: boolean;
    openWindsurf: boolean;
    followUpStart: boolean;
    followUpStartOpenWindsurf: boolean;
};
/** Switch draft fields that can be prefilled by launcher argv. */
export type WorktreeStackKit_InkSwitchDraft = {
    environmentFilter: string;
    selectedWorktreePath: string;
};
/** Optional argv-derived focus for which Ink action, worktree, and drafts should load first. */
export type WorktreeStackKit_InkLaunchTarget = {
    actionId: WorktreeStackKit_InkActionId | null;
    createDraftOverrides: Partial<WorktreeStackKit_InkCreateDraft>;
    poolNextStackName: string | null;
    stackName: string | null;
    stateCheckFetch: boolean | null;
    switchDraftOverrides: Partial<WorktreeStackKit_InkSwitchDraft>;
    worktreePath: string | null;
};
/** Result of parsing launcher argv into structured launch intent. */
export type WorktreeStackKit_InkLaunchOptionsParseResult = {
    readonly helpRequested: boolean;
    readonly target: WorktreeStackKit_InkLaunchTarget | null;
};
/** Resolves CLI `--action` tokens to canonical worktree Ink action IDs. */
export declare function WorktreeStackKit_normalizeInkActionId(value: string): WorktreeStackKit_InkActionId | null;
/** Returns the static help string describing Ink CLI flags for worktree-stack operations. */
export declare function WorktreeStackKit_getInkHelpText(): string;
/** Parses Ink launcher argv into either a help request or a structured launch target. */
export declare function WorktreeStackKit_parseInkLaunchOptions(argv: readonly string[]): WorktreeStackKit_InkLaunchOptionsParseResult;
//# sourceMappingURL=ink-launch-options.d.ts.map