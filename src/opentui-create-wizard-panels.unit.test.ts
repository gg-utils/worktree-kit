/**
 * @fileoverview Verifies OpenTUI create-wizard React panels construct valid elements for the create form and preview phases.
 *
 * This file owns lightweight element-shape regression coverage for package-exported create wizard panel components used by OpenTUI flows.
 * Flow: seed canonical props -> React.createElement for form and preview -> assert React.isValidElement for both.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-create-wizard-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-create-wizard-panels.tsx - Create-wizard OpenTUI panel components and props contracts whose minimal React element validity is asserted here.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll composition that imports these panels for keyboard-first worktree-stack console flows, the primary integration surface when panel props or exports drift.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";

import {
  WorktreeStackKit_OpenTuiCreateWizardForm,
  WorktreeStackKit_OpenTuiCreateWizardPreview,
  type WorktreeStackKit_OpenTuiCreateWizardFormProps,
  type WorktreeStackKit_OpenTuiCreateWizardPreviewProps,
} from "./opentui-create-wizard-panels.js";

const formProps: WorktreeStackKit_OpenTuiCreateWizardFormProps = {
  createGoPreview: () => undefined,
  createModel: {
    baseBranch: "main",
    copyEnvFromMain: false,
    installPreferOffline: true,
    installSkipExisting: false,
    metadataSource: "worktree-stack",
    openWindsurf: false,
    realm: "",
    rootBranch: "",
    runInstall: true,
    slot: "",
    stackName: "",
    startMode: "none",
    submoduleBranch: "",
    worktreePathOverride: "",
    worktreesBase: "/tmp/worktrees",
  },
  formError: "",
  goMenu: () => undefined,
  requestQuit: () => undefined,
  setCreateModel: () => undefined,
  textFieldLabelOptions: {
    baseBranchDefaultLabel: "main",
    rootBranchDefaultLabel: "codex/<name>",
  },
};

const previewProps: WorktreeStackKit_OpenTuiCreateWizardPreviewProps = {
  createArgv: [],
  createPreviewError: "",
  createPreviewText: "npm run worktrees:create --",
  flow: "create",
  phase: "preview",
  runSpawn: async () => undefined,
  scriptPaths: { create: "scripts/worktree-stack/commands/create.ts" },
  setPhase: () => undefined,
};

describe("worktree OpenTUI create wizard panels", () => {
  it("exposes valid React components for create form and preview phases", () => {
    const form = React.createElement(WorktreeStackKit_OpenTuiCreateWizardForm, {
      ...formProps,
    });
    const preview = React.createElement(WorktreeStackKit_OpenTuiCreateWizardPreview, {
      ...previewProps,
    });

    assert.equal(React.isValidElement(form), true);
    assert.equal(React.isValidElement(preview), true);
  });
});
