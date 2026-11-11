/**
 * @fileoverview Reusable OpenTUI action-scroll worktree-pick planning helpers.
 *
 * Package-owned worktree-pick panels consume these helpers for record-scoped pick visibility,
 * option construction, and tab-select selection plans after script adapters translate rich project
 * discovery records into minimal option rows.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI shell contracts for nav tabs, flow/phase tokens, and select-option rows that this module composes when building tab-select payloads and continue transitions.
 * @see packages/worktree-kit/src/opentui-worktree-pick-panel.tsx - OpenTUI worktree-pick panel that calls the visibility, option-builder, and selection-plan helpers exported here to drive record-scoped pick UX.
 * @see packages/worktree-kit/src/opentui-action-scroll-worktree-pick.unit.test.ts - Node `node:test` suite that locks the visibility matrix, option lists, and selection-plan branches owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_OpenTuiFlow, type WorktreeStackKit_OpenTuiPhase, type WorktreeStackKit_OpenTuiSelectOption } from "./opentui-shell-contracts.js";
/** Minimal record row consumed by package-owned worktree-pick option builders. */
export type WorktreeStackKit_OpenTuiWorktreePickRecordOption = {
    readonly description: string;
    readonly name: string;
};
/** Pure selection plan emitted by the populated worktree-pick tab-select. */
export type WorktreeStackKit_OpenTuiWorktreePickSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "quit";
} | {
    readonly type: "continue";
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
} | {
    readonly recordPickIndex: -1;
    readonly type: "manual";
} | {
    readonly recordPickIndex: number;
    readonly type: "record";
};
/** Pure selection plan emitted by the empty worktree-pick/manual-path tab-select. */
export type WorktreeStackKit_OpenTuiEmptyWorktreePickSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "quit";
} | {
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly recordPickIndex: -1;
    readonly type: "continue";
};
/** Whether the shared worktree-pick panel should render for the current flow/phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiWorktreePick(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Builds tab-select options for a populated worktree-pick list. */
export declare function WorktreeStackKit_buildOpenTuiWorktreePickOptions(options: {
    readonly records: readonly WorktreeStackKit_OpenTuiWorktreePickRecordOption[];
}): WorktreeStackKit_OpenTuiSelectOption[];
/** Builds tab-select options for an empty worktree-pick/manual-path screen. */
export declare function WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Plans state transitions for a populated worktree-pick selection. */
export declare function WorktreeStackKit_planOpenTuiWorktreePickSelection(options: {
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiWorktreePickSelectionPlan;
/** Plans state transitions for an empty worktree-pick/manual-path selection. */
export declare function WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection(options: {
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiEmptyWorktreePickSelectionPlan;
