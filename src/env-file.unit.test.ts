/**
 * @fileoverview Regression coverage for worktree-stack env-file helpers that read, merge, rewrite, and sync `.env*` files across local workspaces.
 *
 * This file owns Node.js `node:test` cases for set/merge semantics with comment preservation, URL and origin-list port rewriting, machine-root resolution from generated-dir keys, and shared-key sync between paired temp workspaces.
 * Flow: materialize temp `.env*` trees -> invoke `WorktreeStackKit_*` env-file helpers -> assert rendered file text and resolved paths.
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/env-file.unit.test.ts
 *
 * @see packages/worktree-kit/src/env-file.ts - Source module implementing the env parsing, merge, URL rewrite, machine-root, and cross-workspace sync utilities asserted here.
 * @see packages/worktree-kit/src/create-env-orchestration.ts - Create-flow orchestration that composes env-file helpers when provisioning runtime and package env files during worktree setup.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_extractUrlHost,
  WorktreeStackKit_machineRootFromEnvFile,
  WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference,
  WorktreeStackKit_readSimpleEnvValue,
  WorktreeStackKit_replaceOriginListPorts,
  WorktreeStackKit_replaceUrlPort,
  WorktreeStackKit_setEnvValue,
  WorktreeStackKit_syncSharedEnvKeys,
} from "./env-file.js";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "worktree-kit-env-file-"));
}

describe("worktree env-file helpers", () => {
  it("sets and merges values while preserving existing comments", () => {
    const tempDir = makeTempDir();
    const targetEnv = path.join(tempDir, ".env");
    const referenceEnv = path.join(tempDir, ".env.example");
    fs.writeFileSync(targetEnv, "# comment\nA=1\nB=\n", "utf8");
    fs.writeFileSync(referenceEnv, "A=9\nB=2\nC=3\n", "utf8");

    WorktreeStackKit_setEnvValue(targetEnv, "D", "4");
    WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference(
      targetEnv,
      referenceEnv,
    );

    const rendered = fs.readFileSync(targetEnv, "utf8");
    assert.match(rendered, /^# comment/mu);
    assert.equal(WorktreeStackKit_readSimpleEnvValue(targetEnv, "A"), "1");
    assert.equal(WorktreeStackKit_readSimpleEnvValue(targetEnv, "B"), "2");
    assert.equal(WorktreeStackKit_readSimpleEnvValue(targetEnv, "C"), "3");
    assert.equal(WorktreeStackKit_readSimpleEnvValue(targetEnv, "D"), "4");
  });

  it("rewrites URL ports and origin lists", () => {
    assert.equal(
      WorktreeStackKit_replaceUrlPort("https://example.test:111/path", 222, "localhost"),
      "https://example.test:222/path",
    );
    assert.equal(
      WorktreeStackKit_replaceUrlPort("", 333, "127.0.0.1"),
      "http://127.0.0.1:333",
    );
    assert.equal(
      WorktreeStackKit_extractUrlHost("https://app.example.test/path", "fallback"),
      "app.example.test",
    );
    assert.equal(
      WorktreeStackKit_replaceOriginListPorts(
        "https://a.example:1, http://b.example/x",
        444,
        "fallback",
        "http",
      ),
      "https://a.example:444,http://b.example:444/x",
    );
  });

  it("resolves machine roots and syncs configured shared env keys", () => {
    const tempDir = makeTempDir();
    const sourceWorkspace = path.join(tempDir, "source");
    const targetWorkspace = path.join(tempDir, "target");
    fs.mkdirSync(sourceWorkspace, { recursive: true });
    fs.mkdirSync(targetWorkspace, { recursive: true });
    fs.writeFileSync(
      path.join(sourceWorkspace, ".env.runtime"),
      [
        "RUNTIME_HOST=example.test",
        `RUNTIME_CERT=${path.join(targetWorkspace, ".state", "runtime", "generated", "certs", "cert.pem")}`,
        "UNMANAGED=skip",
      ].join("\n"),
      "utf8",
    );
    fs.writeFileSync(
      path.join(targetWorkspace, ".env.runtime"),
      `RUNTIME_GENERATED_DIR=${path.join(targetWorkspace, ".state", "runtime", "generated")}\n`,
      "utf8",
    );

    assert.equal(
      WorktreeStackKit_machineRootFromEnvFile({
        envFile: path.join(targetWorkspace, ".env.runtime"),
        fallbackRelativePath: path.join(".state", "runtime"),
        generatedDirEnvKey: "RUNTIME_GENERATED_DIR",
        generatedDirLeafName: "generated",
        workspaceFallback: targetWorkspace,
      }),
      path.join(targetWorkspace, ".state", "runtime"),
    );

    WorktreeStackKit_syncSharedEnvKeys({
      config: {
        envFileName: ".env.runtime",
        generatedDirEnvKey: "RUNTIME_GENERATED_DIR",
        generatedDirLeafName: "generated",
        machineRootFallbackRelativePath: path.join(".state", "runtime"),
        normalizedPathKeys: ["RUNTIME_CERT"],
        sharedKeys: ["RUNTIME_HOST", "RUNTIME_CERT"],
      },
      sourceWorkspacePath: sourceWorkspace,
      targetWorkspacePath: targetWorkspace,
    });

    const targetEnvPath = path.join(targetWorkspace, ".env.runtime");
    assert.equal(
      WorktreeStackKit_readSimpleEnvValue(targetEnvPath, "RUNTIME_CERT"),
      path.join(targetWorkspace, ".state", "runtime", "certs", "cert.pem"),
    );
    assert.equal(
      WorktreeStackKit_readSimpleEnvValue(targetEnvPath, "RUNTIME_HOST"),
      "example.test",
    );
  });
});
