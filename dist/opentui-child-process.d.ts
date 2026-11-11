/**
 * @fileoverview Reusable child-process spawners for worktree OpenTUI command adapters.
 *
 * Flow: explicit command/cwd/env + optional stream hooks -> streamed stdout/stderr aggregation and
 * a normalized OpenTUI run result. Package-owned npm and `npx tsx` helpers keep script adapters as
 * thin project-env binders while preserving cancelable run semantics for long-running npm tasks.
 *
 * @example
 * ```typescript
 * const run = WorktreeStackKit_spawnOpenTuiNpmRun({
 *   env: process.env,
 *   forwardedArgs: ["--worktree", "/repo/worktrees/demo"],
 *   npmScript: "worktrees:start",
 *   repoRoot: "/repo",
 * });
 * const result = await run.promise;
 * ```
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/opentui-app-run-lifecycle.ts - Cancelable-run and run-result types imported and re-exported here for lifecycle adapters that normalize streamed child output into the OpenTUI run-panel contract.
 * @see packages/worktree-kit/src/opentui-child-process.unit.test.ts - Jest regression tests for stdout/stderr hooks, exit status capture, cancellation, and the npm run versus npx tsx spawn wrappers.
 * @see packages/worktree-kit/src/index.ts - Public package surface that re-exports this module alongside other worktree-kit OpenTUI helpers.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_OpenTuiCancelableRun, WorktreeStackKit_OpenTuiRunResult } from "./opentui-app-run-lifecycle.js";
export type { WorktreeStackKit_OpenTuiCancelableRun, WorktreeStackKit_OpenTuiRunResult, } from "./opentui-app-run-lifecycle.js";
/** Optional stdout/stderr hooks for streaming child output into the OpenTUI renderer. */
export type WorktreeStackKit_OpenTuiSpawnHandlers = {
    readonly onStderrChunk?: (chunk: string) => void;
    readonly onStdoutChunk?: (chunk: string) => void;
};
export type WorktreeStackKit_StartOpenTuiChildProcessOptions = {
    readonly args: readonly string[];
    readonly command: string;
    readonly cwd: string;
    readonly env: NodeJS.ProcessEnv;
    readonly handlers?: WorktreeStackKit_OpenTuiSpawnHandlers;
};
export type WorktreeStackKit_SpawnOpenTuiNpmRunOptions = {
    readonly env: NodeJS.ProcessEnv;
    readonly forwardedArgs: readonly string[];
    readonly handlers?: WorktreeStackKit_OpenTuiSpawnHandlers;
    readonly npmScript: string;
    readonly repoRoot: string;
};
export type WorktreeStackKit_SpawnOpenTuiNpxTsxOptions = {
    readonly args: readonly string[];
    readonly env: NodeJS.ProcessEnv;
    readonly handlers?: WorktreeStackKit_OpenTuiSpawnHandlers;
    readonly repoRoot: string;
    readonly scriptPathUnderRepo: string;
};
/** Starts a child process and returns cancelable aggregated output for OpenTUI run panels. */
export declare function WorktreeStackKit_startOpenTuiChildProcess(options: WorktreeStackKit_StartOpenTuiChildProcessOptions): WorktreeStackKit_OpenTuiCancelableRun;
/** Runs `npm run <script> -- <forwardedArgs>` from a project root. */
export declare function WorktreeStackKit_spawnOpenTuiNpmRun(options: WorktreeStackKit_SpawnOpenTuiNpmRunOptions): WorktreeStackKit_OpenTuiCancelableRun;
/** Runs `npx tsx <scriptUnderRepo> <args>` from a project root. */
export declare function WorktreeStackKit_spawnOpenTuiNpxTsx(options: WorktreeStackKit_SpawnOpenTuiNpxTsxOptions): Promise<WorktreeStackKit_OpenTuiRunResult>;
