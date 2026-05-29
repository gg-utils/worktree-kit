/**
 * @fileoverview Verifies pure OpenTUI app shell view-model helpers used by worktree-kit terminal shells.
 *
 * This file owns Node `node:test` regression coverage for selected-record and worktree-path resolution,
 * record summaries, inventory header models, detail and issue panel rows, copy label and tone helpers,
 * and footer control strips keyed by flow mode.
 * Flow: canned `WorktreeStackKit_OpenTuiRecordInput` fixture -> assert pure builders and resolvers without React or OpenTUI I/O.
 *
 * @testing Node test runner via tsx: cd packages/worktree-kit && npm run test -- src/opentui-app-shell-view-model.unit.test.ts
 * @testing Node test runner via tsx: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - Pure helper module under test whose selection, formatting, header/detail/issue/footer builders, and copy-affordance helpers are asserted here.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Package OpenTUI shell component that maps inventory and selection into the structural models shaped by these helpers so regressions here surface in the terminal UI contract.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiDetailRows,
  WorktreeStackKit_buildOpenTuiFooterControls,
  WorktreeStackKit_buildOpenTuiInventoryHeaderModel,
  WorktreeStackKit_buildOpenTuiIssuePanelModel,
  WorktreeStackKit_formatOpenTuiCopyLabel,
  WorktreeStackKit_formatOpenTuiRecordSummary,
  WorktreeStackKit_getOpenTuiCopyTone,
  WorktreeStackKit_getOpenTuiSelectedRecord,
  WorktreeStackKit_resolveOpenTuiSelectedWorktreePath,
  type WorktreeStackKit_OpenTuiRecordInput,
} from "./opentui-app-shell-view-model.js";

const RECORD: WorktreeStackKit_OpenTuiRecordInput = {
  branchRef: "refs/heads/feature/demo",
  currentCheckout: false,
  handbook: {
    authHost: "auth.example.test",
    realmSlug: "handbook-realm",
    stackName: "handbook-stack",
  },
  handbookMarkdownExists: true,
  healthSummary: { healthyProbeCount: 2, totalProbeCount: 3 },
  issues: [
    { code: "record-warning", message: "Record warning", severity: "warning" },
  ],
  label: "fallback-label",
  metadata: {
    ports: { api: 8011, ui: 4011 },
    realmSlug: "metadata-realm",
    slot: 11,
    stackName: "metadata-stack",
  },
  realmRecord: { primaryMethod: "docker", status: "active" },
  temporaryMerge: false,
  worktreePath: "/workspace/demo",
};

test("OpenTUI app shell helpers select records and resolve paths", () => {
  assert.equal(
    WorktreeStackKit_getOpenTuiSelectedRecord({
      recordPickIndex: 0,
      records: [RECORD],
    }),
    RECORD,
  );
  assert.equal(
    WorktreeStackKit_resolveOpenTuiSelectedWorktreePath({
      manualWorktreePath: "  /manual/worktree  ",
      recordPickIndex: 0,
      records: [],
    }),
    "/manual/worktree",
  );
  assert.equal(
    WorktreeStackKit_resolveOpenTuiSelectedWorktreePath({
      manualWorktreePath: "",
      recordPickIndex: 0,
      records: [RECORD],
    }),
    "/workspace/demo",
  );
});

test("OpenTUI app shell helpers summarize inventory and records", () => {
  assert.equal(
    WorktreeStackKit_formatOpenTuiRecordSummary(RECORD),
    "metadata-stack | slot 11 | realm metadata-realm",
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiInventoryHeaderModel({ inventory: null }),
    { loaded: false, loadingText: "Loading inventory..." },
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiInventoryHeaderModel({
      inventory: {
        globalIssues: [],
        records: [RECORD],
        summary: {
          activeRealms: 1,
          brokenRecords: 0,
          detachedRecords: 0,
          healthRunAt: "2026-05-21T00:00:00Z",
          healthyRealms: 1,
          inactiveRealms: 0,
          managedRecords: 1,
          staleRealms: 0,
          totalRecords: 1,
          unhealthyRealms: 0,
        },
      },
    }),
    {
      loaded: true,
      recordsLine: "Records: 1 | Managed: 1 | Broken: 0 | Detached: 0",
      realmsLine:
        "Realms: active 1 | inactive 0 | stale 0 | healthy 1 | unhealthy 0 | run 2026-05-21T00:00:00Z",
    },
  );
});

test("OpenTUI app shell helpers build detail and issue models", () => {
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiDetailRows({ record: RECORD }),
    [
      { kind: "path", value: "/workspace/demo" },
      { kind: "field", label: "Branch:", value: "feature/demo" },
      { kind: "field", label: "Stack:", value: "metadata-stack" },
      { kind: "field", label: "Realm:", value: "metadata-realm" },
      { kind: "field", label: "Registry:", value: "active (docker)" },
      { kind: "field", label: "Health:", value: "2/3 probes healthy" },
      { kind: "field", label: "Ports:", value: "api=8011, ui=4011" },
      { kind: "field", label: "Auth host:", value: "auth.example.test" },
      { kind: "meta", value: "Meta: ✓ | HB: ✓ | MD: ✓" },
    ],
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiIssuePanelModel({
      globalIssues: [
        { code: "global-error", message: "Global error", severity: "error" },
      ],
      record: RECORD,
    }),
    {
      globalRows: [
        {
          key: "g:global-error:Global error",
          message: "Global error",
          tone: "red",
        },
      ],
      hasIssues: true,
      recordLabel: "fallback-label",
      recordRows: [
        {
          key: "r:record-warning:Record warning",
          message: "Record warning",
          tone: "yellow",
        },
      ],
    },
  );
});

test("OpenTUI app shell helpers build copy labels and footer controls", () => {
  assert.equal(
    WorktreeStackKit_formatOpenTuiCopyLabel({
      copyFlash: "detail",
      panel: "detail",
    }),
    "[✓ Copied]",
  );
  assert.equal(
    WorktreeStackKit_getOpenTuiCopyTone({ copyFlash: null, panel: "detail" }),
    "gray",
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiFooterControls({ flow: "menu" }).map(
      (control) => control.text,
    ),
    ["Switch Column", "Navigate", "Select", "Copy Panel", "—", "Quit"],
  );
  assert.equal(
    WorktreeStackKit_buildOpenTuiFooterControls({ flow: "create" })[0]?.text,
    "Locked",
  );
});
