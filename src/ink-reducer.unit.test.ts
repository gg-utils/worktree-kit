/**
 * @fileoverview Verifies the worktree-stack Ink reducer adapter for default initial shell state,
 * load-error transitions, and focused primary-action option toggles.
 *
 * This file owns Node `node:test` regression coverage for `WorktreeStackKit_createInitialInkState`
 * defaults and `WorktreeStackKit_inkReducer` branches that stay thin over the helper layer.
 * Flow: create initial state -> dispatch UI actions -> assert status, error text, and option fields.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-reducer.unit.test.ts
 * @testing Node test runner unit: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including this file).
 *
 * @see packages/worktree-kit/src/ink-reducer.ts - Reducer and initial-state factory whose default shell snapshot, load-error handling, and toggle-primary-action-option wiring are asserted here.
 * @see packages/worktree-kit/src/ink-action-catalog.ts - Ordered action ids used to resolve the `start` action index when exercising focused option toggles.
 * @see packages/worktree-kit/src/ink-reducer-helpers.ts - Pure transition helpers the reducer delegates to for most branches; this suite targets adapter-level cases that compose those helpers.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { WORKTREE_STACK_KIT_INK_ACTIONS } from "./ink-action-catalog.js";
import {
  WorktreeStackKit_createInitialInkState,
  WorktreeStackKit_inkReducer,
} from "./ink-reducer.js";

test("WorktreeStackKit_createInitialInkState returns the default shell state", () => {
  const state = WorktreeStackKit_createInitialInkState();

  assert.equal(state.status, "loading");
  assert.equal(state.screen, "shell");
  assert.equal(state.focusedColumn, "actions");
  assert.equal(state.selectedActionIndex, -1);
  assert.equal(state.createRegion, "fields");
  assert.equal(state.createDraft.runInstall, true);
  assert.equal(state.actionOptions.updateFromMainExecutionMode, "plan");
});

test("WorktreeStackKit_inkReducer applies load errors through the package state machine", () => {
  const failed = WorktreeStackKit_inkReducer(
    WorktreeStackKit_createInitialInkState(),
    { type: "load-error", errorMessage: "inventory failed" },
  );

  assert.equal(failed.status, "error");
  assert.equal(failed.errorMessage, "inventory failed");
  assert.equal(failed.screen, "shell");
  assert.equal(failed.activePlan, null);
});

test("WorktreeStackKit_inkReducer applies focused option toggles", () => {
  const startActionIndex = WORKTREE_STACK_KIT_INK_ACTIONS.findIndex(
    (action) => action.id === "start",
  );
  assert.notEqual(startActionIndex, -1);

  const baseState = {
    ...WorktreeStackKit_createInitialInkState(),
    selectedActionIndex: startActionIndex,
  };
  const toggled = WorktreeStackKit_inkReducer(baseState, {
    type: "toggle-primary-action-option",
  });

  assert.equal(baseState.actionOptions.openWindsurfOnStart, false);
  assert.equal(toggled.actionOptions.openWindsurfOnStart, true);
});
