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
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiMenuColumn } from "./opentui-shell-contracts.js";
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
/** Blurs/focuses tab-select controls so keyboard column focus matches the active pane. */
export declare function WorktreeStackKit_focusOpenTuiTabsForMenuColumn(options: {
    readonly actionsTabRef: WorktreeStackKit_OpenTuiFocusableRef;
    readonly column: WorktreeStackKit_OpenTuiMenuColumn;
    readonly worktreesTabRef: WorktreeStackKit_OpenTuiFocusableRef;
}): void;
/** Escape-to-menu plus left/right/tab column rotation for the three-column discovery menu. */
export declare function WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation(options: WorktreeStackKit_OpenTuiMenuKeyboardNavigationOptions): void;
