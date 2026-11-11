/**
 * @fileoverview Verifies the `WorktreeStackKit_InkApp` export remains a stable React component reference when constructed with minimal stub props.
 *
 * This file owns smoke-level wiring checks for the package Ink shell entry so refactors do not accidentally replace the component type during element creation.
 * Flow: build minimal props -> `React.createElement` -> assert `element.type` matches `WorktreeStackKit_InkApp` without invoking `buildActionPlan` or real inventory I/O.
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root (delegates to the worktree-kit package test script that runs tsx --test over src unit tests, including this file).
 *
 * @see packages/worktree-kit/src/ink-app.tsx - Ink/React shell that exports `WorktreeStackKit_InkApp`, the component identity asserted by the smoke test here.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - File-overview contract this test module header follows for documentation gate audits.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";

import { WorktreeStackKit_InkApp } from "./ink-app.js";

void test("exports the package-owned Ink app component", () => {
  const element = React.createElement(WorktreeStackKit_InkApp, {
    buildActionPlan: () => {
      throw new Error("buildActionPlan should not run during element creation");
    },
    createResolutionConfig: {
      defaultBaseBranch: "main",
      defaultBranchPrefix: "codex",
      defaultWorktreesDirectoryName: "worktrees",
      getCurrentDate: () => new Date("2026-05-21T00:00:00.000Z"),
      realmPool: [],
    },
    launchTarget: null,
    loadInventory: async () => ({
      globalIssues: [],
      loadedAt: "2026-05-21T00:00:00.000Z",
      projectRoot: "/tmp/project",
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
    }),
    projectRoot: "/tmp/project",
  });

  assert.equal(element.type, WorktreeStackKit_InkApp);
});
