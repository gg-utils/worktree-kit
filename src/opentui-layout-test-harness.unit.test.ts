/**
 * @fileoverview Verifies React element construction and the exported OpenTUI layout harness bootstrap for manual renderer smoke workflows.
 *
 * This file owns lightweight regressions that `WorktreeStackKit_OpenTuiLayoutTestHarnessApp` stays a valid element for both heading variants and `WorktreeStackKit_runOpenTuiLayoutTestHarness` remains a function for script adapters.
 * Flow: `React.createElement` with harness props -> assert `React.isValidElement`; assert `typeof` on the runner export.
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-layout-test-harness.unit.test.ts
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root (runs worktree-kit package unit tests via tsx, including this file).
 *
 * @see packages/worktree-kit/src/opentui-layout-test-harness.tsx - OpenTUI layout smoke harness module that exports the React app and `WorktreeStackKit_runOpenTuiLayoutTestHarness`, the surface whose element shape and export kind are asserted here.
 * @see scripts/worktree-stack/ui/cli-opentui/test-layout.tsx - Root CLI smoke entry that imports and awaits `WorktreeStackKit_runOpenTuiLayoutTestHarness`, so the bootstrap export contract verified here must stay compatible with host renderer wiring.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";

import {
  WorktreeStackKit_OpenTuiLayoutTestHarnessApp,
  WorktreeStackKit_runOpenTuiLayoutTestHarness,
} from "./opentui-layout-test-harness.js";

describe("worktree OpenTUI layout test harness", () => {
  it("exposes valid React elements for both manual smoke layouts", () => {
    const defaultLayout = React.createElement(
      WorktreeStackKit_OpenTuiLayoutTestHarnessApp,
      { showWorktreesHeading: false },
    );
    const titledLayout = React.createElement(
      WorktreeStackKit_OpenTuiLayoutTestHarnessApp,
      { showWorktreesHeading: true },
    );

    assert.equal(React.isValidElement(defaultLayout), true);
    assert.equal(React.isValidElement(titledLayout), true);
  });

  it("exposes the renderer bootstrap function for script adapters", () => {
    assert.equal(typeof WorktreeStackKit_runOpenTuiLayoutTestHarness, "function");
  });
});
