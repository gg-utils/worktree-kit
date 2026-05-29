/**
 * @fileoverview Verifies Ink full-screen view-model builders for create, action, review, session,
 * and result panels using deterministic fixtures.
 *
 * This file owns Node `node:test` regression coverage for the pure fullscreen header, preview,
 * editor, session output, and post-run handoff rows produced from inventory snapshots and action
 * plans.
 * Flow: seed inventory and plans -> call fullscreen builders -> assert badges, rows, command
 * preview, session legend, and ambiguous-create handoff diagnostics.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-fullscreen-view-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-fullscreen-view-model.ts - Pure fullscreen model builders under test that map create drafts, action plans, and run results into Ink-ready view shapes asserted here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI inventory, draft, action-plan, and result contracts used as stable fixtures when constructing the fullscreen models exercised in this suite.
 * @see packages/worktree-kit/src/ink-create-resolution.ts - Create-resolution configuration type supplying slot prediction, branch naming, and realm inputs referenced by the create-model preview assertions.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildInkFullscreenActionEditorModel,
  WorktreeStackKit_buildInkFullscreenCreateEditorModel,
  WorktreeStackKit_buildInkFullscreenResultModel,
  WorktreeStackKit_buildInkFullscreenReviewModel,
  WorktreeStackKit_buildInkFullscreenSessionModel,
} from "./ink-fullscreen-view-model.js";
import type { WorktreeStackKit_InkCreateResolutionConfig } from "./ink-create-resolution.js";
import type {
  WorktreeStackKit_InkUiActionDefinition,
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiCreateDraft,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiResultModel,
} from "./ink-ui-contracts.js";

const RESOLUTION_CONFIG: WorktreeStackKit_InkCreateResolutionConfig = {
  defaultBaseBranch: "main",
  defaultBranchPrefix: "codex",
  defaultWorktreesDirectoryName: "worktrees",
  getCurrentDate: () => new Date("2026-05-21T12:00:00Z"),
  realmPool: ["worktree-1"],
};

const INVENTORY: WorktreeStackKit_InkUiInventory = {
  globalIssues: [],
  loadedAt: "2026-05-21T12:00:00Z",
  projectRoot: "/repo/main",
  records: [],
  summary: {
    activeRealms: 0,
    brokenRecords: 0,
    detachedRecords: 0,
    healthRunAt: null,
    healthyRealms: 0,
    inactiveRealms: 0,
    managedRecords: 0,
    staleRealms: 0,
    totalRecords: 0,
    unhealthyRealms: 0,
  },
};

const CREATE_DRAFT: WorktreeStackKit_InkUiCreateDraft = {
  baseBranch: "",
  branchPrefix: "",
  copyEnvFromMain: false,
  followUpStart: true,
  followUpStartOpenWindsurf: true,
  installPreferOnline: false,
  installSkipExisting: true,
  metadataSource: "",
  openWindsurf: false,
  realmSlug: "",
  rootBranch: "",
  runInstall: true,
  slotInput: "",
  stackName: "demo",
  submoduleBranch: "",
  worktreePathOverride: "",
  worktreesBase: "",
};

const START_ACTION: WorktreeStackKit_InkUiActionDefinition = {
  description: "Start a selected worktree runtime",
  id: "start",
  label: "Start Environment",
  scope: "record",
};

const CREATE_PLAN: WorktreeStackKit_InkUiActionRequestPlan = {
  actionId: "create",
  actionLabel: "Create Worktree",
  createContext: null,
  destructiveConfirmationText: null,
  executionMode: null,
  issues: [],
  refreshOnSuccess: true,
  request: {
    args: ["run", "worktrees:create", "--", "--stack", "demo"],
    command: "npm",
    label: "Create Worktree",
    sessionKind: "task",
  },
  requiredConfirmationToken: null,
  retainedArtifacts: [],
  summaryLines: ["Create stack demo"],
  switchContext: null,
  targetPath: null,
};

const BLOCKED_PLAN: WorktreeStackKit_InkUiActionRequestPlan = {
  ...CREATE_PLAN,
  actionId: "start",
  actionLabel: "Start Environment",
  issues: [
    {
      code: "missing-target",
      message: "Select a prepared worktree first.",
      severity: "error",
    },
  ],
  request: null,
  requiredConfirmationToken: "START",
  targetPath: "/repo/worktrees/demo",
};

test("Ink full-screen create model resolves draft previews and create navigation rows", () => {
  const model = WorktreeStackKit_buildInkFullscreenCreateEditorModel({
    actionPlan: CREATE_PLAN,
    createDraft: CREATE_DRAFT,
    createInteractionMode: "browse",
    createRegion: "preview",
    inventory: INVENTORY,
    resolutionConfig: RESOLUTION_CONFIG,
    selectedCreateFieldIndex: 1,
    selectedCreateSectionIndex: 0,
  });

  assert.equal(model.header.badgeLabel, "browse");
  assert.equal(
    model.header.summaryText,
    "Focus: preview | Section: Identity & Location | Action: ready",
  );
  assert.equal(model.previewBadgeTone, "editing");
  assert.deepEqual(model.previewRows, [
    {
      key: "predicted-path",
      label: "Predicted path",
      value: "/repo/worktrees/260521WT01-DEMO",
    },
    {
      key: "predicted-folder",
      label: "Predicted folder",
      value: "260521WT01-DEMO",
    },
    { key: "slot", label: "Slot", value: "1" },
    { key: "root-branch", label: "Root branch", value: "codex/demo" },
    {
      key: "submodule-branch",
      label: "Submodule branch",
      value: "codex/demo",
    },
  ]);
  assert.equal(model.editorField?.label, "Stack Name");
  assert.equal(model.editorField?.resolvedValue, "demo");
  assert.equal(
    model.fieldRows.find((row) => row.id === "stackName")?.marker,
    ">",
  );
});

test("Ink full-screen action and review models render command state and confirmations", () => {
  const actionModel = WorktreeStackKit_buildInkFullscreenActionEditorModel({
    actionDefinition: START_ACTION,
    actionPlan: BLOCKED_PLAN,
  });
  assert.equal(actionModel.header.badgeTone, "blocked");
  assert.equal(actionModel.commandPreview, "(blocked)");
  assert.equal(actionModel.targetText, "/repo/worktrees/demo");
  assert.equal(actionModel.preflightIssues.length, 1);

  const reviewModel = WorktreeStackKit_buildInkFullscreenReviewModel({
    actionPlan: BLOCKED_PLAN,
    reviewConfirmationInput: "STA",
  });
  assert.equal(reviewModel.requiredConfirmationToken, null);
  assert.equal(reviewModel.reviewConfirmed, true);
  assert.equal(reviewModel.header.badgeTone, "blocked");
  assert.equal(
    reviewModel.legendLines[0],
    "This plan is blocked. Enter will open the blocked result state.",
  );
});

test("Ink full-screen session and result models expose output and handoff diagnostics", () => {
  const sessionModel = WorktreeStackKit_buildInkFullscreenSessionModel({
    actionPlan: CREATE_PLAN,
    lines: [{ source: "stdout", text: "creating" }],
    sessionStatus: "cancelling",
    startedAt: "2026-05-21T12:01:00Z",
  });
  assert.equal(sessionModel.header.badgeTone, "warning");
  assert.equal(
    sessionModel.legendLines[1],
    "Cancellation requested. Waiting for the child process to exit cleanly.",
  );
  assert.equal(sessionModel.outputMaxLines, 14);

  const result: WorktreeStackKit_InkUiResultModel = {
    createHandoff: {
      candidatePaths: ["/repo/worktrees/demo-a", "/repo/worktrees/demo-b"],
      followUpStartPlan: null,
      matchedWorktreePath: null,
      predictedWorktreePath: "/repo/worktrees/260521WT01-DEMO",
      requestedRootBranch: "codex/demo",
      requestedSlot: 1,
      requestedStackName: "demo",
      requestedSubmoduleBranch: "codex/demo",
      status: "ambiguous",
    },
    endedAt: "2026-05-21T12:02:00Z",
    exitCode: 0,
    lines: [{ source: "stdout", text: "done" }],
    message: "Create finished with ambiguous discovery.",
    refreshRequested: true,
    signal: null,
    startedAt: "2026-05-21T12:01:00Z",
    status: "succeeded",
  };

  const resultModel = WorktreeStackKit_buildInkFullscreenResultModel({
    actionPlan: CREATE_PLAN,
    result,
  });
  assert.equal(resultModel.header.badgeTone, "ready");
  assert.equal(resultModel.createHandoff?.statusTone, "warning");
  assert.equal(resultModel.createHandoff?.candidatePaths.length, 2);
  assert.deepEqual(
    resultModel.executionRows.map((row) => `${row.label}: ${row.value}`),
    [
      "Exit code: 0",
      "Signal: n/a",
      "Started at: 2026-05-21T12:01:00Z",
      "Ended at: 2026-05-21T12:02:00Z",
      "Discovery refresh: requested",
    ],
  );
});
