/**
 * @fileoverview Verifies worktree-stack Ink full-screen React screens (review, session, and result) produce valid
 * React elements when built with representative contract-shaped fixtures.
 *
 * This file owns lightweight import and `React.isValidElement` coverage so refactors to the
 * fullscreen screen components or their prop contracts do not silently break element creation.
 * Flow: build fixture actionPlan and result model -> `React.createElement` per screen -> assert each element is valid React.
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root (delegates to the worktree-kit package test script that runs tsx --test over src unit tests, including this file).
 *
 * @see packages/worktree-kit/src/ink-fullscreen-screens.tsx - Package Ink full-screen screen components whose import paths and element constructors are exercised by the validity assertions here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI action and result contract types used to build the deterministic fixtures passed into each full-screen screen under test.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - File-overview contract this test module header follows for documentation gate audits.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_InkResultScreen,
  WorktreeStackKit_InkReviewScreen,
  WorktreeStackKit_InkSessionScreen,
} from "./ink-fullscreen-screens.js";
import type {
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiResultModel,
} from "./ink-ui-contracts.js";

const actionPlan: WorktreeStackKit_InkUiActionRequestPlan = {
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
};

const resultModel: WorktreeStackKit_InkUiResultModel = {
  createHandoff: null,
  endedAt: "2026-05-21T00:00:01.000Z",
  exitCode: 0,
  lines: [],
  message: "Done",
  refreshRequested: false,
  signal: null,
  startedAt: "2026-05-21T00:00:00.000Z",
  status: "succeeded",
};

describe("worktree Ink full-screen package screens", () => {
  it("exposes valid React components for review, session, and result screens", () => {
    const elements = [
      React.createElement(WorktreeStackKit_InkReviewScreen, {
        actionPlan,
        reviewConfirmationInput: "",
      }),
      React.createElement(WorktreeStackKit_InkSessionScreen, {
        actionPlan,
        lines: [],
        sessionStatus: "queued",
        startedAt: null,
      }),
      React.createElement(WorktreeStackKit_InkResultScreen, {
        actionPlan,
        result: resultModel,
      }),
    ];

    for (const element of elements) {
      assert.equal(React.isValidElement(element), true);
    }
  });
});
