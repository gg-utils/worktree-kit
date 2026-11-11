/**
 * @fileoverview Codex workspace registration helpers for prepared worktree paths.
 *
 * Flow: action + worktree path + label -> Codex config/state rewrite -> saved workspace roots and
 * labels. The package stays product-neutral; root adapters only preserve command surfaces.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see scripts/worktree-stack/integrations/codex-project.ts - Legacy tsx adapter that forwards argv into {@link WorktreeStackKit_runCodexProjectCli} so root `npm run worktrees:codex:*` commands stay stable.
 * @see packages/worktree-kit/src/codex-project-integration.unit.test.ts - Jest unit coverage for Codex `config.toml` trusted-project blocks and `.codex-global-state.json` workspace-root mutations owned here.
 * @see docs/COMMANDS.md - Command catalog documenting `worktrees:codex:register` and `worktrees:codex:unregister` and routing operators to this package-owned integration surface.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Registry mutation requested by the Codex integration CLI. */
export type WorktreeStackKit_CodexProjectAction = "register" | "unregister";
/** Resolved Codex home paths for `config.toml` and `.codex-global-state.json`. */
export type WorktreeStackKit_CodexProjectPaths = {
    codexHomeDir: string;
    configPath: string;
    statePath: string;
};
/** Options for mutating Codex config/state outside the argv parser. */
export type WorktreeStackKit_CodexProjectOptions = {
    action: WorktreeStackKit_CodexProjectAction;
    env?: NodeJS.ProcessEnv;
    homeDir?: string;
    label: string;
    worktreePath: string;
};
/** Normalized argv payload after CLI parsing succeeds. */
export type WorktreeStackKit_CodexProjectCliOptions = {
    action: WorktreeStackKit_CodexProjectAction;
    label: string;
    worktreePath: string;
};
/** Signals argv/help failures so callers can print usage without masking runtime errors. */
export declare class WorktreeStackKit_CodexProjectCliUsageError extends Error {
}
/** Canonicalizes user-supplied worktree paths before Codex config/state writes. */
export declare function WorktreeStackKit_normalizeCodexWorktreePath(worktreePath: string): string;
/** Resolves `CODEX_HOME` defaulting to `~/.codex`, plus config/state file locations. */
export declare function WorktreeStackKit_resolveCodexProjectPaths(env?: NodeJS.ProcessEnv, homeDir?: string): WorktreeStackKit_CodexProjectPaths;
/** Rewrites Codex `config.toml` text to add/remove a trusted project block. */
export declare function WorktreeStackKit_updateCodexConfigContent(options: {
    action: WorktreeStackKit_CodexProjectAction;
    currentContent: string;
    worktreePath: string;
}): string;
/** Returns the next Codex global state with workspace roots/labels adjusted for the path. */
export declare function WorktreeStackKit_updateCodexState(options: {
    action: WorktreeStackKit_CodexProjectAction;
    label: string;
    state: Record<string, unknown>;
    worktreePath: string;
}): Record<string, unknown>;
/** Applies register/unregister mutations to Codex config and JSON state on disk. */
export declare function WorktreeStackKit_runCodexProjectMutation(options: WorktreeStackKit_CodexProjectOptions): void;
/** Prints Codex integration CLI usage and behavior notes to stdout. */
export declare function WorktreeStackKit_printCodexProjectUsage(): void;
/** Parses integration argv into structured options. */
export declare function WorktreeStackKit_parseCodexProjectCliArgs(argv: readonly string[]): WorktreeStackKit_CodexProjectCliOptions;
/** CLI entrypoint that wires parsing to Codex config/state mutation. */
export declare function WorktreeStackKit_runCodexProjectCli(argv: readonly string[], env?: NodeJS.ProcessEnv, homeDir?: string): number;
