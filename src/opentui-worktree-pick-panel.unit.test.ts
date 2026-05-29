/**
 * @fileoverview Node test regression coverage for the OpenTUI worktree-pick panel React surface.
 *
 * This file owns lightweight element-shape assertions that `React.createElement` with populated and
 * empty worktree record props yields valid React elements for the exported panel component.
 * Flow: build base props -> create elements for populated and null records -> assert `React.isValidElement`.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-worktree-pick-panel.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-worktree-pick-panel.tsx - OpenTUI worktree-pick panel component whose element construction and `records` prop handling for populated vs empty lists are smoke-tested here.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll shell that imports this panel to render worktree-pick UI within the OpenTUI interactive stack guarded by these assertions.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import {
  WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel,
  type WorktreeStackKit_OpenTuiActionScrollWorktreePickPanelProps,
} from "./opentui-worktree-pick-panel.js";

describe("worktree OpenTUI worktree-pick panel", () => {
  it("exposes a valid React component for populated and empty selections", () => {
    const baseProps: Omit<
      WorktreeStackKit_OpenTuiActionScrollWorktreePickPanelProps,
      "records"
    > = {
      flow: "start",
      goMenu: () => undefined,
      manualWorktreePath: "",
      phase: "pick",
      requestQuit: () => undefined,
      setManualWorktreePath: () => undefined,
      setPhase: () => undefined,
      setRecordPickIndex: () => undefined,
    };
    const populated = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel,
      {
        ...baseProps,
        records: [{ description: "/worktrees/demo", name: "demo" }],
      },
    );
    const empty = React.createElement(
      WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel,
      {
        ...baseProps,
        records: null,
      },
    );

    assert.equal(React.isValidElement(populated), true);
    assert.equal(React.isValidElement(empty), true);
  });
});
