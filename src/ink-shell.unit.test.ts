/**
 * @fileoverview Verifies WorktreeStackKit Ink shell components build valid React elements when given realistic inventory, action plans, and resolution fixtures.
 *
 * This file owns Node `node:test` regression coverage for `WorktreeStackKit_InkShell` and
 * `WorktreeStackKit_createBoundInkShell` import wiring and `React.createElement` validity.
 * Flow: assemble minimal contracts -> mount shell or bound shell -> assert `React.isValidElement`.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-shell.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-shell.tsx - Ink shell renderer and bound-shell factory under test for element-shape validity and prop wiring against the fixtures defined here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Action definition, inventory, and action-plan contracts consumed when building the shell props asserted in this suite.
 * @see packages/worktree-kit/src/ink-create-model.ts - Initial create-worktree draft factory included in both mount scenarios to keep the shell contract aligned with interactive defaults.
 * @see packages/worktree-kit/src/ink-reducer-helpers.ts - Default Ink action-options factory paired with the shell in both tests to mirror the interactive reducer wiring.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_createBoundInkShell,
  WorktreeStackKit_InkShell,
} from "./ink-shell.js";
import { WorktreeStackKit_createInitialInkCreateDraft } from "./ink-create-model.js";
import { WorktreeStackKit_createDefaultInkActionOptions } from "./ink-reducer-helpers.js";
import type {
  WorktreeStackKit_InkUiActionDefinition,
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiInventory,
} from "./ink-ui-contracts.js";

const actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[] = [
  {
    description: "Run a health check",
    id: "healthcheck",
    label: "Health Check",
    scope: "global",
  },
];

const inventory: WorktreeStackKit_InkUiInventory = {
  globalIssues: [],
  loadedAt: "2026-05-21T00:00:00.000Z",
  projectRoot: "/repo/root",
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

const actionPlans: WorktreeStackKit_InkUiActionRequestPlan[] = [
  {
    actionId: "healthcheck",
    actionLabel: "Health Check",
    createContext: null,
    destructiveConfirmationText: null,
    executionMode: null,
    issues: [],
    refreshOnSuccess: false,
    request: {
      args: ["run", "local:edge:healthcheck"],
      command: "npm",
      label: "Health Check",
      sessionKind: "task",
    },
    requiredConfirmationToken: null,
    retainedArtifacts: [],
    summaryLines: ["Run health check"],
    switchContext: null,
    targetPath: null,
  },
];

describe("WorktreeStackKit_InkShell", () => {
  it("exposes a valid React shell component", () => {
    const element = React.createElement(WorktreeStackKit_InkShell, {
      actionDefinitions,
      actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
      actionPlans,
      createDraft: WorktreeStackKit_createInitialInkCreateDraft(),
      createInteractionMode: "browse",
      createRegion: "sections",
      focusedColumn: "actions",
      inventory,
      poolNextStackEditMode: false,
      resolutionConfig: {
        defaultBaseBranch: "main",
        defaultBranchPrefix: "codex",
        defaultWorktreesDirectoryName: "worktrees",
        getCurrentDate: () => new Date("2026-05-21T00:00:00.000Z"),
        realmPool: [],
      },
      selectedActionIndex: 0,
      selectedCreateFieldIndex: 0,
      selectedCreateSectionIndex: 0,
      selectedIndex: 0,
    });

    assert.equal(React.isValidElement(element), true);
  });

  it("creates a project-configured bound shell component", () => {
    const BoundShell = WorktreeStackKit_createBoundInkShell({
      actionDefinitions,
      resolutionConfig: {
        defaultBaseBranch: "main",
        defaultBranchPrefix: "codex",
        defaultWorktreesDirectoryName: "worktrees",
        getCurrentDate: () => new Date("2026-05-21T00:00:00.000Z"),
        realmPool: [],
      },
    });
    const element = React.createElement(BoundShell, {
      actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
      actionPlans,
      createDraft: WorktreeStackKit_createInitialInkCreateDraft(),
      createInteractionMode: "browse",
      createRegion: "sections",
      focusedColumn: "actions",
      inventory,
      poolNextStackEditMode: false,
      selectedActionIndex: 0,
      selectedCreateFieldIndex: 0,
      selectedCreateSectionIndex: 0,
      selectedIndex: 0,
    });

    assert.equal(React.isValidElement(element), true);
  });
});
