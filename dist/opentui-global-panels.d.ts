/**
 * @fileoverview Package-owned OpenTUI panels for global maintenance and run/result flows.
 *
 * Project adapters inject configured npm script names plus host quit behavior while this module
 * owns package-safe OpenTUI rendering for checkout-state, stale-realm pruning, streaming output,
 * and post-run result navigation.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-global-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-global-plans.ts - Visibility gates, option catalogs, and selection planners this module invokes when advancing checkout-state, prune-stale, and post-run navigation.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that composes these global panels with other stacked maintenance and npm panels for non-menu flows.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Focusable tab-style select control reused here for fetch toggles, form choices, and post-run result actions.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */
import type { Dispatch, SetStateAction } from "react";
import { type WorktreeStackKit_OpenTuiGlobalNpmScripts } from "./opentui-action-scroll-global-plans.js";
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiPhase } from "./opentui-shell-contracts.js";
/** Pending npm-run request handed from global panels to the shared npm preview panel. */
export interface WorktreeStackKit_OpenTuiGlobalPendingNpmRun {
    readonly forwarded: string[];
    readonly script: string;
}
interface WorktreeStackKit_OpenTuiGlobalPreviewStateProps {
    readonly setCommandPreview: Dispatch<SetStateAction<string>>;
    readonly setPendingNpmRun: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiGlobalPendingNpmRun | null>>;
    readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
    readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}
/** Props for the checkout-state global form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollStateCheckPanelProps extends WorktreeStackKit_OpenTuiGlobalPreviewStateProps {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly goMenu: () => void;
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly requestQuit: () => void;
    readonly setStateCheckFetch: Dispatch<SetStateAction<boolean>>;
    readonly stateCheckFetch: boolean;
}
/** Props for the stale-realm prune global form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollPruneStalePanelProps extends WorktreeStackKit_OpenTuiGlobalPreviewStateProps {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly goMenu: () => void;
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly requestQuit: () => void;
}
/** Props for shared running-output and result panels. */
export interface WorktreeStackKit_OpenTuiActionScrollRunAndResultPanelsProps {
    readonly goMenu: () => void;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly runScript: string;
    readonly runStatus: number | null;
    readonly runStderr: string;
    readonly runStdout: string;
}
/** Renders the worktrees:state:check form and preview transition. */
export declare function WorktreeStackKit_OpenTuiActionScrollStateCheckPanel(props: WorktreeStackKit_OpenTuiActionScrollStateCheckPanelProps): import("react").ReactNode;
/** Renders the stale-realm prune form and confirmation-token preview transition. */
export declare function WorktreeStackKit_OpenTuiActionScrollPruneStalePanel(props: WorktreeStackKit_OpenTuiActionScrollPruneStalePanelProps): import("react").ReactNode;
/** Renders streaming output and post-run result navigation for non-menu flows. */
export declare function WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels(props: WorktreeStackKit_OpenTuiActionScrollRunAndResultPanelsProps): import("react").ReactNode;
export {};
