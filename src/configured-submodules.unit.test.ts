/**
 * @fileoverview Verifies configured-submodule listing from `.gitmodules` plus optional prepared-worktree
 * metadata branch overrides for the worktree-stack kit.
 *
 * This file owns regression coverage for `WorktreeStackKit_listConfiguredSubmodules` and
 * `WorktreeStackKit_listConfiguredSubmodulePaths` using ephemeral temp directories and synthetic
 * `.gitmodules` fixtures.
 * Flow: write `.gitmodules` (and optional metadata JSON) -> invoke list helpers -> assert branch names and paths.
 *
 * @example
 * ```typescript
 * test("reads .gitmodules branches", () => {
 *   assert.deepEqual(
 *     WorktreeStackKit_listConfiguredSubmodules({
 *       config: { appSubmodulePaths: ["packages/core"] },
 *       rootDir,
 *     }),
 *     [
 *       { branchName: "main", name: "packages/core", path: "packages/core" },
 *       { branchName: "docs-main", name: "packages/docs", path: "packages/docs" },
 *     ],
 *   );
 * });
 * ```
 *
 * @testing Node.js test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/configured-submodules.unit.test.ts
 * @testing Node.js test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/configured-submodules.ts - Runtime helpers under test whose `.gitmodules` parsing and metadata-driven branch override behavior is asserted here.
 * @see worktrees.config.ts - Root workspace adapter that imports these list helpers to drive platform worktree submodule expectations.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  WorktreeStackKit_listConfiguredSubmodulePaths,
  WorktreeStackKit_listConfiguredSubmodules,
} from "./configured-submodules.js";

function writeGitmodules(rootDir: string): void {
  fs.writeFileSync(
    path.join(rootDir, ".gitmodules"),
    [
      '[submodule "packages/core"]',
      "\tpath = packages/core",
      "\turl = git@example.test:core.git",
      "\tbranch = main",
      '[submodule "packages/docs"]',
      "\tpath = packages/docs",
      "\turl = git@example.test:docs.git",
      "\tbranch = docs-main",
      "",
    ].join("\n"),
    "utf8",
  );
}

void test("WorktreeStackKit_listConfiguredSubmodules reads .gitmodules branches", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-submodules-"));
  try {
    writeGitmodules(rootDir);

    assert.deepEqual(
      WorktreeStackKit_listConfiguredSubmodules({
        config: { appSubmodulePaths: ["packages/core"] },
        rootDir,
      }),
      [
        { branchName: "main", name: "packages/core", path: "packages/core" },
        {
          branchName: "docs-main",
          name: "packages/docs",
          path: "packages/docs",
        },
      ],
    );
    assert.deepEqual(
      WorktreeStackKit_listConfiguredSubmodulePaths({
        config: { appSubmodulePaths: ["packages/core"] },
        rootDir,
      }),
      ["packages/core", "packages/docs"],
    );
  } finally {
    fs.rmSync(rootDir, { force: true, recursive: true });
  }
});

void test("WorktreeStackKit_listConfiguredSubmodules applies metadata branch override", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-submodule-override-"));
  try {
    writeGitmodules(rootDir);
    const metadataDirectory = path.join(rootDir, ".tmp", "worktree-stack");
    fs.mkdirSync(metadataDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(metadataDirectory, "metadata.json"),
      JSON.stringify({ submoduleBranch: "feature/shared" }),
      "utf8",
    );

    assert.deepEqual(
      WorktreeStackKit_listConfiguredSubmodules({
        config: { appSubmodulePaths: ["packages/core"] },
        rootDir,
      }),
      [
        {
          branchName: "feature/shared",
          name: "packages/core",
          path: "packages/core",
        },
        {
          branchName: "docs-main",
          name: "packages/docs",
          path: "packages/docs",
        },
      ],
    );
  } finally {
    fs.rmSync(rootDir, { force: true, recursive: true });
  }
});
