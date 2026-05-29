/**
 * @fileoverview Node test regression suite that owns assertions for the worktree-stack Ink subprocess
 * bridge helpers (one-shot task runs and long-lived runtime sessions).
 *
 * Covers stdout/stderr capture, non-zero exits, cancellation, runtime status phases, and retained-artifact
 * tailing that must ignore stale log file contents from prior runs.
 * Flow: spawn child via bridge -> assert transcript lines, exit status, and sidecar log freshness.
 *
 * @testing Node test unit: cd packages/worktree-kit && npm run test -- src/ink-bridge.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-bridge.ts - Spawn-and-stream bridge implementation whose buffering, cancellation, and retained-artifact polling contracts are verified by the cases in this suite.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink interactive shell that calls the bridge helpers and depends on the runtime and task semantics exercised here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  WorktreeStackKit_startInkRuntimeProcess,
  WorktreeStackKit_startInkTaskProcess,
} from "./ink-bridge.js";

test("WorktreeStackKit_startInkTaskProcess captures stdout and stderr", async () => {
  const capturedLines: string[] = [];
  const startedAtValues: string[] = [];
  const run = WorktreeStackKit_startInkTaskProcess({
    projectRoot: process.cwd(),
    request: {
      command: process.execPath,
      args: [
        "-e",
        "console.log('hello from stdout'); console.error('hello from stderr');",
      ],
    },
    onStarted(startedAt) {
      startedAtValues.push(startedAt);
    },
    onLine(line) {
      capturedLines.push(`${line.source}:${line.text}`);
    },
  });

  const result = await run.promise;

  assert.equal(startedAtValues.length, 1);
  assert.equal(result.status, "succeeded");
  assert.equal(capturedLines.includes("stdout:hello from stdout"), true);
  assert.equal(capturedLines.includes("stderr:hello from stderr"), true);
});

test("WorktreeStackKit_startInkTaskProcess reports failed and cancelled runs", async () => {
  const failedRun = WorktreeStackKit_startInkTaskProcess({
    projectRoot: process.cwd(),
    request: {
      command: process.execPath,
      args: ["-e", "process.stderr.write('boom\\n'); process.exit(7);"],
    },
    onStarted() {},
    onLine() {},
  });
  const failedResult = await failedRun.promise;
  assert.equal(failedResult.status, "failed");
  assert.equal(failedResult.exitCode, 7);
  assert.equal(
    failedResult.lines.map((line) => line.text).includes("boom"),
    true,
  );

  const cancelledRun = WorktreeStackKit_startInkTaskProcess({
    projectRoot: process.cwd(),
    request: {
      command: process.execPath,
      args: ["-e", "setTimeout(() => console.log('late output'), 1000);"],
    },
    onStarted() {},
    onLine() {},
  });
  cancelledRun.cancel();
  const cancelledResult = await cancelledRun.promise;
  assert.equal(cancelledResult.status, "cancelled");
});

test("WorktreeStackKit_startInkRuntimeProcess tails fresh retained artifacts", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "worktree-kit-ink-runtime-"));
  const preflightLogPath = join(tempDir, "start-demo.preflight.log");
  const runtimeLogPath = join(tempDir, "latest.log");
  const capturedLines: string[] = [];
  const statuses: string[] = [];

  try {
    await writeFile(
      preflightLogPath,
      "stale preflight from previous run\n",
      "utf8",
    );
    await writeFile(
      runtimeLogPath,
      "stale runtime from previous run\n",
      "utf8",
    );

    const run = WorktreeStackKit_startInkRuntimeProcess({
      projectRoot: tempDir,
      request: {
        command: process.execPath,
        args: [
          "-e",
          [
            "const fs = require('node:fs');",
            "const [preflightPath, runtimePath] = process.argv.slice(1);",
            "setTimeout(() => fs.writeFileSync(preflightPath, 'fresh preflight\\n'), 25);",
            "setTimeout(() => fs.writeFileSync(runtimePath, 'fresh runtime\\n'), 40);",
            "setTimeout(() => process.exit(0), 120);",
          ].join(" "),
          preflightLogPath,
          runtimeLogPath,
        ],
      },
      retainedArtifacts: [
        { id: "start-preflight-log", path: preflightLogPath },
        { id: "runtime-run-log", path: runtimeLogPath },
      ],
      onStarted() {},
      onStatus(status) {
        statuses.push(status);
      },
      onLine(line) {
        capturedLines.push(`${line.source}:${line.text}`);
      },
      dependencies: {
        pollIntervalMs: 10,
      },
    });

    const result = await run.promise;

    assert.equal(result.status, "succeeded");
    assert.equal(statuses.includes("starting"), true);
    assert.equal(statuses.includes("watching-sidecars"), true);
    assert.equal(statuses.includes("running"), true);
    assert.equal(
      capturedLines.includes("sidecar-preflight:fresh preflight"),
      true,
    );
    assert.equal(capturedLines.includes("runtime-run-log:fresh runtime"), true);
    assert.equal(
      capturedLines.includes(
        "sidecar-preflight:stale preflight from previous run",
      ),
      false,
    );
    assert.equal(
      capturedLines.includes("runtime-run-log:stale runtime from previous run"),
      false,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
