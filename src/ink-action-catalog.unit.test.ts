/**
 * @fileoverview Unit coverage for reusable worktree Ink action catalog metadata and stable ordering.
 *
 * This file owns regression tests for the ordered `WORKTREE_STACK_KIT_INK_ACTIONS` list (record-scoped
 * actions before globals and expected maintenance ids) consumed by Ink UIs and worktree-stack adapters.
 * Flow: import catalog -> assert leading record-action slice -> assert global action ids are present.
 *
 * @example
 * ```typescript
 * test("record actions lead the catalog", () => {
 *   assert.equal(WORKTREE_STACK_KIT_INK_ACTIONS[0]?.id, "start");
 * });
 * ```
 *
 * @testing Node test runner unit: npm run worktree-kit:test from the repository root (executes packages/worktree-kit tests including packages/worktree-kit/src/ink-action-catalog.unit.test.ts).
 *
 * @see packages/worktree-kit/src/ink-action-catalog.ts - Ordered action definitions and scope fields under test for id sequence and membership asserted here.
 * @see packages/worktree-kit/src/ink-keyboard-routing.ts - Ink keyboard routing that indexes this catalog and must stay aligned with the ids covered by these assertions.
 * @see scripts/worktree-stack/ui/cli-ink/worktree-ink-actions.ts - Worktree-stack Ink adapter that re-exports this catalog so script launchers inherit the same ordering contract verified here.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { WORKTREE_STACK_KIT_INK_ACTIONS } from "./ink-action-catalog.js";

test("WORKTREE_STACK_KIT_INK_ACTIONS keeps record actions before global actions", () => {
  assert.deepEqual(
    WORKTREE_STACK_KIT_INK_ACTIONS.slice(0, 4).map((action) => [
      action.id,
      action.scope,
    ]),
    [
      ["start", "record"],
      ["destroy", "record"],
      ["update-from-main", "record"],
      ["merge", "record"],
    ],
  );
});

test("WORKTREE_STACK_KIT_INK_ACTIONS includes launchable global maintenance actions", () => {
  const actionIds = new Set(
    WORKTREE_STACK_KIT_INK_ACTIONS.map((action) => action.id),
  );
  assert.equal(actionIds.has("create"), true);
  assert.equal(actionIds.has("repair"), true);
  assert.equal(actionIds.has("realm-pool-next"), true);
  assert.equal(actionIds.has("checkout-state-check"), true);
});
