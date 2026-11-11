/**
 * @fileoverview Package-owned Ink renderer for worktree action option panels.
 *
 * This component is product-neutral terminal UI: it renders reusable worktree action toggles and
 * selectors from action definitions and option state, while root script adapters still own launch,
 * inventory loading, subprocess execution, and project-specific command construction.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Defines WorktreeStackKit_InkUiActionDefinition and WorktreeStackKit_InkUiActionOptionState contracts whose fields this panel renders as Ink toggles and selectors.
 * @see packages/worktree-kit/src/ink-shell.tsx - Interactive Ink shell that mounts this panel beside the plan preview so operators can flip action-scoped options while navigating the stack UI.
 * @see packages/worktree-kit/src/ink-action-options-panel.unit.test.ts - Node test runner coverage that invokes the panel with representative actionDefinition ids and asserts React.isValidElement on returned trees.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import type { WorktreeStackKit_InkUiActionDefinition, WorktreeStackKit_InkUiActionOptionState } from "./ink-ui-contracts.js";
/**
 * Action-specific toggles and selectors shown beside the plan preview.
 */
export declare function WorktreeStackKit_InkActionOptionsPanel({ actionDefinition, actionOptions, poolNextStackEditMode, }: {
    actionDefinition: WorktreeStackKit_InkUiActionDefinition;
    actionOptions: WorktreeStackKit_InkUiActionOptionState;
    poolNextStackEditMode: boolean;
}): React.ReactNode;
