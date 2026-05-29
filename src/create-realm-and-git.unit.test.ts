/**
 * @fileoverview Verifies realm slug normalization, prepared-worktree metadata discovery, realm
 * assignment reuse versus allocator paths, and create-worktree folder naming for the create-realm
 * helpers in `worktree-kit`.
 *
 * This file owns regression coverage for pure filesystem-backed branches of the create-realm flow
 * using temporary directories and synthetic `.state/metadata.json` payloads.
 * Flow: write temp metadata -> invoke resolver helpers -> assert normalized slugs, paths, and
 * allocator call counts.
 *
 * @testing Node.js test runner (tsx): npm run worktree-kit:test from the repository root and confirm the create-realm-and-git suites pass.
 *
 * @see packages/worktree-kit/src/create-realm-and-git.ts - Implementation under test that normalizes realm slugs, resolves realm assignment from metadata or allocator, picks newest matching prepared metadata, and derives the dated worktree folder path.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - File-overview contract this test module header follows for verification and cross-navigation.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_findExistingPreparedWorktreeMetadataPath,
  WorktreeStackKit_normalizeCreateRealmSlug,
  WorktreeStackKit_resolveCreateRealmAssignment,
  WorktreeStackKit_resolveCreateWorktreePath,
  type WorktreeStackKit_CreateRealmAndGitConfig,
  type WorktreeStackKit_CreateRealmAndGitContext,
} from "./create-realm-and-git.js";

function makeContext(tempDir: string): WorktreeStackKit_CreateRealmAndGitContext {
  return {
    currentStep: "initialization",
    options: {
      baseBranch: "main",
      requestedRealmSlug: "",
      rootBranch: "codex/example-stack",
      stackName: "example-stack",
      submoduleBranch: "codex/example-stack",
      worktreeFolderDateToken: "260520",
      worktreesBase: path.join(tempDir, "worktrees"),
    },
    realmAssignmentSource: "",
    realmSlug: "",
    rootDir: path.join(tempDir, "repo"),
    worktreePath: "",
  };
}

function makeConfig(
  assignment = { realmAssignmentSource: "allocator", realmSlug: "Example Realm" },
): WorktreeStackKit_CreateRealmAndGitConfig {
  return {
    allocateRealm: () => assignment,
    configuredSubmodules: {
      appSubmodulePaths: ["service-a", "service-b"],
    },
    defaultFallbackBaseBranch: "main",
    defaultRealmAssignmentSource: "stack-name",
    metadataRelativePath: path.join(".state", "metadata.json"),
    realmAssignmentSourceMetadataField: "realmAssignmentSource",
    realmMetadataField: "realmSlug",
    remoteName: "origin",
    requiredSubmoduleManifestRelativePaths: [
      path.join("service-a", "package.json"),
      path.join("service-b", "package.json"),
    ],
    rootBranchMetadataField: "rootBranch",
    stackNameMetadataField: "stackName",
    submoduleBranchMetadataField: "submoduleBranch",
    worktreePathMetadataField: "worktreePath",
  };
}

function writeMetadata(worktreePath: string, values: Record<string, string>): string {
  const metadataPath = path.join(worktreePath, ".state", "metadata.json");
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(metadataPath, `${JSON.stringify(values, null, 2)}\n`);
  return metadataPath;
}

describe("WorktreeStackKit_normalizeCreateRealmSlug", () => {
  it("lowercases, strips boundaries, and replaces invalid characters", () => {
    assert.equal(
      WorktreeStackKit_normalizeCreateRealmSlug("  Example Realm!! "),
      "example-realm",
    );
  });
});

describe("WorktreeStackKit_findExistingPreparedWorktreeMetadataPath", () => {
  it("selects existing metadata matching stack and branch identity", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-realm-"));
    const context = makeContext(tempDir);
    const config = makeConfig();
    const older = path.join(context.options.worktreesBase, "260519R-OLDER");
    const newer = path.join(context.options.worktreesBase, "260520R-NEWER");
    writeMetadata(older, {
      rootBranch: context.options.rootBranch,
      stackName: context.options.stackName,
      submoduleBranch: context.options.submoduleBranch,
    });
    const expected = writeMetadata(newer, {
      rootBranch: context.options.rootBranch,
      stackName: context.options.stackName,
      submoduleBranch: context.options.submoduleBranch,
    });

    assert.equal(
      WorktreeStackKit_findExistingPreparedWorktreeMetadataPath({
        config,
        context,
      }),
      expected,
    );
  });
});

describe("WorktreeStackKit_resolveCreateRealmAssignment", () => {
  it("reuses existing metadata before invoking the allocator", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-realm-"));
    const context = makeContext(tempDir);
    const existingWorktreePath = path.join(context.options.worktreesBase, "existing");
    writeMetadata(existingWorktreePath, {
      realmAssignmentSource: "existing-metadata",
      realmSlug: "existing-realm",
      rootBranch: context.options.rootBranch,
      stackName: context.options.stackName,
      submoduleBranch: context.options.submoduleBranch,
      worktreePath: existingWorktreePath,
    });
    let allocationCalls = 0;
    const config: WorktreeStackKit_CreateRealmAndGitConfig = {
      ...makeConfig(),
      allocateRealm: () => {
        allocationCalls += 1;
        return { realmSlug: "new-realm" };
      },
    };

    WorktreeStackKit_resolveCreateRealmAssignment({ config, context });

    assert.equal(allocationCalls, 0);
    assert.equal(context.realmSlug, "existing-realm");
    assert.equal(context.realmAssignmentSource, "existing-metadata");
    assert.equal(context.worktreePath, existingWorktreePath);
  });

  it("normalizes allocator output when no existing metadata matches", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-realm-"));
    const context = makeContext(tempDir);

    WorktreeStackKit_resolveCreateRealmAssignment({
      config: makeConfig({ realmAssignmentSource: "manual", realmSlug: "Manual Realm" }),
      context,
    });

    assert.equal(context.currentStep, "resolve-realm-assignment");
    assert.equal(context.realmSlug, "manual-realm");
    assert.equal(context.realmAssignmentSource, "manual");
  });
});

describe("WorktreeStackKit_resolveCreateWorktreePath", () => {
  it("fills the path using the folder naming contract", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-path-"));
    const context = makeContext(tempDir);
    context.realmSlug = "manual-realm";

    WorktreeStackKit_resolveCreateWorktreePath(context);

    assert.equal(context.currentStep, "resolve-worktree-path");
    assert.equal(
      context.worktreePath,
      path.join(context.options.worktreesBase, "260520RMR-EXAMPLE-STACK"),
    );
  });
});
