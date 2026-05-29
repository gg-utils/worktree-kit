/**
 * @fileoverview Verifies argv parsing, usage rendering, default target discovery, and the
 * end-to-end sync runner for the config-driven local-workspace sync command.
 *
 * This file owns Node `node:test` regression coverage for `WorktreeStackKit_*` helpers imported from
 * `sync-local-workspaces.ts`, using temporary directories to exercise filesystem copy behavior and
 * the project-supplied `afterSyncTarget` hook without invoking live CLI wiring.
 * Flow: build synthetic workspaces -> parse args / resolve targets / run command -> assert copied
 * files, rewritten paths, and hook call order.
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/sync-local-workspaces.unit.test.ts
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root (package script runs tsx --test over worktree-kit unit tests, including this file).
 *
 * @see packages/worktree-kit/src/sync-local-workspaces.ts - Sync-local command module whose argument parser, usage renderer, target resolver, and `WorktreeStackKit_runSyncLocalWorkspacesCommand` entrypoint are asserted here against fixture filesystem layouts.
 * @see packages/worktree-kit/src/local-state-sync.ts - Local-state sync helpers invoked by the runner under test when copying configured files and directories into explicit target workspaces.
 * @see scripts/worktree-stack/commands/sync-local-files.ts - Worktree-stack CLI adapter that forwards argv and root `worktrees.config.ts` wiring into `WorktreeStackKit_runSyncLocalWorkspacesCommand`, representing the integration surface adjacent to these unit assertions.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  WorktreeStackKit_parseSyncLocalWorkspacesArgs,
  WorktreeStackKit_renderSyncLocalWorkspacesUsage,
  WorktreeStackKit_resolveSyncLocalWorkspaceTargets,
  WorktreeStackKit_runSyncLocalWorkspacesCommand,
  type WorktreeStackKit_SyncLocalWorkspacesConfig,
  type WorktreeStackKit_SyncLocalWorkspacesUsageConfig,
} from "./sync-local-workspaces.js";

function createUsage(): WorktreeStackKit_SyncLocalWorkspacesUsageConfig {
  return {
    commandLines: ["package-manager run sync-local -- [options]"],
    examples: ["package-manager run sync-local -- --worktree ../target"],
    notes: ["runs a project-supplied post-sync hook after each copied target"],
    syncedLocalStateLines: ["editor settings", "provider state directories"],
  };
}

function createConfig(options: {
  afterSyncTargets: string[];
  projectRoot: string;
}): WorktreeStackKit_SyncLocalWorkspacesConfig {
  const { afterSyncTargets, projectRoot } = options;
  return {
    afterSyncTarget: ({ targetWorkspacePath }) => {
      afterSyncTargets.push(targetWorkspacePath);
    },
    defaultSourceWorkspacePath: projectRoot,
    defaultWorktreesDirectoryName: "worktrees",
    localStateSync: {
      configuredSubmodules: { appSubmodulePaths: [] },
      detectableLocalDirectoryBasenames: [".tool-state"],
      rewriteWorkspacePathFiles: ["editor/config.toml"],
      syncableLocalDirectories: [".local-cache"],
      syncableLocalFiles: ["editor/config.toml"],
    },
    projectRoot,
    usage: createUsage(),
  };
}

test("WorktreeStackKit_renderSyncLocalWorkspacesUsage uses configured lines", () => {
  const usage = WorktreeStackKit_renderSyncLocalWorkspacesUsage(createUsage());

  assert.match(usage, /package-manager run sync-local/u);
  assert.match(usage, /editor settings/u);
  assert.match(usage, /project-supplied post-sync hook/u);
});

test("WorktreeStackKit_parseSyncLocalWorkspacesArgs supports repeatable targets", () => {
  assert.deepEqual(
    WorktreeStackKit_parseSyncLocalWorkspacesArgs({
      argv: [
        "--source-workspace",
        "/workspace/source",
        "--worktree",
        "/workspace/one",
        "--worktree",
        "/workspace/two",
      ],
      defaultSourceWorkspacePath: "/workspace/default",
      usage: createUsage(),
    }),
    {
      sourceWorkspacePath: "/workspace/source",
      targetWorktrees: ["/workspace/one", "/workspace/two"],
    },
  );
});

test("WorktreeStackKit_resolveSyncLocalWorkspaceTargets discovers git-marked siblings", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-targets-"));
  try {
    const canonicalRootWorkspacePath = path.join(temporaryRoot, "root");
    const defaultWorktreesBasePath = path.join(temporaryRoot, "worktrees");
    const targetPath = path.join(defaultWorktreesBasePath, "target");
    const ignoredPath = path.join(defaultWorktreesBasePath, "not-a-worktree");
    fs.mkdirSync(path.join(targetPath, ".git"), { recursive: true });
    fs.mkdirSync(ignoredPath, { recursive: true });

    assert.deepEqual(
      WorktreeStackKit_resolveSyncLocalWorkspaceTargets({
        canonicalRootWorkspacePath,
        defaultWorktreesBasePath,
        explicitTargets: [],
      }),
      [canonicalRootWorkspacePath, targetPath],
    );
  } finally {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
});

test("WorktreeStackKit_runSyncLocalWorkspacesCommand syncs explicit targets", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-sync-runner-"));
  const afterSyncTargets: string[] = [];
  try {
    const sourceWorkspacePath = path.join(temporaryRoot, "source");
    const targetWorkspacePath = path.join(temporaryRoot, "target");
    fs.mkdirSync(path.join(sourceWorkspacePath, "editor"), { recursive: true });
    fs.mkdirSync(path.join(sourceWorkspacePath, ".local-cache"), {
      recursive: true,
    });
    fs.mkdirSync(targetWorkspacePath, { recursive: true });
    fs.writeFileSync(
      path.join(sourceWorkspacePath, "editor", "config.toml"),
      path.join(sourceWorkspacePath, "editor", "config.toml"),
      "utf8",
    );
    fs.writeFileSync(
      path.join(sourceWorkspacePath, ".local-cache", "value.txt"),
      "cache\n",
      "utf8",
    );

    WorktreeStackKit_runSyncLocalWorkspacesCommand({
      argv: ["--worktree", targetWorkspacePath],
      config: createConfig({
        afterSyncTargets,
        projectRoot: sourceWorkspacePath,
      }),
    });

    assert.equal(
      fs.readFileSync(path.join(targetWorkspacePath, "editor", "config.toml"), "utf8"),
      path.join(targetWorkspacePath, "editor", "config.toml"),
    );
    assert.equal(
      fs.readFileSync(path.join(targetWorkspacePath, ".local-cache", "value.txt"), "utf8"),
      "cache\n",
    );
    assert.deepEqual(afterSyncTargets, [targetWorkspacePath]);
  } finally {
    fs.rmSync(temporaryRoot, { force: true, recursive: true });
  }
});
