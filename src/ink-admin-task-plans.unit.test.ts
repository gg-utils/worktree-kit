/**
 * @fileoverview Verifies WorktreeStackKit Ink admin task plan builders map UI fixtures into npm-run
 * request args, issue codes, and summary copy for prepared-worktree versus root guardrails.
 *
 * This file owns regression coverage for repair and sync-local-files script wiring, realm pool and
 * checkout-state checks, global health routing, and the adapter-safe builder factory.
 * Flow: fixture config + records/inventory -> call plan builders -> assert request args, issues,
 * and summary lines derived from project copy overrides.
 *
 * @testing Node test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-admin-task-plans.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-admin-task-plans.ts - Plan builder functions and config types under test that translate Ink admin selections into npm-run-style requests plus issue codes.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI record, inventory, and action-option contracts used by the fixtures when exercising those builders.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-builders-admin-task-plans.ts - Root Ink CLI adapter that injects worktrees.config.ts script names and user-facing copy into WorktreeStackKit_createInkAdminTaskPlanBuilders for the interactive shell.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_buildInkCheckoutStateCheckPlan,
  WorktreeStackKit_buildInkRealmPoolNextPlan,
  WorktreeStackKit_buildInkRepairPlan,
  WorktreeStackKit_buildInkSyncLocalFilesPlan,
  WorktreeStackKit_createInkAdminTaskPlanBuilders,
  WorktreeStackKit_createInkGlobalPlan,
  type WorktreeStackKit_InkAdminTaskPlanConfig,
} from "./ink-admin-task-plans.js";
import type {
  WorktreeStackKit_InkUiActionOptionState,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";

const config: WorktreeStackKit_InkAdminTaskPlanConfig = {
  commandName: "tool",
  copy: {
    rootWorkspaceLabel: "root workspace",
    rootWorkspaceStartCommandText: "tool root:start",
    routerStatusSummaryLine: "Check router status",
  },
  scripts: {
    checkoutStateCheck: "workspace:state",
    healthcheck: "edge:health",
    platformBootstrap: "platform:bootstrap",
    realmList: "realm:list",
    realmPoolGuide: "realm:pool:guide",
    realmPoolList: "realm:pool:list",
    realmPoolNext: "realm:pool:next",
    realmPoolPrepare: "realm:pool:prepare",
    realmPruneStale: "realm:prune",
    repair: "workspace:repair",
    routerStatus: "edge:router:status",
    syncLocalFiles: "workspace:sync-local",
  },
};

function baseActionOptions(
  overrides: Partial<WorktreeStackKit_InkUiActionOptionState> = {},
): WorktreeStackKit_InkUiActionOptionState {
  return {
    mergeExecutionMode: "plan",
    openWindsurfOnStart: false,
    poolNextStackName: "",
    pruneAfterDestroy: false,
    repairDryRun: false,
    repairIncludePackageEnv: false,
    repairLegacyPackageEnvAlias: false,
    repairScope: "all-prepared",
    stateCheckFetch: false,
    syncScope: "all-discovered",
    updateFromMainExecutionMode: "plan",
    updateFromMainMode: "live-worktree",
    ...overrides,
  };
}

function createRecord(
  overrides: Partial<WorktreeStackKit_InkUiRecord> = {},
): WorktreeStackKit_InkUiRecord {
  return {
    branchRef: "refs/heads/feature/example",
    checkoutKind: "prepared-worktree",
    currentCheckout: false,
    detached: false,
    handbook: null,
    handbookMarkdownExists: true,
    handbookMarkdownPath: "/workspace/WORKTREE.local.md",
    head: "abc123",
    healthSummary: null,
    issues: [],
    label: "example",
    metadata: null,
    onboardingMarkdownExists: true,
    onboardingMarkdownPath: "/workspace/WORKTREE.readme.md",
    realmRecord: null,
    temporaryMerge: false,
    worktreePath: "/workspace/example",
    ...overrides,
  };
}

function createInventory(): WorktreeStackKit_InkUiInventory {
  return {
    globalIssues: [],
    loadedAt: "2026-05-21T00:00:00.000Z",
    projectRoot: "/workspace/root",
    records: [],
    summary: {
      activeRealms: 2,
      brokenRecords: 0,
      detachedRecords: 0,
      healthRunAt: "2026-05-21T00:00:00.000Z",
      healthyRealms: 1,
      inactiveRealms: 0,
      managedRecords: 0,
      staleRealms: 1,
      totalRecords: 3,
      unhealthyRealms: 1,
    },
  };
}

describe("WorktreeStackKit Ink admin task plans", () => {
  it("builds repair and sync args from configured scripts", () => {
    const record = createRecord();
    const repairPlan = WorktreeStackKit_buildInkRepairPlan({
      actionOptions: baseActionOptions({
        repairDryRun: true,
        repairIncludePackageEnv: true,
        repairLegacyPackageEnvAlias: true,
        repairScope: "selected-record",
      }),
      config,
      record,
    });

    assert.deepEqual(repairPlan.request?.args, [
      "run",
      "workspace:repair",
      "--",
      "--dry-run",
      "--include-package-env",
      "--package-env-mode",
      "missing-only",
      "--worktree",
      "/workspace/example",
    ]);

    const syncPlan = WorktreeStackKit_buildInkSyncLocalFilesPlan({
      actionOptions: baseActionOptions({ syncScope: "selected-record" }),
      config,
      inventory: createInventory(),
      record,
    });
    assert.deepEqual(syncPlan.request?.args, [
      "run",
      "workspace:sync-local",
      "--",
      "--source-workspace",
      "/workspace/root",
      "--worktree",
      "/workspace/example",
    ]);
  });

  it("blocks root-scoped repair through project copy", () => {
    const plan = WorktreeStackKit_buildInkRepairPlan({
      actionOptions: baseActionOptions({ repairScope: "selected-record" }),
      config,
      record: createRecord({ checkoutKind: "canonical-root-workspace" }),
    });

    assert.equal(plan.request, null);
    assert.equal(plan.issues[0]?.code, "canonical-root-workspace");
    assert.match(plan.issues[0]?.message ?? "", /tool root:start/u);
  });

  it("builds pool, checkout-state, and global plans from config", () => {
    const poolPlan = WorktreeStackKit_buildInkRealmPoolNextPlan({
      actionOptions: baseActionOptions({ poolNextStackName: "example" }),
      config,
      inventory: createInventory(),
    });
    assert.deepEqual(poolPlan.request?.args, [
      "run",
      "realm:pool:next",
      "--",
      "--stack-name",
      "example",
    ]);

    const statePlan = WorktreeStackKit_buildInkCheckoutStateCheckPlan({
      actionOptions: baseActionOptions({ stateCheckFetch: true }),
      config,
      inventory: createInventory(),
    });
    assert.deepEqual(statePlan.request?.args, [
      "run",
      "workspace:state",
      "--",
      "--fetch",
    ]);

    const globalPlan = WorktreeStackKit_createInkGlobalPlan({
      actionId: "healthcheck",
      config,
      inventory: createInventory(),
    });
    assert.deepEqual(globalPlan.request?.args, ["run", "edge:health"]);
    assert.equal(globalPlan.issues[0]?.code, "unhealthy-realms-present");
  });

  it("binds config into an adapter-safe builder set", () => {
    const builders = WorktreeStackKit_createInkAdminTaskPlanBuilders(config);
    const plan = builders.createGlobalPlan("router-status", createInventory());

    assert.deepEqual(plan.request?.args, ["run", "edge:router:status"]);
    assert.equal(plan.summaryLines[0], "Check router status");
  });
});
