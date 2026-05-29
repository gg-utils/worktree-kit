/**
 * @fileoverview Verifies OpenTUI command-run lifecycle helpers format npm labels and drive UI callbacks in order.
 *
 * This file owns Node test regression coverage for `WorktreeStackKit_formatOpenTuiNpmRunLabel` and
 * `WorktreeStackKit_runOpenTuiCommandWithLifecycle`, using a probe that records callback sequencing for
 * successful cancelable runs and for rejected `startRun` failures.
 * Flow: build probe callbacks -> invoke lifecycle helper with stubbed `startRun` -> assert ordered event transcript.
 *
 * @testing Node test runner via tsx: cd packages/worktree-kit && npm run test -- src/opentui-app-run-lifecycle.unit.test.ts
 * @testing Node test runner via tsx: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-run-lifecycle.ts - Production lifecycle orchestrator whose cancel, reset, stream, phase, status, and stderr wiring contracts are asserted via the probe transcript here.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Defines `WorktreeStackKit_OpenTuiPhase` values referenced when the probe records `phase:*` events emitted by the lifecycle helper under test.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_formatOpenTuiNpmRunLabel,
  WorktreeStackKit_runOpenTuiCommandWithLifecycle,
} from "./opentui-app-run-lifecycle.js";
import type { WorktreeStackKit_OpenTuiPhase } from "./opentui-shell-contracts.js";

function createRunLifecycleProbe() {
  const events: string[] = [];
  const callbacks = {
    appendRunStderr: (chunk: string) => {
      events.push(`stderr:${chunk}`);
    },
    appendRunStdout: (chunk: string) => {
      events.push(`stdout:${chunk}`);
    },
    cancelCurrentRun: () => {
      events.push("cancel-current");
    },
    resetRunArtifacts: () => {
      events.push("reset");
    },
    setCancelRun: (cancel: (() => void) | null) => {
      events.push(cancel === null ? "cancel-handle:null" : "cancel-handle:set");
    },
    setPhase: (phase: WorktreeStackKit_OpenTuiPhase) => {
      events.push(`phase:${phase}`);
    },
    setRunScript: (commandLabel: string) => {
      events.push(`script:${commandLabel}`);
    },
    setRunStatus: (status: number | null) => {
      events.push(`status:${String(status)}`);
    },
    setRunStderr: (stderr: string) => {
      events.push(`set-stderr:${stderr}`);
    },
  };

  return { callbacks, events };
}

test("WorktreeStackKit_formatOpenTuiNpmRunLabel formats npm script labels", () => {
  assert.equal(
    WorktreeStackKit_formatOpenTuiNpmRunLabel("worktrees:start"),
    "npm run worktrees:start",
  );
});

test("WorktreeStackKit_runOpenTuiCommandWithLifecycle handles cancelable runs", async () => {
  const probe = createRunLifecycleProbe();

  await WorktreeStackKit_runOpenTuiCommandWithLifecycle({
    callbacks: probe.callbacks,
    commandLabel: "npm run demo",
    startRun: (handlers) => {
      handlers.onStdoutChunk("hello");
      return {
        cancel: () => {
          probe.events.push("cancel-child");
        },
        promise: Promise.resolve({ status: 0, stderr: "", stdout: "hello" }),
      };
    },
  });

  assert.deepEqual(probe.events, [
    "cancel-current",
    "cancel-handle:null",
    "reset",
    "phase:running",
    "script:npm run demo",
    "stdout:hello",
    "cancel-handle:set",
    "cancel-handle:null",
    "status:0",
    "phase:result",
  ]);
});

test("WorktreeStackKit_runOpenTuiCommandWithLifecycle handles direct failures", async () => {
  const probe = createRunLifecycleProbe();

  await WorktreeStackKit_runOpenTuiCommandWithLifecycle({
    callbacks: probe.callbacks,
    commandLabel: "npx tsx demo.ts",
    startRun: () => Promise.reject(new Error("boom")),
  });

  assert.deepEqual(probe.events, [
    "cancel-current",
    "cancel-handle:null",
    "reset",
    "phase:running",
    "script:npx tsx demo.ts",
    "cancel-handle:null",
    "set-stderr:boom",
    "status:1",
    "phase:result",
  ]);
});
