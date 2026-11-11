/**
 * @fileoverview Verifies Ink terminal display helpers for CLI command previews, review confirmation
 * sanitization, action/session/result tone mapping, and create-form field string rendering.
 *
 * This file owns Node `node:test` regression coverage for the pure view-model helpers consumed by
 * Ink shells when formatting operator-visible strings and status colors.
 * Flow: import helpers -> assert command-line and preview strings -> assert tone/color mapping ->
 * assert create-field labels and display values against a seeded draft.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-display-view-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-display-view-model.ts - Pure Ink display helpers for CLI previews, tones, and create-field strings whose behavior is asserted in this suite.
 * @see packages/worktree-kit/src/ink-create-model.ts - Initial create draft factory imported here to build stable fixture drafts for create-field display assertions.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_formatInkCliCommandLine,
  WorktreeStackKit_getInkActionEditorKeyHint,
  WorktreeStackKit_getInkActionPlanTone,
  WorktreeStackKit_getInkCreateDraftInputValue,
  WorktreeStackKit_getInkCreateFieldBooleanValue,
  WorktreeStackKit_getInkCreateFieldDisplayValue,
  WorktreeStackKit_getInkCreateRegionLabel,
  WorktreeStackKit_getInkResultStatusTone,
  WorktreeStackKit_getInkSessionOutputColor,
  WorktreeStackKit_getInkSessionStatusTone,
  WorktreeStackKit_renderInkCommandPreview,
  WorktreeStackKit_sanitizeInkReviewConfirmationInput,
} from "./ink-display-view-model.js";
import { WorktreeStackKit_createInitialInkCreateDraft } from "./ink-create-model.js";

void test("Ink display helpers format command previews and confirmation input", () => {
  assert.equal(
    WorktreeStackKit_formatInkCliCommandLine({
      command: "npm",
      args: ["run", "worktrees:state:check"],
    }),
    "npm run worktrees:state:check",
  );
  assert.equal(
    WorktreeStackKit_renderInkCommandPreview({
      request: { command: "npm", args: ["run", "build"] },
    }),
    "npm run build",
  );
  assert.equal(
    WorktreeStackKit_renderInkCommandPreview({ request: null }),
    "(blocked)",
  );
  assert.equal(
    WorktreeStackKit_sanitizeInkReviewConfirmationInput("push\nNOW\r"),
    "pushNOW",
  );
});

void test("Ink display helpers map action/session/result tones", () => {
  assert.equal(
    WorktreeStackKit_getInkActionEditorKeyHint({ id: "repair" }),
    "Keys: space dry-run | i include package .env | l legacy missing-only alias | t all vs selected worktree | left/right action | enter review | esc back | q quit",
  );
  assert.equal(
    WorktreeStackKit_getInkActionPlanTone({ request: null }),
    "blocked",
  );
  assert.equal(
    WorktreeStackKit_getInkActionPlanTone({
      request: { command: "npm", args: ["run", "test"] },
    }),
    "ready",
  );
  assert.equal(WorktreeStackKit_getInkSessionOutputColor("stderr"), "red");
  assert.equal(WorktreeStackKit_getInkSessionOutputColor("bridge"), "gray");
  assert.equal(WorktreeStackKit_getInkSessionOutputColor("stdout"), "white");
  assert.equal(WorktreeStackKit_getInkSessionStatusTone("running"), "ready");
  assert.equal(
    WorktreeStackKit_getInkSessionStatusTone("cancelling"),
    "warning",
  );
  assert.equal(WorktreeStackKit_getInkSessionStatusTone("queued"), "info");
  assert.equal(WorktreeStackKit_getInkResultStatusTone("succeeded"), "ready");
  assert.equal(
    WorktreeStackKit_getInkResultStatusTone("failed"),
    "destructive",
  );
  assert.equal(WorktreeStackKit_getInkResultStatusTone("cancelled"), "warning");
});

void test("Ink display helpers format create-region and create-field values", () => {
  const draft = {
    ...WorktreeStackKit_createInitialInkCreateDraft(),
    stackName: "demo-stack",
    runInstall: false,
  };

  assert.equal(
    WorktreeStackKit_getInkCreateRegionLabel("sections"),
    "sections",
  );
  assert.equal(
    WorktreeStackKit_getInkCreateDraftInputValue({
      createDraft: draft,
      fieldId: "stackName",
    }),
    "demo-stack",
  );
  assert.equal(
    WorktreeStackKit_getInkCreateDraftInputValue({
      createDraft: draft,
      fieldId: "runInstall",
    }),
    "",
  );
  assert.equal(
    WorktreeStackKit_getInkCreateFieldBooleanValue({
      createDraft: draft,
      fieldId: "runInstall",
    }),
    false,
  );
  assert.equal(
    WorktreeStackKit_getInkCreateFieldDisplayValue({
      resolvedDraft: draft,
      fieldId: "stackName",
    }),
    "demo-stack",
  );
  assert.equal(
    WorktreeStackKit_getInkCreateFieldDisplayValue({
      resolvedDraft: draft,
      fieldId: "runInstall",
    }),
    "no",
  );
});
