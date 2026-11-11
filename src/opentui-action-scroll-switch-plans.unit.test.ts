/**
 * @fileoverview Node test regression coverage for OpenTUI worktree switch-flow planners.
 *
 * This file owns assertions for phase-gated visibility, switch form and preview option catalogs,
 * form-model updates, argv plus npm preview strings, and tab-select selection routing for the
 * switch flow implemented in `opentui-action-scroll-switch-plans`.
 * Flow: assert visibility gates -> assert stable select-option shapes -> assert model patches and
 * preview argv -> assert selection-to-state transitions.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-switch-plans.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-switch-plans.ts - Pure planner module whose switch visibility helpers, option builders, model updates, preview argv assembly, and selection routing behavior are asserted here.
 * @see packages/worktree-kit/src/opentui-switch-panel.tsx - OpenTUI switch panel that consumes these planners for the scrollable worktree switch UX aligned with the regression contract verified here.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Defines switch-flow phases and select-option shapes exercised by the visibility and option-builder assertions in this suite.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiSwitchFormOptions,
  WorktreeStackKit_buildOpenTuiSwitchPreviewOptions,
  WorktreeStackKit_planOpenTuiSwitchFormSelection,
  WorktreeStackKit_planOpenTuiSwitchPreview,
  WorktreeStackKit_planOpenTuiSwitchPreviewSelection,
  WorktreeStackKit_shouldShowOpenTuiSwitchForm,
  WorktreeStackKit_shouldShowOpenTuiSwitchPreview,
  WorktreeStackKit_updateOpenTuiSwitchFormModel,
} from "./opentui-action-scroll-switch-plans.js";

void test("OpenTUI switch visibility helpers match switch flow phases", () => {
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiSwitchForm({ flow: "switch", phase: "form" }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiSwitchForm({ flow: "switch", phase: "preview" }),
    false,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiSwitchPreview({ flow: "switch", phase: "preview" }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiSwitchPreview({ flow: "start", phase: "preview" }),
    false,
  );
});

void test("OpenTUI switch option builders expose stable form and preview tabs", () => {
  assert.deepEqual(WorktreeStackKit_buildOpenTuiSwitchFormOptions(), [
    { description: "Preview command", name: "Continue", value: "next" },
    { description: "Return to menu", name: "Menu", value: "menu" },
    { description: "Leave", name: "Quit", value: "quit" },
  ]);
  assert.deepEqual(WorktreeStackKit_buildOpenTuiSwitchPreviewOptions(), [
    { description: "Execute", name: "Run", value: "run" },
    { description: "Edit inputs", name: "Back", value: "back" },
  ]);
});

void test("OpenTUI switch model updates and preview planning stay package-owned", () => {
  const initial = { prefix: "", stackName: "demo", worktreesBase: "default" };
  const withPrefix = WorktreeStackKit_updateOpenTuiSwitchFormModel({
    fieldId: "prefix",
    model: initial,
    value: "codex",
  });
  assert.deepEqual(withPrefix, {
    prefix: "codex",
    stackName: "demo",
    worktreesBase: "default",
  });
  const withBase = WorktreeStackKit_updateOpenTuiSwitchFormModel({
    fieldId: "worktreesBase",
    model: withPrefix,
    value: "/tmp/worktrees",
  });
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchPreview({ model: withBase }),
    {
      argv: ["--prefix", "codex", "--name", "demo", "--worktrees-base", "/tmp/worktrees"],
      previewText:
        "npm run worktrees:switch -- --prefix codex --name demo --worktrees-base /tmp/worktrees",
    },
  );
});

void test("OpenTUI switch selection planners map values to state transitions", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchFormSelection({ optionValue: "next" }),
    { type: "preview" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchFormSelection({ optionValue: "menu" }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchFormSelection({ optionValue: "quit" }),
    { type: "quit" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchFormSelection({ optionValue: undefined }),
    { type: "ignore" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchPreviewSelection({ optionValue: "run" }),
    { type: "run" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchPreviewSelection({ optionValue: "back" }),
    { nextPhase: "form", type: "back" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiSwitchPreviewSelection({ optionValue: "menu" }),
    { type: "ignore" },
  );
});
