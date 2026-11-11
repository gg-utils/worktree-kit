/**
 * @fileoverview Reusable OpenTUI main-menu availability and action-selection planning.
 *
 * Script adapters translate project inventory and framework events into these package-owned pure
 * helpers. The package owns stable flow prerequisites, disabled-row rendering, and flow/phase
 * routing while callers retain process termination, refs, and React/OpenTUI state setters.
 *
 * @testing CLI: cd packages/worktree-kit && npm run test -- src/opentui-shell-menu-actions.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow, column, phase, and menu-row contracts referenced when planned selections transition away from the main menu.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Shell renderer that feeds tab-select values into the planners here and applies the resulting flow transitions beside this module.
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.unit.test.ts - Node:test unit module covering catalog-driven availability gating, strikethrough labels, and guarded selection planning for exports in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiMenuColumn, WorktreeStackKit_OpenTuiMenuOption, WorktreeStackKit_OpenTuiPhase } from "./opentui-shell-contracts.js";
/** Menu option value accepted from OpenTUI tab-select rows. */
export type WorktreeStackKit_OpenTuiMenuActionValue = Exclude<WorktreeStackKit_OpenTuiFlow, "menu"> | "quit";
/** Availability facts derived by project adapters from their richer inventory models. */
export type WorktreeStackKit_OpenTuiMenuAvailability = {
    readonly hasRealms: boolean;
    readonly hasRecords: boolean;
    readonly hasSelectedRecord: boolean;
};
/** Pure result of selecting a main-menu row before script adapters apply side effects. */
export type WorktreeStackKit_OpenTuiMenuSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "quit";
} | {
    readonly flow: Exclude<WorktreeStackKit_OpenTuiFlow, "menu">;
    readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly resetRunArtifacts: boolean;
    readonly type: "transition";
};
/** Applies Unicode combining long stroke overlay for unavailable menu labels. */
export declare function WorktreeStackKit_applyOpenTuiStrikethrough(text: string): string;
/** Builds main-menu action options, striking through entries when prerequisites are missing. */
export declare function WorktreeStackKit_buildOpenTuiMenuOptions(options: {
    readonly availability: WorktreeStackKit_OpenTuiMenuAvailability;
}): WorktreeStackKit_OpenTuiMenuOption[];
/** Plans the side effects a script adapter should apply for a selected main-menu option. */
export declare function WorktreeStackKit_planOpenTuiMenuActionSelection(options: {
    readonly availability: WorktreeStackKit_OpenTuiMenuAvailability;
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiMenuSelectionPlan;
