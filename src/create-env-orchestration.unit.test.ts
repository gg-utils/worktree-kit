/**
 * @fileoverview Node test regression coverage for worktree create-env orchestration helpers.
 *
 * This file owns assertions for env materialization success and failure paths, package `.env`
 * seeding from templates plus source env fills, and runtime env rendering with shared-key sync hooks.
 * Flow: build temp context + config -> invoke orchestration helpers -> assert filesystem and return values.
 *
 * @testing Node.js test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/create-env-orchestration.ts - Create-env orchestration module under test for materialize, package env preparation, and runtime env writes asserted by these specs.
 * @see packages/worktree-kit/src/create-command.ts - Worktree create command surface that wires create-env orchestration during provisioning so regressions here map to real create flows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_materializeCreateEnvFiles,
  WorktreeStackKit_prepareCreatePackageEnvFile,
  WorktreeStackKit_writeCreateRuntimeEnvFile,
  type WorktreeStackKit_CreateEnvContext,
  type WorktreeStackKit_CreateEnvOrchestrationConfig,
} from "./create-env-orchestration.js";

function makeContext(tempDir: string): WorktreeStackKit_CreateEnvContext {
  return {
    localLogicalEnvironmentFile: path.join(tempDir, "logical.env"),
    localStateSourceWorkspacePath: path.join(tempDir, "source"),
    options: {
      copyEnvFromMain: false,
    },
    primaryWorkspaceEnvFile: path.join(tempDir, "primary.env"),
    primaryWorkspacePath: path.join(tempDir, "primary"),
    realmSlug: "realm-one",
    rootDir: tempDir,
    runtimeMachineRoot: path.join(tempDir, "runtime"),
    worktreePath: path.join(tempDir, "target"),
  };
}

function makeConfig(
  overrides: Partial<WorktreeStackKit_CreateEnvOrchestrationConfig> = {},
): WorktreeStackKit_CreateEnvOrchestrationConfig {
  return {
    buildMaterializeArgs: () => ["-e", "process.exit(0)"],
    envMaterializeFailureMessage: "materialization failed",
    environment: {},
    localStateSync: {
      configuredSubmodules: {
        appSubmodulePaths: [],
      },
      detectableLocalDirectoryBasenames: [],
      rewriteWorkspacePathFiles: [],
      syncableLocalDirectories: [],
      syncableLocalFiles: [],
    },
    materializeCommand: process.execPath,
    packageEnvFileName: ".env",
    renderRuntimeEnvFile: ({ context, primaryEnv }) =>
      [
        `REALM=${context.realmSlug}`,
        `PRIMARY=${primaryEnv.get("PRIMARY") ?? ""}`,
      ].join("\n"),
    runtimeEnvFileName: ".runtime.env",
    syncSharedRuntimeEnvKeys: () => undefined,
    ...overrides,
  };
}

describe("WorktreeStackKit_materializeCreateEnvFiles", () => {
  it("returns true when the configured materializer succeeds", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-env-"));

    assert.equal(
      WorktreeStackKit_materializeCreateEnvFiles({
        config: makeConfig(),
        context: makeContext(tempDir),
      }),
      true,
    );
  });

  it("returns false on materializer failure when legacy copy fallback is enabled", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-env-"));
    const context = makeContext(tempDir);
    context.options.copyEnvFromMain = true;

    assert.equal(
      WorktreeStackKit_materializeCreateEnvFiles({
        config: makeConfig({
          buildMaterializeArgs: () => ["-e", "process.exit(2)"],
        }),
        context,
      }),
      false,
    );
  });
});

describe("WorktreeStackKit_prepareCreatePackageEnvFile", () => {
  it("seeds a missing package env from a template and fills blanks from source env", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-env-"));
    const context = makeContext(tempDir);
    const serviceRoot = path.join(context.worktreePath, "service-a");
    const sourceServiceRoot = path.join(
      context.localStateSourceWorkspacePath,
      "service-a",
    );
    fs.mkdirSync(serviceRoot, { recursive: true });
    fs.mkdirSync(sourceServiceRoot, { recursive: true });
    fs.writeFileSync(path.join(serviceRoot, ".env.template"), "A=\nB=2\n");
    fs.writeFileSync(path.join(sourceServiceRoot, ".env"), "A=1\nB=source\n");

    WorktreeStackKit_prepareCreatePackageEnvFile({
      config: makeConfig(),
      context,
      serviceRoot,
    });

    const rendered = fs.readFileSync(path.join(serviceRoot, ".env"), "utf8");
    assert.match(rendered, /^A=1$/mu);
    assert.match(rendered, /^B=2$/mu);
  });
});

describe("WorktreeStackKit_writeCreateRuntimeEnvFile", () => {
  it("renders the configured runtime document and invokes shared-key sync", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-env-"));
    const context = makeContext(tempDir);
    fs.mkdirSync(context.worktreePath, { recursive: true });
    fs.writeFileSync(context.primaryWorkspaceEnvFile, "PRIMARY=value\n");
    let syncCalled = false;

    WorktreeStackKit_writeCreateRuntimeEnvFile({
      config: makeConfig({
        syncSharedRuntimeEnvKeys: () => {
          syncCalled = true;
        },
      }),
      context,
    });

    assert.equal(syncCalled, true);
    assert.equal(
      fs.readFileSync(path.join(context.worktreePath, ".runtime.env"), "utf8"),
      "REALM=realm-one\nPRIMARY=value\n",
    );
  });
});
