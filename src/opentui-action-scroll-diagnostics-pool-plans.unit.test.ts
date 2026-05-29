/**
 * @fileoverview Verifies pure OpenTUI diagnostics and realm-pool submenu planners, visibility
 * gates, and npm preview strings for the local-edge diagnostics/pool action-scroll flows.
 *
 * This file owns regression coverage for `WorktreeStackKit_shouldShowOpenTui*` helpers,
 * `WorktreeStackKit_buildOpenTui*Options` builders, and `WorktreeStackKit_planOpenTui*Selection`
 * planners against a representative `WorktreeStackKit_OpenTuiDiagnosticsPoolCommands` fixture.
 * Flow: assert phase-gated visibility -> assert built option lists -> assert selection maps to
 * preview, menu, quit, validation-error, or ignore outcomes.
 *
 * @testing Node.js test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-action-scroll-diagnostics-pool-plans.unit.test.ts
 * @testing Node.js test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-diagnostics-pool-plans.ts - Pure planner and visibility helpers under test whose option ordering, preview npm strings, and stack-name validation are asserted here.
 * @see packages/worktree-kit/src/opentui-diagnostics-pool-panel.tsx - OpenTUI diagnostics/pool panel that imports these helpers to render submenu choices and drive preview transitions in the action-scroll shell.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that supplies the diagnostics/pool command contract consumed downstream by the panel and mirrored by this test fixture.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiDiagnosticsOptions,
  WorktreeStackKit_buildOpenTuiPoolNextFormOptions,
  WorktreeStackKit_buildOpenTuiPoolSubmenuOptions,
  WorktreeStackKit_planOpenTuiDiagnosticsSelection,
  WorktreeStackKit_planOpenTuiPoolNextFormSelection,
  WorktreeStackKit_planOpenTuiPoolSubmenuSelection,
  WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu,
  WorktreeStackKit_shouldShowOpenTuiPoolNextForm,
  WorktreeStackKit_shouldShowOpenTuiPoolSubmenu,
  type WorktreeStackKit_OpenTuiDiagnosticsPoolCommands,
} from "./opentui-action-scroll-diagnostics-pool-plans.js";

const commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands = {
  diagnostics: {
    healthcheckScript: "local:edge:healthcheck",
    realmListScript: "local:edge:realm:list",
    routerStatusScript: "local:edge:router:status",
  },
  realmPool: {
    guideScript: "local:edge:realm:pool:guide",
    listScript: "local:edge:realm:pool:list",
    nextScript: "local:edge:realm:pool:next",
    prepareScript: "local:edge:realm:pool:prepare",
  },
};

test("OpenTUI diagnostics and pool visibility helpers match flow phases", () => {
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu({
      flow: "diagnostics",
      phase: "submenu",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu({
      flow: "diagnostics",
      phase: "preview",
    }),
    false,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiPoolSubmenu({ flow: "pool", phase: "submenu" }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiPoolNextForm({
      flow: "pool",
      phase: "form",
      poolKind: "next",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiPoolNextForm({
      flow: "pool",
      phase: "form",
      poolKind: "list",
    }),
    false,
  );
});

test("OpenTUI diagnostics and pool option builders use configured command names", () => {
  assert.deepEqual(WorktreeStackKit_buildOpenTuiDiagnosticsOptions({ commands }), [
    {
      description: "local:edge:realm:list",
      name: "List realms",
      value: "realmList",
    },
    {
      description: "local:edge:router:status",
      name: "Router status",
      value: "router",
    },
    {
      description: "local:edge:healthcheck",
      name: "Healthcheck",
      value: "health",
    },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(WorktreeStackKit_buildOpenTuiPoolSubmenuOptions({ commands }), [
    {
      description: "local:edge:realm:pool:list",
      name: "List pool",
      value: "list",
    },
    {
      description: "local:edge:realm:pool:guide",
      name: "Guide",
      value: "guide",
    },
    {
      description: "local:edge:realm:pool:prepare",
      name: "Prepare",
      value: "prepare",
    },
    {
      description: "local:edge:realm:pool:next",
      name: "Preview next (stack name)",
      value: "next",
    },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(WorktreeStackKit_buildOpenTuiPoolNextFormOptions(), [
    { description: "Build preview", name: "Continue", value: "next" },
    { description: "Back to pool menu", name: "Back", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
});

test("OpenTUI diagnostics selection plans fixed npm previews", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiDiagnosticsSelection({
      commands,
      optionValue: "router",
    }),
    {
      nextPhase: "preview",
      previewPlan: {
        commandPreview: "npm run local:edge:router:status --",
        forwarded: [],
        requiredConfirmToken: null,
        script: "local:edge:router:status",
      },
      type: "preview",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiDiagnosticsSelection({ commands, optionValue: "menu" }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiDiagnosticsSelection({ commands, optionValue: "quit" }),
    { type: "quit" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiDiagnosticsSelection({ commands, optionValue: undefined }),
    { type: "ignore" },
  );
});

test("OpenTUI realm-pool submenu and next-form planners map selections", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPoolSubmenuSelection({
      commands,
      optionValue: "guide",
    }),
    {
      nextPhase: "preview",
      poolKind: "guide",
      previewPlan: {
        commandPreview: "npm run local:edge:realm:pool:guide --",
        forwarded: [],
        requiredConfirmToken: null,
        script: "local:edge:realm:pool:guide",
      },
      type: "preview",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPoolSubmenuSelection({ commands, optionValue: "next" }),
    { nextPhase: "form", poolKind: "next", type: "form" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPoolNextFormSelection({
      commands,
      optionValue: "next",
      poolNextStackName: " demo-stack ",
    }),
    {
      clearFormError: true,
      nextPhase: "preview",
      previewPlan: {
        commandPreview: "npm run local:edge:realm:pool:next -- --stack-name demo-stack",
        forwarded: ["--stack-name", "demo-stack"],
        requiredConfirmToken: null,
        script: "local:edge:realm:pool:next",
      },
      type: "preview",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPoolNextFormSelection({
      commands,
      optionValue: "next",
      poolNextStackName: " ",
    }),
    { message: "Stack name is required.", type: "validation-error" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiPoolNextFormSelection({
      commands,
      optionValue: "menu",
      poolNextStackName: "demo-stack",
    }),
    { nextPhase: "submenu", type: "back" },
  );
});
