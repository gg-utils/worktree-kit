/**
 * @fileoverview Reusable OpenTUI action-scroll npm preview planners.
 *
 * Package-owned OpenTUI npm panels consume these pure helpers for command-preview
 * assembly, confirmation token policy, enum parsing, and preview/confirm selection planning in
 * record-scoped workflows.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-npm-plans.unit.test.ts
 * @see packages/worktree-kit/src/ui-command-catalog.ts - UI npm script forwarded-arg builders and command preview formatter composed here into typed npm-run preview plans for worktrees stack scripts.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow, phase, pool-kind, and nav-tab contracts consumed when preview and confirm tab selections resolve to navigation or phase transitions.
 * @see packages/worktree-kit/src/opentui-npm-panels.tsx - OpenTUI npm preview and confirm panels that import these pure planners to assemble scrollable command-preview and token-guarded confirm flows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_UiExecutionMode, type WorktreeStackKit_UiUpdateMode } from "./ui-command-catalog.js";
import { type WorktreeStackKit_OpenTuiFlow, type WorktreeStackKit_OpenTuiPhase, type WorktreeStackKit_OpenTuiPoolKind, type WorktreeStackKit_OpenTuiSelectOption } from "./opentui-shell-contracts.js";
type WorktreeStackKit_OpenTuiOptionList = WorktreeStackKit_OpenTuiSelectOption[];
/** Generic npm-run plan applied by OpenTUI action-scroll script adapters. */
export type WorktreeStackKit_OpenTuiNpmRunPreviewPlan = {
    readonly commandPreview: string;
    readonly forwarded: string[];
    readonly requiredConfirmToken: string | null;
    readonly script: string;
};
/** Pure result of selecting an action in a generic npm preview panel. */
export type WorktreeStackKit_OpenTuiNpmPreviewSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "quit";
} | {
    readonly type: "run";
} | {
    readonly type: "confirm";
} | {
    readonly clearConfirmTokenInput: boolean;
    readonly clearPendingRun: boolean;
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly type: "back";
};
/** Pure result of selecting an action in the guarded npm confirm panel. */
export type WorktreeStackKit_OpenTuiNpmConfirmSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "quit";
} | {
    readonly type: "back";
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
} | {
    readonly clearFormError: boolean;
    readonly type: "run";
} | {
    readonly message: string;
    readonly type: "validation-error";
};
/** Tab options for worktree update mode selection. */
export declare const WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS: ReadonlyArray<WorktreeStackKit_OpenTuiSelectOption>;
/** Tab options for plan-vs-push execution selection. */
export declare const WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS: ReadonlyArray<WorktreeStackKit_OpenTuiSelectOption>;
/** Builds tab-select options for the generic npm preview panel. */
export declare function WorktreeStackKit_buildOpenTuiNpmPreviewOptions(options: {
    readonly requiresConfirmToken: boolean;
}): WorktreeStackKit_OpenTuiOptionList;
/** Builds tab-select options for the guarded npm confirmation panel. */
export declare function WorktreeStackKit_buildOpenTuiNpmConfirmOptions(): (WorktreeStackKit_OpenTuiOptionList);
/** Parses tab-select values into the reusable update mode union. */
export declare function WorktreeStackKit_parseOpenTuiUpdateMode(value: string | undefined): WorktreeStackKit_UiUpdateMode | null;
/** Parses tab-select values into the reusable execution mode union. */
export declare function WorktreeStackKit_parseOpenTuiExecutionMode(value: string | undefined): WorktreeStackKit_UiExecutionMode | null;
/** Plans non-render side effects for the generic npm preview panel. */
export declare function WorktreeStackKit_planOpenTuiNpmPreviewSelection(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly optionValue: string | undefined;
    readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
    readonly requiresConfirmToken: boolean;
}): WorktreeStackKit_OpenTuiNpmPreviewSelectionPlan;
/** Plans non-render side effects for the guarded npm confirmation panel. */
export declare function WorktreeStackKit_planOpenTuiNpmConfirmSelection(options: {
    readonly confirmTokenInput: string;
    readonly optionValue: string | undefined;
    readonly requiredConfirmToken: string;
}): WorktreeStackKit_OpenTuiNpmConfirmSelectionPlan;
/** Builds the preview plan for `worktrees:start`. */
export declare function WorktreeStackKit_planOpenTuiStartNpmPreview(options: {
    readonly openWindsurf: boolean;
    readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
/** Builds the preview plan for `worktrees:destroy`. */
export declare function WorktreeStackKit_planOpenTuiDestroyNpmPreview(options: {
    readonly prune: boolean;
    readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
/** Builds the preview plan for `worktrees:update-from-main`. */
export declare function WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview(options: {
    readonly executionMode: WorktreeStackKit_UiExecutionMode;
    readonly targetBranch: string;
    readonly updateMode: WorktreeStackKit_UiUpdateMode;
    readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
/** Builds the preview plan for `worktrees:merge`. */
export declare function WorktreeStackKit_planOpenTuiMergeNpmPreview(options: {
    readonly executionMode: WorktreeStackKit_UiExecutionMode;
    readonly targetBranch: string;
    readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
export {};
