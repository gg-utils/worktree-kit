/**
 * @fileoverview Regression tests for Ink action plan routing and the dispatcher adapter that binds
 * builder callbacks for the interactive worktree stack UI.
 *
 * This file owns assertions that `WorktreeStackKit_buildInkActionPlan` maps `actionId`, optional
 * `switchDraftOverrides`, and realm/global utility ids to the correct builder hooks, and that
 * `WorktreeStackKit_createInkActionPlanDispatcher` forwards the same inputs with builders closed
 * over.
 * Flow: stub builders append event tokens -> call build or dispatcher -> assert recorded builder
 * sequence.
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-action-plan-dispatcher.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-action-plan-dispatcher.ts - Production dispatcher and plan builder that map Ink menu `actionId` values to concrete `WorktreeStackKit_InkUiActionRequestPlan` payloads under test here.
 * @see packages/worktree-kit/src/ink-reducer-helpers.ts - Supplies `WorktreeStackKit_createDefaultInkActionOptions`, the default `actionOptions` object passed into every exercised plan build in this suite.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Defines the inventory, create draft, and plan shapes assembled by the local test fixtures before invoking the dispatcher under test.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildInkActionPlan,
  WorktreeStackKit_createInkActionPlanDispatcher,
  type WorktreeStackKit_InkActionPlanDispatcherBuilders,
} from "./ink-action-plan-dispatcher.js";
import { WorktreeStackKit_createDefaultInkActionOptions } from "./ink-reducer-helpers.js";
import type {
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiCreateDraft,
  WorktreeStackKit_InkUiInventory,
} from "./ink-ui-contracts.js";

function createPlan(actionId: string): WorktreeStackKit_InkUiActionRequestPlan {
  return {
    actionId: "list-active-realms",
    actionLabel: actionId,
    targetPath: null,
    executionMode: null,
    refreshOnSuccess: false,
    createContext: null,
    switchContext: null,
    summaryLines: [actionId],
    issues: [],
    request: null,
    destructiveConfirmationText: null,
    requiredConfirmationToken: null,
    retainedArtifacts: [],
  };
}

function createInventory(): WorktreeStackKit_InkUiInventory {
  return {
    projectRoot: "/repo",
    loadedAt: "2026-05-21T00:00:00.000Z",
    records: [],
    globalIssues: [],
    summary: {
      totalRecords: 0,
      managedRecords: 0,
      brokenRecords: 0,
      detachedRecords: 0,
      activeRealms: 0,
      inactiveRealms: 0,
      staleRealms: 0,
      healthyRealms: 0,
      unhealthyRealms: 0,
      healthRunAt: null,
    },
  };
}

function createCreateDraft(): WorktreeStackKit_InkUiCreateDraft {
  return {
    branchPrefix: "feature",
    stackName: "demo",
    slotInput: "1",
    baseBranch: "main",
    rootBranch: "main",
    submoduleBranch: "main",
    worktreesBase: "",
    realmSlug: "",
    worktreePathOverride: "",
    metadataSource: "",
    copyEnvFromMain: false,
    runInstall: true,
    installSkipExisting: true,
    installPreferOnline: false,
    openWindsurf: false,
    followUpStart: false,
    followUpStartOpenWindsurf: false,
  };
}

function createBuilders(events: string[]): WorktreeStackKit_InkActionPlanDispatcherBuilders {
  return {
    buildCheckoutStateCheckPlan: () => {
      events.push("checkout-state-check");
      return createPlan("checkout-state-check");
    },
    buildCreatePlan: () => {
      events.push("create");
      return createPlan("create");
    },
    buildDestroyPlan: () => {
      events.push("destroy");
      return createPlan("destroy");
    },
    buildGlobalPlan: (actionId) => {
      events.push(`global:${actionId}`);
      return createPlan(actionId);
    },
    buildMergePlan: () => {
      events.push("merge");
      return createPlan("merge");
    },
    buildPlatformBootstrapPlan: () => {
      events.push("platform-bootstrap");
      return createPlan("platform-bootstrap");
    },
    buildRealmPoolNextPlan: () => {
      events.push("realm-pool-next");
      return createPlan("realm-pool-next");
    },
    buildRealmPoolUtilityPlan: (actionId) => {
      events.push(`pool:${actionId}`);
      return createPlan(actionId);
    },
    buildRealmPruneStalePlan: () => {
      events.push("realm-prune-stale");
      return createPlan("realm-prune-stale");
    },
    buildRepairPlan: () => {
      events.push("repair");
      return createPlan("repair");
    },
    buildStartPlan: () => {
      events.push("start");
      return createPlan("start");
    },
    buildSwitchInteractivePlan: (_inventory, _record, switchDraft) => {
      events.push(`switch-interactive:${switchDraft.stackName}`);
      return createPlan("switch-interactive");
    },
    buildSwitchPlan: () => {
      events.push("switch");
      return createPlan("switch");
    },
    buildSyncLocalFilesPlan: () => {
      events.push("sync-local-files");
      return createPlan("sync-local-files");
    },
    buildUpdateFromMainPlan: () => {
      events.push("update-from-main");
      return createPlan("update-from-main");
    },
  };
}

void test("WorktreeStackKit_buildInkActionPlan routes direct action families", () => {
  const events: string[] = [];

  WorktreeStackKit_buildInkActionPlan({
    actionId: "merge",
    actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
    builders: createBuilders(events),
    createDraft: createCreateDraft(),
    inventory: createInventory(),
    selectedRecord: null,
  });

  assert.deepEqual(events, ["merge"]);
});

void test("WorktreeStackKit_buildInkActionPlan merges interactive switch overrides", () => {
  const events: string[] = [];

  WorktreeStackKit_buildInkActionPlan({
    actionId: "switch",
    actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
    builders: createBuilders(events),
    createDraft: createCreateDraft(),
    inventory: createInventory(),
    selectedRecord: null,
    switchDraftOverrides: { stackName: "stack-a" },
  });

  assert.deepEqual(events, ["switch-interactive:stack-a"]);
});

void test("WorktreeStackKit_buildInkActionPlan routes utility and global actions", () => {
  const events: string[] = [];
  const builders = createBuilders(events);

  WorktreeStackKit_buildInkActionPlan({
    actionId: "realm-pool-guide",
    actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
    builders,
    createDraft: createCreateDraft(),
    inventory: createInventory(),
    selectedRecord: null,
  });
  WorktreeStackKit_buildInkActionPlan({
    actionId: "healthcheck",
    actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
    builders,
    createDraft: createCreateDraft(),
    inventory: createInventory(),
    selectedRecord: null,
  });

  assert.deepEqual(events, ["pool:realm-pool-guide", "global:healthcheck"]);
});

void test("WorktreeStackKit_createInkActionPlanDispatcher binds builders for adapters", () => {
  const events: string[] = [];
  const buildActionPlan = WorktreeStackKit_createInkActionPlanDispatcher(
    createBuilders(events),
  );

  buildActionPlan({
    actionId: "start",
    actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
    createDraft: createCreateDraft(),
    inventory: createInventory(),
    selectedRecord: null,
  });

  assert.deepEqual(events, ["start"]);
});
