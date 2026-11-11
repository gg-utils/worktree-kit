/**
 * @fileoverview Verifies `WorktreeStackKit_deriveSlotPortMap` slot-offset math and rejection of non-positive or non-integer slots for prepared worktree stacks.
 *
 * This file owns Node test coverage for the port map returned from explicit base definitions plus a stack slot index.
 * Flow: build port definitions + slot -> call derive -> assert mapped ports or thrown validation errors.
 *
 * @example
 * ```typescript
 * test("slot shifts bases", () => {
 *   const ports = WorktreeStackKit_deriveSlotPortMap({
 *     portDefinitions: [{ basePort: 3000, key: "web" }],
 *     slot: 2,
 *   });
 *   assert.equal(ports.get("web"), 3002);
 * });
 * ```
 *
 * @testing Node.js test runner (node:test): from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (package test glob includes this file).
 *
 * @see packages/worktree-kit/src/slot-ports.ts - Implements `WorktreeStackKit_deriveSlotPortMap` and the positive-integer slot invariant asserted here.
 * @see packages/worktree-kit/src/index.ts - Barrel re-export surface so kit consumers and these tests share the same public entry for slot port derivation.
 * @see worktrees.config.ts - Root worktree-stack adapter that imports slot-port helpers when materializing per-slot listen ports for prepared stacks.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { WorktreeStackKit_deriveSlotPortMap } from "./slot-ports.js";

void test("WorktreeStackKit_deriveSlotPortMap applies slot offsets to explicit bases", () => {
  const ports = WorktreeStackKit_deriveSlotPortMap({
    portDefinitions: [
      { basePort: 3000, key: "web" },
      { basePort: 8000, key: "api" },
    ],
    slot: 5,
  });

  assert.equal(ports.get("web"), 3005);
  assert.equal(ports.get("api"), 8005);
});

void test("WorktreeStackKit_deriveSlotPortMap rejects non-positive slots", () => {
  assert.throws(() =>
    WorktreeStackKit_deriveSlotPortMap({
      portDefinitions: [{ basePort: 3000, key: "web" }],
      slot: 0,
    }),
  );
  assert.throws(() =>
    WorktreeStackKit_deriveSlotPortMap({
      portDefinitions: [{ basePort: 3000, key: "web" }],
      slot: 1.5,
    }),
  );
});
