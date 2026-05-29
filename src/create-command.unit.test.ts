/**
 * @fileoverview Verifies the generic prepared-worktree create runner sequencing, env-materialization
 * branching, and failure exit path through a fully stubbed operations map.
 *
 * This file owns regression coverage for `WorktreeStackKit_runCreateCommand` without touching git,
 * filesystem IO, or editor integrations.
 * Flow: build test context and operations -> invoke runner -> assert ordered side-effect events and exit behavior.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/create-command.ts - Prepared-worktree create orchestration under test whose step order, materialize-vs-fallback env branch, and `exitProcess` failure handling are asserted via the stubbed operations map built here.
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create entrypoint that wires real operations into the same runner contract exercised here, so regressions in this suite surface in operator-facing create flows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_runCreateCommand,
  type WorktreeStackKit_CreateCommandContext,
  type WorktreeStackKit_CreateCommandOperations,
  type WorktreeStackKit_CreateCommandServiceRoot,
} from "./create-command.js";

type TestContext = WorktreeStackKit_CreateCommandContext & {
  materializeResult: boolean;
};

type TestServiceRoot = WorktreeStackKit_CreateCommandServiceRoot & {
  label: string;
};

function makeContext(materializeResult: boolean): TestContext {
  return {
    currentStep: "initialization",
    materializeResult,
    options: {
      submoduleBranch: "feature/example",
    },
    worktreePath: "/workspace/example",
  };
}

function makeOperations(
  events: string[],
): WorktreeStackKit_CreateCommandOperations<TestContext, TestServiceRoot> {
  const record = (event: string) => (): void => {
    events.push(event);
  };

  return {
    checkoutSubmoduleBranch: (_context, submoduleRoot, branchName) => {
      events.push(`checkout:${submoduleRoot}:${branchName}`);
    },
    configureWorktreeGitSafety: record("git-safety"),
    ensureRootBranchUpstream: record("root-upstream"),
    ensureSubmoduleBranchUpstream: (_context, submoduleRoot, branchName) => {
      events.push(`upstream:${submoduleRoot}:${branchName}`);
    },
    ensureWorktree: record("ensure-worktree"),
    exitProcess: (status) => {
      throw new Error(`exit:${String(status)}`);
    },
    generateWorktreeArtifacts: record("artifacts"),
    initializeSubmodules: record("submodules"),
    materializeWorktreeEnvFiles: (context) => {
      events.push("materialize");
      return context.materializeResult;
    },
    openWorktreeInEditor: record("open-editor"),
    prepareFallbackEnvFiles: (_context, serviceRoots) => {
      events.push(`fallback:${serviceRoots.map((root) => root.label).join(",")}`);
    },
    printDebugContext: record("debug"),
    printSummary: record("summary"),
    refreshWorktreeAliases: record("aliases"),
    registerWorktreeInFirstEditor: record("register-one"),
    registerWorktreeInSecondEditor: record("register-two"),
    requirePrerequisites: record("prerequisites"),
    resolveRealmAssignment: record("realm"),
    resolveServiceRoots: () => [
      { label: "service-a", root: "/workspace/example/service-a" },
      { label: "service-b", root: "/workspace/example/service-b" },
    ],
    resolveWorktreePath: record("path"),
    runInstallIfRequested: record("install"),
    startWorktreeInCurrentTerminal: record("start-terminal"),
    startWorktreeInWindow: record("start-window"),
    syncLocalAgentFiles: record("sync-local"),
    validateBaseBranchExists: record("base-branch"),
    validateGeneratedArtifacts: record("validate-artifacts"),
    validateTargetLocation: record("target"),
    validateUniqueWorktreeIdentity: record("identity"),
    warnIfPortsAreBusy: record("ports"),
    writeRuntimeEnvFile: record("runtime-env"),
  };
}

describe("WorktreeStackKit_runCreateCommand", () => {
  it("runs the full sequence and skips fallback env when materialization succeeds", () => {
    const events: string[] = [];

    WorktreeStackKit_runCreateCommand({
      context: makeContext(true),
      operations: makeOperations(events),
    });

    assert.deepEqual(events, [
      "prerequisites",
      "base-branch",
      "realm",
      "path",
      "target",
      "identity",
      "ports",
      "ensure-worktree",
      "git-safety",
      "root-upstream",
      "submodules",
      "checkout:/workspace/example/service-a:feature/example",
      "upstream:/workspace/example/service-a:feature/example",
      "checkout:/workspace/example/service-b:feature/example",
      "upstream:/workspace/example/service-b:feature/example",
      "sync-local",
      "materialize",
      "artifacts",
      "validate-artifacts",
      "install",
      "register-one",
      "register-two",
      "open-editor",
      "start-window",
      "aliases",
      "summary",
      "start-terminal",
    ]);
  });

  it("runs fallback env preparation when materialization requests it", () => {
    const events: string[] = [];

    WorktreeStackKit_runCreateCommand({
      context: makeContext(false),
      operations: makeOperations(events),
    });

    assert.equal(events.includes("fallback:service-a,service-b"), true);
    assert.equal(events.includes("runtime-env"), true);
  });

  it("prints debug context and exits with failure status on errors", () => {
    const events: string[] = [];
    const operations = makeOperations(events);
    operations.validateBaseBranchExists = () => {
      throw new Error("bad branch");
    };

    assert.throws(
      () =>
        WorktreeStackKit_runCreateCommand({
          context: makeContext(true),
          operations,
        }),
      /exit:1/u,
    );
    assert.deepEqual(events, ["prerequisites", "debug"]);
  });
});
