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
/** Returns the first transcript line whose text contains a stable runner echo substring. */
function WorktreeStackKit_findInkResultLineContaining(lines, fragment) {
    for (const line of lines) {
        if (line.text.includes(fragment)) {
            return line;
        }
    }
    return null;
}
/** Detects merge push flows where repo-root main checkout sync was blocked after merge work. */
function WorktreeStackKit_isInkResultMergeRootSyncBlocked(lines) {
    return (WorktreeStackKit_findInkResultLineContaining(lines, "Repo-root checkout has uncommitted changes that overlap incoming main changes.") !== null ||
        WorktreeStackKit_findInkResultLineContaining(lines, "Repo-root checkout stash restore conflicted.") !== null);
}
/** Locates preserved temporary worktree evidence for merge or update-from-main failures. */
function WorktreeStackKit_findInkResultPreservedTempWorktreeLine(lines, actionId) {
    if (actionId === "merge") {
        return WorktreeStackKit_findInkResultLineContaining(lines, "Temporary merge worktree preserved for inspection:");
    }
    if (actionId === "update-from-main") {
        return WorktreeStackKit_findInkResultLineContaining(lines, "Temporary refresh worktree preserved for inspection:");
    }
    return null;
}
/** Copies bridge transcript rows into the UI result contract without sharing mutable arrays. */
function WorktreeStackKit_copyInkResultSessionLines(lines) {
    return lines.map((line) => ({ source: line.source, text: line.text }));
}
/** Builds the user-facing completion line after a successful run. */
function WorktreeStackKit_buildInkResultSuccessMessage(plan) {
    if (plan.executionMode === "plan") {
        return `${plan.actionLabel} plan completed successfully.`;
    }
    return `${plan.actionLabel} completed successfully.`;
}
/** Derives failure status and copy from the action plan plus echoed transcript evidence. */
function WorktreeStackKit_buildInkResultFailureMessage(plan, lines) {
    if (plan.actionId === "merge" &&
        plan.executionMode === "push" &&
        WorktreeStackKit_isInkResultMergeRootSyncBlocked(lines)) {
        return {
            status: "blocked",
            message: "Merge reached origin/main, but the repo-root main checkout sync was blocked. Resolve the root checkout conflict or stash-pop failure before continuing.",
        };
    }
    const preservedLine = WorktreeStackKit_findInkResultPreservedTempWorktreeLine(lines, plan.actionId);
    if (preservedLine) {
        return {
            status: "failed",
            message: `${plan.actionLabel} failed. Conflict evidence was preserved: ${preservedLine.text}`,
        };
    }
    return {
        status: "failed",
        message: `${plan.actionLabel} failed. Inspect stderr and exit code details below.`,
    };
}
/** Maps a finished Ink task execution into the result model shown after each action. */
export function WorktreeStackKit_buildInkResultModel(options) {
    const { executionResult, plan } = options;
    const lines = WorktreeStackKit_copyInkResultSessionLines(executionResult.lines);
    if (executionResult.status === "succeeded") {
        return {
            status: "succeeded",
            message: WorktreeStackKit_buildInkResultSuccessMessage(plan),
            exitCode: executionResult.exitCode,
            signal: executionResult.signal,
            lines,
            startedAt: executionResult.startedAt,
            endedAt: executionResult.endedAt,
            refreshRequested: plan.refreshOnSuccess,
            createHandoff: null,
        };
    }
    if (executionResult.status === "cancelled") {
        return {
            status: "cancelled",
            message: `${plan.actionLabel} was cancelled before it completed.`,
            exitCode: executionResult.exitCode,
            signal: executionResult.signal,
            lines,
            startedAt: executionResult.startedAt,
            endedAt: executionResult.endedAt,
            refreshRequested: false,
            createHandoff: null,
        };
    }
    const failure = WorktreeStackKit_buildInkResultFailureMessage(plan, executionResult.lines);
    return {
        status: failure.status,
        message: failure.message,
        exitCode: executionResult.exitCode,
        signal: executionResult.signal,
        lines,
        startedAt: executionResult.startedAt,
        endedAt: executionResult.endedAt,
        refreshRequested: false,
        createHandoff: null,
    };
}
