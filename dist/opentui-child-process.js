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
import { spawn } from "node:child_process";
import path from "node:path";
function WorktreeStackKit_decodeOpenTuiChildChunk(chunk) {
    return typeof chunk === "string" ? chunk : chunk.toString("utf8");
}
/** Starts a child process and returns cancelable aggregated output for OpenTUI run panels. */
export function WorktreeStackKit_startOpenTuiChildProcess(options) {
    const child = spawn(options.command, [...options.args], {
        cwd: options.cwd,
        env: { ...options.env },
        stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
        const text = WorktreeStackKit_decodeOpenTuiChildChunk(chunk);
        stdout += text;
        options.handlers?.onStdoutChunk?.(text);
    });
    child.stderr?.on("data", (chunk) => {
        const text = WorktreeStackKit_decodeOpenTuiChildChunk(chunk);
        stderr += text;
        options.handlers?.onStderrChunk?.(text);
    });
    const promise = new Promise((resolve, reject) => {
        child.on("error", (error) => {
            reject(error);
        });
        child.on("close", (code) => {
            resolve({
                status: code ?? 1,
                stderr,
                stdout,
            });
        });
    });
    return {
        cancel: () => {
            if (!child.killed && child.pid !== undefined) {
                child.kill("SIGTERM");
            }
        },
        promise,
    };
}
/** Runs `npm run <script> -- <forwardedArgs>` from a project root. */
export function WorktreeStackKit_spawnOpenTuiNpmRun(options) {
    return WorktreeStackKit_startOpenTuiChildProcess({
        args: ["run", options.npmScript, "--", ...options.forwardedArgs],
        command: "npm",
        cwd: options.repoRoot,
        env: options.env,
        handlers: options.handlers,
    });
}
/** Runs `npx tsx <scriptUnderRepo> <args>` from a project root. */
export function WorktreeStackKit_spawnOpenTuiNpxTsx(options) {
    return WorktreeStackKit_startOpenTuiChildProcess({
        args: ["tsx", path.join(options.repoRoot, options.scriptPathUnderRepo), ...options.args],
        command: "npx",
        cwd: options.repoRoot,
        env: options.env,
        handlers: options.handlers,
    }).promise;
}
