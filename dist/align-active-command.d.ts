/**
 * @fileoverview Config-driven sequential align-active command runner.
 *
 * Flow: argv + project worktree config -> prepared-worktree selection -> plan/normalization ->
 * merge/update execution -> final validation. Project command surfaces and required command policy
 * stay in root config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/align-active.ts - Core align-active factory whose plan builders, metadata reads, dirty normalization, refresh-mode selection, and alignment validation this command orchestrates from argv plus project config.
 * @see packages/worktree-kit/src/merge-command.ts - Merge-to-target batch runner invoked per prepared worktree after normalization when `--push` executes the sequential alignment.
 * @see packages/worktree-kit/src/update-from-main-command.ts - Update-from-main refresh runner invoked per worktree after root checkout sync finishes the merge batch under `--push`.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeAlignActiveDirtyPolicy, type WorktreeAlignActiveExecutionMode, type WorktreeAlignActiveMetadata, type WorktreeAlignActiveRefreshMode, type WorktreeStackKit_AlignActiveConfig } from "./align-active.js";
export type WorktreeStackKit_AlignActiveCommandUsageConfig = {
    commandLines: readonly string[];
};
export type WorktreeStackKit_AlignActiveCommandConfig = {
    alignActive: WorktreeStackKit_AlignActiveConfig;
    projectRoot: string;
    requiredCommandNames: readonly string[];
    usage: WorktreeStackKit_AlignActiveCommandUsageConfig;
};
/** Parsed argv for sequential align-active orchestration across one or more prepared worktrees. */
export type WorktreeAlignActiveOptions = {
    dirtyPolicy: WorktreeAlignActiveDirtyPolicy;
    executionMode: WorktreeAlignActiveExecutionMode;
    refreshMode: WorktreeAlignActiveRefreshMode;
    targetBranch: string;
    worktreePaths: string[];
};
export type WorktreeStackKit_AlignActiveCommand = {
    buildAlignActivePlanReport: (metadata: WorktreeAlignActiveMetadata, state: Pick<WorktreeAlignActiveOptions, "dirtyPolicy" | "refreshMode" | "targetBranch">) => string[];
    parseAlignActiveCliArgs: (argv: readonly string[]) => WorktreeAlignActiveOptions | null;
    runAlignActive: (options: WorktreeAlignActiveOptions) => Promise<number>;
    runAlignActiveCli: (argv: readonly string[]) => Promise<number>;
};
/** Renders align-active CLI usage from project-supplied command lines. */
export declare function WorktreeStackKit_renderAlignActiveUsage(config: WorktreeStackKit_AlignActiveCommandConfig): string;
export declare function WorktreeStackKit_createAlignActiveCommand(config: WorktreeStackKit_AlignActiveCommandConfig): WorktreeStackKit_AlignActiveCommand;
//# sourceMappingURL=align-active-command.d.ts.map