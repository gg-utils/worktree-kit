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

import { WorktreeStackKit_createInitialInkSwitchDraft } from "./ink-create-model.js";
import type {
  WorktreeStackKit_InkUiActionId,
  WorktreeStackKit_InkUiActionOptionState,
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiCreateDraft,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
  WorktreeStackKit_InkUiSwitchDraft,
} from "./ink-ui-contracts.js";

export type WorktreeStackKit_InkGlobalFallbackActionId = Extract<
  WorktreeStackKit_InkUiActionId,
  "list-active-realms" | "router-status" | "healthcheck"
>;

/** Config-bound action-plan builder callbacks supplied by the script adapter. */
export type WorktreeStackKit_InkActionPlanDispatcherBuilders = {
  readonly buildCheckoutStateCheckPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildCreatePlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    createDraft: WorktreeStackKit_InkUiCreateDraft,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildDestroyPlan: (
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildGlobalPlan: (
    actionId: WorktreeStackKit_InkGlobalFallbackActionId,
    inventory: WorktreeStackKit_InkUiInventory,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildMergePlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildPlatformBootstrapPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildRealmPoolNextPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildRealmPoolUtilityPlan: (
    actionId: Extract<
      WorktreeStackKit_InkUiActionId,
      "realm-pool-list" | "realm-pool-guide" | "realm-pool-prepare"
    >,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildRealmPruneStalePlan: (
    inventory: WorktreeStackKit_InkUiInventory,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildRepairPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildStartPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildSwitchInteractivePlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    switchDraft: WorktreeStackKit_InkUiSwitchDraft,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildSwitchPlan: (
    createDraft: WorktreeStackKit_InkUiCreateDraft,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildSyncLocalFilesPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildUpdateFromMainPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    selectedRecord: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
};

export type WorktreeStackKit_InkActionPlanDispatcherInput = {
  readonly actionId: WorktreeStackKit_InkUiActionId;
  readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
  readonly createDraft: WorktreeStackKit_InkUiCreateDraft;
  readonly inventory: WorktreeStackKit_InkUiInventory;
  readonly selectedRecord: WorktreeStackKit_InkUiRecord | null;
  readonly switchDraftOverrides?: Partial<WorktreeStackKit_InkUiSwitchDraft>;
};

export type WorktreeStackKit_BuildInkActionPlanOptions =
  WorktreeStackKit_InkActionPlanDispatcherInput & {
    readonly builders: WorktreeStackKit_InkActionPlanDispatcherBuilders;
  };

function WorktreeStackKit_hasInkSwitchDraftOverrides(
  switchDraftOverrides: Partial<WorktreeStackKit_InkUiSwitchDraft> | undefined,
): switchDraftOverrides is Partial<WorktreeStackKit_InkUiSwitchDraft> {
  return Object.keys(switchDraftOverrides ?? {}).length > 0;
}

/** Dispatches the selected Ink action id to the correct config-bound action-plan builder. */
export function WorktreeStackKit_buildInkActionPlan(
  options: WorktreeStackKit_BuildInkActionPlanOptions,
): WorktreeStackKit_InkUiActionRequestPlan {
  const {
    actionId,
    actionOptions,
    builders,
    createDraft,
    inventory,
    selectedRecord,
    switchDraftOverrides,
  } = options;

  if (actionId === "create") {
    return builders.buildCreatePlan(inventory, createDraft);
  }

  if (actionId === "switch") {
    if (WorktreeStackKit_hasInkSwitchDraftOverrides(switchDraftOverrides)) {
      const initialDraft = WorktreeStackKit_createInitialInkSwitchDraft();
      const mergedDraft = { ...initialDraft, ...switchDraftOverrides };
      return builders.buildSwitchInteractivePlan(
        inventory,
        selectedRecord,
        mergedDraft,
      );
    }
    return builders.buildSwitchPlan(createDraft);
  }

  if (actionId === "repair") {
    return builders.buildRepairPlan(inventory, selectedRecord, actionOptions);
  }

  if (actionId === "sync-local-files") {
    return builders.buildSyncLocalFilesPlan(
      inventory,
      selectedRecord,
      actionOptions,
    );
  }

  if (actionId === "platform-bootstrap") {
    return builders.buildPlatformBootstrapPlan(inventory);
  }

  if (actionId === "start") {
    return builders.buildStartPlan(inventory, selectedRecord, actionOptions);
  }

  if (actionId === "destroy") {
    return builders.buildDestroyPlan(selectedRecord, actionOptions);
  }

  if (actionId === "update-from-main") {
    return builders.buildUpdateFromMainPlan(
      inventory,
      selectedRecord,
      actionOptions,
    );
  }

  if (actionId === "merge") {
    return builders.buildMergePlan(inventory, selectedRecord, actionOptions);
  }

  if (actionId === "realm-pool-next") {
    return builders.buildRealmPoolNextPlan(inventory, actionOptions);
  }

  if (actionId === "realm-prune-stale") {
    return builders.buildRealmPruneStalePlan(inventory);
  }

  if (actionId === "checkout-state-check") {
    return builders.buildCheckoutStateCheckPlan(inventory, actionOptions);
  }

  if (
    actionId === "realm-pool-list" ||
    actionId === "realm-pool-guide" ||
    actionId === "realm-pool-prepare"
  ) {
    return builders.buildRealmPoolUtilityPlan(actionId);
  }

  if (
    actionId === "list-active-realms" ||
    actionId === "router-status" ||
    actionId === "healthcheck"
  ) {
    return builders.buildGlobalPlan(actionId, inventory);
  }

  return builders.buildGlobalPlan("list-active-realms", inventory);
}

/** Binds a stable builder catalog once so script adapters only pass per-request UI state. */
export function WorktreeStackKit_createInkActionPlanDispatcher(
  builders: WorktreeStackKit_InkActionPlanDispatcherBuilders,
): (
  options: WorktreeStackKit_InkActionPlanDispatcherInput,
) => WorktreeStackKit_InkUiActionRequestPlan {
  return (options) =>
    WorktreeStackKit_buildInkActionPlan({ ...options, builders });
}
