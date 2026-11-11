/**
 * @fileoverview Verifies `WorktreeStackKit_buildInkResultModel` classifies finished Ink task transcripts into
 * the UI result contract for plan-mode success, merge repo-root sync blockers, and preserved temp-worktree paths.
 *
 * This file owns Node `node:test` regression coverage for transcript-driven status, user-facing messages, and
 * refresh flags shown after worktree-stack Ink actions complete.
 * Flow: build synthetic execution result and plan fixtures -> call mapper -> assert status, message, and refresh flags.
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-result-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-result-model.ts - Maps execution transcripts and action plans into `WorktreeStackKit_InkUiResultModel` values asserted here for success, blocked, and failure wording.
 * @see packages/worktree-kit/src/ink-bridge.ts - Declares `WorktreeStackKit_InkTaskExecutionResult` and session line shapes the fixtures in this suite mirror when building synthetic transcripts.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Defines `WorktreeStackKit_InkUiActionRequestPlan` fields such as `executionMode` and `actionId` that steer the mapper branches covered by these tests.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - File-overview contract this test module header follows for documentation gate audits.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { WorktreeStackKit_InkTaskExecutionResult } from "./ink-bridge.js";
import { WorktreeStackKit_buildInkResultModel } from "./ink-result-model.js";
import type {
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiSessionLine,
} from "./ink-ui-contracts.js";

function createLine(
  text: string,
  source: WorktreeStackKit_InkUiSessionLine["source"] = "stdout",
): WorktreeStackKit_InkUiSessionLine {
  return { source, text };
}

function createExecutionResult(
  overrides: Partial<WorktreeStackKit_InkTaskExecutionResult> = {},
): WorktreeStackKit_InkTaskExecutionResult {
  return {
    status: "succeeded",
    exitCode: 0,
    signal: null,
    lines: [],
    startedAt: "2026-03-12T00:00:00.000Z",
    endedAt: "2026-03-12T00:00:05.000Z",
    ...overrides,
  };
}

function createPlan(
  overrides: Partial<WorktreeStackKit_InkUiActionRequestPlan> = {},
): WorktreeStackKit_InkUiActionRequestPlan {
  return {
    actionId: "merge",
    actionLabel: "Merge to main",
    targetPath: "/repo/worktree",
    executionMode: "push",
    refreshOnSuccess: true,
    createContext: null,
    switchContext: null,
    summaryLines: ["Merge selected worktree domain into origin/main"],
    issues: [],
    request: {
      label: "Merge selected worktree domain into origin/main",
      sessionKind: "task",
      command: "npm",
      args: ["run", "worktrees:merge", "--", "--push"],
    },
    destructiveConfirmationText: "Merge push mutates origin/main.",
    requiredConfirmationToken: "MERGE",
    retainedArtifacts: [],
    ...overrides,
  };
}

void test("WorktreeStackKit_buildInkResultModel marks plan-mode success", () => {
  const plan = createPlan({
    actionId: "update-from-main",
    actionLabel: "Update from main",
    executionMode: "plan",
    refreshOnSuccess: false,
    requiredConfirmationToken: null,
    destructiveConfirmationText: null,
  });

  const result = WorktreeStackKit_buildInkResultModel({
    executionResult: createExecutionResult(),
    plan,
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.message, "Update from main plan completed successfully.");
  assert.equal(result.refreshRequested, false);
  assert.equal(result.createHandoff, null);
});

void test("WorktreeStackKit_buildInkResultModel reclassifies repo-root sync blockers", () => {
  const result = WorktreeStackKit_buildInkResultModel({
    executionResult: createExecutionResult({
      status: "failed",
      exitCode: 1,
      lines: [
        createLine("Merge completed in temp worktrees."),
        createLine(
          "Repo-root checkout has uncommitted changes that overlap incoming main changes.",
          "stderr",
        ),
      ],
    }),
    plan: createPlan(),
  });

  assert.equal(result.status, "blocked");
  assert.match(result.message, /repo-root main checkout sync was blocked/);
  assert.equal(result.refreshRequested, false);
});

void test("WorktreeStackKit_buildInkResultModel surfaces preserved temp-worktree evidence", () => {
  const plan = createPlan({
    actionId: "update-from-main",
    actionLabel: "Update from main",
    request: {
      label: "Refresh selected worktree from origin/main",
      sessionKind: "task",
      command: "npm",
      args: ["run", "worktrees:update-from-main", "--", "--push"],
    },
    executionMode: "push",
    requiredConfirmationToken: null,
    destructiveConfirmationText: null,
  });
  const result = WorktreeStackKit_buildInkResultModel({
    executionResult: createExecutionResult({
      status: "failed",
      exitCode: 1,
      lines: [
        createLine(
          "Temporary refresh worktree preserved for inspection: /repo/.tmp/worktree-stack/update-from-main/run/root",
        ),
      ],
    }),
    plan,
  });

  assert.equal(result.status, "failed");
  assert.match(result.message, /Conflict evidence was preserved/);
  assert.match(
    result.message,
    /\/repo\/\.tmp\/worktree-stack\/update-from-main\/run\/root/,
  );
});
