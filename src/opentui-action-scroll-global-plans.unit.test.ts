/**
 * @fileoverview Regression tests for OpenTUI global action-scroll planner helpers covering panel
 * visibility, option catalogs, npm preview selection plans, and run/result text formatters.
 *
 * This file owns Node `node:test` assertions for the pure `WorktreeStackKit_*` helpers in
 * `opentui-action-scroll-global-plans` that drive checkout-state, prune-stale, and shared run/result
 * OpenTUI flows.
 * Flow: call visibility and builder helpers -> assert stable option shapes -> assert preview plans
 * and selection routing -> assert run/result formatter output.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-global-plans.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-global-plans.ts - Pure planner and formatter module whose visibility gates, option catalogs, preview plans, and formatting branches are asserted here.
 * @see packages/worktree-kit/src/opentui-global-panels.tsx - OpenTUI global maintenance panels that import these helpers to advance checkout-state and prune-stale flows through forms, preview, and run/result chrome covered by this contract.
 * @see packages/worktree-kit/src/opentui-action-scroll-npm-plans.ts - Owns the npm-run preview plan contract and command formatting rules referenced when assertions lock down preview strings for worktrees:state:check and realm prune scripts.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiPruneStaleFormOptions,
  WorktreeStackKit_buildOpenTuiRunResultOptions,
  WorktreeStackKit_buildOpenTuiStateCheckFetchOptions,
  WorktreeStackKit_buildOpenTuiStateCheckFormOptions,
  WorktreeStackKit_formatOpenTuiRunExitStatus,
  WorktreeStackKit_formatOpenTuiRunResultText,
  WorktreeStackKit_formatOpenTuiRunningOutput,
  WorktreeStackKit_planOpenTuiPruneStaleFormSelection,
  WorktreeStackKit_planOpenTuiRunResultSelection,
  WorktreeStackKit_planOpenTuiStateCheckFetchSelection,
  WorktreeStackKit_planOpenTuiStateCheckFormSelection,
  WorktreeStackKit_shouldShowOpenTuiPruneStalePanel,
  WorktreeStackKit_shouldShowOpenTuiResultPanel,
  WorktreeStackKit_shouldShowOpenTuiRunPanel,
  WorktreeStackKit_shouldShowOpenTuiStateCheckPanel,
} from "./opentui-action-scroll-global-plans.js";

const npmScripts = {
  pruneStale: "local:edge:realm:prune",
  stateCheck: "worktrees:state:check",
};

test("OpenTUI global action-scroll visibility helpers match flow phases", () => {
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiStateCheckPanel({
      flow: "checkoutState",
      phase: "form",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiStateCheckPanel({
      flow: "checkoutState",
      phase: "preview",
    }),
    false,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiPruneStalePanel({
      flow: "pruneStale",
      phase: "form",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiPruneStalePanel({
      flow: "checkoutState",
      phase: "form",
    }),
    false,
  );
  assert.equal(WorktreeStackKit_shouldShowOpenTuiRunPanel({ phase: "running" }), true);
  assert.equal(WorktreeStackKit_shouldShowOpenTuiRunPanel({ phase: "result" }), false);
  assert.equal(WorktreeStackKit_shouldShowOpenTuiResultPanel({ phase: "result" }), true);
});

test("OpenTUI global action-scroll options remain stable", () => {
  assert.deepEqual(WorktreeStackKit_buildOpenTuiStateCheckFetchOptions(), [
    { description: "Refresh refs", name: "yes", value: "yes" },
    { description: "Skip fetch", name: "no", value: "no" },
  ]);
  assert.deepEqual(WorktreeStackKit_buildOpenTuiStateCheckFormOptions(), [
    { description: "Preview", name: "Continue", value: "next" },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(WorktreeStackKit_buildOpenTuiPruneStaleFormOptions(), [
    { description: "Preview npm command", name: "Continue", value: "next" },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(WorktreeStackKit_buildOpenTuiRunResultOptions(), [
    { description: "Main menu", name: "Menu", value: "menu" },
  ]);
});

test("OpenTUI checkout-state selection planners build npm preview plans", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFetchSelection({ optionValue: "yes" }),
    { stateCheckFetch: true, type: "set-fetch" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFetchSelection({ optionValue: "no" }),
    { stateCheckFetch: false, type: "set-fetch" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFetchSelection({ optionValue: "other" }),
    { type: "ignore" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFormSelection({
      npmScripts,
      optionValue: "next",
      stateCheckFetch: true,
    }),
    {
      nextPhase: "preview",
      previewPlan: {
        commandPreview: "npm run worktrees:state:check -- --fetch",
        forwarded: ["--fetch"],
        requiredConfirmToken: null,
        script: "worktrees:state:check",
      },
      type: "preview",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFormSelection({
      npmScripts,
      optionValue: "next",
      stateCheckFetch: false,
    }),
    {
      nextPhase: "preview",
      previewPlan: {
        commandPreview: "npm run worktrees:state:check --",
        forwarded: [],
        requiredConfirmToken: null,
        script: "worktrees:state:check",
      },
      type: "preview",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFormSelection({
      npmScripts,
      optionValue: "menu",
      stateCheckFetch: false,
    }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStateCheckFormSelection({
      npmScripts,
      optionValue: "quit",
      stateCheckFetch: false,
    }),
    { type: "quit" },
  );
});

test("OpenTUI prune-stale and run-result planners map selections", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPruneStaleFormSelection({
      npmScripts,
      optionValue: "next",
    }),
    {
      nextPhase: "preview",
      previewPlan: {
        commandPreview: "npm run local:edge:realm:prune --",
        forwarded: [],
        requiredConfirmToken: "PRUNE",
        script: "local:edge:realm:prune",
      },
      type: "preview",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPruneStaleFormSelection({
      npmScripts,
      optionValue: "menu",
    }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPruneStaleFormSelection({
      npmScripts,
      optionValue: "quit",
    }),
    { type: "quit" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPruneStaleFormSelection({
      npmScripts,
      optionValue: undefined,
    }),
    { type: "ignore" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiRunResultSelection({ optionValue: "menu" }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiRunResultSelection({ optionValue: "quit" }),
    { type: "ignore" },
  );
});

test("OpenTUI run/result text formatters preserve existing placeholders", () => {
  assert.equal(
    WorktreeStackKit_formatOpenTuiRunningOutput({ runStderr: "err", runStdout: "out" }),
    "outerr",
  );
  assert.equal(
    WorktreeStackKit_formatOpenTuiRunningOutput({ runStderr: "", runStdout: "" }),
    "…",
  );
  assert.equal(WorktreeStackKit_formatOpenTuiRunExitStatus({ runStatus: null }), "unknown");
  assert.equal(WorktreeStackKit_formatOpenTuiRunExitStatus({ runStatus: 0 }), "0");
  assert.equal(WorktreeStackKit_formatOpenTuiRunResultText({ text: "" }), "(empty)");
  assert.equal(WorktreeStackKit_formatOpenTuiRunResultText({ text: "details" }), "details");
});
