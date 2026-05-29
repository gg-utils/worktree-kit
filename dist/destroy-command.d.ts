/**
 * @fileoverview Config-driven prepared-worktree destroy command runner.
 *
 * Flow: argv + project cleanup command config -> target resolution -> registry validation ->
 * configured cleanup hooks -> git/filesystem removal -> optional prune. Project-specific integration
 * scripts and environment variables stay in root config.
 *
 * @testing Node test runner: npm run worktree-kit:test from the repository root (executes packages/worktree-kit unit tests that cover this module).
 *
 * @see scripts/worktree-stack/commands/destroy.ts - Root destroy CLI adapter that forwards argv and worktrees.config.ts destroy hooks into WorktreeStackKit_runDestroyCli implemented here.
 * @see worktrees.config.ts - Declares WorktreeStackKit_DestroyCommandConfig cleanup command builders, required commands, and usage lines the root adapter passes into this module.
 * @see packages/worktree-kit/src/destroy-command.unit.test.ts - Node test coverage for argv parsing, stack-name worktree resolution, and destroy preflight behavior owned by this file.
 * @see docs/COMMANDS.md - Command index describing how the root destroy adapter delegates orchestration to this kit-owned parser and removal sequencing.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { SpawnOptions } from "node:child_process";
export type WorktreeStackKit_DestroyConfiguredCommand = {
    allowFailure?: boolean;
    args: readonly string[];
    command: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: SpawnOptions["stdio"];
    warningOnFailure?: string;
};
export type WorktreeStackKit_DestroyCleanupAction = (context: WorktreeStackKit_DestroyCommandContext) => void;
export type WorktreeStackKit_DestroyRequiredFile = {
    description: string;
    filePath: string;
};
export type WorktreeStackKit_DestroyCommandContext = {
    metadataPath: string;
    projectRoot: string;
    stackName: string;
    worktreeEnvFile: string;
    worktreePath: string;
    worktreesBase: string;
};
export type WorktreeStackKit_DestroyCommandConfig = {
    buildExistingEnvCleanupCommand?: (context: WorktreeStackKit_DestroyCommandContext) => WorktreeStackKit_DestroyConfiguredCommand | null;
    buildMissingWorktreeCleanupCommand?: (context: WorktreeStackKit_DestroyCommandContext) => WorktreeStackKit_DestroyConfiguredCommand | null;
    buildPostRemovalCleanupCommands?: (context: WorktreeStackKit_DestroyCommandContext) => readonly WorktreeStackKit_DestroyConfiguredCommand[];
    cleanupExistingEnv?: WorktreeStackKit_DestroyCleanupAction;
    cleanupMissingWorktree?: WorktreeStackKit_DestroyCleanupAction;
    defaultWorktreesDirectoryName: string;
    projectRoot: string;
    requiredCommandNames: readonly string[];
    requiredFiles: readonly WorktreeStackKit_DestroyRequiredFile[];
    usageCommandLines: readonly string[];
};
export type WorktreeStackKit_DestroyOptions = {
    prune: boolean;
    stackName: string;
    worktreePath: string;
    worktreesBase: string;
};
export type WorktreeStackKit_RunDestroyCli_Options = {
    argv: readonly string[];
    config: WorktreeStackKit_DestroyCommandConfig;
};
/** Renders destroy CLI usage from project-supplied command lines. */
export declare function WorktreeStackKit_renderDestroyUsage(config: WorktreeStackKit_DestroyCommandConfig): string;
/** Normalizes any thrown value into a single-line stderr message with a worktree-stack prefix. */
export declare function WorktreeStackKit_formatDestroyCliErrorMessage(error: unknown): string;
/** Parses destroy argv, requiring exactly one of `--worktree` or `--name`. */
export declare function WorktreeStackKit_parseDestroyCliArgs(options: {
    argv: readonly string[];
    config: WorktreeStackKit_DestroyCommandConfig;
}): WorktreeStackKit_DestroyOptions | null;
/** Locates a prepared worktree directory under `worktreesBase` matching `stackName` heuristics. */
export declare function WorktreeStackKit_resolveDestroyWorktreePathFromStackName(worktreesBase: string, stackName: string): string;
/** Destroys a prepared worktree, using configured cleanup hooks when applicable. */
export declare function WorktreeStackKit_runDestroy(options: {
    config: WorktreeStackKit_DestroyCommandConfig;
    destroyOptions: WorktreeStackKit_DestroyOptions;
}): number;
/** CLI entrypoint wiring argv parsing to destroy execution. */
export declare function WorktreeStackKit_runDestroyCli(options: WorktreeStackKit_RunDestroyCli_Options): number;
//# sourceMappingURL=destroy-command.d.ts.map