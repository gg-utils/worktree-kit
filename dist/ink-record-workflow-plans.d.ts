/**
 * @fileoverview Package-owned Ink record workflow action-plan builders.
 *
 * Start, destroy, update-from-main, and merge previews are reusable command-planning behavior. This
 * module validates the selected worktree record, constructs task/runtime requests, records retained
 * artifact hints, and leaves project-specific npm script names, target branch labels, editor labels,
 * and log/temp artifact paths behind an explicit config object supplied by script adapters.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Ink inventory, record, action-option, and action-request-plan contracts this module fills when building validated npm task and runtime requests.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-builders-record-workflow-plans.ts - consumer script adapter that supplies command names, copy labels, branch targets, and artifact path templates to the bound builders re-exported from here.
 * @see packages/worktree-kit/src/ink-record-workflow-plans.unit.test.ts - node:test regression file exercising merge, update-from-main, start, and destroy plan shapes owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiActionOptionState, WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiIssue, WorktreeStackKit_InkUiRecord, WorktreeStackKit_InkUiRetainedArtifact } from "./ink-ui-contracts.js";
/** Template for retained artifacts associated with a start-runtime plan. */
export type WorktreeStackKit_InkRecordWorkflowRetainedArtifactTemplate = {
    readonly id: string;
    readonly label: string;
    readonly relativePathTemplate: string;
};
/** Explicit project-owned command and copy config for reusable record workflow plans. */
export type WorktreeStackKit_InkRecordWorkflowPlanConfig = {
    readonly commandName: string;
    readonly copy: {
        readonly canonicalRootContextSuggestionText: string;
        readonly canonicalRootStartCommandText: string;
        readonly editorOpenSummaryLabel: string;
        readonly rootWorkspaceLabel: string;
        readonly targetBranchDisplayName: string;
    };
    readonly scripts: {
        readonly destroy: string;
        readonly merge: string;
        readonly openEditorOnStartFlag: string | null;
        readonly start: string;
        readonly updateFromMain: string;
    };
    readonly startRetainedArtifacts: readonly WorktreeStackKit_InkRecordWorkflowRetainedArtifactTemplate[];
    readonly targetBranchName: string;
    readonly temporaryArtifactRootRelativePaths: {
        readonly merge: string;
        readonly updateFromMain: string;
    };
};
/** Bound builder set used by root adapters that only inject project command/copy config. */
export type WorktreeStackKit_InkRecordWorkflowPlanBuilders = {
    readonly buildDestroyPlan: (record: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildMergePlan: (inventory: WorktreeStackKit_InkUiInventory, record: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildStartPlan: (inventory: WorktreeStackKit_InkUiInventory, record: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildUpdateFromMainPlan: (inventory: WorktreeStackKit_InkUiInventory, record: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
};
/** Builds a typed UI issue struct for preview panels and command gating. */
export declare function WorktreeStackKit_createInkRecordWorkflowIssue(code: string, severity: WorktreeStackKit_InkUiIssue["severity"], message: string): WorktreeStackKit_InkUiIssue;
/** Human-readable git branch label from a worktree record. */
export declare function WorktreeStackKit_getInkRecordWorkflowBranchLabel(record: WorktreeStackKit_InkUiRecord | null): string;
/** Resolves the stack display label for summaries and issue copy. */
export declare function WorktreeStackKit_getInkRecordWorkflowStackLabel(record: WorktreeStackKit_InkUiRecord | null): string;
/** Resolves realm slug label for summaries and issue copy. */
export declare function WorktreeStackKit_getInkRecordWorkflowRealmLabel(record: WorktreeStackKit_InkUiRecord | null): string;
/** True when the inventory row is the canonical root checkout. */
export declare function WorktreeStackKit_isCanonicalRootWorkspaceRecord(record: WorktreeStackKit_InkUiRecord): boolean;
/** Lists retained artifacts related to start-environment flows. */
export declare function WorktreeStackKit_buildInkStartRetainedArtifacts(options: {
    readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiRetainedArtifact[];
/** Root directory for transient merge or update-from-main artifacts. */
export declare function WorktreeStackKit_buildInkRecordWorkflowTempArtifactRoot(options: {
    readonly category: "merge" | "update-from-main";
    readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): string;
/** Builds start-environment request for a selected prepared worktree. */
export declare function WorktreeStackKit_buildInkStartPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Binds project command/copy config once and returns record workflow plan builders. */
export declare function WorktreeStackKit_createInkRecordWorkflowPlanBuilders(config: WorktreeStackKit_InkRecordWorkflowPlanConfig): WorktreeStackKit_InkRecordWorkflowPlanBuilders;
/** Builds destructive worktree delete plan with optional git prune. */
export declare function WorktreeStackKit_buildInkDestroyPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds update-from-main plan with live vs temp modes and plan vs push execution. */
export declare function WorktreeStackKit_buildInkUpdateFromMainPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds merge-to-target plan with plan-only vs push and root-checkout drift warnings. */
export declare function WorktreeStackKit_buildInkMergePlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan;
