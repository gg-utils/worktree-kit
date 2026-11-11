/**
 * @fileoverview Regression tests for OpenTUI action-scroll npm planner helpers covering execution
 * and update-mode catalogs, preview/confirm option builders, selection routing, and npm command
 * preview payloads for worktrees stack scripts.
 *
 * This file owns Node `node:test` assertions for the pure `WorktreeStackKit_*` exports from
 * `opentui-action-scroll-npm-plans` that back start, destroy, update-from-main, and merge npm flows.
 * Flow: assert stable select-option shapes and parsers -> assert preview/confirm selection plans ->
 * assert command-preview strings and forwarded argv for stack npm scripts.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-npm-plans.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-npm-plans.ts - Pure planner module whose option catalogs, parsers, preview plans, and npm-run preview assembly behavior are asserted here.
 * @see packages/worktree-kit/src/opentui-npm-panels.tsx - OpenTUI npm preview and confirm panels that import these planners to drive scrollable command previews and token-guarded confirm steps aligned with this contract.
 * @see packages/worktree-kit/src/ui-command-catalog.ts - UI npm script arg builders and preview formatter composed by the planners under test when assembling forwarded argv and human-readable command previews.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS,
  WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS,
  WorktreeStackKit_buildOpenTuiNpmConfirmOptions,
  WorktreeStackKit_buildOpenTuiNpmPreviewOptions,
  WorktreeStackKit_parseOpenTuiExecutionMode,
  WorktreeStackKit_parseOpenTuiUpdateMode,
  WorktreeStackKit_planOpenTuiDestroyNpmPreview,
  WorktreeStackKit_planOpenTuiNpmConfirmSelection,
  WorktreeStackKit_planOpenTuiNpmPreviewSelection,
  WorktreeStackKit_planOpenTuiMergeNpmPreview,
  WorktreeStackKit_planOpenTuiStartNpmPreview,
  WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview,
} from "./opentui-action-scroll-npm-plans.js";

void test("OpenTUI action-scroll npm planners expose stable select options and parsers", () => {
  assert.deepEqual(WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS, [
    {
      description: "Target existing live worktree",
      name: "live-worktree",
      value: "live-worktree",
    },
    {
      description: "Target branch directly",
      name: "pushed-only",
      value: "pushed-only",
    },
  ]);
  assert.deepEqual(WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS, [
    { description: "Skip modifications", name: "plan", value: "plan" },
    { description: "Execute changes", name: "push", value: "push" },
  ]);
  assert.equal(
    WorktreeStackKit_parseOpenTuiUpdateMode("pushed-only"),
    "pushed-only",
  );
  assert.equal(WorktreeStackKit_parseOpenTuiUpdateMode("other"), null);
  assert.equal(WorktreeStackKit_parseOpenTuiExecutionMode("push"), "push");
  assert.equal(WorktreeStackKit_parseOpenTuiExecutionMode(undefined), null);
});

void test("OpenTUI npm preview options and selection plans are stable", () => {
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiNpmPreviewOptions({
      requiresConfirmToken: true,
    }),
    [
      {
        description: "Enter token in confirm screen",
        name: "Confirm…",
        value: "confirm",
      },
      { description: "Edit inputs", name: "Back", value: "back" },
      { description: "Return to menu", name: "Menu", value: "menu" },
      { description: "Leave", name: "Quit", value: "quit" },
    ],
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiNpmPreviewSelection({
      flow: "pool",
      optionValue: "back",
      poolKind: "next",
      requiresConfirmToken: false,
    }),
    {
      clearConfirmTokenInput: true,
      clearPendingRun: true,
      nextPhase: "form",
      type: "back",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiNpmPreviewSelection({
      flow: "diagnostics",
      optionValue: "run",
      poolKind: "list",
      requiresConfirmToken: true,
    }),
    { type: "ignore" },
  );
});

void test("OpenTUI npm confirm options and selection plans are stable", () => {
  assert.deepEqual(WorktreeStackKit_buildOpenTuiNpmConfirmOptions(), [
    {
      description: "Execute after token match",
      name: "Run",
      value: "run",
    },
    { description: "Return to preview", name: "Back", value: "back" },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiNpmConfirmSelection({
      confirmTokenInput: "wrong",
      optionValue: "run",
      requiredConfirmToken: "DESTROY",
    }),
    {
      message: "Token must match DESTROY.",
      type: "validation-error",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiNpmConfirmSelection({
      confirmTokenInput: "DESTROY",
      optionValue: "run",
      requiredConfirmToken: "DESTROY",
    }),
    {
      clearFormError: true,
      type: "run",
    },
  );
});

void test("OpenTUI action-scroll npm planners build start and destroy previews", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiStartNpmPreview({
      openWindsurf: true,
      worktreePath: "/tmp/work tree",
    }),
    {
      commandPreview:
        "npm run worktrees:start -- --worktree '/tmp/work tree' --open-windsurf",
      forwarded: ["--worktree", "/tmp/work tree", "--open-windsurf"],
      requiredConfirmToken: null,
      script: "worktrees:start",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiDestroyNpmPreview({
      prune: true,
      worktreePath: "/tmp/wt",
    }),
    {
      commandPreview: "npm run worktrees:destroy -- --worktree /tmp/wt --prune",
      forwarded: ["--worktree", "/tmp/wt", "--prune"],
      requiredConfirmToken: "DESTROY",
      script: "worktrees:destroy",
    },
  );
});

void test("OpenTUI action-scroll npm planners build update and merge previews", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview({
      executionMode: "push",
      targetBranch: "main",
      updateMode: "pushed-only",
      worktreePath: "/tmp/wt",
    }),
    {
      commandPreview: [
        "npm run worktrees:update-from-main --",
        "--worktree /tmp/wt",
        "--mode pushed-only",
        "--target-branch main",
        "--push",
      ].join(" "),
      forwarded: [
        "--worktree",
        "/tmp/wt",
        "--mode",
        "pushed-only",
        "--target-branch",
        "main",
        "--push",
      ],
      requiredConfirmToken: "PUSH",
      script: "worktrees:update-from-main",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMergeNpmPreview({
      executionMode: "plan",
      targetBranch: "main",
      worktreePath: "/tmp/wt",
    }),
    {
      commandPreview:
        "npm run worktrees:merge -- --worktree /tmp/wt --target-branch main --plan",
      forwarded: ["--worktree", "/tmp/wt", "--target-branch", "main", "--plan"],
      requiredConfirmToken: null,
      script: "worktrees:merge",
    },
  );
});
