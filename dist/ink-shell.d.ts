/**
 * @fileoverview Package-owned Ink shell renderer for worktree inventory, action overview, and inline editors.
 *
 * Root adapters provide project action catalogs, create-resolution config, inventory loading, and
 * subprocess side effects. This package renderer owns the reusable React/Ink shell layout and keeps
 * script folders focused on configuration/adapters.
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root; that script runs tsx --test over packages/worktree-kit/src, matching every path ending in .unit.test.ts under src, including src/ink-shell.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-app.tsx - Ink app controller that mounts this shell renderer inside reducer-driven session, keyboard routing, and fullscreen handoffs for worktree-stack CLIs.
 * @see packages/worktree-kit/src/ink-shell-view-model.ts - Pure view-model builders supplying header summaries, record rows, legend lines, overview stats, and combined issue rows consumed by this layout.
 * @see packages/worktree-kit/src/ink-shell.unit.test.ts - Node test module asserting bound-shell factory wiring and React element-shape coverage for exports owned by this renderer.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-app-shell-views.tsx - Worktree-stack CLI Ink views that import the published `@gg-utils/worktree-kit/ink-shell` entrypoint alongside other shell slices.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import type { WorktreeStackKit_InkCreateResolutionConfig } from "./ink-create-resolution.js";
import type { WorktreeStackKit_InkUiActionDefinition, WorktreeStackKit_InkUiActionOptionState, WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiCreateDraft, WorktreeStackKit_InkUiCreateInteractionMode, WorktreeStackKit_InkUiCreateRegion, WorktreeStackKit_InkUiFocusedColumn, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord } from "./ink-ui-contracts.js";
export { WorktreeStackKit_getInkShellSelectedRecord } from "./ink-shell-view-model.js";
/** Props required by the package-owned Ink shell renderer. */
export type WorktreeStackKit_InkShellProps = {
    inventory: WorktreeStackKit_InkUiInventory;
    selectedIndex: number;
    selectedActionIndex: number;
    focusedColumn: WorktreeStackKit_InkUiFocusedColumn;
    actionPlans: WorktreeStackKit_InkUiActionRequestPlan[];
    actionOptions: WorktreeStackKit_InkUiActionOptionState;
    poolNextStackEditMode: boolean;
    noticeMessage?: string | null;
    createDraft: WorktreeStackKit_InkUiCreateDraft;
    createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
    createRegion: WorktreeStackKit_InkUiCreateRegion;
    selectedCreateSectionIndex: number;
    selectedCreateFieldIndex: number;
    actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[];
    resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
    appName?: string;
    description?: string;
};
/** Props retained by shell adapters after action/config dependencies are bound once. */
export type WorktreeStackKit_BoundInkShellProps = Omit<WorktreeStackKit_InkShellProps, "actionDefinitions" | "resolutionConfig">;
/** Function component returned by the package-owned bound shell factory. */
export type WorktreeStackKit_BoundInkShellComponent = (props: WorktreeStackKit_BoundInkShellProps) => React.ReactNode;
/** Options for creating a project-configured Ink shell component. */
export type WorktreeStackKit_CreateBoundInkShellOptions = {
    readonly actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[];
    readonly resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
};
/**
 * Resolve the selected worktree record from a numeric list index.
 */
export declare function WorktreeStackKit_getInkShellSelectedRecordFromInventory(inventory: WorktreeStackKit_InkUiInventory, selectedIndex: number): WorktreeStackKit_InkUiRecord | null;
/**
 * Primary two-column Ink shell listing worktrees, actions, and contextual detail panels.
 */
export declare function WorktreeStackKit_InkShell({ inventory, selectedIndex, selectedActionIndex, focusedColumn, actionPlans, actionOptions, poolNextStackEditMode, noticeMessage, createDraft, createInteractionMode, createRegion, selectedCreateSectionIndex, selectedCreateFieldIndex, actionDefinitions, resolutionConfig, appName, description, }: WorktreeStackKit_InkShellProps): React.ReactNode;
/**
 * Creates a shell component with project action definitions and create-resolution config bound.
 */
export declare function WorktreeStackKit_createBoundInkShell({ actionDefinitions, resolutionConfig, }: WorktreeStackKit_CreateBoundInkShellOptions): WorktreeStackKit_BoundInkShellComponent;
//# sourceMappingURL=ink-shell.d.ts.map