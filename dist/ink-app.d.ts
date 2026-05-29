/**
 * @fileoverview Package-owned Ink app controller and renderer for worktree-stack UIs.
 *
 * Project adapters inject inventory discovery, action-plan construction, create-resolution config,
 * and project roots. This component owns reusable reducer wiring, launch-target application,
 * keyboard routing, session/run lifecycle effects, create handoff refresh, and shell/fullscreen
 * routing so root scripts can stay focused on configuration and side-effect adapters.
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/ink-app.unit.test.ts
 * @testing Jest unit: npm run worktree-kit:test (runs the full @gg-utils/worktree-kit Jest suite including this module)
 *
 * @see packages/worktree-kit/src/ink-app.unit.test.ts - Jest coverage for `WorktreeStackKit_InkApp` reducer wiring, keyboard routing, and lifecycle effects owned by this renderer.
 * @see packages/worktree-kit/src/ink-reducer.ts - Consolidated Ink UI reducer and initial-state factory this component dispatches through session, shell, and fullscreen flows.
 * @see packages/worktree-kit/src/ink-bridge.ts - Child-process launch helpers invoked when this UI starts Ink runtime or task workflows from the action catalog.
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports this module so project adapters can import `@gg-utils/worktree-kit/ink-app` without reaching into `src/` paths.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import { type WorktreeStackKit_InkActionDefinition } from "./ink-action-catalog.js";
import { type WorktreeStackKit_InkCreateResolutionConfig } from "./ink-create-resolution.js";
import type { WorktreeStackKit_InkLaunchTarget } from "./ink-launch-options.js";
import type { WorktreeStackKit_InkUiActionId, WorktreeStackKit_InkUiActionOptionState, WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiCreateDraft, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord, WorktreeStackKit_InkUiSwitchDraft } from "./ink-ui-contracts.js";
/** Host/project inventory loader injected into the reusable Ink app. */
export type WorktreeStackKit_InkAppLoadInventory = (options: {
    readonly projectRoot: string;
}) => Promise<WorktreeStackKit_InkUiInventory>;
/** Config-bound project action-plan builder injected into the reusable Ink app. */
export type WorktreeStackKit_InkAppBuildActionPlan = (options: {
    readonly actionId: WorktreeStackKit_InkUiActionId;
    readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
    readonly createDraft: WorktreeStackKit_InkUiCreateDraft;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly selectedRecord: WorktreeStackKit_InkUiRecord | null;
    readonly switchDraftOverrides?: Partial<WorktreeStackKit_InkUiSwitchDraft>;
}) => WorktreeStackKit_InkUiActionRequestPlan;
/** Props for the package-owned worktree Ink app. */
export interface WorktreeStackKit_InkAppProps {
    readonly actionDefinitions?: readonly WorktreeStackKit_InkActionDefinition[];
    readonly buildActionPlan: WorktreeStackKit_InkAppBuildActionPlan;
    readonly createResolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
    readonly launchTarget: WorktreeStackKit_InkLaunchTarget | null;
    readonly loadInventory: WorktreeStackKit_InkAppLoadInventory;
    readonly projectRoot: string;
}
/** Renders the reusable worktree Ink app around project-injected plans and inventory loading. */
export declare function WorktreeStackKit_InkApp({ actionDefinitions: actionDefinitionsProp, buildActionPlan, createResolutionConfig, launchTarget, loadInventory, projectRoot, }: WorktreeStackKit_InkAppProps): React.ReactNode;
//# sourceMappingURL=ink-app.d.ts.map