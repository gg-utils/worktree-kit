/**
 * @fileoverview Verifies OpenTUI create-wizard form plans: default model seeding, ordered text and
 * select field catalogs, text/select reducers, preview visibility, and form/preview navigation planners.
 *
 * This file owns Node test regression coverage for pure helpers in `opentui-create-wizard-form-plans.ts`
 * that wire the OpenTUI create stack wizard without filesystem or subprocess I/O.
 * Flow: construct model or catalogs -> apply text/select updates -> assert preview visibility and planOpenTui* navigation results.
 *
 * @testing Node test runner: cd packages/worktree-kit && npx tsx --test src/opentui-create-wizard-form-plans.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests via tsx --test when validating broader kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-create-wizard-form-plans.ts - Pure form schema, catalogs, reducers, and navigation planners whose contracts are asserted by the scenarios in this test module.
 * @see packages/worktree-kit/src/opentui-create-wizard-panels.tsx - Create wizard panels import these catalogs and planOpenTui* helpers to render rows and interpret user selections in the live OpenTUI create flow.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview standard defining the `@testing`, `@see`, and `@documentation` tag order validated by the file-overview scanners.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKTREE_STACK_KIT_OPENTUI_CREATE_CONTINUE_TAB,
  WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS,
  WorktreeStackKit_buildOpenTuiCreateFormOptions,
  WorktreeStackKit_buildOpenTuiCreatePreviewOptions,
  WorktreeStackKit_applyOpenTuiCreateSelectChange,
  WorktreeStackKit_applyOpenTuiCreateTextChange,
  WorktreeStackKit_buildOpenTuiCreateTextFields,
  WorktreeStackKit_createOpenTuiCreateFormModel,
  WorktreeStackKit_getOpenTuiCreateTextValue,
  WorktreeStackKit_planOpenTuiCreateFormSelection,
  WorktreeStackKit_planOpenTuiCreatePreviewSelection,
  WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel,
} from "./opentui-create-wizard-form-plans.js";

void test("OpenTUI create form model uses explicit project defaults", () => {
  const model = WorktreeStackKit_createOpenTuiCreateFormModel({
    baseBranch: "main",
    metadataSource: "configured-source",
    worktreesBase: "/tmp/worktrees",
  });

  assert.equal(model.baseBranch, "main");
  assert.equal(model.metadataSource, "configured-source");
  assert.equal(model.worktreesBase, "/tmp/worktrees");
  assert.equal(model.installPreferOffline, true);
  assert.equal(model.installSkipExisting, false);
  assert.equal(model.startMode, "none");
});

void test("OpenTUI create field catalogs preserve wizard order", () => {
  const textFields = WorktreeStackKit_buildOpenTuiCreateTextFields({
    baseBranchDefaultLabel: "main",
    rootBranchDefaultLabel: "codex/<name>",
  });

  assert.deepEqual(
    textFields.map((field) => field.id),
    [
      "stackName",
      "slot",
      "realm",
      "worktreesBase",
      "worktreePathOverride",
      "baseBranch",
      "rootBranch",
      "submoduleBranch",
    ],
  );
  assert.equal(textFields[5]?.label, "Base branch (default main)");
  assert.equal(
    textFields[6]?.label,
    "Root branch (optional, default codex/<name>)",
  );
  assert.deepEqual(
    WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS.map((field) => field.id),
    [
      "copyEnvFromMain",
      "runInstall",
      "installSkipExisting",
      "installPreferOffline",
      "startMode",
      "openWindsurf",
    ],
  );
  assert.deepEqual(WORKTREE_STACK_KIT_OPENTUI_CREATE_CONTINUE_TAB, {
    description: "Preview command",
    name: "Continue",
    value: "next",
  });
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiCreateFormOptions().map((option) => option.value),
    ["next", "menu", "quit"],
  );
});

void test("OpenTUI create text helpers read and update model fields", () => {
  const model = WorktreeStackKit_createOpenTuiCreateFormModel({
    baseBranch: "main",
    metadataSource: "worktree-stack",
    worktreesBase: "/tmp/worktrees",
  });
  const updated = WorktreeStackKit_applyOpenTuiCreateTextChange({
    fieldId: "stackName",
    model,
    value: "demo-stack",
  });

  assert.equal(
    WorktreeStackKit_getOpenTuiCreateTextValue({
      fieldId: "stackName",
      model: updated,
    }),
    "demo-stack",
  );
  assert.equal(
    WorktreeStackKit_getOpenTuiCreateTextValue({
      fieldId: "worktreesBase",
      model: updated,
    }),
    "/tmp/worktrees",
  );
});

void test("OpenTUI create select helper updates booleans and start mode", () => {
  const model = WorktreeStackKit_createOpenTuiCreateFormModel({
    baseBranch: "main",
    metadataSource: "worktree-stack",
    worktreesBase: "/tmp/worktrees",
  });

  const withInstallDisabled = WorktreeStackKit_applyOpenTuiCreateSelectChange({
    fieldId: "runInstall",
    model,
    value: "no",
  });
  const withWindsurf = WorktreeStackKit_applyOpenTuiCreateSelectChange({
    fieldId: "openWindsurf",
    model: withInstallDisabled,
    value: "yes",
  });
  const withTerminal = WorktreeStackKit_applyOpenTuiCreateSelectChange({
    fieldId: "startMode",
    model: withWindsurf,
    value: "terminal",
  });
  const unchanged = WorktreeStackKit_applyOpenTuiCreateSelectChange({
    fieldId: "startMode",
    model: withTerminal,
    value: "browser",
  });

  assert.equal(withTerminal.runInstall, false);
  assert.equal(withTerminal.openWindsurf, true);
  assert.equal(withTerminal.startMode, "terminal");
  assert.equal(unchanged, withTerminal);
});

void test("OpenTUI create preview planner maps visibility and navigation", () => {
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel({
      flow: "create",
      phase: "preview",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel({
      flow: "repair",
      phase: "preview",
    }),
    false,
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiCreatePreviewOptions().map((option) => option.value),
    ["run", "back"],
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiCreatePreviewSelection({ optionValue: "run" }),
    { type: "run" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiCreatePreviewSelection({ optionValue: "back" }),
    { nextPhase: "form", type: "back" },
  );
});

void test("OpenTUI create form planner maps continue, menu, and quit navigation", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiCreateFormSelection({ optionValue: "next" }),
    { type: "preview" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiCreateFormSelection({ optionValue: "menu" }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiCreateFormSelection({ optionValue: "quit" }),
    { type: "quit" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiCreateFormSelection({ optionValue: undefined }),
    { type: "ignore" },
  );
});
