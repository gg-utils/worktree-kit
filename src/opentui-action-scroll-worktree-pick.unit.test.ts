/**
 * @fileoverview Node test regression coverage for OpenTUI worktree-pick planners and option builders.
 *
 * This file owns assertions for record-scoped pick visibility, populated and empty worktree-pick
 * option catalogs, and tab-select selection routing for the helpers in
 * `opentui-action-scroll-worktree-pick`.
 * Flow: assert visibility gates -> assert stable select-option shapes -> assert selection-to-state plans.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-worktree-pick.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-worktree-pick.ts - Pure planner module whose worktree-pick visibility helpers, option builders, and selection-plan branches are asserted here.
 * @see packages/worktree-kit/src/opentui-worktree-pick-panel.tsx - OpenTUI worktree-pick panel that consumes these planners for record-scoped pick UX aligned with the regression contract verified here.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Defines flow/phase tokens and select-option row shapes exercised by the visibility and option-builder assertions in this suite.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions,
  WorktreeStackKit_buildOpenTuiWorktreePickOptions,
  WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection,
  WorktreeStackKit_planOpenTuiWorktreePickSelection,
  WorktreeStackKit_shouldShowOpenTuiWorktreePick,
} from "./opentui-action-scroll-worktree-pick.js";

void test("OpenTUI worktree pick visibility only covers record-scoped pick flows", () => {
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiWorktreePick({
      flow: "start",
      phase: "pick",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiWorktreePick({
      flow: "switch",
      phase: "pick",
    }),
    false,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiWorktreePick({
      flow: "merge",
      phase: "form",
    }),
    false,
  );
});

void test("OpenTUI worktree pick options include records, manual, continue, and nav rows", () => {
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiWorktreePickOptions({
      records: [
        { description: "/tmp/wt-a", name: "stack-a" },
        { description: "/tmp/wt-b", name: "stack-b" },
      ],
    }),
    [
      { description: "/tmp/wt-a", name: "stack-a", value: "0" },
      { description: "/tmp/wt-b", name: "stack-b", value: "1" },
      {
        description: "Type path on next screen",
        name: "Manual path",
        value: "manual",
      },
      {
        description: "Continue with selection",
        name: "Continue",
        value: "next",
      },
      { description: "Return to menu", name: "Menu", value: "menu" },
      { description: "Leave", name: "Quit", value: "quit" },
    ],
  );
  assert.deepEqual(WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions(), [
    { description: "Configure flags", name: "Continue", value: "next" },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
});

void test("OpenTUI worktree pick selection planners map values to state transitions", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiWorktreePickSelection({ optionValue: "2" }),
    { recordPickIndex: 2, type: "record" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiWorktreePickSelection({ optionValue: "manual" }),
    { recordPickIndex: -1, type: "manual" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiWorktreePickSelection({ optionValue: "next" }),
    { nextPhase: "form", type: "continue" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection({ optionValue: "next" }),
    { nextPhase: "form", recordPickIndex: -1, type: "continue" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiWorktreePickSelection({ optionValue: "menu" }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiWorktreePickSelection({ optionValue: "quit" }),
    { type: "quit" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiWorktreePickSelection({ optionValue: undefined }),
    { type: "ignore" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection({ optionValue: "abc" }),
    { type: "ignore" },
  );
});
