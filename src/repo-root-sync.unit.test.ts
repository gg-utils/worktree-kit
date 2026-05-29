/**
 * @fileoverview Unit tests for config-driven repo-root sync helpers that must skip work safely when
 * branches are not `main` or when configured submodule paths are absent on disk.
 *
 * This file owns regression coverage for early-return branches that avoid git I/O on non-main
 * targets and tolerate missing submodule directories without throwing.
 * Flow: build minimal `WorktreeStackKit_RepoRootSyncConfig` -> call sync entrypoints -> assert
 * `assert.doesNotThrow` for skipped paths.
 *
 * @example
 * ```typescript
 * test("skips non-main target checkout without git I/O", () => {
 *   WorktreeStackKit_syncRepoRootTargetCheckout({
 *     config: { configuredSubmodules: { appSubmodulePaths: ["packages/app"] }, requiredSubmodulePaths: ["packages/app"] },
 *     rootDir: "/nonexistent-worktree-kit-root",
 *     targetBranch: "feature/demo",
 *   });
 * });
 * ```
 *
 * @testing Node.js test runner: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/repo-root-sync.unit.test.ts
 * @testing Node.js test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/repo-root-sync.ts - Production repo-root sync and submodule branch helpers whose skip/no-op behavior and missing-path guards are exercised here.
 * @see packages/worktree-kit/src/merge-command.ts - Merge workflow entrypoint that calls repo-root sync after submodule-first merges when aligning the root checkout with resolved gitlinks.
 * @see packages/worktree-kit/README.md - Package README documenting the `@gg-utils/worktree-kit/repo-root-sync` export surface these tests protect.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  WorktreeStackKit_syncRepoRootTargetCheckout,
  WorktreeStackKit_syncRequiredSubmoduleBranches,
  type WorktreeStackKit_RepoRootSyncConfig,
} from "./repo-root-sync.js";

function repoRootSyncTestConfig(
  requiredSubmodulePaths: readonly string[],
): WorktreeStackKit_RepoRootSyncConfig {
  return {
    configuredSubmodules: { appSubmodulePaths: requiredSubmodulePaths },
    requiredSubmodulePaths,
  };
}

test("WorktreeStackKit_syncRepoRootTargetCheckout skips non-main targets without git I/O", () => {
  const missingRoot = path.join(os.tmpdir(), "worktree-kit-missing-root");
  assert.doesNotThrow(() => {
    WorktreeStackKit_syncRepoRootTargetCheckout({
      config: repoRootSyncTestConfig(["packages/app"]),
      rootDir: missingRoot,
      targetBranch: "feature/demo",
    });
  });
});

test("WorktreeStackKit_syncRequiredSubmoduleBranches skips missing configured paths", () => {
  const sandboxRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "worktree-kit-root-sync-"),
  );
  try {
    assert.doesNotThrow(() => {
      WorktreeStackKit_syncRequiredSubmoduleBranches({
        branchName: "main",
        config: repoRootSyncTestConfig(["missing-submodule"]),
        rootDir: sandboxRoot,
      });
    });
  } finally {
    fs.rmSync(sandboxRoot, { force: true, recursive: true });
  }
});
