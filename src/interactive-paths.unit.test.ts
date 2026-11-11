/**
 * @fileoverview Node test regression coverage for classic worktree-stack interactive path resolution.
 *
 * This file owns assertions for `WorktreeStackKit_resolveInteractiveRepoRoot` marker walks with an
 * injectable `exists` probe and for `WorktreeStackKit_resolveInteractivePathContext` assembling
 * commands, UI, and default worktree-base directories from a resolved repo root.
 * Flow: stub marker hit -> assert repo root -> assert joined command/UI/default-base paths; missing
 * marker -> assert thrown repo-root error.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/interactive-paths.unit.test.ts
 *
 * @see packages/worktree-kit/src/interactive-paths.ts - Resolver implementation under test for upward marker discovery and interactive path-context assembly exercised by the injectable `exists` fixtures here.
 * @see scripts/worktree-stack/ui/cli-interactive/paths.ts - Classic worktree-stack adapter that supplies marker and segment configuration consumed by interactive CLIs relying on the resolver contract asserted in this suite.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting the interactive path helpers so downstream kit consumers resolve the same surface validated by these regression tests.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  WorktreeStackKit_resolveInteractivePathContext,
  WorktreeStackKit_resolveInteractiveRepoRoot,
} from "./interactive-paths.js";

const TEST_MARKER_SEGMENTS = ["scripts", "worktree-stack", "commands", "create.ts"];

void test("WorktreeStackKit_resolveInteractiveRepoRoot walks to the configured marker", () => {
  const repoRoot = path.join(path.sep, "repo");
  const cwd = path.join(repoRoot, "nested", "leaf");

  assert.equal(
    WorktreeStackKit_resolveInteractiveRepoRoot({
      cwd,
      exists: (candidatePath) =>
        candidatePath === path.join(repoRoot, ...TEST_MARKER_SEGMENTS),
      markerSegments: TEST_MARKER_SEGMENTS,
    }),
    repoRoot,
  );
});

void test("WorktreeStackKit_resolveInteractiveRepoRoot rejects missing markers", () => {
  assert.throws(
    () =>
      WorktreeStackKit_resolveInteractiveRepoRoot({
        cwd: path.join(path.sep, "repo"),
        exists: () => false,
        markerSegments: TEST_MARKER_SEGMENTS,
      }),
    /could not resolve repo root/u,
  );
});

void test("WorktreeStackKit_resolveInteractivePathContext builds configured paths", () => {
  const repoRoot = path.join(path.sep, "repo");
  const cwd = path.join(repoRoot, "nested");

  assert.deepEqual(
    WorktreeStackKit_resolveInteractivePathContext({
      commandsSegments: ["scripts", "worktree-stack", "commands"],
      cwd,
      exists: (candidatePath) =>
        candidatePath === path.join(repoRoot, ...TEST_MARKER_SEGMENTS),
      markerSegments: TEST_MARKER_SEGMENTS,
      resolveDefaultWorktreesBase: (root) => path.join(root, ".worktrees"),
      uiSegments: ["scripts", "worktree-stack", "ui", "cli-interactive"],
    }),
    {
      commandsDir: path.join(repoRoot, "scripts", "worktree-stack", "commands"),
      defaultWorktreesBase: path.join(repoRoot, ".worktrees"),
      repoRoot,
      uiDir: path.join(
        repoRoot,
        "scripts",
        "worktree-stack",
        "ui",
        "cli-interactive",
      ),
    },
  );
});
