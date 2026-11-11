/**
 * @fileoverview Reusable OpenTUI action-scroll global-flow and run/result planners.
 *
 * Package-owned OpenTUI global panels consume these pure option catalogs, command-preview
 * builders, configured npm-script contracts, and selection plans for global maintenance flows plus
 * the common run/result chrome.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-global-plans.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test, including opentui-action-scroll-global-plans.unit.test.ts.
 *
 * @see packages/worktree-kit/src/opentui-global-panels.tsx - OpenTUI global maintenance panels that import these option catalogs, visibility gates, and selection planners to advance checkout-state and prune flows through preview and run/result chrome.
 * @see packages/worktree-kit/src/opentui-action-scroll-npm-plans.ts - Owns the npm-run preview plan contract referenced when global form selections produce preview-phase payloads for the shared npm preview panel.
 * @see packages/worktree-kit/src/opentui-action-scroll-global-plans.unit.test.ts - Node test runner regression coverage for planner branches and run/result formatting helpers owned in this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_OpenTuiNpmRunPreviewPlan } from "./opentui-action-scroll-npm-plans.js";
import { type WorktreeStackKit_OpenTuiFlow, type WorktreeStackKit_OpenTuiPhase, type WorktreeStackKit_OpenTuiSelectOption } from "./opentui-shell-contracts.js";
/** Pure result of selecting a yes/no fetch option in the checkout-state form. */
export type WorktreeStackKit_OpenTuiStateCheckFetchSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly stateCheckFetch: boolean;
    readonly type: "set-fetch";
};
/** Pure result of selecting a global maintenance form action. */
export type WorktreeStackKit_OpenTuiGlobalFormSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "quit";
} | {
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
    readonly type: "preview";
};
/** Pure result of selecting an action in the common run/result footer. */
export type WorktreeStackKit_OpenTuiRunResultSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
};
/** Configured npm script names required by global OpenTUI maintenance panels. */
export type WorktreeStackKit_OpenTuiGlobalNpmScripts = {
    readonly pruneStale: string;
    readonly stateCheck: string;
};
/** Whether the checkout-state form should render for the current action-scroll flow/phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiStateCheckPanel(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Whether the stale-realm prune form should render for the current action-scroll flow/phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiPruneStalePanel(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Whether the shared streaming-output panel should render for the current phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiRunPanel(options: {
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Whether the shared post-run result panel should render for the current phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiResultPanel(options: {
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Builds the yes/no fetch selector options for the checkout-state form. */
export declare function WorktreeStackKit_buildOpenTuiStateCheckFetchOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Builds the continue/navigation selector options for the checkout-state form. */
export declare function WorktreeStackKit_buildOpenTuiStateCheckFormOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Builds the continue/navigation selector options for the stale-realm prune form. */
export declare function WorktreeStackKit_buildOpenTuiPruneStaleFormOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Builds the navigation selector options for the shared post-run result panel. */
export declare function WorktreeStackKit_buildOpenTuiRunResultOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Plans state updates for selecting the checkout-state fetch mode. */
export declare function WorktreeStackKit_planOpenTuiStateCheckFetchSelection(options: {
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiStateCheckFetchSelectionPlan;
/** Builds the checkout-state npm preview plan from the selected fetch mode. */
export declare function WorktreeStackKit_planOpenTuiStateCheckPreview(options: {
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
    readonly stateCheckFetch: boolean;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
/** Plans state transitions for the checkout-state form action selector. */
export declare function WorktreeStackKit_planOpenTuiStateCheckFormSelection(options: {
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
    readonly optionValue: string | undefined;
    readonly stateCheckFetch: boolean;
}): WorktreeStackKit_OpenTuiGlobalFormSelectionPlan;
/** Builds the stale-realm prune npm preview plan. */
export declare function WorktreeStackKit_planOpenTuiPruneStalePreview(options: {
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
/** Plans state transitions for the stale-realm prune form action selector. */
export declare function WorktreeStackKit_planOpenTuiPruneStaleFormSelection(options: {
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiGlobalFormSelectionPlan;
/** Formats the streaming output area for a running command. */
export declare function WorktreeStackKit_formatOpenTuiRunningOutput(options: {
    readonly runStderr: string;
    readonly runStdout: string;
}): string;
/** Formats a command exit status for the result panel. */
export declare function WorktreeStackKit_formatOpenTuiRunExitStatus(options: {
    readonly runStatus: number | null;
}): string;
/** Formats stdout/stderr blocks for the result panel. */
export declare function WorktreeStackKit_formatOpenTuiRunResultText(options: {
    readonly text: string;
}): string;
/** Plans navigation from the common post-run result footer. */
export declare function WorktreeStackKit_planOpenTuiRunResultSelection(options: {
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiRunResultSelectionPlan;
