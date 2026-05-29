/**
 * @fileoverview Verifies OpenTUI global maintenance panels still render as valid React elements for
 * checkout-state, prune-stale, and run/result flows.
 *
 * This file owns lightweight `node:test` smoke coverage that `React.createElement` accepts the
 * exported panel components with representative props without mounting a full OpenTUI shell.
 * Flow: build minimal props -> create elements for each panel -> assert `React.isValidElement`.
 *
 * @example
 * ```typescript
 * it("builds valid elements", () => {
 *   const el = React.createElement(WorktreeStackKit_OpenTuiActionScrollStateCheckPanel, {
 *     ...basePreviewProps,
 *     flow: "checkoutState",
 *     phase: "form",
 *     setStateCheckFetch: () => undefined,
 *     stateCheckFetch: false,
 *   });
 *   assert.equal(React.isValidElement(el), true);
 * });
 * ```
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-global-panels.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-global-panels.tsx - OpenTUI global panel module under test whose exported components must remain constructible as valid React elements from the prop shapes asserted here.
 * @see packages/worktree-kit/src/opentui-action-scroll-global-plans.ts - Planner and visibility helpers consumed by those panels so regressions in option wiring or phase gating surface when adjacent contracts drift.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_OpenTuiActionScrollPruneStalePanel,
  WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels,
  WorktreeStackKit_OpenTuiActionScrollStateCheckPanel,
} from "./opentui-global-panels.js";

const npmScripts = {
  pruneStale: "local:edge:realm:prune",
  stateCheck: "worktrees:state:check",
};

const basePreviewProps = {
  goMenu: () => undefined,
  npmScripts,
  requestQuit: () => undefined,
  setCommandPreview: () => undefined,
  setPendingNpmRun: () => undefined,
  setPhase: () => undefined,
  setRequiredConfirmToken: () => undefined,
};

describe("worktree OpenTUI global panels", () => {
  it("exposes valid React components for global forms and run/result panels", () => {
    const stateCheck = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollStateCheckPanel,
      {
        ...basePreviewProps,
        flow: "checkoutState",
        phase: "form",
        setStateCheckFetch: () => undefined,
        stateCheckFetch: false,
      },
    );
    const pruneStale = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollPruneStalePanel,
      {
        ...basePreviewProps,
        flow: "pruneStale",
        phase: "form",
      },
    );
    const runResult = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels,
      {
        goMenu: () => undefined,
        phase: "result",
        runScript: "worktrees:state:check",
        runStatus: 0,
        runStderr: "",
        runStdout: "ok",
      },
    );

    for (const element of [stateCheck, pruneStale, runResult]) {
      assert.equal(React.isValidElement(element), true);
    }
  });
});
