/**
 * @fileoverview Unit tests for prepared-worktree start command argv parsing exposed through the kit start-command factory.
 *
 * This file owns regression coverage for `WorktreeStackKit_createStartCommand().parseStartCliArgs` flag handling (`--worktree`, Windsurf open toggles) and strict rejection rules for missing required flags and unknown arguments.
 * Flow: build a fully-shaped fake config -> construct the start command -> assert parsed argv objects or thrown error patterns.
 *
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (package.json test glob covers every src path ending in .unit.test.ts, including this file).
 *
 * @see packages/worktree-kit/src/start-command.ts - Kit-owned start command factory and argv parser whose `parseStartCliArgs` contract and error patterns are exercised here.
 * @see scripts/worktree-stack/commands/start.ts - Repository `worktrees:start` adapter that loads root config and delegates argv into the same factory surface validated by these tests.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_createStartCommand,
  type WorktreeStackKit_StartCommandConfig,
} from "./start-command.js";

function startCommandTestConfig(): WorktreeStackKit_StartCommandConfig {
  return {
    buildMarkRealmInactiveCommand: ({ realmSlug }) => ({
      args: ["mark-inactive", realmSlug],
      command: "tool",
    }),
    buildPreflightCommand: () => ({ args: ["preflight"], command: "tool" }),
    buildRealmRegisterCommand: ({ worktreePath }) => ({
      args: ["register", worktreePath],
      command: "tool",
    }),
    buildReconcileRouterCommand: ({ realmSlug }) => ({
      args: ["router", realmSlug],
      command: "tool",
    }),
    buildRepairCommand: ({ worktreePath }) => ({
      args: ["repair", worktreePath],
      command: "tool",
    }),
    buildRuntimeCommand: () => ({ args: ["runtime"], command: "tool" }),
    canonicalRootWorkspacePathRelativePath: path.join(
      ".state",
      "worktree",
      "canonical-root-workspace-path.txt",
    ),
    canonicalRootEnvRelativePath: ".env.runtime",
    checkoutContract: {
      buildFieldCommand: ({ fieldName, worktreePath }) => ({
        args: ["checkout-kind", worktreePath, fieldName],
        command: "tool",
      }),
      expectedCheckoutKind: "prepared-worktree",
    },
    clearAfterRealmResolvedLogSuffixes: ["preflight", "register"],
    clearBeforeRepairLogSuffixes: ["repair", "preflight", "register"],
    defaultMachineRootRelativePath: path.join(".state", "runtime"),
    editor: {
      displayName: "Editor",
      launcherCommand: "editor",
    },
    envKeys: {
      generatedDir: "RUNTIME_GENERATED_DIR",
      realmSlug: "RUNTIME_REALM_SLUG",
      runtimeAliasBypass: "RUNTIME_ALIAS_BYPASS",
      runtimeAliasBypassValue: "true",
      spawnedEnvFile: "RUNTIME_ENV_FILE",
      spawnedProjectRoot: "RUNTIME_PROJECT_ROOT",
      spawnedRootEnvFile: "RUNTIME_ROOT_ENV_FILE",
    },
    knownLogSuffixes: ["repair", "preflight", "register"],
    metadataRelativePath: path.join(".state", "worktree", "metadata.json"),
    projectRoot: "/repo",
    requiredCommandNames: ["git"],
    requiredFiles: [],
    requiredRuntimeDependencyRelativePaths: ["node_modules"],
    requiredSubmodules: [
      { packageManifestRelativePath: "package.json", path: "service-api" },
    ],
    startLogDir: "/repo/logs/worktree",
    usage: {
      commandLines: ["tool start -- --worktree <path>"],
    },
    worktreeAgentContextRelativePath: "WORKTREE.local.md",
    worktreeEnvRelativePath: ".env.runtime",
    worktreeInfoRelativePath: path.join(
      ".state",
      "worktree",
      "worktree-info.json",
    ),
    worktreeReadmeRelativePath: "WORKTREE.readme.md",
  };
}

describe("WorktreeStackKit_parseStartCliArgs", () => {
  it("parses the required worktree path", () => {
    const command = WorktreeStackKit_createStartCommand(
      startCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseStartCliArgs(["--worktree", "/tmp/worktree"]),
      {
        openWindsurf: false,
        worktreePath: "/tmp/worktree",
      },
    );
  });

  it("supports opting into editor open", () => {
    const command = WorktreeStackKit_createStartCommand(
      startCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseStartCliArgs([
        "--worktree",
        "/tmp/worktree",
        "--open-windsurf",
      ]),
      {
        openWindsurf: true,
        worktreePath: "/tmp/worktree",
      },
    );
  });

  it("supports disabling editor open", () => {
    const command = WorktreeStackKit_createStartCommand(
      startCommandTestConfig(),
    );

    assert.deepEqual(
      command.parseStartCliArgs([
        "--worktree",
        "/tmp/worktree",
        "--no-open-windsurf",
      ]),
      {
        openWindsurf: false,
        worktreePath: "/tmp/worktree",
      },
    );
  });

  it("rejects missing --worktree", () => {
    const command = WorktreeStackKit_createStartCommand(
      startCommandTestConfig(),
    );

    assert.throws(
      () => command.parseStartCliArgs([]),
      /--worktree is required\./u,
    );
  });

  it("rejects unknown arguments", () => {
    const command = WorktreeStackKit_createStartCommand(
      startCommandTestConfig(),
    );

    assert.throws(
      () => command.parseStartCliArgs(["--bogus"]),
      /Unknown argument: --bogus/u,
    );
  });
});
