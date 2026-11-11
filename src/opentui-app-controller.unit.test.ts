/**
 * @fileoverview Verifies the package-owned OpenTUI app controller hook remains exported as a callable function.
 *
 * This file owns minimal regression coverage that `WorktreeStackKit_useOpenTuiAppController` stays a function export for downstream OpenTUI CLI hosts.
 * Flow: import named hook -> assert `typeof` is `function`.
 *
 * @testing Node test runner via tsx: cd packages/worktree-kit && npm run test -- src/opentui-app-controller.unit.test.ts
 * @testing Node test runner via tsx: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI app controller implementation whose `WorktreeStackKit_useOpenTuiAppController` export shape is smoke-tested here.
 * @see scripts/worktree-stack/ui/cli-opentui/app.tsx - Worktree-stack OpenTUI CLI host that injects adapters into the hook before mounting the kit shell, downstream consumer of the export asserted here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { WorktreeStackKit_useOpenTuiAppController } from "./opentui-app-controller.js";

void test("exports the package-owned OpenTUI app controller hook", () => {
  assert.equal(typeof WorktreeStackKit_useOpenTuiAppController, "function");
});
