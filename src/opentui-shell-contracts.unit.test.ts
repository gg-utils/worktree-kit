/**
 * @fileoverview Verifies stable OpenTUI shell tab constants and breadcrumb/navigation helpers for
 * worktree-stack flows in `worktree-kit`.
 *
 * This file owns regression coverage for preview/result tab option rows, flow-title strings, and
 * global menu tab wiring exported from `opentui-shell-contracts`.
 * Flow: import constants and helpers -> assert tab shapes, titles, and nav tabs match the UX contract.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-shell-contracts.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Canonical preview/result tab constants, flow-title builder, and nav-tab helper whose closed-string labels and option values are asserted here.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI app shell that consumes flow titles and nav-tab shapes when rendering breadcrumbs and bottom navigation aligned with this contract surface.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS,
  WORKTREE_STACK_KIT_OPENTUI_RESULT_TABS,
  WorktreeStackKit_openTuiFlowTitle,
  WorktreeStackKit_openTuiNavTabs,
} from "./opentui-shell-contracts.js";

test("OpenTUI shell contract exposes stable preview/result tabs", () => {
  assert.deepEqual(WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS, [
    { description: "Execute", name: "Run", value: "run" },
    { description: "Edit inputs", name: "Back", value: "back" },
  ]);
  assert.deepEqual(WORKTREE_STACK_KIT_OPENTUI_RESULT_TABS, [
    { description: "Main menu", name: "Menu", value: "menu" },
  ]);
});

test("OpenTUI shell contract formats breadcrumbs and navigation tabs", () => {
  assert.equal(
    WorktreeStackKit_openTuiFlowTitle({
      flow: "updateFromMain",
      phase: "preview",
    }),
    "Update from Main → Preview",
  );
  assert.deepEqual(WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }), [
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(WorktreeStackKit_openTuiNavTabs({ includeMenuBack: false }), [
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
});
