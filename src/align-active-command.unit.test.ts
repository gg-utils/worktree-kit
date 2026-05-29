/**
 * @fileoverview Verifies CLI parsing, validation errors, and plan-report output for the sequential
 * align-active command factory used by worktree-stack CLIs.
 *
 * This file owns regression coverage for `WorktreeStackKit_createAlignActiveCommand` argument
 * parsing and deterministic plan text without touching git or the filesystem.
 * Flow: build command with stubbed align-active config -> parse or build plan report -> assert structured args and report lines.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/align-active-command.unit.test.ts
 * @see packages/worktree-kit/src/align-active-command.ts - Command factory plus parse and plan-report helpers whose CLI-facing behavior is asserted here.
 * @see packages/worktree-kit/src/align-active.ts - Shared sequential align-active configuration types consumed by the stub config builders in this module.
 * @see packages/worktree-kit/src/align-active.unit.test.ts - Lower-level sequential align-active runner tests adjacent to the command surface covered here.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { WorktreeStackKit_AlignActiveConfig } from "./align-active.js";
import {
  WorktreeStackKit_createAlignActiveCommand,
  type WorktreeStackKit_AlignActiveCommandConfig,
} from "./align-active-command.js";

function alignActiveTestConfig(): WorktreeStackKit_AlignActiveConfig {
  return {
    mergeCommand: {
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
        commandLines: ["tool merge -- --worktree <path>"],
      },
    },
    metadataRelativePath: ".state/worktree/metadata.json",
    repoRootSync: {
      configuredSubmodules: {
        appSubmodulePaths: ["service-api", "service-web"],
      },
      requiredSubmodulePaths: ["service-api", "service-web"],
    },
    requiredSubmodulePaths: ["service-api", "service-web"],
    updateFromMainCommand: {
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
        commandLines: ["tool update-from-main -- --worktree <path>"],
      },
    },
  };
}

function alignActiveCommandTestConfig(): WorktreeStackKit_AlignActiveCommandConfig {
  return {
    alignActive: alignActiveTestConfig(),
    projectRoot: "/repo",
    requiredCommandNames: ["git"],
    usage: {
      commandLines: ["tool align-active -- [options]"],
    },
  };
}

describe("WorktreeStackKit_parseAlignActiveCliArgs", () => {
  it("parses explicit worktree selection with defaults", () => {
    const command = WorktreeStackKit_createAlignActiveCommand(
      alignActiveCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseAlignActiveCliArgs([
        "--worktree",
        "/tmp/worktree-a",
        "--worktree",
        "/tmp/worktree-b",
        "--plan",
      ]),
      {
        dirtyPolicy: "commit-and-push",
        executionMode: "plan",
        refreshMode: "auto",
        targetBranch: "main",
        worktreePaths: ["/tmp/worktree-a", "/tmp/worktree-b"],
      },
    );
  });

  it("rejects mutually exclusive execution modes", () => {
    const command = WorktreeStackKit_createAlignActiveCommand(
      alignActiveCommandTestConfig(),
    );

    assert.throws(
      () => command.parseAlignActiveCliArgs(["--plan", "--push"]),
      /Choose exactly one execution mode: --plan or --push\./u,
    );
  });

  it("rejects unsupported refresh modes", () => {
    const command = WorktreeStackKit_createAlignActiveCommand(
      alignActiveCommandTestConfig(),
    );

    assert.throws(
      () =>
        command.parseAlignActiveCliArgs([
          "--refresh-mode",
          "invalid",
          "--plan",
        ]),
      /Choose --refresh-mode auto, live-worktree, or pushed-only\./u,
    );
  });
});

describe("WorktreeStackKit_buildAlignActivePlanReport", () => {
  it("prints the plan header and ordered operations", () => {
    const command = WorktreeStackKit_createAlignActiveCommand(
      alignActiveCommandTestConfig(),
    );

    const report = command.buildAlignActivePlanReport(
      {
        metadataPath:
          "/repo/worktrees/worktree-a/.state/worktree/metadata.json",
        rootBranch: "task/worktree-a",
        stackName: "worktree-a",
        submoduleBranch: "task/worktree-a",
        worktreePath: "/repo/worktrees/worktree-a",
      },
      {
        dirtyPolicy: "commit-and-push",
        refreshMode: "live-worktree",
        targetBranch: "main",
      },
    );

    assert.match(report[0] ?? "", /Align-active plan for stack 'worktree-a'/u);
    assert.ok(report.includes("Operation order:"));
    assert.ok(
      report.includes(
        "- normalize service-api /repo/worktrees/worktree-a/service-api:task/worktree-a",
      ),
    );
    assert.ok(
      report.includes(
        "- sync repo-root checkout /repo:main once after the merge batch",
      ),
    );
    assert.equal(
      report[report.length - 1],
      "- validate worktree-a-root /repo/worktrees/worktree-a: origin/main <= origin/task/worktree-a and repo clean",
    );
  });
});
