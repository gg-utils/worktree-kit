/**
 * @fileoverview Verifies plaintext serializers for worktree OpenTUI clipboard exports in
 * `worktree-kit`.
 *
 * This file owns regression coverage for numbered worktree list lines, selected-record detail
 * blocks, action-catalog exports, and grouped issue summaries produced by
 * `opentui-shell-serializers`.
 * Flow: build typed inventory/record fixtures -> call serializers -> assert stable substrings and
 * full issue text.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-shell-serializers.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-shell-serializers.ts - Serializer entrypoints under test that format worktree lists, record detail, actions, and issues for clipboard export without host script imports.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - Inventory and record input contracts used to construct fixtures whose serialized output is asserted here.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI app shell that imports the serializers when copying the same plaintext surfaces exercised by these tests.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_serializeOpenTuiActions,
  WorktreeStackKit_serializeOpenTuiIssues,
  WorktreeStackKit_serializeOpenTuiRecordDetail,
  WorktreeStackKit_serializeOpenTuiWorktreesList,
} from "./opentui-shell-serializers.js";
import type {
  WorktreeStackKit_OpenTuiInventoryInput,
  WorktreeStackKit_OpenTuiRecordInput,
} from "./opentui-app-shell-view-model.js";

const record: WorktreeStackKit_OpenTuiRecordInput = {
  branchRef: "refs/heads/feature/demo",
  currentCheckout: true,
  handbook: {
    authHost: "auth.demo.local",
    realmSlug: "realm-a",
    stackName: "stack-a",
  },
  handbookMarkdownExists: true,
  healthSummary: { healthyProbeCount: 2, totalProbeCount: 3 },
  issues: [{ code: "warn", message: "Needs repair", severity: "warning" }],
  label: "stack-a-01",
  metadata: {
    ports: { ui: 4011 },
    realmSlug: "realm-a",
    slot: 1,
    stackName: "stack-a",
  },
  realmRecord: { primaryMethod: "nginx-docker", status: "active" },
  temporaryMerge: false,
  worktreePath: "/tmp/stack-a",
};

const inventory: WorktreeStackKit_OpenTuiInventoryInput = {
  globalIssues: [
    { code: "global", message: "Global warning", severity: "warning" },
  ],
  records: [record],
  summary: {
    activeRealms: 1,
    brokenRecords: 0,
    detachedRecords: 0,
    healthRunAt: null,
    healthyRealms: 1,
    inactiveRealms: 0,
    managedRecords: 1,
    staleRealms: 0,
    totalRecords: 1,
    unhealthyRealms: 0,
  },
};

void test("worktree OpenTUI serializers format worktree lists and selected details", () => {
  assert.equal(
    WorktreeStackKit_serializeOpenTuiWorktreesList({ inventory }),
    "1. stack-a  ⚠ Issues  slot 1  feature/demo",
  );

  const detail = WorktreeStackKit_serializeOpenTuiRecordDetail({ record });
  assert.match(detail, /\/tmp\/stack-a/);
  assert.match(detail, /Registry: active \(nginx-docker\)/);
  assert.match(detail, /Ports: ui=4011/);
});

void test("worktree OpenTUI serializers format action and issue exports", () => {
  const actions = WorktreeStackKit_serializeOpenTuiActions({
    inventory,
    selectedRecord: record,
  });
  assert.match(actions, /Create — worktrees:create/);
  assert.match(actions, /Realm pool — Realm pool/);

  assert.equal(
    WorktreeStackKit_serializeOpenTuiIssues({
      globalIssues: inventory.globalIssues,
      label: record.label,
      recordIssues: record.issues,
    }),
    "Global:\n  - Global warning\nstack-a-01:\n  - Needs repair",
  );
});
