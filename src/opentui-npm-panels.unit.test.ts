/**
 * @fileoverview Verifies React element validity for OpenTUI worktree npm panels (record-scoped start,
 * destroy, update-from-main, and merge forms plus npm preview and confirm) in `worktree-kit`.
 *
 * This file owns lightweight regression checks that minimal canned props produce valid `React`
 * elements for stack npm flows without exercising a live OpenTUI renderer.
 * Flow: assemble props -> `React.createElement` -> assert `React.isValidElement`.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-npm-panels.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-npm-panels.tsx - Npm form, preview, and confirm panel components whose React element shapes are asserted here with minimal async stubs and canned pending npm runs.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll shell that composes these npm panels into guarded preview and confirm steps alongside record-scoped worktree-stack flows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel,
  WorktreeStackKit_OpenTuiActionScrollMergeFormPanel,
  WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel,
  WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel,
  WorktreeStackKit_OpenTuiActionScrollStartFormPanel,
  WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel,
} from "./opentui-npm-panels.js";

const baseRecordProps = {
  getSelectedWorktreePath: () => "/worktrees/demo",
  goMenu: () => undefined,
  manualWorktreePath: "",
  recordPickIndex: 0,
  requestQuit: () => undefined,
  setCommandPreview: () => undefined,
  setFormError: () => undefined,
  setManualWorktreePath: () => undefined,
  setPendingNpmRun: () => undefined,
  setPhase: () => undefined,
  setRequiredConfirmToken: () => undefined,
};

describe("worktree OpenTUI npm panels", () => {
  it("exposes valid React components for record-scoped forms and guarded npm panels", () => {
    const start = React.createElement(WorktreeStackKit_OpenTuiActionScrollStartFormPanel, {
      ...baseRecordProps,
      flow: "start",
      phase: "form",
      setStartOpenWindsurf: () => undefined,
      startOpenWindsurf: false,
    });
    const destroy = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel,
      {
        ...baseRecordProps,
        destroyPrune: false,
        flow: "destroy",
        phase: "form",
        setDestroyPrune: () => undefined,
      },
    );
    const update = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel,
      {
        ...baseRecordProps,
        flow: "updateFromMain",
        phase: "form",
        setUpdateExec: () => undefined,
        setUpdateMode: () => undefined,
        targetBranch: "main",
        updateExec: "plan",
        updateMode: "live-worktree",
      },
    );
    const merge = React.createElement(WorktreeStackKit_OpenTuiActionScrollMergeFormPanel, {
      ...baseRecordProps,
      flow: "merge",
      mergeExec: "plan",
      phase: "form",
      setMergeExec: () => undefined,
      targetBranch: "main",
    });
    const preview = React.createElement(WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel, {
      commandPreview: "npm run worktrees:destroy -- --worktree /worktrees/demo",
      flow: "destroy",
      goMenu: () => undefined,
      pendingNpmRun: { forwarded: ["--worktree", "/worktrees/demo"], script: "worktrees:destroy" },
      phase: "preview",
      poolKind: "list",
      requestQuit: () => undefined,
      requiredConfirmToken: "DESTROY",
      runNpmScript: async () => undefined,
      setConfirmTokenInput: () => undefined,
      setPendingNpmRun: () => undefined,
      setPhase: () => undefined,
      setRequiredConfirmToken: () => undefined,
    });
    const confirm = React.createElement(WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel, {
      confirmTokenInput: "DESTROY",
      formError: "",
      goMenu: () => undefined,
      pendingNpmRun: { forwarded: ["--worktree", "/worktrees/demo"], script: "worktrees:destroy" },
      phase: "confirm",
      requestQuit: () => undefined,
      requiredConfirmToken: "DESTROY",
      runNpmScript: async () => undefined,
      setConfirmTokenInput: () => undefined,
      setFormError: () => undefined,
      setPhase: () => undefined,
    });

    for (const element of [start, destroy, update, merge, preview, confirm]) {
      assert.equal(React.isValidElement(element), true);
    }
  });
});
