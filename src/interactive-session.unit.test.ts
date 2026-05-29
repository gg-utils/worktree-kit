/**
 * @fileoverview Verifies the stable cancellation sentinel contract for `WorktreeInteractiveCancelledError` in worktree-kit interactive prompts.
 *
 * This file owns regression coverage for the fixed cancellation message and `Error` inheritance used when operators abort readline-backed prompts.
 * Flow: construct error -> assert message stability -> assert `Error` prototype chain.
 *
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/interactive-session.ts - Readline-backed interactive session module that defines `WorktreeInteractiveCancelledError` and relies on the stable message contract asserted here.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - File-overview contract governing this test module header and verification tags.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { WorktreeInteractiveCancelledError } from "./interactive-session.js";

test("WorktreeInteractiveCancelledError keeps the stable cancellation message", () => {
  const error = new WorktreeInteractiveCancelledError();

  assert.equal(error.message, "Interactive flow cancelled.");
  assert.equal(error instanceof Error, true);
});
