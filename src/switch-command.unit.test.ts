/**
 * @fileoverview Verifies config-driven argv parsing, prepared-worktree matching, editor-command
 * resolution, and usage rendering for the worktree switch helpers.
 *
 * This file owns Node test coverage for the pure helpers exported from switch-command.ts so root
 * npm script adapters can keep thin orchestration layers.
 * Flow: fixture config + argv -> parse or resolve -> assert normalized outputs.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/switch-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/switch-command.ts - Switch command helpers and types under test whose argv parsing, worktree matching, editor mapping, and usage output are asserted here.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting the switch helpers so consumers validate behavior through the published kit surface.
 * @see packages/worktree-kit/README.md - Operator-facing kit README that documents the switch-command export and how adapters wire these helpers into npm scripts.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_findMatchingSwitchWorktree,
  WorktreeStackKit_parseSwitchArgs,
  WorktreeStackKit_renderSwitchUsage,
  WorktreeStackKit_resolveSwitchEditorCommand,
  type WorktreeStackKit_SwitchCommandConfig,
} from "./switch-command.js";

const switchCommandTestConfig: WorktreeStackKit_SwitchCommandConfig = {
  createCommand: { args: ["run", "worktrees:create", "--"], command: "npm" },
  interactiveCommand: {
    args: ["run", "worktrees:cli:ink", "--", "--action", "switch", "--interactive"],
    command: "npm",
  },
  projectRoot: "/repo",
  usageCommandLines: [
    "npm run worktrees:switch -- [options]",
    "tool switch [options]",
  ],
};

test("WorktreeStackKit_parseSwitchArgs parses direct switch options", () => {
  const parsed = WorktreeStackKit_parseSwitchArgs({
    argv: ["--prefix", "Claude", "--name", "fix-auth", "--slot", "7", "--dry-run"],
    config: switchCommandTestConfig,
  });

  assert.deepEqual(parsed, {
    branchPrefix: "claude",
    dryRun: true,
    editorOverride: "",
    environment: "",
    interactive: false,
    slot: 7,
    stackName: "fix-auth",
  });
});

test("WorktreeStackKit_parseSwitchArgs allows interactive mode without a stack name", () => {
  const parsed = WorktreeStackKit_parseSwitchArgs({
    argv: ["--interactive", "--environment", "sandbox"],
    config: switchCommandTestConfig,
  });

  assert.equal(parsed?.interactive, true);
  assert.equal(parsed?.environment, "sandbox");
  assert.equal(parsed?.stackName, "");
});

test("WorktreeStackKit_findMatchingSwitchWorktree matches by prefix and stack name", () => {
  const match = WorktreeStackKit_findMatchingSwitchWorktree({
    branchPrefix: "codex",
    stackName: "fix-auth",
    worktrees: [
      { branchPrefix: "claude", slot: 1, stackName: "fix-auth", worktreePath: "/a" },
      { branchPrefix: "codex", slot: 2, stackName: "fix-auth", worktreePath: "/b" },
    ],
  });

  assert.equal(match?.worktreePath, "/b");
});

test("WorktreeStackKit_resolveSwitchEditorCommand respects overrides and prefix mapping", () => {
  assert.equal(WorktreeStackKit_resolveSwitchEditorCommand("claude", ""), "claude --cwd <PATH>");
  assert.equal(WorktreeStackKit_resolveSwitchEditorCommand("codex", ""), null);
  assert.equal(WorktreeStackKit_resolveSwitchEditorCommand("codex", "code <PATH>"), "code <PATH>");
});

test("WorktreeStackKit_renderSwitchUsage includes configured command lines", () => {
  const text = WorktreeStackKit_renderSwitchUsage(switchCommandTestConfig);
  assert.match(text, /npm run worktrees:switch/u);
  assert.match(text, /tool switch/u);
});
