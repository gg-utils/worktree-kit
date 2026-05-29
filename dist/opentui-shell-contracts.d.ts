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
/** Tab-select option contract for menus and navigation chrome in OpenTUI shells. */
export type WorktreeStackKit_OpenTuiSelectOption = {
    readonly description: string;
    readonly name: string;
    readonly value: string;
};
/** Active worktree-stack subflow driving an OpenTUI action panel. */
export type WorktreeStackKit_OpenTuiFlow = "bootstrap" | "checkoutState" | "create" | "destroy" | "diagnostics" | "menu" | "merge" | "pool" | "pruneStale" | "repair" | "start" | "switch" | "sync" | "updateFromMain";
/** Wizard step within a subflow (pick → form → preview → run/result). */
export type WorktreeStackKit_OpenTuiPhase = "confirm" | "form" | "pick" | "preview" | "result" | "running" | "submenu";
/** Realm-pool submenu variant driving which configured command is previewed. */
export type WorktreeStackKit_OpenTuiPoolKind = "guide" | "list" | "next" | "prepare";
/** Which clipboard summary column flashes after a successful copy. */
export type WorktreeStackKit_OpenTuiCopyFlash = "worktrees" | "detail" | "actions" | "issues" | null;
/** Menu shell keyboard-navigation column. */
export type WorktreeStackKit_OpenTuiMenuColumn = "worktrees" | "detail" | "actions";
/** Action row extending a select option with a disabled guard for unavailable flows. */
export type WorktreeStackKit_OpenTuiMenuOption = WorktreeStackKit_OpenTuiSelectOption & {
    readonly disabled?: boolean;
};
/** Tab options for preview screens that offer Run vs Back navigation. */
export declare const WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS: ReadonlyArray<WorktreeStackKit_OpenTuiSelectOption>;
/** Tab options for completed run panels that return to the main menu. */
export declare const WORKTREE_STACK_KIT_OPENTUI_RESULT_TABS: ReadonlyArray<WorktreeStackKit_OpenTuiSelectOption>;
/** Human-readable breadcrumb combining flow and wizard phase labels. */
export declare function WorktreeStackKit_openTuiFlowTitle(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): string;
/** Supplies quit/navigation tab options appended to submenus and preview screens. */
export declare function WorktreeStackKit_openTuiNavTabs(options: {
    readonly includeMenuBack: boolean;
}): WorktreeStackKit_OpenTuiSelectOption[];
//# sourceMappingURL=opentui-shell-contracts.d.ts.map