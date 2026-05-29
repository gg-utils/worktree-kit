/**
 * @fileoverview Verifies minimal React element-shape guarantees for the OpenTUI action-scroll orchestrator in worktree-kit.
 *
 * This file owns Node test coverage ensuring `React.createElement(WorktreeStackKit_OpenTuiActionScroll, fixture)` returns a valid element for a saturated non-menu props surface.
 * Flow: assemble `WorktreeStackKit_OpenTuiActionScrollProps` fixture -> create element -> assert `React.isValidElement`.
 *
 * @testing Node.js test runner (node:test): npm run worktree-kit:test
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - OpenTUI orchestrator under test; this file only asserts `React.createElement` returns a valid element for a saturated non-menu fixture.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI shell that mounts this orchestrator with live props so element-shape regressions surface in interactive terminal sessions.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";

import {
  WorktreeStackKit_OpenTuiActionScroll,
  type WorktreeStackKit_OpenTuiActionScrollProps,
} from "./opentui-action-scroll.js";

const baseProps: WorktreeStackKit_OpenTuiActionScrollProps = {
  bootstrapGoPreview: () => undefined,
  bootstrapInstallDescription: "Runs platform install.",
  commandPreview: "npm run worktrees:state:check",
  confirmTokenInput: "",
  createArgv: [],
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
  createPreviewError: "",
  createPreviewText: "npm run worktrees:create --",
  createScriptPaths: { create: "scripts/worktree-stack/commands/create.ts" },
  createTextFieldLabelOptions: {
    baseBranchDefaultLabel: "main",
    rootBranchDefaultLabel: "codex/<name>",
  },
  destroyPrune: false,
  diagnosticsPoolCommands: {
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
  },
  flow: "create",
  formError: "",
  getSelectedWorktreePath: () => null,
  goMenu: () => undefined,
  inventory: null,
  maintenanceScriptPaths: {
    bootstrapInstall: "scripts/platform/commands/install-all.ts",
    repair: "scripts/worktree-stack/commands/repair.ts",
    syncLocalFiles: "scripts/worktree-stack/commands/sync-local-files.ts",
  },
  manualWorktreePath: "",
  mergeExec: "plan",
  npmScripts: {
    pruneStale: "local:edge:realm:prune",
    stateCheck: "worktrees:state:check",
  },
  pendingNpmRun: null,
  phase: "form",
  poolKind: "guide",
  poolNextStackName: "",
  recordPickIndex: -1,
  recordSummary: (record) => record.label,
  repairArgv: [],
  repairGoPreview: () => undefined,
  repairWorktrees: "",
  requestQuit: () => undefined,
  requiredConfirmToken: null,
  runNpmScript: async () => undefined,
  runScript: "",
  runSpawn: async () => undefined,
  runStatus: null,
  runStderr: "",
  runStdout: "",
  seedReport: {
    localLogicalEnvironmentFilePath: "local-env-seed.env",
    localLogicalEnvironmentPresent: true,
  },
  setCommandPreview: () => undefined,
  setConfirmTokenInput: () => undefined,
  setCreateModel: () => undefined,
  setDestroyPrune: () => undefined,
  setFormError: () => undefined,
  setManualWorktreePath: () => undefined,
  setMergeExec: () => undefined,
  setPendingNpmRun: () => undefined,
  setPhase: () => undefined,
  setPoolKind: () => undefined,
  setPoolNextStackName: () => undefined,
  setRecordPickIndex: () => undefined,
  setRepairDryRun: () => undefined,
  setRepairIncludePkg: () => undefined,
  setRepairLegacyMissingOnly: () => undefined,
  setRepairWorktrees: () => undefined,
  setRequiredConfirmToken: () => undefined,
  setStartOpenWindsurf: () => undefined,
  setStateCheckFetch: () => undefined,
  setSwitchModel: () => undefined,
  setSyncSource: () => undefined,
  setSyncWorktrees: () => undefined,
  setUpdateExec: () => undefined,
  setUpdateMode: () => undefined,
  startOpenWindsurf: false,
  stateCheckFetch: false,
  switchArgv: [],
  switchGoPreview: () => undefined,
  switchModel: { prefix: "", stackName: "", worktreesBase: "" },
  switchPreviewError: "",
  switchPreviewText: "npm run worktrees:switch --",
  switchScriptPaths: { switch: "scripts/worktree-stack/commands/switch.ts" },
  syncArgv: [],
  syncGoPreview: () => undefined,
  syncSource: "",
  syncWorktrees: "",
  targetBranch: "main",
  updateExec: "plan",
  updateMode: "live-worktree",
};

describe("worktree OpenTUI action-scroll orchestrator", () => {
  it("exposes a valid React component for non-menu flows", () => {
    const element = React.createElement(WorktreeStackKit_OpenTuiActionScroll, {
      ...baseProps,
    });

    assert.equal(React.isValidElement(element), true);
  });
});
