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
function WorktreeStackKit_hasInkSwitchDraftOverrides(switchDraftOverrides) {
    return Object.keys(switchDraftOverrides ?? {}).length > 0;
}
/** Dispatches the selected Ink action id to the correct config-bound action-plan builder. */
export function WorktreeStackKit_buildInkActionPlan(options) {
    const { actionId, actionOptions, builders, createDraft, inventory, selectedRecord, switchDraftOverrides, } = options;
    if (actionId === "create") {
        return builders.buildCreatePlan(inventory, createDraft);
    }
    if (actionId === "switch") {
        if (WorktreeStackKit_hasInkSwitchDraftOverrides(switchDraftOverrides)) {
            const initialDraft = WorktreeStackKit_createInitialInkSwitchDraft();
            const mergedDraft = { ...initialDraft, ...switchDraftOverrides };
            return builders.buildSwitchInteractivePlan(inventory, selectedRecord, mergedDraft);
        }
        return builders.buildSwitchPlan(createDraft);
    }
    if (actionId === "repair") {
        return builders.buildRepairPlan(inventory, selectedRecord, actionOptions);
    }
    if (actionId === "sync-local-files") {
        return builders.buildSyncLocalFilesPlan(inventory, selectedRecord, actionOptions);
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
        return builders.buildUpdateFromMainPlan(inventory, selectedRecord, actionOptions);
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
    if (actionId === "realm-pool-list" ||
        actionId === "realm-pool-guide" ||
        actionId === "realm-pool-prepare") {
        return builders.buildRealmPoolUtilityPlan(actionId);
    }
    if (actionId === "list-active-realms" ||
        actionId === "router-status" ||
        actionId === "healthcheck") {
        return builders.buildGlobalPlan(actionId, inventory);
    }
    return builders.buildGlobalPlan("list-active-realms", inventory);
}
/** Binds a stable builder catalog once so script adapters only pass per-request UI state. */
export function WorktreeStackKit_createInkActionPlanDispatcher(builders) {
    return (options) => WorktreeStackKit_buildInkActionPlan({ ...options, builders });
}
//# sourceMappingURL=ink-action-plan-dispatcher.js.map