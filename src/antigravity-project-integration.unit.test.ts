/**
 * @fileoverview Verifies Antigravity/Gemini `projects.json` register and unregister mutations for
 * prepared worktree paths via `WorktreeStackKit_runAntigravityProjectMutation`.
 *
 * This file owns regression coverage for basename label fallback, `ANTIGRAVITY_HOME` vs
 * `GEMINI_HOME` resolution, and targeted unregister cleanup without disturbing unrelated projects.
 * Flow: seed synthetic projects.json under a temp home -> invoke mutation -> assert JSON snapshot.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/antigravity-project-integration.unit.test.ts
 *
 * @see packages/worktree-kit/src/antigravity-project-integration.ts - Antigravity/Gemini `projects.json` mutation implementation whose register, unregister, label fallback, and home-dir wiring these tests lock down with isolated temp fixtures.
 * @see packages/worktree-kit/README.md - Package export notes for `@gg-utils/worktree-kit/antigravity-project-integration`, orienting this suite to the supported integration surface.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  WorktreeStackKit_runAntigravityProjectMutation,
} from "./antigravity-project-integration.js";

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

describe("WorktreeStackKit_runAntigravityProjectMutation", () => {
  it("registers a worktree and falls back to the basename when no label is provided", () => {
    const antigravityHome = createTempDirectory("worktree-antigravity-home-");
    const worktreePath = path.join(antigravityHome, "prepared-alpha");
    const projectsPath = path.join(antigravityHome, "projects.json");

    fs.writeFileSync(
      projectsPath,
      `${JSON.stringify(
        {
          lastOpened: "/tmp/other-worktree",
          projects: {
            [worktreePath]: "   ",
            "/tmp/other-worktree": "Other Workspace",
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    WorktreeStackKit_runAntigravityProjectMutation({
      action: "register",
      env: {
        ANTIGRAVITY_HOME: antigravityHome,
      },
      label: "",
      worktreePath,
    });

    assert.deepEqual(JSON.parse(fs.readFileSync(projectsPath, "utf8")), {
      lastOpened: "/tmp/other-worktree",
      projects: {
        [worktreePath]: "prepared-alpha",
        "/tmp/other-worktree": "Other Workspace",
      },
    });
  });

  it("unregisters only the targeted project while preserving unrelated state", () => {
    const geminiHome = createTempDirectory("worktree-gemini-home-");
    const worktreePath = path.join(geminiHome, "prepared-beta");
    const projectsPath = path.join(geminiHome, "projects.json");

    fs.writeFileSync(
      projectsPath,
      `${JSON.stringify(
        {
          selectedProject: worktreePath,
          projects: {
            [worktreePath]: "Beta Workspace",
            "/tmp/other-worktree": "Other Workspace",
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    WorktreeStackKit_runAntigravityProjectMutation({
      action: "unregister",
      env: {
        GEMINI_HOME: geminiHome,
      },
      label: "",
      worktreePath,
    });

    assert.deepEqual(JSON.parse(fs.readFileSync(projectsPath, "utf8")), {
      selectedProject: worktreePath,
      projects: {
        "/tmp/other-worktree": "Other Workspace",
      },
    });
  });
});
