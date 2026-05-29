/**
 * @fileoverview Verifies OpenTUI shell keyboard routing helpers for menu-column focus and escape-to-menu behavior in `worktree-kit`.
 *
 * This file owns regression coverage for structural key/ref navigation: tab blur/focus sequencing, left/right column rotation, and non-menu flow escape handling for `WorktreeStackKit_focusOpenTuiTabsForMenuColumn` and `WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation`.
 * Flow: build fixture refs and key events -> invoke helpers -> assert event ordering and focused column mutations.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-shell-keyboard.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-shell-keyboard.ts - Pure keyboard routing helpers under test that blur/focus OpenTUI tab refs and rotate menu columns without importing framework runtime types.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Flow and menu-column contract types used by fixtures when simulating key navigation against the helpers exercised here.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - Session controller that forwards OpenTUI key events into the production wiring surface these tests mirror at the structural-ref boundary.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation,
  WorktreeStackKit_focusOpenTuiTabsForMenuColumn,
  type WorktreeStackKit_OpenTuiFocusableRef,
  type WorktreeStackKit_OpenTuiKeyEventLike,
  type WorktreeStackKit_OpenTuiMenuKeyboardNavigationOptions,
} from "./opentui-shell-keyboard.js";
import type { WorktreeStackKit_OpenTuiMenuColumn } from "./opentui-shell-contracts.js";

function createFocusableRef(events: string[], label: string): WorktreeStackKit_OpenTuiFocusableRef {
  return {
    current: {
      blur: () => events.push(`${label}:blur`),
      focus: () => events.push(`${label}:focus`),
    },
  };
}

function createKey(name: string, events: string[]): WorktreeStackKit_OpenTuiKeyEventLike {
  return {
    name,
    preventDefault: () => events.push("preventDefault"),
  };
}

function createKeyboardOptions(options: {
  readonly events: string[];
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly keyName: string;
  readonly selectedColumns: WorktreeStackKit_OpenTuiMenuColumn[];
}): WorktreeStackKit_OpenTuiMenuKeyboardNavigationOptions {
  return {
    actionsTabRef: createFocusableRef(options.events, "actions"),
    flow: "menu",
    focusedColumn: options.focusedColumn,
    goMenu: () => options.events.push("goMenu"),
    key: createKey(options.keyName, options.events),
    setFocusedColumn: (column) => options.selectedColumns.push(column),
    worktreesTabRef: createFocusableRef(options.events, "worktrees"),
  };
}

test("OpenTUI keyboard helper focuses the active menu column", () => {
  const events: string[] = [];
  WorktreeStackKit_focusOpenTuiTabsForMenuColumn({
    actionsTabRef: createFocusableRef(events, "actions"),
    column: "actions",
    worktreesTabRef: createFocusableRef(events, "worktrees"),
  });
  assert.deepEqual(events, ["worktrees:blur", "actions:focus"]);
});

test("OpenTUI keyboard helper rotates columns and preserves focus order", () => {
  const events: string[] = [];
  const selectedColumns: WorktreeStackKit_OpenTuiMenuColumn[] = [];

  WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation(
    createKeyboardOptions({
      events,
      focusedColumn: "worktrees",
      keyName: "right",
      selectedColumns,
    }),
  );
  assert.deepEqual(selectedColumns, ["actions"]);
  assert.deepEqual(events, ["preventDefault", "worktrees:blur", "actions:focus"]);
});

test("OpenTUI keyboard helper escapes non-menu flows without column routing", () => {
  const events: string[] = [];
  const selectedColumns: WorktreeStackKit_OpenTuiMenuColumn[] = [];
  const options = createKeyboardOptions({
    events,
    focusedColumn: "detail",
    keyName: "escape",
    selectedColumns,
  });

  WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation({
    ...options,
    flow: "create",
  });
  assert.deepEqual(events, ["preventDefault", "goMenu"]);
  assert.deepEqual(selectedColumns, []);
});
