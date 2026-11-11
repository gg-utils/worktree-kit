/**
 * @fileoverview Config-driven zsh alias rendering and installation for prepared worktree slots.
 *
 * Flow: discovered worktrees + project render config -> alias file render -> optional shell-config
 * source block. The package stays product-neutral; root config supplies names, markers, and paths.
 *
 * @testing Node test runner (tsx): cd packages/worktree-kit && npx tsx --test src/zsh-aliases-integration.unit.test.ts
 *
 * @see scripts/worktree-stack/integrations/zsh-aliases.ts - Root npm-script entrypoint that resolves consumer paths then forwards argv plus `WorktreeStackKit_ZshAliasesCliConfig` into `WorktreeStackKit_runZshAliasesCli` owned here.
 * @see worktrees.config.ts - Workspace adapter that exports the render markers, default paths, and usage command lines typed as `WorktreeStackKit_ZshAliasesCliConfig` / `WorktreeStackKit_ZshAliasesRenderConfig` for that script wiring.
 * @see packages/worktree-kit/src/zsh-aliases-integration.unit.test.ts - Jest regression coverage for metadata scanning, generated zsh helpers, managed `~/.zshrc` splice behavior, and CLI flag parsing implemented in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Whether the integration should print aliases or splice them into `zshrcPath`. */
export type WorktreeStackKit_ZshAliasAction = "install" | "render";
/** One discovered prepared worktree with metadata used to build `cd` aliases. */
export type WorktreeStackKit_ZshAliasEntry = {
    createdAt: string;
    slot: number;
    stackName: string;
    worktreePath: string;
};
/** Product-owned text and function names used while rendering shell helpers. */
export type WorktreeStackKit_ZshAliasesRenderConfig = {
    beginMarker: string;
    endMarker: string;
    generatorPath: string;
    messagePrefix: string;
    shellFunctionPrefix: string;
};
/** Fully-resolved CLI defaults supplied by project config/adapters. */
export type WorktreeStackKit_ZshAliasesCliConfig = {
    defaultAliasesFile: string;
    defaultMaxSlot: number;
    defaultRootDir: string;
    defaultWorktreesBase: string;
    defaultZshrcPath: string;
    renderConfig: WorktreeStackKit_ZshAliasesRenderConfig;
    usageCommandLines: readonly string[];
};
/** Fully-resolved CLI options controlling scan roots, output paths, and verbosity. */
export type WorktreeStackKit_ZshAliasesOptions = {
    action: WorktreeStackKit_ZshAliasAction;
    aliasesFile: string;
    maxSlot: number;
    quiet: boolean;
    renderConfig: WorktreeStackKit_ZshAliasesRenderConfig;
    rootDir: string;
    worktreesBase: string;
    zshrcPath: string;
};
/** Signals malformed argv or invalid flag values for the zsh-alias integration CLI. */
export declare class WorktreeStackKit_ZshAliasesCliUsageError extends Error {
}
/** Scans `worktreesBase` for prepared worktrees and returns stable metadata rows. */
export declare function WorktreeStackKit_readZshAliasEntries(worktreesBase: string): WorktreeStackKit_ZshAliasEntry[];
/** Renders the `.zsh` helper functions and `apN` aliases for configured slot coverage. */
export declare function WorktreeStackKit_renderZshAliasesFileContent(options: {
    aliasesFile: string;
    entries: readonly WorktreeStackKit_ZshAliasEntry[];
    minimumSlotCount: number;
    renderConfig: WorktreeStackKit_ZshAliasesRenderConfig;
    rootDir: string;
    worktreesBase: string;
}): string;
/** Splices or replaces the managed marker block that sources `aliasesFile` inside shell config. */
export declare function WorktreeStackKit_updateManagedZshrcContent(options: {
    aliasesFile: string;
    currentContent: string;
    renderConfig: WorktreeStackKit_ZshAliasesRenderConfig;
}): string;
/** Regenerates the aliases file and optionally patches `zshrcPath` to source it. */
export declare function WorktreeStackKit_runZshAliases(options: WorktreeStackKit_ZshAliasesOptions): void;
/** Prints zsh-alias integration CLI usage and flag documentation to stdout. */
export declare function WorktreeStackKit_printZshAliasesUsage(config: WorktreeStackKit_ZshAliasesCliConfig): void;
/** Parses argv into `WorktreeStackKit_ZshAliasesOptions`. */
export declare function WorktreeStackKit_parseZshAliasesCliArgs(argv: readonly string[], config: WorktreeStackKit_ZshAliasesCliConfig): WorktreeStackKit_ZshAliasesOptions;
/** CLI entrypoint that parses argv then delegates to `WorktreeStackKit_runZshAliases`. */
export declare function WorktreeStackKit_runZshAliasesCli(argv: readonly string[], config: WorktreeStackKit_ZshAliasesCliConfig): number;
