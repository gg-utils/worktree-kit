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

import type {
  WorktreeStackKit_OpenTuiNpmRunPreviewPlan,
} from "./opentui-action-scroll-npm-plans.js";

import {
  WORKTREE_STACK_KIT_OPENTUI_RESULT_TABS,
  WorktreeStackKit_openTuiNavTabs,
  type WorktreeStackKit_OpenTuiFlow,
  type WorktreeStackKit_OpenTuiPhase,
  type WorktreeStackKit_OpenTuiSelectOption,
} from "./opentui-shell-contracts.js";
import { WorktreeStackKit_formatUiNpmRunCommand } from "./ui-command-catalog.js";

/** Pure result of selecting a yes/no fetch option in the checkout-state form. */
export type WorktreeStackKit_OpenTuiStateCheckFetchSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly stateCheckFetch: boolean; readonly type: "set-fetch" };

/** Pure result of selecting a global maintenance form action. */
export type WorktreeStackKit_OpenTuiGlobalFormSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | {
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
      readonly type: "preview";
    };

/** Pure result of selecting an action in the common run/result footer. */
export type WorktreeStackKit_OpenTuiRunResultSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" };

/** Configured npm script names required by global OpenTUI maintenance panels. */
export type WorktreeStackKit_OpenTuiGlobalNpmScripts = {
  readonly pruneStale: string;
  readonly stateCheck: string;
};

const WORKTREE_STACK_KIT_OPENTUI_STATE_CHECK_FETCH_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Refresh refs", name: "yes", value: "yes" },
  { description: "Skip fetch", name: "no", value: "no" },
];

/** Whether the checkout-state form should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiStateCheckPanel(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "checkoutState" && options.phase === "form";
}

/** Whether the stale-realm prune form should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiPruneStalePanel(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "pruneStale" && options.phase === "form";
}

/** Whether the shared streaming-output panel should render for the current phase. */
export function WorktreeStackKit_shouldShowOpenTuiRunPanel(options: {
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.phase === "running";
}

/** Whether the shared post-run result panel should render for the current phase. */
export function WorktreeStackKit_shouldShowOpenTuiResultPanel(options: {
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.phase === "result";
}

/** Builds the yes/no fetch selector options for the checkout-state form. */
export function WorktreeStackKit_buildOpenTuiStateCheckFetchOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [...WORKTREE_STACK_KIT_OPENTUI_STATE_CHECK_FETCH_OPTIONS];
}

/** Builds the continue/navigation selector options for the checkout-state form. */
export function WorktreeStackKit_buildOpenTuiStateCheckFormOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [
    { description: "Preview", name: "Continue", value: "next" },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds the continue/navigation selector options for the stale-realm prune form. */
export function WorktreeStackKit_buildOpenTuiPruneStaleFormOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [
    {
      description: "Preview npm command",
      name: "Continue",
      value: "next",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds the navigation selector options for the shared post-run result panel. */
export function WorktreeStackKit_buildOpenTuiRunResultOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [...WORKTREE_STACK_KIT_OPENTUI_RESULT_TABS];
}

/** Plans state updates for selecting the checkout-state fetch mode. */
export function WorktreeStackKit_planOpenTuiStateCheckFetchSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiStateCheckFetchSelectionPlan {
  switch (options.optionValue) {
    case "yes":
      return { stateCheckFetch: true, type: "set-fetch" };
    case "no":
      return { stateCheckFetch: false, type: "set-fetch" };
    default:
      return { type: "ignore" };
  }
}

/** Builds the checkout-state npm preview plan from the selected fetch mode. */
export function WorktreeStackKit_planOpenTuiStateCheckPreview(options: {
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
  readonly stateCheckFetch: boolean;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  const forwarded = options.stateCheckFetch ? ["--fetch"] : [];
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: forwarded,
      npmScript: options.npmScripts.stateCheck,
    }),
    forwarded,
    requiredConfirmToken: null,
    script: options.npmScripts.stateCheck,
  };
}

/** Plans state transitions for the checkout-state form action selector. */
export function WorktreeStackKit_planOpenTuiStateCheckFormSelection(options: {
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
  readonly optionValue: string | undefined;
  readonly stateCheckFetch: boolean;
}): WorktreeStackKit_OpenTuiGlobalFormSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "next":
      return {
        nextPhase: "preview",
        previewPlan: WorktreeStackKit_planOpenTuiStateCheckPreview({
          npmScripts: options.npmScripts,
          stateCheckFetch: options.stateCheckFetch,
        }),
        type: "preview",
      };
    default:
      return { type: "ignore" };
  }
}

/** Builds the stale-realm prune npm preview plan. */
export function WorktreeStackKit_planOpenTuiPruneStalePreview(options: {
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  const forwarded: string[] = [];
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: forwarded,
      npmScript: options.npmScripts.pruneStale,
    }),
    forwarded,
    requiredConfirmToken: "PRUNE",
    script: options.npmScripts.pruneStale,
  };
}

/** Plans state transitions for the stale-realm prune form action selector. */
export function WorktreeStackKit_planOpenTuiPruneStaleFormSelection(options: {
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiGlobalFormSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "next":
      return {
        nextPhase: "preview",
        previewPlan: WorktreeStackKit_planOpenTuiPruneStalePreview({
          npmScripts: options.npmScripts,
        }),
        type: "preview",
      };
    default:
      return { type: "ignore" };
  }
}

/** Formats the streaming output area for a running command. */
export function WorktreeStackKit_formatOpenTuiRunningOutput(options: {
  readonly runStderr: string;
  readonly runStdout: string;
}): string {
  const output = options.runStdout + options.runStderr;
  return output.length > 0 ? output : "…";
}

/** Formats a command exit status for the result panel. */
export function WorktreeStackKit_formatOpenTuiRunExitStatus(options: {
  readonly runStatus: number | null;
}): string {
  return options.runStatus === null ? "unknown" : String(options.runStatus);
}

/** Formats stdout/stderr blocks for the result panel. */
export function WorktreeStackKit_formatOpenTuiRunResultText(options: {
  readonly text: string;
}): string {
  return options.text.length > 0 ? options.text : "(empty)";
}

/** Plans navigation from the common post-run result footer. */
export function WorktreeStackKit_planOpenTuiRunResultSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiRunResultSelectionPlan {
  if (options.optionValue === "menu") {
    return { type: "menu" };
  }
  return { type: "ignore" };
}
