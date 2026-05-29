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
import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
/** Builds a single structured transcript line for the Ink session log. */
function WorktreeStackKit_createInkBridgeLine(source, text) {
    return { source, text };
}
/** Appends streaming text to a line buffer and emits completed newline-terminated rows. */
function WorktreeStackKit_appendInkBridgeChunkLines(options) {
    let buffer = options.existingBuffer + options.chunk;
    while (true) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex === -1) {
            break;
        }
        const rawLine = buffer.slice(0, newlineIndex).replace(/\r$/, "");
        buffer = buffer.slice(newlineIndex + 1);
        const line = WorktreeStackKit_createInkBridgeLine(options.source, rawLine);
        options.lines.push(line);
        options.emitLine(line);
    }
    return buffer;
}
/** Emits one final line when a stream closes with a partial buffered row. */
function WorktreeStackKit_flushInkBridgeBufferedLine(options) {
    const trimmed = options.buffer.replace(/\r$/, "");
    if (trimmed.length === 0) {
        return;
    }
    const line = WorktreeStackKit_createInkBridgeLine(options.source, trimmed);
    options.lines.push(line);
    options.emitLine(line);
}
/** Stops a child process or process group, treating already-dead children as a no-op. */
function WorktreeStackKit_stopInkBridgeChildProcess(options) {
    try {
        if (options.useProcessGroup && typeof options.child.pid === "number") {
            process.kill(-options.child.pid, options.signal);
            return;
        }
        options.child.kill(options.signal);
    }
    catch (error) {
        const code = error instanceof Error && "code" in error ? String(error.code) : null;
        if (code === "ESRCH") {
            return;
        }
        throw error;
    }
}
/** Spawns the requested command and adapts stdout/stderr to package session lines. */
function WorktreeStackKit_startInkBaseProcess(options) {
    const spawnProcess = options.dependencies?.spawnProcess ??
        ((command, args, spawnOptions) => spawn(command, args, spawnOptions));
    const useProcessGroup = process.platform !== "win32";
    const child = spawnProcess(options.request.command, [...options.request.args], {
        cwd: options.projectRoot,
        detached: useProcessGroup,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
    });
    const lines = [];
    const startedAt = new Date().toISOString();
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let cancelled = false;
    let closed = false;
    let forceKillTimer = null;
    options.callbacks.onStarted(startedAt);
    const promise = new Promise((resolve, reject) => {
        child.stdout.on("data", (chunk) => {
            stdoutBuffer = WorktreeStackKit_appendInkBridgeChunkLines({
                chunk: chunk.toString(),
                emitLine: options.callbacks.onLine,
                existingBuffer: stdoutBuffer,
                lines,
                source: "stdout",
            });
        });
        child.stderr.on("data", (chunk) => {
            stderrBuffer = WorktreeStackKit_appendInkBridgeChunkLines({
                chunk: chunk.toString(),
                emitLine: options.callbacks.onLine,
                existingBuffer: stderrBuffer,
                lines,
                source: "stderr",
            });
        });
        child.once("error", (error) => {
            reject(error);
        });
        child.once("close", (exitCode, signal) => {
            closed = true;
            if (forceKillTimer) {
                clearTimeout(forceKillTimer);
                forceKillTimer = null;
            }
            WorktreeStackKit_flushInkBridgeBufferedLine({
                buffer: stdoutBuffer,
                emitLine: options.callbacks.onLine,
                lines,
                source: "stdout",
            });
            WorktreeStackKit_flushInkBridgeBufferedLine({
                buffer: stderrBuffer,
                emitLine: options.callbacks.onLine,
                lines,
                source: "stderr",
            });
            resolve({
                endedAt: new Date().toISOString(),
                exitCode,
                lines,
                signal,
                startedAt,
                status: cancelled
                    ? "cancelled"
                    : exitCode === 0
                        ? "succeeded"
                        : "failed",
            });
        });
    });
    return {
        promise,
        lines,
        startedAt,
        cancel() {
            cancelled = true;
            if (closed) {
                return;
            }
            WorktreeStackKit_stopInkBridgeChildProcess({
                child,
                signal: "SIGTERM",
                useProcessGroup,
            });
            forceKillTimer = setTimeout(() => {
                if (closed) {
                    return;
                }
                WorktreeStackKit_stopInkBridgeChildProcess({
                    child,
                    signal: "SIGKILL",
                    useProcessGroup,
                });
            }, 2000);
            forceKillTimer.unref?.();
        },
    };
}
/** Resolves a retained artifact id to the session line source used when tailing its file. */
function WorktreeStackKit_getInkArtifactSource(artifactId) {
    switch (artifactId) {
        case "start-preflight-log":
            return "sidecar-preflight";
        case "start-register-log":
            return "sidecar-register";
        case "start-render-log":
            return "sidecar-render";
        case "start-ensure-running-log":
            return "sidecar-ensure-running";
        case "runtime-run-log":
            return "runtime-run-log";
        default:
            return null;
    }
}
/** Builds tracked artifact records for known retained log ids. */
function WorktreeStackKit_buildTrackedInkArtifacts(artifacts) {
    return artifacts.flatMap((artifact) => {
        const source = WorktreeStackKit_getInkArtifactSource(artifact.id);
        if (!source) {
            return [];
        }
        return [
            {
                artifact,
                buffer: "",
                emittedStatus: false,
                lastContentLength: 0,
                source,
            },
        ];
    });
}
/** Polls retained log files and merges new content into the shared Ink transcript. */
function WorktreeStackKit_startInkArtifactPolling(options) {
    const trackedArtifacts = WorktreeStackKit_buildTrackedInkArtifacts(options.artifacts);
    if (trackedArtifacts.length === 0) {
        return { stop() { } };
    }
    for (const artifactState of trackedArtifacts) {
        try {
            artifactState.lastContentLength = statSync(artifactState.artifact.path).size;
        }
        catch {
            artifactState.lastContentLength = 0;
        }
    }
    const intervalId = setInterval(() => {
        Promise.all(trackedArtifacts.map(async (artifactState) => {
            try {
                const content = await readFile(artifactState.artifact.path, "utf8");
                if (content.length < artifactState.lastContentLength) {
                    artifactState.lastContentLength = 0;
                    artifactState.buffer = "";
                }
                if (content.length === artifactState.lastContentLength) {
                    return;
                }
                const nextChunk = content.slice(artifactState.lastContentLength);
                artifactState.lastContentLength = content.length;
                if (!artifactState.emittedStatus) {
                    options.onStatus(artifactState.source === "runtime-run-log"
                        ? "running"
                        : "watching-sidecars");
                    artifactState.emittedStatus = true;
                }
                artifactState.buffer = WorktreeStackKit_appendInkBridgeChunkLines({
                    chunk: nextChunk,
                    emitLine: options.onLine,
                    existingBuffer: artifactState.buffer,
                    lines: options.lines,
                    source: artifactState.source,
                });
            }
            catch {
                return;
            }
        }));
    }, options.pollIntervalMs);
    return {
        stop() {
            clearInterval(intervalId);
        },
    };
}
/** Spawns a single-shot worktree-stack command and streams structured session lines to Ink. */
export function WorktreeStackKit_startInkTaskProcess(options) {
    const baseProcess = WorktreeStackKit_startInkBaseProcess({
        callbacks: {
            onLine: options.onLine,
            onStarted: options.onStarted,
        },
        dependencies: options.dependencies,
        projectRoot: options.projectRoot,
        request: options.request,
    });
    return {
        promise: baseProcess.promise,
        cancel: baseProcess.cancel,
    };
}
/** Spawns a long-lived runtime session while polling retained artifact logs into the transcript. */
export function WorktreeStackKit_startInkRuntimeProcess(options) {
    const baseProcess = WorktreeStackKit_startInkBaseProcess({
        callbacks: {
            onStarted(startedAt) {
                options.onStarted(startedAt);
                options.onStatus("starting");
            },
            onLine: options.onLine,
        },
        dependencies: options.dependencies,
        projectRoot: options.projectRoot,
        request: options.request,
    });
    const artifactPolling = WorktreeStackKit_startInkArtifactPolling({
        artifacts: options.retainedArtifacts,
        lines: baseProcess.lines,
        onLine: options.onLine,
        onStatus: options.onStatus,
        pollIntervalMs: options.dependencies?.pollIntervalMs ?? 250,
    });
    return {
        promise: baseProcess.promise.finally(() => {
            artifactPolling.stop();
        }),
        cancel() {
            artifactPolling.stop();
            baseProcess.cancel();
        },
    };
}
//# sourceMappingURL=ink-bridge.js.map