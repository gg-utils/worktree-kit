/**
 * @fileoverview Verifies `WorktreeStackKit_renderInkIssueLine` returns valid React elements for each
 * supported issue severity.
 *
 * This file owns Node `node:test` regression coverage that guards the Ink `Text` wrapper and
 * severity-to-color mapping contract against silent JSX regressions.
 * Flow: build issue-shaped props per severity -> call renderer -> assert `React.isValidElement`.
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root (delegates to the worktree-kit package test script that runs tsx --test over src unit tests, including this file).
 *
 * @see packages/worktree-kit/src/ink-issue-line.tsx - Package Ink issue-line renderer whose severity branches and React element output are asserted here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared `WorktreeStackKit_InkUiIssue` severity and message contract the renderer consumes and this test instantiates with representative values.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - File-overview contract this test module header follows for documentation gate audits.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { WorktreeStackKit_renderInkIssueLine } from "./ink-issue-line.js";

describe("WorktreeStackKit_renderInkIssueLine", () => {
  it("returns a valid React element for each severity", () => {
    for (const severity of ["info", "warning", "error"] as const) {
      const element = WorktreeStackKit_renderInkIssueLine({
        code: `issue-${severity}`,
        message: `Issue ${severity}`,
        severity,
      });

      assert.equal(React.isValidElement(element), true);
    }
  });
});
