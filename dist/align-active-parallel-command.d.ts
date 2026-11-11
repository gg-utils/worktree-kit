/**
 * @fileoverview Config-driven staged parallel align-active command runner.
 *
 * Flow: argv + worktree config -> selected prepared worktrees -> staged parallel audit,
 * normalization, merge, refresh, and validation with project-owned subprocess surfaces supplied by
 * root config.
 *
 * @testing Node test (tsx): npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/align-active.ts - Sequential align-active factory whose metadata, plan, normalize, and validate helpers this module composes with spawned merge and refresh entrypoints.
 * @see packages/worktree-kit/src/repo-root-sync.ts - Locked repo-root target-branch checkout helper used for the serial sync-root-main stage between the merge wave and per-worktree refresh.
 * @see scripts/worktree-stack/commands/align-active-parallel.ts - Platform CLI adapter that injects `worktrees.config.ts` into `WorktreeStackKit_createAlignActiveParallelCommand` for `npm run worktrees:align-active:parallel`.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeAlignActiveDirtyPolicy, type WorktreeAlignActiveExecutionMode, type WorktreeAlignActiveRefreshMode, type WorktreeStackKit_AlignActiveConfig } from "./align-active.js";
export declare const WORKTREE_STACK_KIT_ALIGN_ACTIVE_PARALLEL_DEFAULT_ARTIFACTS_RELATIVE_PATH: string;
declare const ALIGN_ACTIVE_PARALLEL_STAGE_SEQUENCE: readonly ["discover", "audit", "normalize", "merge", "sync-root-main", "refresh", "validate"];
/** Single stage token from the fixed parallel align-active pipeline ordering. */
type AlignActiveParallelStageName = (typeof ALIGN_ACTIVE_PARALLEL_STAGE_SEQUENCE)[number];
export type WorktreeStackKit_AlignActiveParallelCommandUsageConfig = {
    commandLines: readonly string[];
};
export type WorktreeStackKit_AlignActiveParallelStageProcessConfig = {
    baseArgs: readonly string[];
    commandName: string;
    mergeEntrypoint: string;
    updateFromMainEntrypoint: string;
};
export type WorktreeStackKit_AlignActiveParallelCommandConfig = {
    alignActive: WorktreeStackKit_AlignActiveConfig;
    artifactsRelativePath: string;
    projectRoot: string;
    requiredCommandNames: readonly string[];
    stageProcess: WorktreeStackKit_AlignActiveParallelStageProcessConfig;
    usage: WorktreeStackKit_AlignActiveParallelCommandUsageConfig;
};
/** Parsed argv controlling dirty policy, refresh semantics, and which worktrees enter the parallel batch. */
export type WorktreeAlignActiveParallelOptions = {
    dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
    executionMode: WorktreeAlignActiveExecutionMode;
    refreshMode: WorktreeAlignActiveRefreshMode;
    targetBranch: string;
    worktreePaths: string[];
};
export type WorktreeStackKit_AlignActiveParallelCommand = {
    createAlignActiveParallelRunDir: (rootDir: string, runId: string) => string;
    createAlignActiveParallelRunId: (date?: Date) => string;
    listAlignActiveParallelStages: () => AlignActiveParallelStageName[];
    parseAlignActiveParallelCliArgs: (argv: readonly string[]) => WorktreeAlignActiveParallelOptions | null;
    runAlignActiveParallel: (options: WorktreeAlignActiveParallelOptions) => Promise<number>;
    runAlignActiveParallelCli: (argv: readonly string[]) => Promise<number>;
};
/** Renders parallel align-active CLI usage from project-supplied command lines. */
export declare function WorktreeStackKit_renderAlignActiveParallelUsage(config: WorktreeStackKit_AlignActiveParallelCommandConfig): string;
export declare function WorktreeStackKit_createAlignActiveParallelCommand(config: WorktreeStackKit_AlignActiveParallelCommandConfig): WorktreeStackKit_AlignActiveParallelCommand;
export {};
