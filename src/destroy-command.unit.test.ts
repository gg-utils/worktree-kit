/**
 * @fileoverview Verifies the config-driven prepared-worktree destroy command helpers for argv
 * parsing and stack-name-to-worktree-path resolution.
 *
 * This file owns regression coverage for `WorktreeStackKit_parseDestroyCliArgs` and
 * `WorktreeStackKit_resolveDestroyWorktreePathFromStackName` using temp directories and synthetic
 * worktree-stack metadata without invoking git or configured cleanup hooks.
 * Flow: argv fixtures -> parse assertions; temp worktrees with metadata -> assert newest-directory selection by mtime.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/destroy-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/destroy-command.ts - Destroy command implementation whose argv parsing rules and stack-name resolution over prepared worktree metadata are asserted here.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting the destroy helpers validated here so regressions surface through the public `@gg-utils/worktree-kit` import paths.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  WorktreeStackKit_parseDestroyCliArgs,
  WorktreeStackKit_resolveDestroyWorktreePathFromStackName,
  type WorktreeStackKit_DestroyCommandConfig,
} from "./destroy-command.js";

const tempDirectories: string[] = [];

function createTempDirectory(prefix: string): string {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

function destroyCommandTestConfig(
  projectRoot: string,
): WorktreeStackKit_DestroyCommandConfig {
  return {
    defaultWorktreesDirectoryName: "worktrees",
    projectRoot,
    requiredCommandNames: [],
    requiredFiles: [],
    usageCommandLines: ["npm run worktrees:destroy -- [options]"],
  };
}

afterEach(() => {
  for (const directoryPath of tempDirectories.splice(0)) {
    fs.rmSync(directoryPath, { force: true, recursive: true });
  }
});

describe("WorktreeStackKit_parseDestroyCliArgs", () => {
  it("parses a direct worktree target", () => {
    const parsed = WorktreeStackKit_parseDestroyCliArgs({
      argv: ["--worktree", "/tmp/worktree", "--prune"],
      config: destroyCommandTestConfig("/repo"),
    });
    assert.equal(parsed?.prune, true);
    assert.equal(parsed?.stackName, "");
    assert.equal(parsed?.worktreePath, "/tmp/worktree");
  });

  it("rejects missing target selection", () => {
    assert.throws(
      () =>
        WorktreeStackKit_parseDestroyCliArgs({
          argv: [],
          config: destroyCommandTestConfig("/repo"),
        }),
      /Provide --worktree or --name\./u,
    );
  });

  it("rejects mutually exclusive target selectors", () => {
    assert.throws(
      () =>
        WorktreeStackKit_parseDestroyCliArgs({
          argv: ["--worktree", "/tmp/worktree", "--name", "stack-a"],
          config: destroyCommandTestConfig("/repo"),
        }),
      /Use only one of --worktree or --name\./u,
    );
  });
});

describe("WorktreeStackKit_resolveDestroyWorktreePathFromStackName", () => {
  it("selects the newest matching prepared worktree by metadata stackName", () => {
    const tempDirectory = createTempDirectory("worktree-destroy-");
    const worktreesBase = path.join(tempDirectory, "worktrees");

    const newerPath = path.join(worktreesBase, "260329WT02-STACK-A");
    const olderPath = path.join(worktreesBase, "260328WT01-STACK-A");
    fs.mkdirSync(path.join(newerPath, ".tmp", "worktree-stack"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(olderPath, ".tmp", "worktree-stack"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(newerPath, ".tmp", "worktree-stack", "metadata.json"),
      JSON.stringify({ stackName: "stack-a" }),
      "utf8",
    );
    fs.writeFileSync(
      path.join(olderPath, ".tmp", "worktree-stack", "metadata.json"),
      JSON.stringify({ stackName: "stack-a" }),
      "utf8",
    );
    const olderMtime = new Date(Date.now() - 60_000);
    fs.utimesSync(olderPath, olderMtime, olderMtime);
    fs.utimesSync(newerPath, new Date(), new Date());

    assert.equal(
      WorktreeStackKit_resolveDestroyWorktreePathFromStackName(
        worktreesBase,
        "stack-a",
      ),
      newerPath,
    );
  });
});
