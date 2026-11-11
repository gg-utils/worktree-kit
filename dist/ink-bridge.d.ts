/**
 * @fileoverview Reusable process bridge for worktree-stack Ink command sessions.
 *
 * Flow: command request -> detached child process -> sourced transcript lines -> optional retained
 * artifact polling -> terminal execution result. Script adapters bind project-specific request types
 * and UI state while this package owns stream buffering, cancellation, and artifact tailing.
 *
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/ink-app.tsx - Ink action UI that passes session callbacks into these spawn helpers when starting runtime or task workflows from the action catalog.
 * @see packages/worktree-kit/src/ink-bridge.unit.test.ts - Node test module that exercises stdout/stderr line splitting, cancellation, SIGKILL escalation, and retained-artifact polling for this bridge.
 * @see scripts/worktree-stack/ui/cli-ink/bridge.ts - Worktree-stack CLI façade that imports this package so callers can keep using the `@gg-utils/worktree-kit/ink-bridge` export path documented in COMMANDS.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Minimal command request shape required by the reusable Ink process bridge. */
export type WorktreeStackKit_InkCommandRequest = {
    readonly args: readonly string[];
    readonly command: string;
};
/** Retained artifact metadata that can be polled into the Ink transcript. */
export type WorktreeStackKit_InkRetainedArtifact = {
    readonly id: string;
    readonly path: string;
};
/** Source classification for a session output line. */
export type WorktreeStackKit_InkSessionLineSource = "stdout" | "stderr" | "bridge" | "sidecar-preflight" | "sidecar-register" | "sidecar-render" | "sidecar-ensure-running" | "runtime-run-log";
/** A single output line from a bridged Ink session. */
export type WorktreeStackKit_InkSessionLine = {
    source: WorktreeStackKit_InkSessionLineSource;
    text: string;
};
/** Structured outcome of a spawned Ink-sidecar or task process. */
export type WorktreeStackKit_InkTaskExecutionResult = {
    endedAt: string;
    exitCode: number | null;
    lines: WorktreeStackKit_InkSessionLine[];
    signal: string | null;
    startedAt: string;
    status: "succeeded" | "failed" | "cancelled";
};
/** High-level phases reported for long-lived runtime sessions in the Ink UI. */
export type WorktreeStackKit_InkRuntimeSessionStatus = "starting" | "watching-sidecars" | "running";
/** Spawned child process shape used by the bridge and tests. */
export interface WorktreeStackKit_InkSpawnedProcess {
    kill: (signal?: NodeJS.Signals | number) => boolean;
    once: (event: "close" | "error", listener: ((code: number | null, signal: NodeJS.Signals | null) => void) | ((error: Error) => void)) => WorktreeStackKit_InkSpawnedProcess;
    pid?: number;
    stderr: NodeJS.ReadableStream;
    stdout: NodeJS.ReadableStream;
}
/** Injectable spawn hook matching Node child-process streaming semantics. */
export interface WorktreeStackKit_InkSpawnProcess {
    (command: string, args: string[], options: {
        cwd: string;
        detached: boolean;
        env: NodeJS.ProcessEnv;
        stdio: ["ignore", "pipe", "pipe"];
    }): WorktreeStackKit_InkSpawnedProcess;
}
/** Spawns a single-shot worktree-stack command and streams structured session lines to Ink. */
export declare function WorktreeStackKit_startInkTaskProcess(options: {
    readonly dependencies?: {
        readonly spawnProcess?: WorktreeStackKit_InkSpawnProcess;
    };
    readonly onLine: (line: WorktreeStackKit_InkSessionLine) => void;
    readonly onStarted: (startedAt: string) => void;
    readonly projectRoot: string;
    readonly request: WorktreeStackKit_InkCommandRequest;
}): {
    readonly cancel: () => void;
    readonly promise: Promise<WorktreeStackKit_InkTaskExecutionResult>;
};
/** Spawns a long-lived runtime session while polling retained artifact logs into the transcript. */
export declare function WorktreeStackKit_startInkRuntimeProcess(options: {
    readonly dependencies?: {
        readonly pollIntervalMs?: number;
        readonly spawnProcess?: WorktreeStackKit_InkSpawnProcess;
    };
    readonly onLine: (line: WorktreeStackKit_InkSessionLine) => void;
    readonly onStarted: (startedAt: string) => void;
    readonly onStatus: (status: WorktreeStackKit_InkRuntimeSessionStatus) => void;
    readonly projectRoot: string;
    readonly request: WorktreeStackKit_InkCommandRequest;
    readonly retainedArtifacts: readonly WorktreeStackKit_InkRetainedArtifact[];
}): {
    readonly cancel: () => void;
    readonly promise: Promise<WorktreeStackKit_InkTaskExecutionResult>;
};
