/**
 * @fileoverview Verifies config-driven env-doctor argv parsing, repair/overlay telemetry parsing,
 * shell quoting, workspace-root discovery, and narrow overlay-artifact reads for the worktree kit.
 *
 * This file owns regression coverage for `WorktreeStackKit_parseEnvDoctorArgs` and the env-doctor
 * helper surface used by materialize/overlay workflows without spawning configured CLI commands.
 * Flow: argv fixtures -> parse assertions; temp dirs with marker env files -> workspace resolution;
 * JSON artifact fixtures -> narrow issue extraction.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/env-doctor-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/env-doctor-command.ts - Env-doctor command module whose argv parsing, overlay/repair field helpers, workspace resolution, and artifact narrowing behavior are asserted here.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting env-doctor helpers so regressions surface through the public `@gg-utils/worktree-kit` and `@gg-utils/worktree-kit/env-doctor-command` import paths.
 * @see packages/worktree-kit/README.md - Package README documenting the env-doctor subpath and operator-facing usage expectations adjacent to the contracts exercised in this suite.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  WorktreeStackKit_envDoctorShellQuote,
  WorktreeStackKit_parseEnvDoctorArgs,
  WorktreeStackKit_parseEnvDoctorCommaSeparatedKeys,
  WorktreeStackKit_parseEnvDoctorOverlayArtifact,
  WorktreeStackKit_parseEnvDoctorRepairFields,
  WorktreeStackKit_resolveEnvDoctorWorkspacePath,
  type WorktreeStackKit_EnvDoctorCommandConfig,
} from "./env-doctor-command.js";

const tempDirectories: string[] = [];

function createTempDirectory(prefix: string): string {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

function envDoctorTestConfig(): WorktreeStackKit_EnvDoctorCommandConfig {
  return {
    buildOverlayRenderCommand: () => ({ args: [], command: "true" }),
    buildOverlayValidateCommand: () => ({ args: [], command: "true" }),
    buildRepairDryRunCommand: () => ({ args: [], command: "true" }),
    canonicalRootWorkspacePathField: "canonical-root",
    envFileName: ".env.test",
    manualReviewIssueMappings: [],
    overlayArtifactPath: (workspacePath) => path.join(workspacePath, "artifact.json"),
    overlayStartSuggestionIssueFragments: ["Missing generated file"],
    overlayTempDirectoryPrefix: "worktree-env-doctor-test-",
    packageConfigs: [
      {
        displayName: "backend",
        envRelativePath: "backend/.env",
        missingRootKeysField: "backend-missing-root-keys",
      },
    ],
    preparedMetadataRelativePath: ".tmp/worktree-stack/metadata.json",
    repairSuggestionCommand: (workspacePath) => `repair ${workspacePath}`,
    startSuggestionCommand: (workspacePath) => `start ${workspacePath}`,
    usageCommandLines: ["tool env-doctor [options]"],
    usageExamples: ["tool env-doctor"],
  };
}

afterEach(() => {
  for (const directoryPath of tempDirectories.splice(0)) {
    fs.rmSync(directoryPath, { force: true, recursive: true });
  }
});

describe("WorktreeStackKit_parseEnvDoctorArgs", () => {
  it("parses JSON mode and worktree path", () => {
    const parsed = WorktreeStackKit_parseEnvDoctorArgs({
      argv: ["--json", "--worktree", "/tmp/workspace"],
      config: envDoctorTestConfig(),
      defaultRequestedPath: "/default",
    });

    assert.deepEqual(parsed, {
      jsonMode: true,
      requestedPath: "/tmp/workspace",
    });
  });
});

describe("env doctor parser helpers", () => {
  it("parses repair telemetry fields", () => {
    assert.deepEqual(
      WorktreeStackKit_parseEnvDoctorRepairFields(
        "[worktree] backend-missing-root-keys: A, B\nignored",
      ),
      { "backend-missing-root-keys": "A, B" },
    );
  });

  it("parses comma-separated key lists", () => {
    assert.deepEqual(
      WorktreeStackKit_parseEnvDoctorCommaSeparatedKeys("A, B, , C"),
      ["A", "B", "C"],
    );
    assert.deepEqual(WorktreeStackKit_parseEnvDoctorCommaSeparatedKeys("<none>"), []);
  });

  it("shell-quotes paths", () => {
    assert.equal(
      WorktreeStackKit_envDoctorShellQuote("/tmp/path with ' quote"),
      "'/tmp/path with '\\'' quote'",
    );
  });
});

describe("workspace and artifact helpers", () => {
  it("resolves a workspace root by configured env filename", () => {
    const workspacePath = createTempDirectory("worktree-env-doctor-");
    const nestedPath = path.join(workspacePath, "a", "b");
    fs.mkdirSync(nestedPath, { recursive: true });
    fs.writeFileSync(path.join(workspacePath, ".env.test"), "KEY=value\n", "utf8");

    assert.equal(
      WorktreeStackKit_resolveEnvDoctorWorkspacePath({
        candidatePath: nestedPath,
        envFileName: ".env.test",
      }),
      workspacePath,
    );
  });

  it("narrowly parses overlay artifacts", () => {
    const directoryPath = createTempDirectory("worktree-env-doctor-artifact-");
    const artifactPath = path.join(directoryPath, "artifact.json");
    fs.writeFileSync(
      artifactPath,
      JSON.stringify({
        issues: ["Missing generated file"],
        listenPort: 1000,
        primaryMethod: "proxy",
        runAt: new Date().toISOString(),
        success: false,
        validatedFiles: { app: "/tmp/app.env" },
      }),
      "utf8",
    );

    assert.deepEqual(
      WorktreeStackKit_parseEnvDoctorOverlayArtifact(artifactPath)?.issues,
      ["Missing generated file"],
    );
  });
});
