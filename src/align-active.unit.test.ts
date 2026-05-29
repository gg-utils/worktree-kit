/**
 * @fileoverview Verifies pure helper decisions for config-driven sequential align-active: refresh
 * mode selection from dirty state, dirty-remote handling policies, validation target ordering, and
 * operation plan sequencing without touching git or the filesystem.
 *
 * This file owns regression coverage for `WorktreeStackKit_createAlignActive` planning and
 * decision helpers used before command-layer orchestration runs merge and refresh entrypoints.
 * Flow: construct stub config plus metadata -> call factory helpers -> assert returned modes,
 * actions, validation targets, and human-readable plan lines.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/align-active.unit.test.ts
 *
 * @see packages/worktree-kit/src/align-active.ts - Factory surface under test exposing refresh-mode, dirty-remote, validation-order, and operation-plan helpers asserted here without filesystem or git I/O.
 * @see packages/worktree-kit/src/align-active-command.ts - Sequential align-active command that wires argv and runtime orchestration atop the helpers verified in this suite.
 * @see packages/worktree-kit/src/align-active-command.unit.test.ts - Adjacent command-layer tests for parse and plan-report behavior complementary to these helper-focused assertions.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_createAlignActive,
  type WorktreeAlignActiveMetadata,
  type WorktreeStackKit_AlignActiveConfig,
} from "./align-active.js";

const TEST_METADATA: WorktreeAlignActiveMetadata = {
  metadataPath: "/repo/worktrees/worktree-a/.state/worktree/metadata.json",
  rootBranch: "task/worktree-a",
  stackName: "worktree-a",
  submoduleBranch: "task/worktree-a",
  worktreePath: "/repo/worktrees/worktree-a",
};

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

describe("WorktreeStackKit_alignActive refresh mode decisions", () => {
  it("selects live-worktree when the selected repos are clean", () => {
    const alignActive = WorktreeStackKit_createAlignActive(
      alignActiveTestConfig(),
    );

    assert.equal(
      alignActive.worktreeStackAlignActiveDetermineRefreshModeFromDirtyState({
        requestedRefreshMode: "auto",
        rootDirty: false,
        submoduleDirtyStates: {
          "service-api": false,
          "service-web": false,
        },
      }),
      "live-worktree",
    );
  });

  it("selects pushed-only when any selected repo remains dirty", () => {
    const alignActive = WorktreeStackKit_createAlignActive(
      alignActiveTestConfig(),
    );

    assert.equal(
      alignActive.worktreeStackAlignActiveDetermineRefreshModeFromDirtyState({
        requestedRefreshMode: "auto",
        rootDirty: false,
        submoduleDirtyStates: {
          "service-api": false,
          "service-web": true,
        },
      }),
      "pushed-only",
    );
  });
});

describe("WorktreeStackKit_alignActive dirty remote handling", () => {
  it("blocks dirty repos when dirty-policy is fail", () => {
    const alignActive = WorktreeStackKit_createAlignActive(
      alignActiveTestConfig(),
    );

    assert.deepEqual(
      alignActive.worktreeStackAlignActiveDecideDirtyRemoteHandling({
        dirtyPolicy: "fail",
        initialAheadCount: 0,
        initialBehindCount: 0,
        remoteBranchExists: true,
        repoIsDirty: true,
      }),
      {
        action: "error",
        message: "dirty-policy-fail",
      },
    );
  });

  it("requires checkpoint plus remote reconciliation when dirty and only behind", () => {
    const alignActive = WorktreeStackKit_createAlignActive(
      alignActiveTestConfig(),
    );

    assert.deepEqual(
      alignActive.worktreeStackAlignActiveDecideDirtyRemoteHandling({
        dirtyPolicy: "commit-and-push",
        initialAheadCount: 0,
        initialBehindCount: 2,
        remoteBranchExists: true,
        repoIsDirty: true,
      }),
      {
        action: "checkpoint-then-merge-remote",
      },
    );
  });
});

describe("WorktreeStackKit_alignActive validation and planning helpers", () => {
  it("keeps validation targets in required-submodules-first order", () => {
    const alignActive = WorktreeStackKit_createAlignActive(
      alignActiveTestConfig(),
    );

    assert.deepEqual(
      alignActive
        .worktreeStackAlignActiveBuildValidationTargets(TEST_METADATA)
        .map((target) => target.label),
      ["worktree-a-service-api", "worktree-a-service-web", "worktree-a-root"],
    );
  });

  it("keeps normalization, merge, refresh, and validation steps ordered around root sync", () => {
    const alignActive = WorktreeStackKit_createAlignActive(
      alignActiveTestConfig(),
    );

    const operationPlan = alignActive.buildAlignActiveOperationPlan({
      metadata: TEST_METADATA,
      refreshMode: "live-worktree",
      rootDir: "/repo",
      targetBranch: "main",
    });

    assert.deepEqual(operationPlan.slice(0, 3), [
      "normalize service-api /repo/worktrees/worktree-a/service-api:task/worktree-a",
      "normalize service-web /repo/worktrees/worktree-a/service-web:task/worktree-a",
      "normalize root /repo/worktrees/worktree-a:task/worktree-a",
    ]);
    assert.ok(
      operationPlan.includes(
        "sync repo-root checkout /repo:main once after the merge batch",
      ),
    );
    assert.equal(
      operationPlan[operationPlan.length - 1],
      "validate worktree-a-root /repo/worktrees/worktree-a: origin/main <= origin/task/worktree-a and repo clean",
    );
  });
});
