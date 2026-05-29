/**
 * @fileoverview Node test regression coverage for worktree create preflight validation helpers.
 *
 * This file owns assertions for `WorktreeStackKit_validateCreateTargetLocation` and
 * `WorktreeStackKit_validateGeneratedCreateArtifacts`, including worktrees-base creation, rejection
 * of occupied non-worktree targets, and required generated-artifact presence.
 * Flow: build temp `WorktreeStackKit_CreatePreflightContext` + config -> invoke validators -> assert step transitions, filesystem state, and thrown errors.
 *
 * @testing Node.js test: cd packages/worktree-kit && npm run test -- src/create-preflight-validation.unit.test.ts
 *
 * @see packages/worktree-kit/src/create-preflight-validation.ts - Preflight validation module under test whose target-path and generated-artifact contracts are asserted here.
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create flow that calls these validators during provisioning so regressions in this spec map to real create paths.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_validateCreateTargetLocation,
  WorktreeStackKit_validateGeneratedCreateArtifacts,
  type WorktreeStackKit_CreatePreflightConfig,
  type WorktreeStackKit_CreatePreflightContext,
} from "./create-preflight-validation.js";

function makeContext(tempDir: string): WorktreeStackKit_CreatePreflightContext {
  return {
    currentStep: "initialization",
    options: {
      baseBranch: "main",
      slot: 3,
      worktreesBase: path.join(tempDir, "worktrees"),
    },
    primaryWorkspaceEnvFile: path.join(tempDir, ".env.runtime"),
    realmSlug: "realm-one",
    rootDir: path.join(tempDir, "repo"),
    worktreePath: path.join(tempDir, "worktrees", "realm-one"),
  };
}

function makeConfig(): WorktreeStackKit_CreatePreflightConfig {
  return {
    generatedArtifactRequirements: [
      {
        description: "runtime env",
        relativePath: ".env.runtime",
      },
      {
        description: "metadata",
        relativePath: path.join(".state", "metadata.json"),
      },
    ],
    metadataRelativePath: path.join(".state", "metadata.json"),
    primaryEnvMissingExpectedFileLabel: "expected-env",
    primaryEnvMissingWarning: "Primary env missing.",
    realmMetadataField: "realmSlug",
    requiredCommandNames: [],
    requiredDirectories: [],
    requiredFiles: [],
    slotMetadataField: "slot",
  };
}

describe("WorktreeStackKit_validateCreateTargetLocation", () => {
  it("creates the worktrees base and allows an absent worktree path", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-preflight-"));
    const context = makeContext(tempDir);

    WorktreeStackKit_validateCreateTargetLocation(context);

    assert.equal(context.currentStep, "validate-target-location");
    assert.equal(fs.existsSync(context.options.worktreesBase), true);
  });

  it("rejects an existing non-git target path", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-preflight-"));
    const context = makeContext(tempDir);
    fs.mkdirSync(context.worktreePath, { recursive: true });

    assert.throws(
      () => WorktreeStackKit_validateCreateTargetLocation(context),
      /Target path already exists but is not a Git worktree/u,
    );
  });
});

describe("WorktreeStackKit_validateGeneratedCreateArtifacts", () => {
  it("passes when all configured generated artifacts exist", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-artifacts-"));
    const context = makeContext(tempDir);
    const config = makeConfig();
    fs.mkdirSync(path.join(context.worktreePath, ".state"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(context.worktreePath, ".env.runtime"), "A=1\n");
    fs.writeFileSync(
      path.join(context.worktreePath, ".state", "metadata.json"),
      "{}\n",
    );

    WorktreeStackKit_validateGeneratedCreateArtifacts({ config, context });

    assert.equal(context.currentStep, "validate-generated-artifacts");
  });

  it("rejects missing configured generated artifacts", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-artifacts-"));
    const context = makeContext(tempDir);

    assert.throws(
      () =>
        WorktreeStackKit_validateGeneratedCreateArtifacts({
          config: makeConfig(),
          context,
        }),
      /Missing file \(runtime env\)/u,
    );
  });
});
