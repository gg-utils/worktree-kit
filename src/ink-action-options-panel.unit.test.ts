/**
 * @fileoverview Verifies `WorktreeStackKit_InkActionOptionsPanel` returns valid React elements for
 * action-specific option layouts and the default no-options path.
 *
 * This file owns shallow structural regression coverage for the Ink action-options panel: build
 * representative `WorktreeStackKit_InkUiActionDefinition` and option-state fixtures, invoke the panel
 * function, and assert `React.isValidElement` for repair versus healthcheck scenarios.
 * Flow: construct fixtures -> call `WorktreeStackKit_InkActionOptionsPanel` -> assert element validity.
 *
 * @testing Node test runner unit: npm run worktree-kit:test from the repository root (executes packages/worktree-kit tests including packages/worktree-kit/src/ink-action-options-panel.unit.test.ts).
 *
 * @see packages/worktree-kit/src/ink-action-options-panel.tsx - Ink action options panel implementation under test whose returned React trees must stay element-valid for the scenarios asserted here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI action and option-state contracts used to build the fixtures passed into the panel in these tests.
 * @see packages/worktree-kit/src/ink-shell.tsx - Ink shell host that mounts this panel in interactive flows, so structural regressions here can break operator-facing stack operations.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { WorktreeStackKit_InkActionOptionsPanel } from "./ink-action-options-panel.js";
import type {
  WorktreeStackKit_InkUiActionDefinition,
  WorktreeStackKit_InkUiActionOptionState,
} from "./ink-ui-contracts.js";

const baseActionOptions: WorktreeStackKit_InkUiActionOptionState = {
  mergeExecutionMode: "plan",
  openWindsurfOnStart: false,
  poolNextStackName: "",
  pruneAfterDestroy: false,
  repairDryRun: false,
  repairIncludePackageEnv: false,
  repairLegacyPackageEnvAlias: false,
  repairScope: "selected-record",
  stateCheckFetch: false,
  syncScope: "selected-record",
  updateFromMainExecutionMode: "plan",
  updateFromMainMode: "live-worktree",
};

function actionDefinition(
  id: WorktreeStackKit_InkUiActionDefinition["id"],
): WorktreeStackKit_InkUiActionDefinition {
  return {
    id,
    label: id,
    description: `Description for ${id}`,
    scope: "global",
  };
}

describe("WorktreeStackKit_InkActionOptionsPanel", () => {
  it("returns a valid React element for action-specific options", () => {
    const element = WorktreeStackKit_InkActionOptionsPanel({
      actionDefinition: actionDefinition("repair"),
      actionOptions: {
        ...baseActionOptions,
        repairDryRun: true,
        repairScope: "all-prepared",
      },
      poolNextStackEditMode: false,
    });

    assert.equal(React.isValidElement(element), true);
  });

  it("returns a valid React element for the default no-options panel", () => {
    const element = WorktreeStackKit_InkActionOptionsPanel({
      actionDefinition: actionDefinition("healthcheck"),
      actionOptions: baseActionOptions,
      poolNextStackEditMode: false,
    });

    assert.equal(React.isValidElement(element), true);
  });
});
