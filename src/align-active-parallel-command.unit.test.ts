/**
 * @fileoverview Verifies pure helpers on the staged parallel align-active command: CLI parsing,
 * run-id and artifact path formatting, and stable stage ordering for the config-driven runner.
 *
 * This file owns regression coverage for `WorktreeStackKit_createAlignActiveParallelCommand` wiring
 * without spawning subprocesses or touching the filesystem.
 * Flow: build minimal parallel command config -> invoke parse/metadata helpers -> assert shapes and errors.
 *
 * @example
 * ```typescript
 * it("parses explicit worktree selection with defaults", () => {
 *   const command = WorktreeStackKit_createAlignActiveParallelCommand(
 *     alignActiveParallelCommandTestConfig(),
 *   );
 *   assert.deepEqual(command.parseAlignActiveParallelCliArgs(["--worktree", "/tmp/a", "--plan"]), {
 *     dirtyPolicy: "commit-and-push",
 *     executionMode: "plan",
 *     refreshMode: "auto",
 *     targetBranch: "main",
 *     worktreePaths: ["/tmp/a"],
 *   });
 * });
 * ```
 *
 * @testing Node.js test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/align-active-parallel-command.unit.test.ts
 * @testing Node.js test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/align-active-parallel-command.ts - Factory and CLI parsing surface whose deterministic parse, run-id, artifact path, and stage-list behavior is asserted here.
 * @see packages/worktree-kit/src/align-active.ts - Shared align-active config types imported to construct the minimal parallel-command fixtures used by these tests.
 * @see canonical-skills/worktrees-align-active-parallel/SKILL.md - Platform workflow guidance for the staged parallel align-active process this command module implements.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { WorktreeStackKit_AlignActiveConfig } from "./align-active.js";
import {
  WorktreeStackKit_createAlignActiveParallelCommand,
  type WorktreeStackKit_AlignActiveParallelCommandConfig,
} from "./align-active-parallel-command.js";

function alignActiveParallelTestConfig(): WorktreeStackKit_AlignActiveConfig {
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

function alignActiveParallelCommandTestConfig(): WorktreeStackKit_AlignActiveParallelCommandConfig {
  return {
    alignActive: alignActiveParallelTestConfig(),
    artifactsRelativePath: ".state/worktree/align-active-parallel",
    projectRoot: "/repo",
    requiredCommandNames: ["git", "node"],
    stageProcess: {
      baseArgs: ["runner"],
      commandName: "tool",
      mergeEntrypoint: "merge-command",
      updateFromMainEntrypoint: "update-from-main-command",
    },
    usage: {
      commandLines: ["tool align-active-parallel -- [options]"],
    },
  };
}

describe("WorktreeStackKit_parseAlignActiveParallelCliArgs", () => {
  it("parses explicit worktree selection with defaults", () => {
    const command = WorktreeStackKit_createAlignActiveParallelCommand(
      alignActiveParallelCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseAlignActiveParallelCliArgs([
        "--worktree",
        "/tmp/worktree-a",
        "--plan",
      ]),
      {
        dirtyPolicy: "commit-and-push",
        executionMode: "plan",
        refreshMode: "auto",
        targetBranch: "main",
        worktreePaths: ["/tmp/worktree-a"],
      },
    );
  });

  it("rejects mutually exclusive execution modes", () => {
    const command = WorktreeStackKit_createAlignActiveParallelCommand(
      alignActiveParallelCommandTestConfig(),
    );

    assert.throws(
      () => command.parseAlignActiveParallelCliArgs(["--push", "--plan"]),
      /Choose exactly one execution mode: --plan or --push\./u,
    );
  });
});

describe("WorktreeStackKit_alignActiveParallel run metadata helpers", () => {
  it("formats the run id with the staged parallel prefix", () => {
    const command = WorktreeStackKit_createAlignActiveParallelCommand(
      alignActiveParallelCommandTestConfig(),
    );

    assert.equal(
      command.createAlignActiveParallelRunId(new Date(2026, 2, 30, 14, 5, 9)),
      "align-active-parallel-20260330-140509",
    );
  });

  it("builds the artifact path under the configured run root", () => {
    const command = WorktreeStackKit_createAlignActiveParallelCommand(
      alignActiveParallelCommandTestConfig(),
    );

    assert.equal(
      command.createAlignActiveParallelRunDir(
        "/repo",
        "align-active-parallel-20260330-140509",
      ),
      "/repo/.state/worktree/align-active-parallel/align-active-parallel-20260330-140509",
    );
  });

  it("keeps the staged sequence stable", () => {
    const command = WorktreeStackKit_createAlignActiveParallelCommand(
      alignActiveParallelCommandTestConfig(),
    );

    assert.deepEqual(command.listAlignActiveParallelStages(), [
      "discover",
      "audit",
      "normalize",
      "merge",
      "sync-root-main",
      "refresh",
      "validate",
    ]);
  });
});
