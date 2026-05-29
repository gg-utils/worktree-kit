/**
 * @fileoverview Verifies argv parsing, validation errors, and pure plan/summary helpers for the
 * config-driven prepared-worktree update-from-main command factory.
 *
 * This file owns Node `node:test` regression coverage for `WorktreeStackKit_createUpdateFromMainCommand`
 * surfaces that stay filesystem- and git-free (CLI parsing, thrown guidance, plan text, operation order).
 * Flow: build minimal factory config -> parse args or build plan/summary -> assert parsed fields and strings.
 *
 * @example
 * ```typescript
 * it("parses pushed-only plan mode", () => {
 *   const command = WorktreeStackKit_createUpdateFromMainCommand(updateFromMainCommandTestConfig());
 *   const parsed = command.parseUpdateFromMainCliArgs([
 *     "--worktree",
 *     "/tmp/worktree",
 *     "--mode",
 *     "pushed-only",
 *     "--plan",
 *   ]);
 *   assert.equal(parsed.refreshMode, "pushed-only");
 * });
 * ```
 *
 * @testing Node.js test runner (node:test): from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (package test glob includes this file).
 *
 * @see packages/worktree-kit/src/update-from-main-command.ts - Command factory, argv parser, and refresh orchestration whose pure helpers and error messages asserted here stay aligned with the shipped CLI contract without invoking git.
 * @see canonical-skills/worktrees-update-from-main/SKILL.md - Canonical operator workflow for live-worktree versus pushed-only refresh semantics that these tests lock to user-facing `--mode` and execution-mode validation text.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_createUpdateFromMainCommand,
  type WorktreeStackKit_UpdateFromMainCommandConfig,
} from "./update-from-main-command.js";

function updateFromMainCommandTestConfig(): WorktreeStackKit_UpdateFromMainCommandConfig {
  return {
    configuredSubmodules: {
      appSubmodulePaths: ["service-api", "service-web"],
    },
    metadataRelativePath: ".state/worktree/metadata.json",
    projectRoot: "/repo",
    refreshTmpRootRelativePath: ".state/worktree/update-from-main",
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
      commandLines: ["tool update-from-main -- --worktree <path> --mode <mode>"],
    },
  };
}

describe("WorktreeStackKit_parseUpdateFromMainCliArgs", () => {
  it("parses pushed-only plan mode", () => {
    const command = WorktreeStackKit_createUpdateFromMainCommand(
      updateFromMainCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseUpdateFromMainCliArgs([
        "--worktree",
        "/tmp/worktree",
        "--mode",
        "pushed-only",
        "--plan",
      ]),
      {
        executionMode: "plan",
        refreshMode: "pushed-only",
        skipBatchWriterLock: false,
        targetBranch: "main",
        trustWorktreeSubmoduleState: false,
        worktreePath: "/tmp/worktree",
      },
    );
  });

  it("rejects missing refresh mode", () => {
    const command = WorktreeStackKit_createUpdateFromMainCommand(
      updateFromMainCommandTestConfig(),
    );

    assert.throws(
      () =>
        command.parseUpdateFromMainCliArgs([
          "--worktree",
          "/tmp/worktree",
          "--plan",
        ]),
      /Choose --mode live-worktree or --mode pushed-only\./u,
    );
  });

  it("rejects missing execution mode", () => {
    const command = WorktreeStackKit_createUpdateFromMainCommand(
      updateFromMainCommandTestConfig(),
    );

    assert.throws(
      () =>
        command.parseUpdateFromMainCliArgs([
          "--worktree",
          "/tmp/worktree",
          "--mode",
          "live-worktree",
        ]),
      /Choose exactly one execution mode: --plan or --push\./u,
    );
  });
});

describe("update-from-main planning", () => {
  it("prints the pushed-only temp-worktree model in the summary", () => {
    const command = WorktreeStackKit_createUpdateFromMainCommand(
      updateFromMainCommandTestConfig(),
    );
    const summary = command.buildUpdateFromMainPlanSummary({
      refreshMode: "pushed-only",
      refreshTmpRoot: "/repo/.state/worktree/update-from-main/run-1",
      rootBranch: "task/worktree-a",
      stackName: "worktree-a",
      submoduleBranch: "task/worktree-a",
      targetBranch: "main",
      worktreePath: "/repo/worktrees/worktree-a",
    });

    assert.match(summary, /pushed-only refreshes only origin\/<worktree-branch> tips/u);
    assert.match(summary, /\/repo\/\.state\/worktree\/update-from-main\/run-1/u);
    assert.match(summary, /- api: \/repo\/worktrees\/worktree-a\/service-api/u);
  });

  it("keeps required submodules before root in the operation plan", () => {
    const command = WorktreeStackKit_createUpdateFromMainCommand(
      updateFromMainCommandTestConfig(),
    );

    assert.deepEqual(
      command.buildUpdateFromMainOperationPlan({
        refreshMode: "live-worktree",
        refreshTmpRoot: "/tmp/run",
        rootBranch: "task/worktree-a",
        submoduleBranch: "task/worktree-a",
        targetBranch: "main",
        worktreePath: "/repo/worktrees/worktree-a",
      }),
      [
        "refresh service-api /repo/worktrees/worktree-a/service-api:task/worktree-a <= origin/main via checked-out worktree branches",
        "refresh service-web /repo/worktrees/worktree-a/service-web:task/worktree-a <= origin/main via checked-out worktree branches",
        "refresh root /repo/worktrees/worktree-a:task/worktree-a <= origin/main via checked-out worktree branches",
      ],
    );
  });
});
