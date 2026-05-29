/**
 * @fileoverview Verifies that `WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel` constructs a valid
 * React element for representative diagnostics/pool submenu props.
 *
 * This file owns a minimal smoke check that the OpenTUI diagnostics/pool panel component remains a
 * valid React function component when wired with a canonical `WorktreeStackKit_OpenTuiDiagnosticsPoolCommands` fixture.
 * Flow: `React.createElement` with diagnostics flow props -> `React.isValidElement` must be true.
 *
 * @testing Node.js test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-diagnostics-pool-panel.unit.test.ts
 * @testing Node.js test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-diagnostics-pool-panel.tsx - OpenTUI diagnostics/pool panel component under test whose React element shape is asserted here.
 * @see packages/worktree-kit/src/opentui-action-scroll-diagnostics-pool-plans.ts - Command and planner contract that defines `WorktreeStackKit_OpenTuiDiagnosticsPoolCommands`, mirrored by the fixture passed into the panel props in this test.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel } from "./opentui-diagnostics-pool-panel.js";
import type { WorktreeStackKit_OpenTuiDiagnosticsPoolCommands } from "./opentui-action-scroll-diagnostics-pool-plans.js";

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

describe("WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel", () => {
  it("exposes a valid React component", () => {
    const element = React.createElement(
      WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel,
      {
        commands,
        flow: "diagnostics",
        formError: "",
        goMenu: () => undefined,
        phase: "submenu",
        poolKind: "list",
        poolNextStackName: "",
        requestQuit: () => undefined,
        setCommandPreview: () => undefined,
        setFormError: () => undefined,
        setPendingNpmRun: () => undefined,
        setPhase: () => undefined,
        setPoolKind: () => undefined,
        setPoolNextStackName: () => undefined,
        setRequiredConfirmToken: () => undefined,
      },
    );

    assert.equal(React.isValidElement(element), true);
  });
});
