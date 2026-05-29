/**
 * @fileoverview Package-owned Ink admin/global task action-plan builders.
 *
 * Repair, local-state sync, platform bootstrap, realm-pool, checkout-state, router status, and
 * healthcheck actions are reusable command-planning behavior. This module owns validation and
 * request assembly while project config supplies command names, root-workspace copy, router copy,
 * and other repository-specific labels.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI inventory, action IDs, option state, and action-request plan types this module fills when assembling npm-run task plans.
 * @see packages/worktree-kit/src/ink-record-workflow-plans.ts - Record-workflow helpers reused here to emit structured Ink issues during repair and sync-local-files validation against the canonical root workspace.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-builders-admin-task-plans.ts - Root-owned adapter that injects `worktrees.config.ts` command names and copy labels into `WorktreeStackKit_createInkAdminTaskPlanBuilders` for the Ink CLI shell.
 * @see packages/worktree-kit/src/ink-admin-task-plans.unit.test.ts - Node test runner regression coverage for repair, sync-local-files, realm pool, checkout-state, and global admin plan assembly.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiActionId, WorktreeStackKit_InkUiActionOptionState, WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord } from "./ink-ui-contracts.js";
/** Explicit project-owned command and copy config for reusable admin/global task plans. */
export type WorktreeStackKit_InkAdminTaskPlanConfig = {
    readonly commandName: string;
    readonly copy: {
        readonly rootWorkspaceLabel: string;
        readonly rootWorkspaceStartCommandText: string;
        readonly routerStatusSummaryLine: string;
    };
    readonly scripts: {
        readonly checkoutStateCheck: string;
        readonly healthcheck: string;
        readonly platformBootstrap: string;
        readonly realmList: string;
        readonly realmPoolGuide: string;
        readonly realmPoolList: string;
        readonly realmPoolNext: string;
        readonly realmPoolPrepare: string;
        readonly realmPruneStale: string;
        readonly repair: string;
        readonly routerStatus: string;
        readonly syncLocalFiles: string;
    };
};
/** Bound builder set used by root adapters that only inject project command/copy config. */
export type WorktreeStackKit_InkAdminTaskPlanBuilders = {
    readonly buildCheckoutStateCheckPlan: (inventory: WorktreeStackKit_InkUiInventory, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildPlatformBootstrapPlan: (inventory: WorktreeStackKit_InkUiInventory) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRealmPoolNextPlan: (inventory: WorktreeStackKit_InkUiInventory, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRealmPoolUtilityPlan: (actionId: Extract<WorktreeStackKit_InkUiActionId, "realm-pool-guide" | "realm-pool-list" | "realm-pool-prepare">) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRealmPruneStalePlan: (inventory: WorktreeStackKit_InkUiInventory) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildRepairPlan: (inventory: WorktreeStackKit_InkUiInventory, record: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly buildSyncLocalFilesPlan: (inventory: WorktreeStackKit_InkUiInventory, record: WorktreeStackKit_InkUiRecord | null, actionOptions: WorktreeStackKit_InkUiActionOptionState) => WorktreeStackKit_InkUiActionRequestPlan;
    readonly createGlobalPlan: (actionId: Extract<WorktreeStackKit_InkUiActionId, "healthcheck" | "list-active-realms" | "router-status">, inventory: WorktreeStackKit_InkUiInventory) => WorktreeStackKit_InkUiActionRequestPlan;
};
/** Builds the repair request plan with scope and dry-run options. */
export declare function WorktreeStackKit_buildInkRepairPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Binds project command/copy config once and returns reusable admin/global plan builders. */
export declare function WorktreeStackKit_createInkAdminTaskPlanBuilders(config: WorktreeStackKit_InkAdminTaskPlanConfig): WorktreeStackKit_InkAdminTaskPlanBuilders;
/** Builds sync-local-files plan copying shared defaults into worktrees. */
export declare function WorktreeStackKit_buildInkSyncLocalFilesPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds platform install/bootstrap plan for submodules and dependencies. */
export declare function WorktreeStackKit_buildInkPlatformBootstrapPlan(options: {
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds preview plan for the next pooled realm slot on a named stack. */
export declare function WorktreeStackKit_buildInkRealmPoolNextPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds destructive prune plan for stale realm registry entries. */
export declare function WorktreeStackKit_buildInkRealmPruneStalePlan(options: {
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds git checkout-state inspection plan with optional fetch-first refresh. */
export declare function WorktreeStackKit_buildInkCheckoutStateCheckPlan(options: {
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Builds realm pool utility plans without additional validation. */
export declare function WorktreeStackKit_buildInkRealmPoolUtilityPlan(options: {
    readonly actionId: Extract<WorktreeStackKit_InkUiActionId, "realm-pool-guide" | "realm-pool-list" | "realm-pool-prepare">;
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
}): WorktreeStackKit_InkUiActionRequestPlan;
/** Central factory for realm list, router status, and healthcheck action plans. */
export declare function WorktreeStackKit_createInkGlobalPlan(options: {
    readonly actionId: Extract<WorktreeStackKit_InkUiActionId, "healthcheck" | "list-active-realms" | "router-status">;
    readonly config: WorktreeStackKit_InkAdminTaskPlanConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkUiActionRequestPlan;
//# sourceMappingURL=ink-admin-task-plans.d.ts.map