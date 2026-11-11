/**
 * @fileoverview Verifies config-driven local file, directory, and path-rewrite sync helpers used
 * when mirroring operator-local state into a target prepared-worktree workspace.
 *
 * This file owns regression coverage for `WorktreeStackKit_syncLocalFilesIntoTarget`,
 * `WorktreeStackKit_syncLocalDirectoriesIntoTarget`, and `WorktreeStackKit_detectLocalDirectories`
 * using ephemeral temp directories, synthetic `.gitmodules`, and representative config fixtures.
 * Flow: write source workspace fixtures -> invoke sync/detect helpers -> assert copied files,
 * directory trees, and rewritten workspace paths in text config.
 *
 * @example
 * ```typescript
 * test("copies configured files into target workspace", () => {
 *   WorktreeStackKit_syncLocalFilesIntoTarget({
 *     config: createConfig(),
 *     sourceWorkspacePath,
 *     targetWorkspacePath,
 *   });
 *   assert.equal(fs.readFileSync(path.join(targetWorkspacePath, "AGENTS.generated.md"), "utf8"), "# generated\n");
 * });
 * ```
 *
 * @testing Node.js test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/local-state-sync.unit.test.ts
 * @testing Node.js test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/local-state-sync.ts - Runtime sync and detection helpers under test whose filesystem copy, submodule scan, and workspace-path rewrite behavior is asserted here.
 * @see packages/worktree-kit/src/sync-local-workspaces.ts - Workspace orchestration module that imports these helpers to mirror configured local state across prepared worktrees.
 * @see packages/worktree-kit/src/create-env-orchestration.ts - Create-flow orchestration that calls the same sync primitives when seeding agent or operator state into a new worktree path.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  WorktreeStackKit_detectLocalDirectories,
  WorktreeStackKit_syncLocalDirectoriesIntoTarget,
  WorktreeStackKit_syncLocalFilesIntoTarget,
  type WorktreeStackKit_LocalStateSyncConfig,
} from "./local-state-sync.js";

function createConfig(): WorktreeStackKit_LocalStateSyncConfig {
  return {
    configuredSubmodules: { appSubmodulePaths: ["packages/core"] },
    detectableLocalDirectoryBasenames: [".tool-state"],
    rewriteWorkspacePathFiles: ["editor/config.toml"],
    syncableLocalDirectories: [".local-cache"],
    syncableLocalFiles: ["AGENTS.generated.md", "editor/config.toml"],
  };
}

function writeGitmodules(rootDir: string): void {
  fs.writeFileSync(
    path.join(rootDir, ".gitmodules"),
    [
      '[submodule "packages/core"]',
      "\tpath = packages/core",
      "\turl = git@example.test:core.git",
      "\tbranch = main",
      "",
    ].join("\n"),
    "utf8",
  );
}

void test("WorktreeStackKit_syncLocalFilesIntoTarget copies files and rewrites text", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-local-files-"));
  try {
    const sourceWorkspacePath = path.join(temporaryRoot, "source");
    const targetWorkspacePath = path.join(temporaryRoot, "target");
    fs.mkdirSync(path.join(sourceWorkspacePath, "editor"), { recursive: true });
    fs.mkdirSync(targetWorkspacePath, { recursive: true });
    fs.writeFileSync(
      path.join(sourceWorkspacePath, "AGENTS.generated.md"),
      "# generated\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(sourceWorkspacePath, "editor", "config.toml"),
      `config_path = ${JSON.stringify(path.join(sourceWorkspacePath, "AGENTS.generated.md"))}\n`,
      "utf8",
    );

    WorktreeStackKit_syncLocalFilesIntoTarget({
      config: createConfig(),
      sourceWorkspacePath,
      targetWorkspacePath,
    });

    assert.equal(
      fs.readFileSync(path.join(targetWorkspacePath, "AGENTS.generated.md"), "utf8"),
      "# generated\n",
    );
    assert.match(
      fs.readFileSync(path.join(targetWorkspacePath, "editor", "config.toml"), "utf8"),
      new RegExp(path.join(targetWorkspacePath, "AGENTS.generated.md"), "u"),
    );
  } finally {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
});

void test("WorktreeStackKit_detectLocalDirectories scans root and configured submodules", () => {
  const sourceWorkspacePath = fs.mkdtempSync(
    path.join(os.tmpdir(), "worktree-kit-detect-local-dirs-"),
  );
  try {
    writeGitmodules(sourceWorkspacePath);
    fs.mkdirSync(path.join(sourceWorkspacePath, ".tool-state"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(sourceWorkspacePath, "packages", "core", ".tool-state"), {
      recursive: true,
    });

    assert.deepEqual(
      WorktreeStackKit_detectLocalDirectories({
        config: createConfig(),
        sourceWorkspacePath,
      }).sort(),
      [".tool-state", path.join("packages", "core", ".tool-state")].sort(),
    );
  } finally {
    fs.rmSync(sourceWorkspacePath, { force: true, recursive: true });
  }
});

void test("WorktreeStackKit_syncLocalDirectoriesIntoTarget copies local directories", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-local-dirs-"));
  try {
    const sourceWorkspacePath = path.join(temporaryRoot, "source");
    const targetWorkspacePath = path.join(temporaryRoot, "target");
    fs.mkdirSync(path.join(sourceWorkspacePath, ".local-cache"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(sourceWorkspacePath, ".tool-state"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(sourceWorkspacePath, ".local-cache", "value.txt"),
      "cache\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(sourceWorkspacePath, ".tool-state", "value.txt"),
      "state\n",
      "utf8",
    );
    fs.mkdirSync(targetWorkspacePath, { recursive: true });

    WorktreeStackKit_syncLocalDirectoriesIntoTarget({
      config: createConfig(),
      sourceWorkspacePath,
      targetWorkspacePath,
    });

    assert.equal(
      fs.readFileSync(path.join(targetWorkspacePath, ".local-cache", "value.txt"), "utf8"),
      "cache\n",
    );
    assert.equal(
      fs.readFileSync(path.join(targetWorkspacePath, ".tool-state", "value.txt"), "utf8"),
      "state\n",
    );
  } finally {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
});
