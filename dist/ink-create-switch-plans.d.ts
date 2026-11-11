/**
 * @fileoverview Package-owned Ink create/switch action-plan builders.
 *
 * This module owns reusable create-worktree and switch action validation, summary construction,
 * command argv assembly, and interactive switch preview planning. Project adapters supply resolved
 * create drafts, command names, branch-prefix defaults, editor flags, and slot-port preview labels
 * through explicit config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI contracts for drafts, inventory, issues, and action request plans that this module assembles into argv-backed create and switch previews.
 * @see packages/worktree-kit/src/ink-record-workflow-plans.ts - Workflow issue factory used when validation surfaces blocking errors and warnings attached to the returned action plans.
 * @see packages/worktree-kit/src/ink-create-resolution.ts - Resolved create-draft shape adapters combine with config here to derive create argv, summaries, and slot-derived port preview lines.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiCreateDraft, WorktreeStackKit_InkUiCreateRequestContext, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord, WorktreeStackKit_InkUiSwitchDraft } from "./ink-ui-contracts.js";
import type { WorktreeStackKit_InkResolvedCreateDraft } from "./ink-create-resolution.js";
/** One label/value pair in a slot-derived port preview. */
export type WorktreeStackKit_InkCreateSlotPortPreview = {
    readonly label: string;
    readonly value: number;
};
/** Explicit project-owned command, copy, and slot-preview config for create/switch plans. */
export type WorktreeStackKit_InkCreateSwitchPlanConfig = {
    readonly commandName: string;
    readonly copy: {
        readonly editorOpenSummaryLabel: string;
        readonly envCopySummaryLabel: string;
        readonly startEnvironmentSummaryLabel: string;
    };
    readonly defaultBranchPrefix: string;
    readonly deriveSlotPortPreview: (slot: number) => readonly WorktreeStackKit_InkCreateSlotPortPreview[];
    readonly flags: {
        readonly copyEnvFromMain: string;
        readonly createBaseBranch: string;
        readonly createInstall: string;
        readonly createInstallPreferOnline: string;
        readonly createInstallSkipExisting: string;
        readonly createMetadataSource: string;
        readonly createName: string;
        readonly createNoInstall: string;
        readonly createOpenEditor: string | null;
        readonly createPrefix: string;
        readonly createRealm: string;
        readonly createRootBranch: string;
        readonly createSlot: string;
        readonly createSubmoduleBranch: string;
        readonly createWorktreePath: string;
        readonly createWorktreesBase: string;
        readonly switchName: string;
        readonly switchPrefix: string;
        readonly switchSlot: string;
    };
    readonly scripts: {
        readonly create: string;
        readonly switch: string;
    };
};
/** Bound create/switch builder dependencies supplied by project adapters. */
export type WorktreeStackKit_InkCreateSwitchPlanBuilderConfig = {
    readonly buildCreateContext: (resolvedDraft: WorktreeStackKit_InkResolvedCreateDraft) => WorktreeStackKit_InkUiCreateRequestContext | null;
    readonly config: WorktreeStackKit_InkCreateSwitchPlanConfig;
    readonly resolveCreateDraft: (options: {
        readonly draft: WorktreeStackKit_InkUiCreateDraft;
        readonly inventory: WorktreeStackKit_InkUiInventory;
    }) => WorktreeStackKit_InkResolvedCreateDraft;
};
/** Bound builder set used by root adapters that only inject project config and draft resolution. */
export type WorktreeStackKit_InkCreateSwitchPlanBuilders = {
    readonly buildCreatePlan: (inventory: WorktreeStackKit_InkUiInventory, createDraft: WorktreeStackKit_InkUiCreateDraft) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildSwitchInteractivePlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, switchDraft: WorktreeStackKit_InkUiSwitchDraft) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildSwitchPlan: (createDraft: WorktreeStackKit_InkUiCreateDraft) => WorktreeStackKit_InkUiActionRequestPlan;
};
/** Builds forwarded argv for create from a validated context plus resolved draft flags. */
export declare function WorktreeStackKit_buildInkCreateCommandArgs(options: {
    readonly config: WorktreeStackKit_InkCreateSwitchPlanConfig;
    readonly createContext: WorktreeStackKit_InkUiCreateRequestContext;
    readonly resolvedDraft: WorktreeStackKit_InkResolvedCreateDraft;
}): string[];
/** Builds create-worktree plan from resolved draft plus derived slot port preview. */
export declare function WorktreeStackKit_buildInkCreatePlan(options: {
    readonly config: WorktreeStackKit_InkCreateSwitchPlanConfig;
    readonly createContext: WorktreeStackKit_InkUiCreateRequestContext | null;
    readonly resolvedDraft: WorktreeStackKit_InkResolvedCreateDraft;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Binds project config/draft resolution once and returns create/switch plan builders. */
export declare function WorktreeStackKit_createInkCreateSwitchPlanBuilders(builderConfig: WorktreeStackKit_InkCreateSwitchPlanBuilderConfig): WorktreeStackKit_InkCreateSwitchPlanBuilders;
/** Builds branch-prefix plus stack-name switch plan from create-draft form fields. */
export declare function WorktreeStackKit_buildInkSwitchPlan(options: {
    readonly config: WorktreeStackKit_InkCreateSwitchPlanConfig;
    readonly createDraft: WorktreeStackKit_InkUiCreateDraft;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds interactive switch preview using selected record plus switch draft overrides. */
export declare function WorktreeStackKit_buildInkSwitchInteractivePlan(options: {
    readonly config: WorktreeStackKit_InkCreateSwitchPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly selectedRecord: WorktreeStackKit_InkUiRecord | null;
    readonly switchDraft: WorktreeStackKit_InkUiSwitchDraft;
}): WorktreeStackKit_InkUiActionRequestPlan;
