/**
 * @fileoverview Node test regression coverage for worktree-stack Ink CLI entrypoint request parsing
 * and Kitty keyboard-mode env mapping.
 *
 * This file owns assertions for help short-circuiting, TTY guards, launch-target extraction from
 * argv, and `WORKTREE_INK_KITTY_KEYBOARD` normalization ahead of the alternate-screen Ink runner.
 * Flow: build synthetic argv + stdio TTY flags -> assert help, error, or launch request shapes ->
 * assert Kitty keyboard mode resolves from env.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-entrypoint.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-entrypoint.ts - Ink entrypoint resolver and runner whose argv, TTY guard, and Kitty keyboard-mode contracts are asserted in this suite.
 * @see packages/worktree-kit/src/ink-launch-options.ts - Launch-option parser and help text supplier consumed by the entrypoint before resolving help vs launch requests tested here.
 * @see scripts/worktree-stack/ui/cli-ink/index.mts - Root Ink CLI wiring that delegates into the package entrypoint and depends on the same request shapes verified below.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_resolveInkEntrypointRequest,
  WorktreeStackKit_resolveInkKittyKeyboardMode,
} from "./ink-entrypoint.js";

test("WorktreeStackKit_resolveInkEntrypointRequest returns help before TTY checks", () => {
  const request = WorktreeStackKit_resolveInkEntrypointRequest({
    argv: ["--help"],
    stdinIsTty: false,
    stdoutIsTty: false,
  });

  assert.equal(request.kind, "worktree-stack-ink-entrypoint-request-help");
  if (request.kind !== "worktree-stack-ink-entrypoint-request-help") {
    throw new Error("Expected help request");
  }
  assert.equal(request.exitCode, 0);
  assert.match(request.helpText, /Usage: npm run worktrees:cli:ink/);
});

test("WorktreeStackKit_resolveInkEntrypointRequest rejects non-TTY launches", () => {
  const request = WorktreeStackKit_resolveInkEntrypointRequest({
    argv: [],
    stdinIsTty: true,
    stdoutIsTty: false,
  });

  assert.equal(request.kind, "worktree-stack-ink-entrypoint-request-error");
  if (request.kind !== "worktree-stack-ink-entrypoint-request-error") {
    throw new Error("Expected error request");
  }
  assert.equal(request.exitCode, 1);
  assert.equal(request.message, "worktrees:cli:ink requires an interactive TTY.");
});

test("WorktreeStackKit_resolveInkEntrypointRequest launches with parsed target", () => {
  const request = WorktreeStackKit_resolveInkEntrypointRequest({
    argv: ["--action", "start"],
    stdinIsTty: true,
    stdoutIsTty: true,
  });

  assert.equal(request.kind, "worktree-stack-ink-entrypoint-request-launch");
  if (request.kind !== "worktree-stack-ink-entrypoint-request-launch") {
    throw new Error("Expected launch request");
  }
  assert.equal(request.launchTarget?.actionId, "start");
});

test("WorktreeStackKit_resolveInkKittyKeyboardMode maps opt-in env", () => {
  assert.equal(
    WorktreeStackKit_resolveInkKittyKeyboardMode({
      WORKTREE_INK_KITTY_KEYBOARD: "1",
    }),
    "auto",
  );
  assert.equal(WorktreeStackKit_resolveInkKittyKeyboardMode({}), "disabled");
});
