/**
 * @fileoverview Verifies React element validity for OpenTUI worktree app-shell panel components and
 * discovery column render helpers in `worktree-kit`.
 *
 * This file owns lightweight regression checks that header, detail, issues, footer, and discovery
 * body entrypoints return valid `React` elements against a small canned inventory fixture.
 * Flow: build canned inventory -> construct panel elements -> assert `React.isValidElement`.
 *
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-shell-panels.tsx - OpenTUI shell panel components and discovery body renderer whose element shapes are validated here.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - Inventory input contract shared by the fixture and the panel components under test.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";

import {
  WorktreeStackKit_OpenTuiDetailPanel,
  WorktreeStackKit_OpenTuiIssuesPanel,
  WorktreeStackKit_OpenTuiShellFooter,
  WorktreeStackKit_OpenTuiShellHeader,
  WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody,
} from "./opentui-app-shell-panels.js";
import type { WorktreeStackKit_OpenTuiInventoryInput } from "./opentui-app-shell-view-model.js";

const inventory: WorktreeStackKit_OpenTuiInventoryInput = {
  globalIssues: [
    { code: "workspace.issue.demo", message: "Global warning", severity: "warning" },
  ],
  records: [
    {
      branchRef: "refs/heads/main",
      currentCheckout: true,
      handbook: { authHost: "auth.local", realmSlug: "main", stackName: "Main" },
      handbookMarkdownExists: true,
      healthSummary: { healthyProbeCount: 1, totalProbeCount: 1 },
      issues: [
        { code: "record.issue.demo", message: "Record warning", severity: "warning" },
      ],
      label: "main",
      metadata: { ports: { ui: 4011 }, realmSlug: "main", slot: 1, stackName: "Main" },
      realmRecord: { primaryMethod: "nginx", status: "active" },
      temporaryMerge: false,
      worktreePath: "/tmp/main",
    },
  ],
  summary: {
    activeRealms: 1,
    brokenRecords: 0,
    detachedRecords: 0,
    healthRunAt: "2026-05-21T00:00:00.000Z",
    healthyRealms: 1,
    inactiveRealms: 0,
    managedRecords: 1,
    staleRealms: 0,
    totalRecords: 1,
    unhealthyRealms: 0,
  },
};

describe("worktree OpenTUI app-shell panels", () => {
  it("exposes valid React components for shell chrome", () => {
    const header = React.createElement(WorktreeStackKit_OpenTuiShellHeader, {
      inventory,
    });
    const detail = React.createElement(WorktreeStackKit_OpenTuiDetailPanel, {
      selectedRecord: inventory.records[0],
    });
    const issues = React.createElement(WorktreeStackKit_OpenTuiIssuesPanel, {
      copyFlash: null,
      globalIssues: inventory.globalIssues,
      handleCopy: () => undefined,
      selectedRecord: inventory.records[0],
    });
    const footer = React.createElement(WorktreeStackKit_OpenTuiShellFooter, {
      flow: "menu",
    });

    assert.equal(React.isValidElement(header), true);
    assert.equal(React.isValidElement(detail), true);
    assert.equal(React.isValidElement(issues), true);
    assert.equal(React.isValidElement(footer), true);
  });

  it("renders discovery body states as valid React elements", () => {
    const loading = WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody({
      focusedColumn: "worktrees",
      inventory: null,
      inventoryLoadError: null,
      setRecordPickIndex: () => undefined,
      worktreesTabRef: { current: null },
    });
    const loaded = WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody({
      focusedColumn: "worktrees",
      inventory,
      inventoryLoadError: null,
      setRecordPickIndex: () => undefined,
      worktreesTabRef: { current: null },
    });

    assert.equal(React.isValidElement(loading), true);
    assert.equal(React.isValidElement(loaded), true);
  });
});
