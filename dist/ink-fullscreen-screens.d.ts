/**
 * @fileoverview Package-owned Ink full-screen renderers for worktree review/session/result flows.
 *
 * The screens compose package-owned full-screen view models, issue rendering, status badges, command
 * previews, output capture blocks, and terminal sizing. Root launchers still own inventory loading,
 * reducer wiring, config loading, and subprocess side effects.
 *
 * @testing Node test: npm run worktree-kit:test from the repository root runs packages/worktree-kit unit tests including ink-fullscreen-screens.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-fullscreen-view-model.ts - View-model builders that normalize headers, legends, command previews, and section copy these Ink screens render.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Action plan, session line, and result model contracts passed into the exported review, session, and result screen components.
 * @see packages/worktree-kit/src/ink-issue-line.tsx - Issue-line renderer embedded in the review and result issue panels owned by this module.
 * @see packages/worktree-kit/src/ink-display-view-model.ts - Session output color mapping applied when rendering captured lines inside session and result output blocks here.
 * @see packages/worktree-kit/src/ink-fullscreen-screens.unit.test.ts - Node:test coverage that imports these screens and asserts stable element wiring against fixture contracts.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import type { WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiResultModel, WorktreeStackKit_InkUiSessionLine, WorktreeStackKit_InkUiSessionModel } from "./ink-ui-contracts.js";
/** Typed confirmation gate before spawning runtime or task sessions. */
export declare function WorktreeStackKit_InkReviewScreen({ actionPlan, reviewConfirmationInput, }: {
    actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    reviewConfirmationInput: string;
}): React.ReactNode;
/** Live child-process output with cancellable session affordances. */
export declare function WorktreeStackKit_InkSessionScreen({ actionPlan, lines, sessionStatus, startedAt, }: {
    actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    lines: readonly WorktreeStackKit_InkUiSessionLine[];
    sessionStatus: WorktreeStackKit_InkUiSessionModel["status"];
    startedAt: string | null;
}): React.ReactNode;
/** Post-run diagnostics including optional create-resolution handoff UI. */
export declare function WorktreeStackKit_InkResultScreen({ actionPlan, result, }: {
    actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    result: WorktreeStackKit_InkUiResultModel;
}): React.ReactNode;
