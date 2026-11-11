/**
 * @fileoverview Verifies argv parsing, action-id alias normalization, help text, and mutually
 * exclusive worktree selectors for the worktree-kit Ink launch-option contract.
 *
 * This file owns Node test regression coverage for `WorktreeStackKit_parseInkLaunchOptions`,
 * `WorktreeStackKit_normalizeInkActionId`, and `WorktreeStackKit_getInkHelpText`.
 * Flow: build argv token lists -> parse or normalize -> assert structured targets, help strings, and validation errors.
 *
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including this file).
 *
 * @see packages/worktree-kit/src/ink-launch-options.ts - Parser and help-text module under test; owns the argv normalization and error messages asserted by the cases here.
 * @see packages/worktree-kit/src/ink-entrypoint.ts - Ink CLI entrypoint that forwards launcher argv into the parser functions exercised here before help versus launch routing.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract this header follows for verification and cross-reference discipline.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_getInkHelpText,
  WorktreeStackKit_normalizeInkActionId,
  WorktreeStackKit_parseInkLaunchOptions,
} from "./ink-launch-options.js";

void test("WorktreeStackKit_getInkHelpText lists launch flags", () => {
  const helpText = WorktreeStackKit_getInkHelpText();
  assert.match(helpText, /--action <action-id>/);
  assert.match(helpText, /--create-follow-up-start/);
  assert.match(helpText, /--pool-next-stack-name/);
});

void test("WorktreeStackKit_normalizeInkActionId maps documented aliases", () => {
  assert.equal(
    WorktreeStackKit_normalizeInkActionId("bootstrap"),
    "platform-bootstrap",
  );
  assert.equal(
    WorktreeStackKit_normalizeInkActionId("pool-next"),
    "realm-pool-next",
  );
  assert.equal(WorktreeStackKit_normalizeInkActionId("missing"), null);
});

void test("WorktreeStackKit_parseInkLaunchOptions infers create action from draft flags", () => {
  assert.deepEqual(
    WorktreeStackKit_parseInkLaunchOptions([
      "--create-stack-name",
      "ink-direct-entry",
      "--create-follow-up-start-open-windsurf",
    ]),
    {
      helpRequested: false,
      target: {
        actionId: "create",
        createDraftOverrides: {
          followUpStart: true,
          followUpStartOpenWindsurf: true,
          stackName: "ink-direct-entry",
        },
        poolNextStackName: null,
        stackName: null,
        stateCheckFetch: null,
        switchDraftOverrides: {},
        worktreePath: null,
      },
    },
  );
});

void test("WorktreeStackKit_parseInkLaunchOptions rejects conflicting worktree selectors", () => {
  assert.throws(
    () =>
      WorktreeStackKit_parseInkLaunchOptions([
        "--worktree",
        "/tmp/one",
        "--stack",
        "stack-a",
      ]),
    /Use only one of --worktree or --stack\./,
  );
});
