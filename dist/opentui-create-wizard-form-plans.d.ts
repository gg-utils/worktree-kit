/**
 * @fileoverview Reusable OpenTUI create-wizard form schema and update helpers.
 *
 * The package owns field ordering, labels, select-option catalogs, default model construction from
 * explicit caller-supplied defaults, pure model update reducers, and form/preview navigation
 * planning. Package-owned OpenTUI panels consume these catalogs while script adapters keep local
 * preview helpers, process execution, and project config values such as the default base branch,
 * metadata source, and worktrees folder.
 *
 * @testing Node test runner: cd packages/worktree-kit && npx tsx --test src/opentui-create-wizard-form-plans.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow/phase types and preview-tab constants consumed here for preview visibility and create/preview navigation option wiring.
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Declares WorktreeStackKit_UiCreateFormModel that createOpenTuiCreateFormModel seeds and the apply* reducers update without I/O.
 * @see packages/worktree-kit/src/opentui-create-wizard-panels.tsx - Create wizard panels import field catalogs and planOpenTui* helpers to render rows and interpret user selections in the create flow.
 * @see packages/worktree-kit/src/opentui-create-wizard-form-plans.unit.test.ts - Node test module asserting defaults, select/text reducers, and navigation plan branches for the contracts in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_OpenTuiSelectOption } from "./opentui-shell-contracts.js";
import { type WorktreeStackKit_OpenTuiFlow, type WorktreeStackKit_OpenTuiPhase } from "./opentui-shell-contracts.js";
import type { WorktreeStackKit_UiCreateFormModel } from "./ui-command-catalog.js";
export type { WorktreeStackKit_UiCreateFormModel } from "./ui-command-catalog.js";
/** Text-input fields rendered by the OpenTUI create wizard. */
export type WorktreeStackKit_OpenTuiCreateTextFieldId = "baseBranch" | "realm" | "rootBranch" | "slot" | "stackName" | "submoduleBranch" | "worktreePathOverride" | "worktreesBase";
/** Select fields rendered by the OpenTUI create wizard. */
export type WorktreeStackKit_OpenTuiCreateSelectFieldId = "copyEnvFromMain" | "installPreferOffline" | "installSkipExisting" | "openWindsurf" | "runInstall" | "startMode";
/** Explicit project/config defaults needed to seed the package-owned create model. */
export type WorktreeStackKit_OpenTuiCreateFormDefaults = {
    readonly baseBranch: string;
    readonly metadataSource: string;
    readonly worktreesBase: string;
};
/** Explicit project/config labels needed for create text-field defaults. */
export type WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions = {
    readonly baseBranchDefaultLabel: string;
    readonly rootBranchDefaultLabel: string;
};
/** Metadata for one text-input row in the create wizard. */
export type WorktreeStackKit_OpenTuiCreateTextField = {
    readonly id: WorktreeStackKit_OpenTuiCreateTextFieldId;
    readonly label: string;
};
/** Metadata for one select row in the create wizard. */
export type WorktreeStackKit_OpenTuiCreateSelectField = {
    readonly id: WorktreeStackKit_OpenTuiCreateSelectFieldId;
    readonly label: string;
    readonly options: readonly WorktreeStackKit_OpenTuiSelectOption[];
};
/** Pure result of selecting a create-preview navigation row. */
export type WorktreeStackKit_OpenTuiCreatePreviewSelectionPlan = {
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly type: "back";
} | {
    readonly type: "ignore";
} | {
    readonly type: "run";
};
/** Pure result of selecting a create-form navigation row. */
export type WorktreeStackKit_OpenTuiCreateFormSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "preview";
} | {
    readonly type: "quit";
};
/** Builds ordered text fields for the create wizard from explicit project/default labels. */
export declare function WorktreeStackKit_buildOpenTuiCreateTextFields(options: WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions): WorktreeStackKit_OpenTuiCreateTextField[];
/** Ordered select fields for the create wizard. */
export declare const WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS: ReadonlyArray<WorktreeStackKit_OpenTuiCreateSelectField>;
/** Navigation option that advances from the create form to command preview. */
export declare const WORKTREE_STACK_KIT_OPENTUI_CREATE_CONTINUE_TAB: WorktreeStackKit_OpenTuiSelectOption;
/** Builds the continue/menu/quit selector options for the create form panel. */
export declare function WorktreeStackKit_buildOpenTuiCreateFormOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Whether the create preview should render for the current action-scroll flow/phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Builds the run/back selector options for the create preview panel. */
export declare function WorktreeStackKit_buildOpenTuiCreatePreviewOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Plans state transitions for create preview navigation. */
export declare function WorktreeStackKit_planOpenTuiCreatePreviewSelection(options: {
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiCreatePreviewSelectionPlan;
/** Plans state transitions or side-effect requests for create-form navigation. */
export declare function WorktreeStackKit_planOpenTuiCreateFormSelection(options: {
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiCreateFormSelectionPlan;
/** Seeds the create form from explicit project defaults and package-owned UI defaults. */
export declare function WorktreeStackKit_createOpenTuiCreateFormModel(defaults: WorktreeStackKit_OpenTuiCreateFormDefaults): WorktreeStackKit_UiCreateFormModel;
/** Reads a text-field value from the create form model. */
export declare function WorktreeStackKit_getOpenTuiCreateTextValue(options: {
    readonly fieldId: WorktreeStackKit_OpenTuiCreateTextFieldId;
    readonly model: WorktreeStackKit_UiCreateFormModel;
}): string;
/** Applies one text-input edit to the create form model. */
export declare function WorktreeStackKit_applyOpenTuiCreateTextChange(options: {
    readonly fieldId: WorktreeStackKit_OpenTuiCreateTextFieldId;
    readonly model: WorktreeStackKit_UiCreateFormModel;
    readonly value: string;
}): WorktreeStackKit_UiCreateFormModel;
/** Applies one select option to the create form model, ignoring unexpected option payloads. */
export declare function WorktreeStackKit_applyOpenTuiCreateSelectChange(options: {
    readonly fieldId: WorktreeStackKit_OpenTuiCreateSelectFieldId;
    readonly model: WorktreeStackKit_UiCreateFormModel;
    readonly value: string;
}): WorktreeStackKit_UiCreateFormModel;
//# sourceMappingURL=opentui-create-wizard-form-plans.d.ts.map