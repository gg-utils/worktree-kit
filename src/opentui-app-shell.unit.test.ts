/**
 * @fileoverview Verifies the OpenTUI app shell produces a valid React element when wired with representative scroll and tab props.
 *
 * This file owns smoke-level regression coverage for `WorktreeStackKit_OpenTuiAppShell` element-shape wiring used by the worktree-kit OpenTUI surface.
 * Flow: build action-scroll + shell props -> `React.createElement` -> assert `React.isValidElement`.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-app-shell.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI shell component whose element-shape contract is asserted here.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll props surface exercised by this test's representative fixture wiring.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MutableRefObject } from "react";
import React from "react";

import type { TabSelectRenderable } from "@opentui/core";

import type { WorktreeStackKit_OpenTuiActionScrollProps } from "./opentui-action-scroll.js";
import {
  WorktreeStackKit_OpenTuiAppShell,
  type WorktreeStackKit_OpenTuiAppShellProps,
} from "./opentui-app-shell.js";

const actionScrollProps: WorktreeStackKit_OpenTuiActionScrollProps = {
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
    rootBranchDefaultLabel: "prefix/<name>",
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
  flow: "menu",
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
  recordPickIndex: 0,
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

const actionsTabRef: MutableRefObject<TabSelectRenderable | null> = {
  current: null,
};
const worktreesTabRef: MutableRefObject<TabSelectRenderable | null> = {
  current: null,
};

const shellProps: WorktreeStackKit_OpenTuiAppShellProps = {
  actionScrollProps,
  actionsTabRef,
  copyFlash: null,
  focusedColumn: "worktrees",
  handleCopy: () => undefined,
  inventoryLoadError: null,
  resetRunArtifacts: () => undefined,
  setFlow: () => undefined,
  setFocusedColumn: () => undefined,
  setRecordPickIndex: () => undefined,
  worktreesTabRef,
};

describe("worktree OpenTUI app shell", () => {
  it("exposes a valid React component for the shell layout", () => {
    const element = React.createElement(WorktreeStackKit_OpenTuiAppShell, {
      ...shellProps,
    });

    assert.equal(React.isValidElement(element), true);
  });
});
