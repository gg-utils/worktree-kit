/**
 * @fileoverview Verifies config-driven argv parsing and base create-context construction for
 * prepared-worktree creation flows.
 *
 * This file owns regression coverage for `WorktreeStackKit_parseCreateArgs` and
 * `WorktreeStackKit_buildCreateBaseContext` using an isolated temp project root and a local
 * `WorktreeStackKit_CreateCliContextConfig` fixture.
 * Flow: build fixture config -> parse argv -> assert normalized options; parse argv with explicit
 * worktree path -> build base context -> assert resolved filesystem paths and option mirrors.
 *
 * @example
 * ```typescript
 * it("parses defaults, branches, booleans, and explicit paths", () => {
 *   const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-ctx-root-"));
 *   const options = WorktreeStackKit_parseCreateArgs(
 *     ["--name", "feature-one", "--slot", "7"],
 *     createConfig(projectRoot),
 *   );
 *   assert.equal(options?.stackName, "feature-one");
 *   assert.equal(options?.slot, 7);
 * });
 * ```
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-cli-context.unit.test.ts
 *
 * @see packages/worktree-kit/src/create-cli-context.ts - Implementation under test that parses create argv against adapter config and materializes the generic base create context asserted here.
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create runner that merges parsed options and base context from create-cli-context before orchestration, so argv and path regressions covered here surface at that entrypoint.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting the create-cli-context surface validated by this spec.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_buildCreateBaseContext,
  WorktreeStackKit_parseCreateArgs,
  type WorktreeStackKit_CreateCliContextConfig,
} from "./create-cli-context.js";

function createConfig(projectRoot: string): WorktreeStackKit_CreateCliContextConfig {
  return {
    branchPrefixDefault: "agent",
    datePrefixEnvKey: "WORKTREE_DATE_TOKEN",
    defaultBaseBranch: "trunk",
    defaultMetadataSource: "workspace-stack",
    defaultWorktreesDirectoryName: "prepared-worktrees",
    environment: {
      WORKTREE_DATE_TOKEN: "260520",
    },
    localLogicalEnvironmentRelativePath: path.join(
      ".state",
      "env",
      "local.env",
    ),
    localStateSourceWorkspacePathEnvKey: "LOCAL_STATE_SOURCE_PATH",
    machineRootRelativePath: path.join(".state", "runtime"),
    primaryWorkspaceEnvRelativePath: ".env.runtime",
    projectRoot,
    usageText: "usage text",
  };
}

describe("WorktreeStackKit_parseCreateArgs", () => {
  it("parses defaults, branches, booleans, and explicit paths", () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-ctx-root-"));
    const config = createConfig(projectRoot);
    const options = WorktreeStackKit_parseCreateArgs(
      [
        "--name",
        "feature-one",
        "--slot",
        "7",
        "--prefix",
        "Tool",
        "--realm",
        "realm-one",
        "--worktrees-base",
        "../custom-worktrees",
        "--no-install",
        "--install-skip-existing",
        "--install-prefer-online",
        "--start-iterm",
        "--open-windsurf",
      ],
      config,
    );

    assert.deepEqual(options, {
      baseBranch: "trunk",
      branchPrefix: "tool",
      copyEnvFromMain: false,
      installPreferOffline: false,
      installSkipExisting: true,
      metadataSource: "workspace-stack",
      openWindsurf: true,
      requestedRealmSlug: "realm-one",
      rootBranch: "tool/feature-one",
      runInstall: false,
      slot: 7,
      stackName: "feature-one",
      startMode: "iterm",
      submoduleBranch: "tool/feature-one",
      worktreeFolderDateToken: "260520",
      worktreePathOverride: "",
      worktreesBase: "../custom-worktrees",
    });
  });

  it("returns null after printing usage for help", () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-ctx-help-"));
    assert.equal(
      WorktreeStackKit_parseCreateArgs(["--help"], createConfig(projectRoot)),
      null,
    );
  });

  it("rejects missing required name and slot", () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-ctx-bad-"));
    assert.throws(
      () => WorktreeStackKit_parseCreateArgs([], createConfig(projectRoot)),
      /--name and a positive integer --slot are required\./u,
    );
  });
});

describe("WorktreeStackKit_buildCreateBaseContext", () => {
  it("builds generic paths and honors explicit worktree path overrides", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-ctx-build-"));
    const projectRoot = path.join(tempRoot, "repo");
    const destinationRoot = path.join(tempRoot, "worktrees");
    fs.mkdirSync(projectRoot, { recursive: true });
    const explicitWorktreePath = path.join(destinationRoot, "feature-one");
    const config = createConfig(projectRoot);
    const parsedOptions = WorktreeStackKit_parseCreateArgs(
      [
        "--name",
        "feature-one",
        "--slot",
        "2",
        "--worktree-path",
        explicitWorktreePath,
      ],
      config,
    );
    if (parsedOptions === null) {
      throw new Error("Expected create options for explicit worktree path.");
    }

    const context = WorktreeStackKit_buildCreateBaseContext({
      config,
      createOptions: parsedOptions,
    });

    assert.equal(context.rootDir, projectRoot);
    assert.equal(context.primaryWorkspacePath, projectRoot);
    assert.equal(context.primaryWorkspaceEnvFile, path.join(projectRoot, ".env.runtime"));
    assert.equal(context.localStateSourceWorkspacePath, projectRoot);
    assert.equal(
      context.localLogicalEnvironmentFile,
      path.join(projectRoot, ".state", "env", "local.env"),
    );
    assert.equal(context.machineRoot, path.join(projectRoot, ".state", "runtime"));
    const realDestinationRoot = fs.realpathSync(destinationRoot);
    assert.equal(
      context.worktreePath,
      path.join(realDestinationRoot, "feature-one"),
    );
    assert.equal(context.options.worktreesBase, realDestinationRoot);
  });
});
