/**
 * @fileoverview Config-driven prepared-worktree switch command runner.
 *
 * Flow: argv + explicit command config -> normalized branch identity -> prepared-worktree metadata
 * lookup -> editor launch or configured create / interactive picker subprocess. Root adapters supply
 * npm script names and usage text so package code stays reusable.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/switch-command.unit.test.ts
 *
 * @see packages/worktree-core/src/worktree-discovery.ts - Prepared-worktree directory listing and per-worktree metadata path helpers consumed when this command scans stacks and reads stack JSON.
 * @see packages/worktree-kit/src/switch-command.unit.test.ts - Node test module asserting argv parsing, prepared-worktree discovery, prefix/name matching, editor command resolution, and usage text from this module.
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports WorktreeStackKit_runSwitchCommand and related switch types so root npm script adapters can import the kit entrypoint.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export type WorktreeStackKit_CommandInvocation = {
    args: readonly string[];
    command: string;
};
export type WorktreeStackKit_SwitchCommandConfig = {
    createCommand: WorktreeStackKit_CommandInvocation;
    interactiveCommand: WorktreeStackKit_CommandInvocation;
    projectRoot: string;
    usageCommandLines: readonly string[];
};
export type WorktreeStackKit_RunSwitchCommand_Options = {
    argv: readonly string[];
    config: WorktreeStackKit_SwitchCommandConfig;
};
/** Parsed CLI switches for locating or creating a prepared worktree and launching its editor. */
export type WorktreeStackKit_SwitchOptions = {
    branchPrefix: string;
    dryRun: boolean;
    editorOverride: string;
    environment: string;
    interactive: boolean;
    slot: number;
    stackName: string;
};
/** Prepared worktree identity synthesized from stack metadata beside each candidate directory. */
export type WorktreeStackKit_DiscoveredSwitchWorktree = {
    branchPrefix: string;
    slot: number;
    stackName: string;
    worktreePath: string;
};
/** Renders the extended switch command help text from configured command examples. */
export declare function WorktreeStackKit_renderSwitchUsage(config: WorktreeStackKit_SwitchCommandConfig): string;
/** Parses post-`--` CLI tokens into switch options, normalizing prefixes and required flags. */
export declare function WorktreeStackKit_parseSwitchArgs(options: {
    argv: readonly string[];
    config: WorktreeStackKit_SwitchCommandConfig;
}): WorktreeStackKit_SwitchOptions | null;
/** Enumerates prepared worktrees and attaches stack metadata read from disk. */
export declare function WorktreeStackKit_discoverSwitchPreparedWorktrees(rootDir: string): WorktreeStackKit_DiscoveredSwitchWorktree[];
/** Selects the first discovered worktree whose normalized prefix and stack name match exactly. */
export declare function WorktreeStackKit_findMatchingSwitchWorktree(options: {
    branchPrefix: string;
    stackName: string;
    worktrees: readonly WorktreeStackKit_DiscoveredSwitchWorktree[];
}): WorktreeStackKit_DiscoveredSwitchWorktree | null;
/** Derives the shell command line for launching an editor, respecting explicit overrides. */
export declare function WorktreeStackKit_resolveSwitchEditorCommand(prefix: string, editorOverride: string): string | null;
/** Runs the config-driven switch command and returns a process exit code. */
export declare function WorktreeStackKit_runSwitchCommand(options: WorktreeStackKit_RunSwitchCommand_Options): number;
