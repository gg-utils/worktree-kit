/**
 * @fileoverview Reusable Ink action-plan dispatcher for worktree terminal UIs.
 *
 * Domain adapters provide config-bound plan builders for each action family. This package owns the
 * product-neutral routing from a selected Ink action id plus current inventory/form state into the
 * correct action-plan builder, including interactive switch-draft override merging and a bound
 * dispatcher factory for tiny script adapters.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-action-plan-dispatcher.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Canonical Ink action ids, inventory, drafts, and action-request plan types consumed and returned by every dispatcher branch.
 * @see packages/worktree-kit/src/ink-create-model.ts - Initial switch-draft factory whose output is merged with optional overrides before the interactive switch builder runs.
 * @see scripts/worktree-stack/ui/cli-ink/builders.ts - Project Ink CLI adapter that wires concrete plan builders into WorktreeStackKit_createInkActionPlanDispatcher for runtime menus.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiActionId, WorktreeStackKit_InkUiActionOptionState, WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiCreateDraft, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord, WorktreeStackKit_InkUiSwitchDraft } from "./ink-ui-contracts.js";
export type WorktreeStackKit_InkGlobalFallbackActionId = Extract<WorktreeStackKit_InkUiActionId, "list-active-realms" | "router-status" | "healthcheck">;
/** Config-bound action-plan builder callbacks supplied by the script adapter. */
export type WorktreeStackKit_InkActionPlanDispatcherBuilders = {
    readonly buildCheckoutStateCheckPlan: (inventory: WorktreeStackKit_InkUiInventory, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildCreatePlan: (inventory: WorktreeStackKit_InkUiInventory, createDraft: WorktreeStackKit_InkUiCreateDraft) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildDestroyPlan: (selectedRecord: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildGlobalPlan: (actionId: WorktreeStackKit_InkGlobalFallbackActionId, inventory: WorktreeStackKit_InkUiInventory) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildMergePlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildPlatformBootstrapPlan: (inventory: WorktreeStackKit_InkUiInventory) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRealmPoolNextPlan: (inventory: WorktreeStackKit_InkUiInventory, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRealmPoolUtilityPlan: (actionId: Extract<WorktreeStackKit_InkUiActionId, "realm-pool-list" | "realm-pool-guide" | "realm-pool-prepare">) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRealmPruneStalePlan: (inventory: WorktreeStackKit_InkUiInventory) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRepairPlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildStartPlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildSwitchInteractivePlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, switchDraft: WorktreeStackKit_InkUiSwitchDraft) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildSwitchPlan: (createDraft: WorktreeStackKit_InkUiCreateDraft) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildSyncLocalFilesPlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildUpdateFromMainPlan: (inventory: WorktreeStackKit_InkUiInventory, selectedRecord: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
};
export type WorktreeStackKit_InkActionPlanDispatcherInput = {
    readonly actionId: WorktreeStackKit_InkUiActionId;
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly createDraft: WorktreeStackKit_InkUiCreateDraft;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly selectedRecord: WorktreeStackKit_InkUiRecord | null;
    readonly switchDraftOverrides?: Partial<WorktreeStackKit_InkUiSwitchDraft>;
};
export type WorktreeStackKit_BuildInkActionPlanOptions = WorktreeStackKit_InkActionPlanDispatcherInput & {
    readonly builders: WorktreeStackKit_InkActionPlanDispatcherBuilders;
};
/** Dispatches the selected Ink action id to the correct config-bound action-plan builder. */
export declare function WorktreeStackKit_buildInkActionPlan(options: WorktreeStackKit_BuildInkActionPlanOptions): WorktreeStackKit_InkUiActionRequestPlan;
/** Binds a stable builder catalog once so script adapters only pass per-request UI state. */
export declare function WorktreeStackKit_createInkActionPlanDispatcher(builders: WorktreeStackKit_InkActionPlanDispatcherBuilders): (options: WorktreeStackKit_InkActionPlanDispatcherInput) => WorktreeStackKit_InkUiActionRequestPlan;
//# sourceMappingURL=ink-action-plan-dispatcher.d.ts.map