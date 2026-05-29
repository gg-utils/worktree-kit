/**
 * @fileoverview Reusable Ink result model derivation for completed worktree command sessions.
 *
 * The package owns product-neutral success/cancel/failure classification, including preserved
 * temporary-worktree evidence and blocked repo-root sync wording. Script adapters supply only the
 * finished execution transcript and the already-built action plan.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/ink-result-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-bridge.ts - Process bridge types for finished task execution and transcript lines this module scans when deriving blocked, failed, or succeeded outcomes.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Action-plan and result-model contracts that define the inputs and the normalized `WorktreeStackKit_InkUiResultModel` surface returned here.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink shell that calls `WorktreeStackKit_buildInkResultModel` after each catalog action completes so the session UI shows consistent completion messaging.
 * @see packages/worktree-kit/src/ink-result-model.unit.test.ts - Node test regression module covering plan-mode success copy, merge push repo-root sync blocks, and preserved temporary-worktree failure lines.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkTaskExecutionResult } from "./ink-bridge.js";
import type { WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiResultModel } from "./ink-ui-contracts.js";
/** Maps a finished Ink task execution into the result model shown after each action. */
export declare function WorktreeStackKit_buildInkResultModel(options: {
    readonly executionResult: WorktreeStackKit_InkTaskExecutionResult;
    readonly plan: WorktreeStackKit_InkUiActionRequestPlan;
}): WorktreeStackKit_InkUiResultModel;
//# sourceMappingURL=ink-result-model.d.ts.map