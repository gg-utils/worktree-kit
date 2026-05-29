/**
 * @fileoverview Reusable OpenTUI shell keyboard routing for worktree-stack launch surfaces.
 *
 * This module deliberately uses structural key/ref/setter contracts instead of importing React or
 * OpenTUI runtime types. Script adapters can keep framework-specific type names while package code
 * owns the generic escape-to-menu and three-column focus routing behavior.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Canonical flow and menu-column tokens this router reads when applying escape-to-menu and left/right/tab column rotation.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI session controller that forwards key events into the exported focus and column-navigation helpers owned here.
 * @see packages/worktree-kit/src/opentui-shell-keyboard.unit.test.ts - Node test runner coverage that asserts escape handling and three-column tab focus wiring for the helpers in this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiMenuColumn,
} from "./opentui-shell-contracts.js";

/** Minimal key event contract needed by package-owned OpenTUI keyboard routing. */
export type WorktreeStackKit_OpenTuiKeyEventLike = {
  readonly name: string;
  preventDefault: () => void;
};

/** Minimal focus/blur contract for tab-select controls. */
export type WorktreeStackKit_OpenTuiFocusableControl = {
  blur: () => void;
  focus: () => void;
};

/** Minimal mutable ref contract accepted from React adapters without importing React. */
export type WorktreeStackKit_OpenTuiFocusableRef = {
  readonly current: WorktreeStackKit_OpenTuiFocusableControl | null;
};

/** Keyboard routing inputs for package-owned OpenTUI column navigation. */
export type WorktreeStackKit_OpenTuiMenuKeyboardNavigationOptions = {
  readonly actionsTabRef: WorktreeStackKit_OpenTuiFocusableRef;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly goMenu: () => void;
  readonly key: WorktreeStackKit_OpenTuiKeyEventLike;
  readonly setFocusedColumn: (column: WorktreeStackKit_OpenTuiMenuColumn) => void;
  readonly worktreesTabRef: WorktreeStackKit_OpenTuiFocusableRef;
};

const WORKTREE_STACK_KIT_OPENTUI_MENU_COLUMNS: readonly WorktreeStackKit_OpenTuiMenuColumn[] = [
  "worktrees",
  "actions",
  "detail",
];

/** Blurs/focuses tab-select controls so keyboard column focus matches the active pane. */
export function WorktreeStackKit_focusOpenTuiTabsForMenuColumn(options: {
  readonly actionsTabRef: WorktreeStackKit_OpenTuiFocusableRef;
  readonly column: WorktreeStackKit_OpenTuiMenuColumn;
  readonly worktreesTabRef: WorktreeStackKit_OpenTuiFocusableRef;
}): void {
  const { actionsTabRef, column, worktreesTabRef } = options;
  if (column === "worktrees") {
    actionsTabRef.current?.blur();
    worktreesTabRef.current?.focus();
    return;
  }
  if (column === "actions") {
    worktreesTabRef.current?.blur();
    actionsTabRef.current?.focus();
    return;
  }
  worktreesTabRef.current?.blur();
  actionsTabRef.current?.blur();
}

/** Escape-to-menu plus left/right/tab column rotation for the three-column discovery menu. */
export function WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation(
  options: WorktreeStackKit_OpenTuiMenuKeyboardNavigationOptions,
): void {
  const {
    actionsTabRef,
    flow,
    focusedColumn,
    goMenu,
    key,
    setFocusedColumn,
    worktreesTabRef,
  } = options;

  if (key.name === "escape" && flow !== "menu") {
    key.preventDefault();
    goMenu();
    return;
  }
  if (flow !== "menu") return;

  const curIdx = WORKTREE_STACK_KIT_OPENTUI_MENU_COLUMNS.indexOf(focusedColumn);
  if (key.name === "left") {
    key.preventDefault();
    const next = curIdx > 0 ? curIdx - 1 : WORKTREE_STACK_KIT_OPENTUI_MENU_COLUMNS.length - 1;
    const nextCol = WORKTREE_STACK_KIT_OPENTUI_MENU_COLUMNS[next];
    setFocusedColumn(nextCol);
    WorktreeStackKit_focusOpenTuiTabsForMenuColumn({
      actionsTabRef,
      column: nextCol,
      worktreesTabRef,
    });
    return;
  }

  if (key.name === "right" || key.name === "tab") {
    key.preventDefault();
    const next = curIdx < WORKTREE_STACK_KIT_OPENTUI_MENU_COLUMNS.length - 1 ? curIdx + 1 : 0;
    const nextCol = WORKTREE_STACK_KIT_OPENTUI_MENU_COLUMNS[next];
    setFocusedColumn(nextCol);
    WorktreeStackKit_focusOpenTuiTabsForMenuColumn({
      actionsTabRef,
      column: nextCol,
      worktreesTabRef,
    });
  }
}
