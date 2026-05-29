/**
 * @fileoverview Verifies injectable post-provision helpers used after a prepared worktree exists:
 * artifact generation, optional install, best-effort hooks, editor launch, summary printing, and
 * same-terminal startup selection.
 *
 * This file owns regression coverage for `WorktreeStackKit_*` helpers in create-post-provision
 * using temp directories and a local `WorktreeStackKit_CreatePostProvisionConfig` fixture.
 * Flow: build fixture config and context -> invoke helper -> assert filesystem, process exit, or
 * console side effects.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-post-provision.unit.test.ts
 *
 * @see packages/worktree-kit/src/create-post-provision.ts - Post-provision orchestration surface under test whose artifact, install, hook, editor, summary, and terminal helpers are asserted here.
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create command that imports these helpers into the interactive create path so behavioral regressions in this spec surface at that entrypoint.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting the create-post-provision module validated indirectly by this spec.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_generateCreateArtifacts,
  WorktreeStackKit_openCreateEditor,
  WorktreeStackKit_printCreateSummary,
  WorktreeStackKit_runCreateBestEffortHook,
  WorktreeStackKit_runCreateInstallIfRequested,
  WorktreeStackKit_startCreateInCurrentTerminal,
  type WorktreeStackKit_CreatePostProvisionConfig,
  type WorktreeStackKit_CreatePostProvisionContext,
} from "./create-post-provision.js";

function makeContext(tempDir: string): WorktreeStackKit_CreatePostProvisionContext {
  return {
    currentStep: "initialization",
    derivedPorts: new Map([["web", 3001]]),
    installCleanlinessStatus: "unknown",
    integrationStatuses: new Map([["editor", "not checked"]]),
    options: {
      baseBranch: "main",
      branchPrefix: "codex",
      installPreferOffline: true,
      installSkipExisting: false,
      metadataSource: "unit-test",
      openWindsurf: false,
      rootBranch: "codex/example",
      runInstall: false,
      slot: 3,
      stackName: "example",
      startMode: "none",
      submoduleBranch: "codex/example",
      worktreesBase: path.join(tempDir, "worktrees"),
    },
    primaryWorkspacePath: path.join(tempDir, "primary"),
    realmAssignmentSource: "unit-test",
    realmSlug: "example",
    rootDir: tempDir,
    runtimeMachineRoot: path.join(tempDir, "runtime"),
    worktreePath: path.join(tempDir, "worktree"),
  };
}

function makeConfig(
  tempDir: string,
  overrides: Partial<WorktreeStackKit_CreatePostProvisionConfig> = {},
): WorktreeStackKit_CreatePostProvisionConfig {
  const artifactPath = JSON.stringify(path.join(tempDir, "artifact.txt"));
  return {
    buildArtifactCommand: () => ({
      args: ["-e", `require('fs').writeFileSync(${artifactPath}, 'ok')`],
      command: process.execPath,
    }),
    buildGeneratedSyncTargets: () => [],
    buildInstallArgs: () => ["-e", "process.exit(0)"],
    buildStartTerminalCommand: () => ({
      args: ["-e", "process.exit(7)"],
      command: process.execPath,
    }),
    installCommand: process.execPath,
    installSkippedStatus: "install skipped",
    installVerifiedStatus: "verified clean",
    launchEditor: () => undefined,
    launchEditorDisabledMessage: "editor disabled",
    launchEditorStartModeMessage: (startMode) => `start mode ${startMode}`,
    renderSummary: (context) => `summary:${context.realmSlug}`,
    resolveCleanlinessTargets: ({ installTargets }) => installTargets,
    resolveInstallTargets: (context) => [
      {
        label: "worktree",
        root: context.worktreePath,
      },
    ],
    startInWindow: () => undefined,
    terminalStartMode: "terminal",
    windowStartMode: "iterm",
    ...overrides,
  };
}

describe("WorktreeStackKit_generateCreateArtifacts", () => {
  it("runs the configured artifact command", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-provision-"));
    WorktreeStackKit_generateCreateArtifacts({
      config: makeConfig(tempDir),
      context: makeContext(tempDir),
    });

    assert.equal(fs.readFileSync(path.join(tempDir, "artifact.txt"), "utf8"), "ok");
  });
});

describe("WorktreeStackKit_runCreateInstallIfRequested", () => {
  it("returns the configured skip status when install is disabled", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-provision-"));

    assert.equal(
      WorktreeStackKit_runCreateInstallIfRequested({
        config: makeConfig(tempDir),
        context: makeContext(tempDir),
      }),
      "install skipped",
    );
  });
});

describe("WorktreeStackKit_runCreateBestEffortHook", () => {
  it("returns false for a failing non-fatal hook", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-provision-"));
    const context = makeContext(tempDir);

    assert.equal(
      WorktreeStackKit_runCreateBestEffortHook({
        context,
        hook: {
          failureWarning: "hook failed",
          spec: {
            args: ["-e", "process.exit(2)"],
            command: process.execPath,
          },
          step: "hook-step",
        },
      }),
      false,
    );
    assert.equal(context.currentStep, "hook-step");
  });
});

describe("editor, summary, and terminal helpers", () => {
  it("skips editor launch when the open flag is disabled", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-provision-"));
    let launched = false;

    WorktreeStackKit_openCreateEditor({
      config: makeConfig(tempDir, {
        launchEditor: () => {
          launched = true;
        },
      }),
      context: makeContext(tempDir),
    });

    assert.equal(launched, false);
  });

  it("prints the configured summary", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-provision-"));
    const originalLog = console.log;
    const lines: string[] = [];
    console.log = (value: unknown): void => {
      lines.push(String(value));
    };
    try {
      WorktreeStackKit_printCreateSummary({
        config: makeConfig(tempDir),
        context: makeContext(tempDir),
      });
    } finally {
      console.log = originalLog;
    }

    assert.deepEqual(lines, ["summary:example"]);
  });

  it("returns null when same-terminal startup is not selected", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "post-provision-"));

    assert.equal(
      WorktreeStackKit_startCreateInCurrentTerminal({
        config: makeConfig(tempDir),
        context: makeContext(tempDir),
      }),
      null,
    );
  });
});
