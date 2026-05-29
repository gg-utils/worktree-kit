/**
 * @fileoverview Verifies Codex workspace registry sync for worktree paths using isolated CODEX_HOME
 * fixtures and the Node test runner.
 *
 * This file owns regression coverage for `WorktreeStackKit_runCodexProjectMutation`, asserting that
 * register and unregister actions rewrite `config.toml` and `.codex-global-state.json` without
 * clobbering unrelated projects, labels, or preserved JSON fields.
 * Flow: create temp CODEX_HOME -> seed config and state -> call mutation -> assert TOML + JSON output.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/codex-project-integration.unit.test.ts
 *
 * @see packages/worktree-kit/src/codex-project-integration.ts - Mutation helper under test that reads and writes Codex config.toml plus global JSON state resolved from CODEX_HOME for register and unregister flows.
 * @see scripts/worktree-stack/integrations/codex-project.ts - Worktree-stack CLI entrypoint that parses argv and delegates register or unregister work to the same mutation helper exercised in this suite.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  WorktreeStackKit_runCodexProjectMutation,
} from "./codex-project-integration.js";

const tempDirectories: string[] = [];

function createTempDirectory(prefix: string): string {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

afterEach(() => {
  for (const directoryPath of tempDirectories.splice(0)) {
    fs.rmSync(directoryPath, { force: true, recursive: true });
  }
});

describe("WorktreeStackKit_runCodexProjectMutation", () => {
  it("registers a worktree without clobbering unrelated Codex config or state", () => {
    const codexHome = createTempDirectory("worktree-codex-home-");
    const worktreePath = path.join(codexHome, "prepared-alpha");
    const configPath = path.join(codexHome, "config.toml");
    const statePath = path.join(codexHome, ".codex-global-state.json");

    fs.writeFileSync(
      configPath,
      `[model]
provider = "openai"

[projects."${worktreePath}"]
trust_level = "untrusted"

[profiles.ci]
model = "gpt-5-codex"

[projects."/tmp/other-worktree"]
trust_level = "trusted"
`,
      "utf8",
    );
    fs.writeFileSync(
      statePath,
      JSON.stringify({
        "electron-saved-workspace-roots": ["/tmp/other-worktree"],
        "active-workspace-roots": ["/tmp/other-worktree", worktreePath],
        "electron-workspace-root-labels": {
          "/tmp/other-worktree": "Other Workspace",
          [worktreePath]: "Old Label",
        },
        preserveMe: {
          enabled: true,
        },
      }),
      "utf8",
    );

    WorktreeStackKit_runCodexProjectMutation({
      action: "register",
      env: {
        CODEX_HOME: codexHome,
      },
      label: "Alpha Workspace",
      worktreePath,
    });

    assert.equal(
      fs.readFileSync(configPath, "utf8"),
      `[model]
provider = "openai"

[projects."${worktreePath}"]
trust_level = "trusted"

[profiles.ci]
model = "gpt-5-codex"

[projects."/tmp/other-worktree"]
trust_level = "trusted"
`,
    );

    assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")), {
      "electron-saved-workspace-roots": [worktreePath, "/tmp/other-worktree"],
      "active-workspace-roots": ["/tmp/other-worktree", worktreePath],
      "electron-workspace-root-labels": {
        "/tmp/other-worktree": "Other Workspace",
        [worktreePath]: "Alpha Workspace",
      },
      preserveMe: {
        enabled: true,
      },
    });
  });

  it("unregisters only the targeted worktree from Codex config and state", () => {
    const codexHome = createTempDirectory("worktree-codex-home-");
    const worktreePath = path.join(codexHome, "prepared-beta");
    const configPath = path.join(codexHome, "config.toml");
    const statePath = path.join(codexHome, ".codex-global-state.json");

    fs.writeFileSync(
      configPath,
      `[projects."${worktreePath}"]
trust_level = "trusted"

[projects."/tmp/other-worktree"]
trust_level = "trusted"

[profiles.safe]
model = "gpt-5-codex"
`,
      "utf8",
    );
    fs.writeFileSync(
      statePath,
      JSON.stringify({
        "electron-saved-workspace-roots": [worktreePath, "/tmp/other-worktree"],
        "active-workspace-roots": [worktreePath, "/tmp/other-worktree"],
        "electron-workspace-root-labels": {
          "/tmp/other-worktree": "Other Workspace",
          [worktreePath]: "Beta Workspace",
        },
        preserveMe: {
          enabled: true,
        },
      }),
      "utf8",
    );

    WorktreeStackKit_runCodexProjectMutation({
      action: "unregister",
      env: {
        CODEX_HOME: codexHome,
      },
      label: "",
      worktreePath,
    });

    assert.equal(
      fs.readFileSync(configPath, "utf8"),
      `[projects."/tmp/other-worktree"]
trust_level = "trusted"

[profiles.safe]
model = "gpt-5-codex"
`,
    );

    assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")), {
      "electron-saved-workspace-roots": ["/tmp/other-worktree"],
      "active-workspace-roots": ["/tmp/other-worktree"],
      "electron-workspace-root-labels": {
        "/tmp/other-worktree": "Other Workspace",
      },
      preserveMe: {
        enabled: true,
      },
    });
  });
});
