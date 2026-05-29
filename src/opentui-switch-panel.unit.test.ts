/**
 * @fileoverview Verifies that the OpenTUI worktree switch panel exports valid React elements for the form and preview phases with minimal prop stubs.
 *
 * This file owns element-shape regression coverage for `WorktreeStackKit_OpenTuiActionScrollSwitchPanel`, asserting `React.isValidElement` for each phase without mounting OpenTUI runtime.
 * Flow: build canned props -> `React.createElement` for form and preview -> assert valid elements.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-switch-panel.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-switch-panel.tsx - Switch-flow form and preview panel module whose exported component element shapes are asserted here with stubbed callbacks and script paths.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll shell that composes the switch panel into guarded switch workflow steps alongside other package-owned OpenTUI surfaces.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_OpenTuiActionScrollSwitchPanel,
  type WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps,
} from "./opentui-switch-panel.js";

const baseProps: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps = {
  flow: "switch",
  formError: "",
  goMenu: () => undefined,
  phase: "form",
  requestQuit: () => undefined,
  runSpawn: async () => undefined,
  scriptPaths: { switch: "scripts/worktree-stack/commands/switch.ts" },
  setPhase: () => undefined,
  setSwitchModel: () => undefined,
  switchArgv: [],
  switchGoPreview: () => undefined,
  switchModel: { prefix: "", stackName: "", worktreesBase: "" },
  switchPreviewError: "",
  switchPreviewText: "npm run worktrees:switch --",
};

describe("worktree OpenTUI switch panel", () => {
  it("exposes valid React components for switch form and preview phases", () => {
    const form = React.createElement(WorktreeStackKit_OpenTuiActionScrollSwitchPanel, {
      ...baseProps,
      phase: "form",
    });
    const preview = React.createElement(WorktreeStackKit_OpenTuiActionScrollSwitchPanel, {
      ...baseProps,
      phase: "preview",
    });

    assert.equal(React.isValidElement(form), true);
    assert.equal(React.isValidElement(preview), true);
  });
});
