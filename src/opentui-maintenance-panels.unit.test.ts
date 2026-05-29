/**
 * @fileoverview Verifies React element validity for OpenTUI worktree maintenance panels (repair,
 * sync-local-files, and bootstrap) in `worktree-kit`.
 *
 * This file owns lightweight regression checks that minimal canned props produce valid `React`
 * elements for the repair, sync, and bootstrap scroll panels.
 * Flow: assemble props -> `React.createElement` -> assert `React.isValidElement`.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-maintenance-panels.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-maintenance-panels.tsx - Maintenance panel components whose React element shapes are asserted here with minimal side-effect stubs and canned script paths.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll shell that composes these maintenance panels into the interactive repair, sync, and bootstrap workflow.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_OpenTuiActionScrollBootstrapPanel,
  WorktreeStackKit_OpenTuiActionScrollRepairPanel,
  WorktreeStackKit_OpenTuiActionScrollSyncPanel,
} from "./opentui-maintenance-panels.js";

const sideEffects = {
  requestQuit: () => undefined,
  runSpawn: async () => undefined,
};

describe("worktree OpenTUI maintenance panels", () => {
  it("exposes valid React components for repair, sync, and bootstrap", () => {
    const repair = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollRepairPanel,
      {
        ...sideEffects,
        commandPreview: "npx tsx scripts/worktree-stack/commands/repair.ts",
        flow: "repair",
        formError: "",
        goMenu: () => undefined,
        phase: "form",
        repairArgv: [],
        repairGoPreview: () => undefined,
        repairWorktrees: "",
        scriptPaths: { repair: "scripts/worktree-stack/commands/repair.ts" },
        setPhase: () => undefined,
        setRepairDryRun: () => undefined,
        setRepairIncludePkg: () => undefined,
        setRepairLegacyMissingOnly: () => undefined,
        setRepairWorktrees: () => undefined,
      },
    );
    const sync = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollSyncPanel,
      {
        ...sideEffects,
        commandPreview:
          "npx tsx scripts/worktree-stack/commands/sync-local-files.ts",
        flow: "sync",
        formError: "",
        goMenu: () => undefined,
        phase: "form",
        scriptPaths: {
          syncLocalFiles: "scripts/worktree-stack/commands/sync-local-files.ts",
        },
        setPhase: () => undefined,
        setSyncSource: () => undefined,
        setSyncWorktrees: () => undefined,
        syncArgv: [],
        syncGoPreview: () => undefined,
        syncSource: ".",
        syncWorktrees: "",
      },
    );
    const bootstrap = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollBootstrapPanel,
      {
        ...sideEffects,
        bootstrapGoPreview: () => undefined,
        commandPreview: "npx tsx scripts/platform/commands/install-all.ts",
        flow: "bootstrap",
        goMenu: () => undefined,
        installDescription: "Install workspace dependencies.",
        phase: "form",
        scriptPaths: {
          bootstrapInstall: "scripts/platform/commands/install-all.ts",
        },
        seedReport: {
          localLogicalEnvironmentFilePath: ".config/local.env",
          localLogicalEnvironmentPresent: false,
        },
        setPhase: () => undefined,
      },
    );

    assert.equal(React.isValidElement(repair), true);
    assert.equal(React.isValidElement(sync), true);
    assert.equal(React.isValidElement(bootstrap), true);
  });
});
