/**
 * @fileoverview Verifies interactive worktree discovery helpers: porcelain path parsing, metadata summary strings, and next-slot selection for picker UX.
 *
 * This file owns Node `node:test` regression coverage for `WorktreeStackKit_*` helpers in `packages/worktree-kit/src/interactive-worktrees.ts` that power interactive worktree menus.
 * Flow: build porcelain or row fixtures -> assert parsed paths, formatted labels, and collected slot picks.
 *
 * @testing Node test runner: npm run worktree-kit:test
 * @testing Node test runner: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/interactive-worktrees.unit.test.ts
 *
 * @see packages/worktree-kit/src/interactive-worktrees.ts - Runtime module under test that parses `git worktree list --porcelain`, formats interactive row summaries, and derives the next free slot from prepared-worktree metadata consumed by picker flows.
 * @see packages/worktree-kit/src/interactive-flows.ts - Interactive lifecycle runners that import those helpers to populate shared picker prompts guarded by the assertions in this regression file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_collectInteractiveUsedSlots,
  WorktreeStackKit_describeInteractiveWorktree,
  WorktreeStackKit_parseInteractiveGitWorktreeListPorcelain,
  WorktreeStackKit_pickNextInteractiveSlot,
} from "./interactive-worktrees.js";

test("WorktreeStackKit_parseInteractiveGitWorktreeListPorcelain excludes the repo root", () => {
  assert.deepEqual(
    WorktreeStackKit_parseInteractiveGitWorktreeListPorcelain(
      [
        "worktree /repo",
        "HEAD abcdef",
        "branch refs/heads/main",
        "",
        "worktree /repo/../worktrees/260329WT01-STACK-A",
        "HEAD 123456",
        "branch refs/heads/feature/stack-a",
        "",
        "worktree /repo/../worktrees/260329WT02-STACK-B",
      ].join("\n"),
      "/repo",
    ),
    ["/worktrees/260329WT01-STACK-A", "/worktrees/260329WT02-STACK-B"],
  );
});

test("WorktreeStackKit_describeInteractiveWorktree formats metadata summaries", () => {
  assert.equal(
    WorktreeStackKit_describeInteractiveWorktree({
      folderName: "260329WT02-STACK-A",
      metadata: {
        realmSlug: "wt02",
        rootBranch: "feature/stack-a",
        slot: 2,
        stackName: "stack-a",
      },
    }),
    "stack-a | slot 2 | realm wt02 | branch feature/stack-a",
  );
  assert.equal(
    WorktreeStackKit_describeInteractiveWorktree({
      folderName: "260329WT02-STACK-A",
      metadata: null,
    }),
    "260329WT02-STACK-A",
  );
});

test("interactive slot helpers collect used slots and pick the first free slot", () => {
  const usedSlots = WorktreeStackKit_collectInteractiveUsedSlots([
    {
      folderName: "one",
      metadataPath: "/tmp/one/.tmp/worktree-stack/metadata.json",
      path: "/tmp/one",
      realmSlug: "wt01",
      rootBranch: "feature/one",
      slot: 1,
      stackName: "one",
      summary: "one",
    },
    {
      folderName: "three",
      metadataPath: "/tmp/three/.tmp/worktree-stack/metadata.json",
      path: "/tmp/three",
      realmSlug: "wt03",
      rootBranch: "feature/three",
      slot: 3,
      stackName: "three",
      summary: "three",
    },
    {
      folderName: "unknown",
      metadataPath: "/tmp/unknown/.tmp/worktree-stack/metadata.json",
      path: "/tmp/unknown",
      realmSlug: "",
      rootBranch: "",
      slot: null,
      stackName: "",
      summary: "unknown",
    },
  ]);

  assert.deepEqual(usedSlots, [1, 3]);
  assert.equal(WorktreeStackKit_pickNextInteractiveSlot(usedSlots), 2);
});
