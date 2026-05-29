/**
 * @fileoverview Verifies config-driven merge-command helpers for argv parsing and merge plan
 * summaries without invoking git or touching real worktrees.
 *
 * This file owns regression coverage for `WorktreeStackKit_createMergeCommand` helpers:
 * `parseMergeCliArgs`, `buildMergePlanSummary`, and `buildMergeOperationPlan` using synthetic
 * config fixtures aligned with prepared-worktree merge workflows.
 * Flow: construct command from test config -> assert CLI parse results and human-readable plan strings.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/merge-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/merge-command.ts - Merge command implementation whose mutually exclusive execution modes, plan summaries, and ordered submodule-first operation strings are asserted here.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting merge helpers validated here so regressions surface through the public `@gg-utils/worktree-kit` import paths.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_createMergeCommand,
  type WorktreeStackKit_MergeCommandConfig,
} from "./merge-command.js";

function mergeCommandTestConfig(): WorktreeStackKit_MergeCommandConfig {
  return {
    mergeTmpRootRelativePath: ".state/worktree/merge",
    metadataRelativePath: ".state/worktree/metadata.json",
    projectRoot: "/repo",
    repoRootSync: {
      configuredSubmodules: {
        appSubmodulePaths: ["service-api", "service-web"],
      },
      requiredSubmodulePaths: ["service-api", "service-web"],
    },
    requiredCommandNames: ["git"],
    requiredSubmodules: [
      { path: "service-api", planLabel: "api" },
      { path: "service-web", planLabel: "web" },
    ],
    usage: {
      commandLines: ["tool merge -- --worktree <path> [options]"],
    },
  };
}

describe("WorktreeStackKit_parseMergeCliArgs", () => {
  it("parses audit mode", () => {
    const command = WorktreeStackKit_createMergeCommand(
      mergeCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseMergeCliArgs(["--worktree", "/tmp/worktree", "--audit"]),
      {
        executionMode: "audit",
        skipBatchWriterLock: false,
        skipRootSync: false,
        targetBranch: "main",
        trustWorktreeSubmoduleState: false,
        worktreePath: "/tmp/worktree",
      },
    );
  });

  it("rejects mutually exclusive execution modes", () => {
    const command = WorktreeStackKit_createMergeCommand(
      mergeCommandTestConfig(),
    );

    assert.throws(
      () =>
        command.parseMergeCliArgs([
          "--worktree",
          "/tmp/worktree",
          "--plan",
          "--audit",
        ]),
      /--push, --plan, and --audit are mutually exclusive/u,
    );
  });

  it("rejects missing execution mode", () => {
    const command = WorktreeStackKit_createMergeCommand(
      mergeCommandTestConfig(),
    );

    assert.throws(
      () => command.parseMergeCliArgs(["--worktree", "/tmp/worktree"]),
      /Choose exactly one execution mode: --plan, --push, or --audit/u,
    );
  });
});

describe("merge planning", () => {
  it("mentions temp detached merge worktrees in the summary", () => {
    const command = WorktreeStackKit_createMergeCommand(
      mergeCommandTestConfig(),
    );
    const summary = command.buildMergePlanSummary({
      mergeTmpRoot: "/repo/.state/worktree/merge/run-1",
      rootBranch: "task/worktree-a",
      stackName: "worktree-a",
      submoduleBranch: "task/worktree-a",
      targetBranch: "main",
      worktreePath: "/repo/worktrees/worktree-a",
    });

    assert.match(summary, /temporary detached merge worktrees/u);
    assert.match(summary, /\/repo\/\.state\/worktree\/merge\/run-1/u);
    assert.match(summary, /- api: \/repo\/worktrees\/worktree-a\/service-api/u);
  });

  it("keeps required submodules before root in the operation plan", () => {
    const command = WorktreeStackKit_createMergeCommand(
      mergeCommandTestConfig(),
    );

    assert.deepEqual(
      command.buildMergeOperationPlan({
        mergeTmpRoot: "/tmp/run",
        rootBranch: "task/worktree-a",
        submoduleBranch: "task/worktree-a",
        targetBranch: "main",
        worktreePath: "/repo/worktrees/worktree-a",
      }),
      [
        "merge service-api /repo/worktrees/worktree-a/service-api:task/worktree-a -> origin/main via temp worktrees under /tmp/run",
        "merge service-web /repo/worktrees/worktree-a/service-web:task/worktree-a -> origin/main via temp worktrees under /tmp/run",
        "merge root /repo/worktrees/worktree-a:task/worktree-a -> origin/main via temp worktrees under /tmp/run",
      ],
    );
  });
});
