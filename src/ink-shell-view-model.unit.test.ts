/**
 * @fileoverview Verifies pure Ink shell view-model builders for worktree inventory headers, list
 * rows, action lists, overview stats, selected-record detail panels, combined issues, and
 * focus-aware legend copy.
 *
 * This file owns Node `node:test` regression coverage for the structural row models consumed by the
 * Ink worktree shell renderer.
 * Flow: seed inventory and record fixtures -> assert each builder output shape and strings against
 * stable demo records and global issues.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-shell-view-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-shell-view-model.ts - Pure view-model helpers for shell header, record rows, actions, overview, detail, issues, and legend lines whose outputs are asserted in this suite.
 * @see packages/worktree-kit/src/ink-shell.tsx - Ink shell renderer that maps these row models into React/Ink columns and keyboard navigation alongside the inventory contracts covered here.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildInkShellActionListModel,
  WorktreeStackKit_buildInkShellCombinedIssuesModel,
  WorktreeStackKit_buildInkShellDetailModel,
  WorktreeStackKit_buildInkShellHeaderSummary,
  WorktreeStackKit_buildInkShellLegendLines,
  WorktreeStackKit_buildInkShellOverviewModel,
  WorktreeStackKit_buildInkShellRecordRows,
  WorktreeStackKit_getInkShellSelectedRecord,
  type WorktreeStackKit_InkShellInventoryInput,
  type WorktreeStackKit_InkShellRecordInput,
} from "./ink-shell-view-model.js";

const RECORD: WorktreeStackKit_InkShellRecordInput = {
  branchRef: "refs/heads/feature/demo",
  currentCheckout: true,
  handbook: {
    authHost: "https://auth.example.test",
    realmSlug: "handbook-realm",
    stackName: "handbook-stack",
  },
  handbookMarkdownExists: true,
  healthSummary: { healthyProbeCount: 2, totalProbeCount: 3 },
  issues: [
    { code: "record-warning", message: "Record warning", severity: "warning" },
  ],
  label: "demo-record",
  metadata: {
    ports: { api: 8011, ui: 4011 },
    realmSlug: "metadata-realm",
    stackName: "metadata-stack",
  },
  realmRecord: { primaryMethod: "nginx-docker", status: "active" },
  temporaryMerge: false,
  worktreePath: "/workspace/demo",
};

const INVENTORY: WorktreeStackKit_InkShellInventoryInput = {
  globalIssues: [
    { code: "global-error", message: "Global error", severity: "error" },
  ],
  records: [RECORD],
  summary: {
    activeRealms: 1,
    brokenRecords: 1,
    detachedRecords: 0,
    healthRunAt: "2026-05-21T00:00:00Z",
    healthyRealms: 1,
    inactiveRealms: 0,
    managedRecords: 1,
    staleRealms: 0,
    totalRecords: 1,
    unhealthyRealms: 0,
  },
};

test("Ink shell view models build header, selected record, and record rows", () => {
  assert.equal(
    WorktreeStackKit_buildInkShellHeaderSummary({ summary: INVENTORY.summary }),
    "Worktrees: 1 | Ready: 1 | Issues: 1",
  );
  assert.equal(
    WorktreeStackKit_getInkShellSelectedRecord({
      records: INVENTORY.records,
      selectedIndex: 0,
    }),
    RECORD,
  );
  assert.deepEqual(
    WorktreeStackKit_buildInkShellRecordRows({
      records: [RECORD],
      selectedIndex: 0,
    }),
    [
      {
        branchLabel: "feature/demo",
        branchTone: "cyan",
        dimBranch: false,
        key: "/workspace/demo",
        label: "demo-record",
        labelTone: "cyan",
        marker: "> ",
        statusLabel: "Current",
        statusTone: "cyan",
      },
    ],
  );
});

test("Ink shell view models build action rows and overview stats", () => {
  assert.deepEqual(
    WorktreeStackKit_buildInkShellActionListModel({
      actionDefinitions: [
        { id: "start", label: "Start Environment" },
        { id: "destroy", label: "Delete Worktree" },
      ],
      actionPlans: [{ request: { command: "npm" } }, { request: null }],
      selectedActionIndex: 1,
    }),
    {
      detailSelected: false,
      rows: [
        {
          key: "start",
          label: "Start Environment",
          marker: " ",
          selected: false,
          statusLabel: "Ready",
          statusTone: "ready",
        },
        {
          key: "destroy",
          label: "Delete Worktree",
          marker: ">",
          selected: true,
          statusLabel: "Needs Setup",
          statusTone: "blocked",
        },
      ],
    },
  );
  assert.deepEqual(
    WorktreeStackKit_buildInkShellOverviewModel({
      actionPlan: { request: { command: "npm" } },
      inventory: INVENTORY,
    }).statLines,
    [
      "Standalone: 0",
      "Active: 1 | Inactive: 0",
      "Stale: 0 | Healthy: 1",
      "Unhealthy: 0 | Last Check: 2026-05-21T00:00:00Z",
    ],
  );
});

test("Ink shell view models build detail and issue models", () => {
  const detail = WorktreeStackKit_buildInkShellDetailModel({ record: RECORD });
  assert.equal(detail.empty, false);
  if (!detail.empty) {
    assert.equal(detail.badgeLabel, "Current");
    assert.deepEqual(
      detail.rows.map((row) => row.text),
      [
        "/workspace/demo",
        "Branch: feature/demo",
        "Stack: metadata-stack",
        "Realm: metadata-realm",
        "Realm: active (nginx-docker)",
        "Health: 2/3 healthy",
        "Config: Found | Handbook: Found",
        "Guide: Found",
        "Ports: api=8011, ui=4011",
        "Auth host: https://auth.example.test",
      ],
    );
    assert.deepEqual(detail.issueRows, [
      {
        icon: "!",
        key: "record-warning:Record warning",
        message: "Record warning",
        tone: "yellow",
      },
    ]);
  }
  assert.deepEqual(
    WorktreeStackKit_buildInkShellCombinedIssuesModel({
      globalIssues: INVENTORY.globalIssues,
      selectedRecord: RECORD,
    }),
    {
      count: 2,
      rows: [
        {
          icon: "✗",
          key: "global-error:Global error",
          message: "Global error",
          tone: "red",
        },
        {
          icon: "!",
          key: "record-warning:Record warning",
          message: "Record warning",
          tone: "yellow",
        },
      ],
      visible: true,
    },
  );
});

test("Ink shell view models build focus-aware legend lines", () => {
  assert.deepEqual(
    WorktreeStackKit_buildInkShellLegendLines({
      createInteractionMode: "browse",
      focusedColumn: "records",
      selectedActionId: null,
    }),
    ["←/→: Columns  ↑/↓: Browse  Enter: Action  R: Refresh  Q: Quit"],
  );
  assert.deepEqual(
    WorktreeStackKit_buildInkShellLegendLines({
      createInteractionMode: "edit",
      focusedColumn: "editor",
      selectedActionId: "create",
    }),
    ["Type to edit  Backspace to delete  Enter/Esc when done"],
  );
  assert.deepEqual(
    WorktreeStackKit_buildInkShellLegendLines({
      createInteractionMode: "browse",
      focusedColumn: "editor",
      selectedActionId: "start",
    }),
    ["Space: Toggle  Enter: Review  ←: Return  Esc: Back"],
  );
});
