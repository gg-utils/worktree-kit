/**
 * @fileoverview Verifies WorktreeStackKit Ink record workflow plan builders map inventory records and
 * action options into npm-run request args, retained artifact paths, summary lines, and guardrail
 * issues for start, update-from-main, and merge flows.
 *
 * This file owns regression coverage for canonical-root start blocking, configured script wiring,
 * temporary artifact roots, and the adapter-safe builder factory that closes over project config.
 * Flow: fixture config + records/inventory -> call plan builders -> assert request args, retained
 * paths, confirmation tokens, and issue codes.
 *
 * @testing Node test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-record-workflow-plans.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-record-workflow-plans.ts - Plan builder functions and config types under test that translate Ink record selections into npm-run-style requests plus retained-artifact hints.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI record, inventory, and action-option contracts used by the fixtures when exercising those builders.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-builders-record-workflow-plans.ts - Root Ink CLI adapter that injects worktrees.config.ts script names, branch labels, and artifact path templates into the bound builders re-exported from the implementation module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_buildInkMergePlan,
  WorktreeStackKit_buildInkStartPlan,
  WorktreeStackKit_buildInkUpdateFromMainPlan,
  WorktreeStackKit_createInkRecordWorkflowPlanBuilders,
  type WorktreeStackKit_InkRecordWorkflowPlanConfig,
} from "./ink-record-workflow-plans.js";
import type {
  WorktreeStackKit_InkUiActionOptionState,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";

const config: WorktreeStackKit_InkRecordWorkflowPlanConfig = {
  commandName: "tool",
  copy: {
    canonicalRootContextSuggestionText: "Refresh root context before starting.",
    canonicalRootStartCommandText: "tool run root:start",
    editorOpenSummaryLabel: "Open editor",
    rootWorkspaceLabel: "root workspace",
    targetBranchDisplayName: "Stable",
  },
  scripts: {
    destroy: "workspace:destroy",
    merge: "workspace:merge",
    openEditorOnStartFlag: "--open-editor",
    start: "workspace:start",
    updateFromMain: "workspace:update",
  },
  startRetainedArtifacts: [
    {
      id: "preflight-log",
      label: "Preflight log",
      relativePathTemplate: "logs/start-{realmSlug}.preflight.log",
    },
    {
      id: "runtime-log",
      label: "Runtime log",
      relativePathTemplate: "logs/runtime/latest.log",
    },
  ],
  targetBranchName: "stable",
  temporaryArtifactRootRelativePaths: {
    merge: "tmp/merge",
    updateFromMain: "tmp/update",
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
    metadata: {
      baseBranch: "stable",
      createdAt: "2026-05-21T00:00:00.000Z",
      ports: {},
      raw: {},
      realmSlug: "realm-01",
      rootBranch: "feature/example",
      slot: 1,
      stackName: "example",
      submoduleBranch: "feature/example",
      workspaceType: "worktree",
    },
    onboardingMarkdownExists: true,
    onboardingMarkdownPath: "/workspace/WORKTREE.readme.md",
    realmRecord: null,
    temporaryMerge: false,
    worktreePath: "/workspace/example",
    ...overrides,
  };
}

function createInventory(
  record: WorktreeStackKit_InkUiRecord,
): WorktreeStackKit_InkUiInventory {
  return {
    globalIssues: [],
    loadedAt: "2026-05-21T00:00:00.000Z",
    projectRoot: "/workspace/root",
    records: [record],
    summary: {
      activeRealms: 0,
      brokenRecords: 0,
      detachedRecords: record.detached ? 1 : 0,
      healthRunAt: null,
      healthyRealms: 0,
      inactiveRealms: 1,
      managedRecords: 1,
      staleRealms: 0,
      totalRecords: 1,
      unhealthyRealms: 0,
    },
  };
}

describe("WorktreeStackKit Ink record workflow plans", () => {
  it("builds start requests and retained artifact paths from explicit config", () => {
    const record = createRecord();
    const inventory = createInventory(record);

    const plan = WorktreeStackKit_buildInkStartPlan({
      actionOptions: baseActionOptions({ openWindsurfOnStart: true }),
      config,
      inventory,
      record,
    });

    assert.deepEqual(plan.request?.args, [
      "run",
      "workspace:start",
      "--",
      "--worktree",
      "/workspace/example",
      "--open-editor",
    ]);
    assert.deepEqual(
      plan.retainedArtifacts.map((artifact) => artifact.path),
      [
        "/workspace/root/logs/start-realm-01.preflight.log",
        "/workspace/root/logs/runtime/latest.log",
      ],
    );
    assert.equal(plan.summaryLines.at(2), "Open editor: Yes");
  });

  it("blocks root checkout start with project-supplied copy", () => {
    const record = createRecord({
      checkoutKind: "canonical-root-workspace",
      handbookMarkdownExists: false,
      metadata: null,
      onboardingMarkdownExists: false,
      worktreePath: "/workspace/root",
    });
    const plan = WorktreeStackKit_buildInkStartPlan({
      actionOptions: baseActionOptions(),
      config,
      inventory: createInventory(record),
      record,
    });

    assert.equal(plan.request, null);
    assert.deepEqual(
      plan.issues.map((issue) => issue.code),
      ["canonical-root-workspace", "root-context-missing"],
    );
    assert.match(plan.issues[0]?.message ?? "", /tool run root:start/u);
  });

  it("builds update and merge args from configured scripts and branch", () => {
    const record = createRecord();
    const inventory = createInventory(record);

    const updatePlan = WorktreeStackKit_buildInkUpdateFromMainPlan({
      actionOptions: baseActionOptions({
        updateFromMainExecutionMode: "push",
        updateFromMainMode: "pushed-only",
      }),
      config,
      inventory,
      record,
    });
    assert.deepEqual(updatePlan.request?.args, [
      "run",
      "workspace:update",
      "--",
      "--worktree",
      "/workspace/example",
      "--mode",
      "pushed-only",
      "--target-branch",
      "stable",
      "--push",
    ]);
    assert.equal(
      updatePlan.retainedArtifacts[0]?.path,
      "/workspace/root/tmp/update",
    );

    const mergePlan = WorktreeStackKit_buildInkMergePlan({
      actionOptions: baseActionOptions({ mergeExecutionMode: "push" }),
      config,
      inventory,
      record,
    });
    assert.deepEqual(mergePlan.request?.args, [
      "run",
      "workspace:merge",
      "--",
      "--worktree",
      "/workspace/example",
      "--target-branch",
      "stable",
      "--push",
    ]);
    assert.equal(
      mergePlan.retainedArtifacts[0]?.path,
      "/workspace/root/tmp/merge",
    );
    assert.equal(mergePlan.requiredConfirmationToken, "MERGE");
  });

  it("binds config into an adapter-safe builder set", () => {
    const record = createRecord();
    const builders =
      WorktreeStackKit_createInkRecordWorkflowPlanBuilders(config);
    const plan = builders.buildStartPlan(
      createInventory(record),
      record,
      baseActionOptions({ openWindsurfOnStart: true }),
    );

    assert.deepEqual(plan.request?.args, [
      "run",
      "workspace:start",
      "--",
      "--worktree",
      "/workspace/example",
      "--open-editor",
    ]);
    assert.equal(plan.summaryLines.at(2), "Open editor: Yes");
  });
});
