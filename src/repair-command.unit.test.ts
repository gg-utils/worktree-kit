/**
 * @fileoverview Unit tests for the config-driven prepared-worktree repair command helpers and argv parsing.
 *
 * This file owns regression coverage for `WorktreeStackKit_parseRepairArgs`, repair target and machine-root resolution, and canonical package-env backfill helpers used by the repair CLI surface.
 * Flow: build temp workspaces and argv -> call repair helpers -> assert parsed options, resolved roots, and env sync behavior.
 *
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (package.json test glob covers every src path ending in .unit.test.ts, including this file).
 *
 * @see packages/worktree-kit/src/repair-command.ts - Kit-owned repair argv parsing, machine-root resolution, and package-env sync helpers whose behavior is asserted here.
 * @see scripts/worktree-stack/commands/repair.ts - Root repair CLI entrypoint that runs `WorktreeStackKit_runRepairCli` from the repair-command module whose argv and env contracts these tests lock down.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  WorktreeStackKit_collectRepairPackageEnvMissingKeys,
  WorktreeStackKit_normalizeRepairPackageEnvMode,
  WorktreeStackKit_parseRepairArgs,
  WorktreeStackKit_resolveRepairMachineRoot,
  WorktreeStackKit_resolveRepairTargets,
  WorktreeStackKit_syncRepairPackageEnvFromCanonical,
  type WorktreeStackKit_RepairCommandConfig,
} from "./repair-command.js";

const tempDirectories: string[] = [];

function createTempDirectory(prefix: string): string {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

function repairCommandTestConfig(projectRoot: string): WorktreeStackKit_RepairCommandConfig {
  return {
    buildMaterializeEnvCommand: () => ({ args: [], command: "true" }),
    buildRegenerateArtifactsCommand: () => ({ args: [], command: "true" }),
    envFileName: ".env.test",
    generatedArtifactPreviewRelativePath: ".tmp/worktree-stack/*",
    generatedArtifactRequirements: [],
    generatedDirLeafName: "generated",
    machineRootEnvKey: "TEST_GENERATED_DIR",
    machineRootFallbackRelativePath: ".tmp/edge-runtime",
    packageConfigs: [
      {
        displayName: "service-one",
        envRelativePath: "service-one/.env",
        missingRootKeysField: "service-one-missing-root-keys",
      },
    ],
    projectRoot,
    realmSlugEnvKey: "TEST_REALM_SLUG",
    realmSlugMetadataField: "realmSlug",
    stackNameMetadataField: "stackName",
    usage: {
      commandLines: ["tool repair [options]"],
      defaultBehaviorLines: ["discover prepared worktrees"],
      examples: ["tool repair"],
      notes: ["repairs configured artifacts"],
      packageEnvBehaviorLines: ["disabled by default"],
    },
  };
}

afterEach(() => {
  for (const directoryPath of tempDirectories.splice(0)) {
    fs.rmSync(directoryPath, { force: true, recursive: true });
  }
});

describe("WorktreeStackKit_parseRepairArgs", () => {
  it("parses direct worktree targets, dry-run, and package env mode", () => {
    const parsed = WorktreeStackKit_parseRepairArgs({
      argv: [
        "--worktree",
        "/tmp/worktree-a",
        "--worktree",
        "/tmp/worktree-b",
        "--include-package-env",
        "--dry-run",
      ],
      config: repairCommandTestConfig("/repo"),
    });

    assert.deepEqual(parsed, {
      dryRun: true,
      packageEnvMode: "missing-or-blank",
      targetWorktrees: ["/tmp/worktree-a", "/tmp/worktree-b"],
    });
  });

  it("normalizes the legacy package env mode alias", () => {
    assert.equal(
      WorktreeStackKit_normalizeRepairPackageEnvMode("missing-only"),
      "missing-or-blank",
    );
  });

  it("rejects unsupported package env modes", () => {
    assert.throws(
      () => WorktreeStackKit_normalizeRepairPackageEnvMode("replace-all"),
      /Unsupported package env sync mode/u,
    );
  });
});

describe("repair path and machine-root helpers", () => {
  it("resolves explicit targets to absolute paths", () => {
    const cwd = process.cwd();
    assert.deepEqual(
      WorktreeStackKit_resolveRepairTargets({
        canonicalRootWorkspacePath: cwd,
        explicitTargets: ["relative-worktree"],
      }),
      [path.join(cwd, "relative-worktree")],
    );
  });

  it("uses the configured fallback when the generated-dir env key is missing", () => {
    const workspacePath = createTempDirectory("worktree-repair-machine-root-");
    fs.writeFileSync(path.join(workspacePath, ".env.test"), "OTHER=value\n", "utf8");

    assert.equal(
      WorktreeStackKit_resolveRepairMachineRoot({
        config: repairCommandTestConfig(workspacePath),
        envFilePath: path.join(workspacePath, ".env.test"),
        workspaceFallbackPath: workspacePath,
      }),
      path.join(workspacePath, ".tmp", "edge-runtime"),
    );
  });

  it("collapses a generated leaf directory to its machine root", () => {
    const workspacePath = createTempDirectory("worktree-repair-machine-root-");
    fs.writeFileSync(
      path.join(workspacePath, ".env.test"),
      `TEST_GENERATED_DIR=${path.join(workspacePath, ".tmp", "edge-runtime", "generated")}\n`,
      "utf8",
    );

    assert.equal(
      WorktreeStackKit_resolveRepairMachineRoot({
        config: repairCommandTestConfig(workspacePath),
        envFilePath: path.join(workspacePath, ".env.test"),
        workspaceFallbackPath: workspacePath,
      }),
      path.join(workspacePath, ".tmp", "edge-runtime"),
    );
  });
});

describe("package env backfill helpers", () => {
  it("reports canonical keys missing or blank in the target env", () => {
    const directoryPath = createTempDirectory("worktree-repair-env-");
    const canonicalEnvPath = path.join(directoryPath, "canonical.env");
    const envFilePath = path.join(directoryPath, "target.env");
    fs.writeFileSync(canonicalEnvPath, "A=1\nB=2\nC=\n", "utf8");
    fs.writeFileSync(envFilePath, "A=\nB=target\n", "utf8");

    assert.deepEqual(
      WorktreeStackKit_collectRepairPackageEnvMissingKeys({
        canonicalEnvPath,
        envFilePath,
      }),
      ["A"],
    );
  });

  it("backfills only missing or blank keys without replacing existing values", () => {
    const directoryPath = createTempDirectory("worktree-repair-env-");
    const canonicalEnvPath = path.join(directoryPath, "canonical.env");
    const envFilePath = path.join(directoryPath, "target.env");
    fs.writeFileSync(canonicalEnvPath, "A=from-root\nB=root\nC=root\nD=\n", "utf8");
    fs.writeFileSync(envFilePath, "# keep\nA=\nB=local\nEXTRA=yes\n", "utf8");

    assert.deepEqual(
      WorktreeStackKit_syncRepairPackageEnvFromCanonical({
        canonicalEnvPath,
        envFilePath,
      }),
      ["A", "C"],
    );
    assert.equal(
      fs.readFileSync(envFilePath, "utf8"),
      "# keep\nA=from-root\nB=local\nEXTRA=yes\n\nC=root\n",
    );
  });
});
