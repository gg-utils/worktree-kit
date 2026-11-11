/**
 * @fileoverview Reusable OpenTUI shell contracts for worktree-stack launch surfaces.
 *
 * This module owns the closed-string flow/phase model, navigation tab constants, and breadcrumb
 * helpers shared by package-owned command catalogs and script-owned view components; OpenTUI
 * adapters keep project configuration and rendering glue in scripts outside this file.
 * Flow: flow/phase/pool tokens -> breadcrumb labels and tab rows -> OpenTUI panels and controllers.
 *
 * @example
 * ```typescript
 * import {
 *   WorktreeStackKit_openTuiFlowTitle,
 *   WorktreeStackKit_openTuiNavTabs,
 * } from "@gg-utils/worktree-kit/opentui-shell-contracts";
 *
 * const title = WorktreeStackKit_openTuiFlowTitle({ flow: "sync", phase: "preview" });
 * const navTabs = WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true });
 * ```
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-shell-contracts.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI shell chrome that consumes flow/phase types, preview/result tab constants, and breadcrumb helpers while rendering wizard navigation.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - Session controller that advances wizard `WorktreeStackKit_OpenTuiPhase` values against the flow tokens and tab builders exported here.
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports this module on `@gg-utils/worktree-kit` subpaths for downstream stack tooling without duplicating the contract surface.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Tab options for preview screens that offer Run vs Back navigation. */
export const WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS = [
    { description: "Execute", name: "Run", value: "run" },
    { description: "Edit inputs", name: "Back", value: "back" },
];
/** Tab options for completed run panels that return to the main menu. */
export const WORKTREE_STACK_KIT_OPENTUI_RESULT_TABS = [{ description: "Main menu", name: "Menu", value: "menu" }];
const WORKTREE_STACK_KIT_OPENTUI_FLOW_LABELS = {
    bootstrap: "Bootstrap",
    checkoutState: "Checkout State",
    create: "Create",
    destroy: "Destroy",
    diagnostics: "Diagnostics",
    menu: "Menu",
    merge: "Merge",
    pool: "Realm Pool",
    pruneStale: "Prune Stale",
    repair: "Repair",
    start: "Start",
    switch: "Switch",
    sync: "Sync",
    updateFromMain: "Update from Main",
};
const WORKTREE_STACK_KIT_OPENTUI_PHASE_LABELS = {
    confirm: "Confirm",
    form: "Form",
    pick: "Pick",
    preview: "Preview",
    result: "Result",
    running: "Running",
    submenu: "Menu",
};
/** Human-readable breadcrumb combining flow and wizard phase labels. */
export function WorktreeStackKit_openTuiFlowTitle(options) {
    const flowLabel = WORKTREE_STACK_KIT_OPENTUI_FLOW_LABELS[options.flow];
    const phaseLabel = WORKTREE_STACK_KIT_OPENTUI_PHASE_LABELS[options.phase];
    return `${flowLabel} → ${phaseLabel}`;
}
/** Supplies quit/navigation tab options appended to submenus and preview screens. */
export function WorktreeStackKit_openTuiNavTabs(options) {
    const tabs = [];
    if (options.includeMenuBack) {
        tabs.push({ description: "Return to menu", name: "Menu", value: "menu" });
    }
    tabs.push({ description: "Leave", name: "Quit", value: "quit" });
    return tabs;
}
