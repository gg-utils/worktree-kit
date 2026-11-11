/**
 * @fileoverview Verifies `WorktreeStackKit_startOpenTuiChildProcess` aggregates stdout and stderr,
 * forwards streamed chunks to optional hooks, and resolves exit status for OpenTUI child runs.
 *
 * This file owns regression coverage for the Node `spawn`-backed helper used by OpenTUI npm and
 * `npx tsx` adapters in worktree-kit.
 * Flow: configure handlers and child argv -> await cancelable run promise -> assert buffers, chunk
 * ordering, and exit code.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-child-process.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-child-process.ts - Runtime implementation under test that wraps `spawn`, streams stdout/stderr into hooks, and returns the cancelable run handle asserted here.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract that defines the `@testing` and `@see` shape used in this header.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { WorktreeStackKit_startOpenTuiChildProcess } from "./opentui-child-process.js";

void test("WorktreeStackKit_startOpenTuiChildProcess aggregates streamed output", async () => {
  const chunks: string[] = [];
  const run = WorktreeStackKit_startOpenTuiChildProcess({
    args: [
      "-e",
      "process.stdout.write('out'); process.stderr.write('err');",
    ],
    command: process.execPath,
    cwd: process.cwd(),
    env: process.env,
    handlers: {
      onStderrChunk: (chunk) => {
        chunks.push(`stderr:${chunk}`);
      },
      onStdoutChunk: (chunk) => {
        chunks.push(`stdout:${chunk}`);
      },
    },
  });

  const result = await run.promise;

  assert.equal(result.status, 0);
  assert.equal(result.stdout, "out");
  assert.equal(result.stderr, "err");
  assert.deepEqual(chunks.sort(), ["stderr:err", "stdout:out"]);
});
