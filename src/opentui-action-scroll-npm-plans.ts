/**
 * @fileoverview Reusable OpenTUI action-scroll npm preview planners.
 *
 * Package-owned OpenTUI npm panels consume these pure helpers for command-preview
 * assembly, confirmation token policy, enum parsing, and preview/confirm selection planning in
 * record-scoped workflows.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-npm-plans.unit.test.ts
 * @see packages/worktree-kit/src/ui-command-catalog.ts - UI npm script forwarded-arg builders and command preview formatter composed here into typed npm-run preview plans for worktrees stack scripts.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow, phase, pool-kind, and nav-tab contracts consumed when preview and confirm tab selections resolve to navigation or phase transitions.
 * @see packages/worktree-kit/src/opentui-npm-panels.tsx - OpenTUI npm preview and confirm panels that import these pure planners to assemble scrollable command-preview and token-guarded confirm flows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import {
  WorktreeStackKit_buildUiDestroyArgs,
  WorktreeStackKit_buildUiMergeArgs,
  WorktreeStackKit_buildUiStartArgs,
  WorktreeStackKit_buildUiUpdateFromMainArgs,
  WorktreeStackKit_formatUiNpmRunCommand,
  type WorktreeStackKit_UiExecutionMode,
  type WorktreeStackKit_UiUpdateMode,
} from "./ui-command-catalog.js";
import {
  WorktreeStackKit_openTuiNavTabs,
  type WorktreeStackKit_OpenTuiFlow,
  type WorktreeStackKit_OpenTuiPhase,
  type WorktreeStackKit_OpenTuiPoolKind,
  type WorktreeStackKit_OpenTuiSelectOption,
} from "./opentui-shell-contracts.js";

type WorktreeStackKit_OpenTuiOptionList = WorktreeStackKit_OpenTuiSelectOption[];

/** Generic npm-run plan applied by OpenTUI action-scroll script adapters. */
export type WorktreeStackKit_OpenTuiNpmRunPreviewPlan = {
  readonly commandPreview: string;
  readonly forwarded: string[];
  readonly requiredConfirmToken: string | null;
  readonly script: string;
};

/** Pure result of selecting an action in a generic npm preview panel. */
export type WorktreeStackKit_OpenTuiNpmPreviewSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | { readonly type: "run" }
  | { readonly type: "confirm" }
  | {
      readonly clearConfirmTokenInput: boolean;
      readonly clearPendingRun: boolean;
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly type: "back";
    };

/** Pure result of selecting an action in the guarded npm confirm panel. */
export type WorktreeStackKit_OpenTuiNpmConfirmSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | { readonly type: "back"; readonly nextPhase: WorktreeStackKit_OpenTuiPhase }
  | { readonly clearFormError: boolean; readonly type: "run" }
  | { readonly message: string; readonly type: "validation-error" };

/** Tab options for worktree update mode selection. */
export const WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  {
    description: "Target existing live worktree",
    name: "live-worktree",
    value: "live-worktree",
  },
  {
    description: "Target branch directly",
    name: "pushed-only",
    value: "pushed-only",
  },
];

/** Tab options for plan-vs-push execution selection. */
export const WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Skip modifications", name: "plan", value: "plan" },
  { description: "Execute changes", name: "push", value: "push" },
];

/** Builds tab-select options for the generic npm preview panel. */
export function WorktreeStackKit_buildOpenTuiNpmPreviewOptions(options: {
  readonly requiresConfirmToken: boolean;
}): WorktreeStackKit_OpenTuiOptionList {
  return [
    ...(options.requiresConfirmToken
      ? [
          {
            description: "Enter token in confirm screen",
            name: "Confirm…",
            value: "confirm",
          },
        ]
      : [{ description: "Execute", name: "Run", value: "run" }]),
    { description: "Edit inputs", name: "Back", value: "back" },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds tab-select options for the guarded npm confirmation panel. */
export function WorktreeStackKit_buildOpenTuiNpmConfirmOptions(): (
  WorktreeStackKit_OpenTuiOptionList
) {
  return [
    {
      description: "Execute after token match",
      name: "Run",
      value: "run",
    },
    { description: "Return to preview", name: "Back", value: "back" },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Parses tab-select values into the reusable update mode union. */
export function WorktreeStackKit_parseOpenTuiUpdateMode(
  value: string | undefined,
): WorktreeStackKit_UiUpdateMode | null {
  if (value === "live-worktree" || value === "pushed-only") {
    return value;
  }
  return null;
}

/** Parses tab-select values into the reusable execution mode union. */
export function WorktreeStackKit_parseOpenTuiExecutionMode(
  value: string | undefined,
): WorktreeStackKit_UiExecutionMode | null {
  if (value === "plan" || value === "push") {
    return value;
  }
  return null;
}

function WorktreeStackKit_resolveOpenTuiPreviewBackPhase(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
}): WorktreeStackKit_OpenTuiPhase {
  if (options.flow === "diagnostics") {
    return "submenu";
  }
  if (options.flow === "pool") {
    return options.poolKind === "next" ? "form" : "submenu";
  }
  return "form";
}

/** Plans non-render side effects for the generic npm preview panel. */
export function WorktreeStackKit_planOpenTuiNpmPreviewSelection(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly optionValue: string | undefined;
  readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
  readonly requiresConfirmToken: boolean;
}): WorktreeStackKit_OpenTuiNpmPreviewSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "run":
      return options.requiresConfirmToken ? { type: "ignore" } : { type: "run" };
    case "confirm":
      return options.requiresConfirmToken
        ? { type: "confirm" }
        : { type: "ignore" };
    case "back":
      return {
        clearConfirmTokenInput: true,
        clearPendingRun: true,
        nextPhase: WorktreeStackKit_resolveOpenTuiPreviewBackPhase({
          flow: options.flow,
          poolKind: options.poolKind,
        }),
        type: "back",
      };
    default:
      return { type: "ignore" };
  }
}

/** Plans non-render side effects for the guarded npm confirmation panel. */
export function WorktreeStackKit_planOpenTuiNpmConfirmSelection(options: {
  readonly confirmTokenInput: string;
  readonly optionValue: string | undefined;
  readonly requiredConfirmToken: string;
}): WorktreeStackKit_OpenTuiNpmConfirmSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "back":
      return { nextPhase: "preview", type: "back" };
    case "run":
      if (options.confirmTokenInput !== options.requiredConfirmToken) {
        return {
          message: `Token must match ${options.requiredConfirmToken}.`,
          type: "validation-error",
        };
      }
      return { clearFormError: true, type: "run" };
    default:
      return { type: "ignore" };
  }
}

/** Builds the preview plan for `worktrees:start`. */
export function WorktreeStackKit_planOpenTuiStartNpmPreview(options: {
  readonly openWindsurf: boolean;
  readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  const script = "worktrees:start";
  const forwarded = WorktreeStackKit_buildUiStartArgs({
    openWindsurf: options.openWindsurf,
    worktreePath: options.worktreePath,
  });
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: forwarded,
      npmScript: script,
    }),
    forwarded,
    requiredConfirmToken: null,
    script,
  };
}

/** Builds the preview plan for `worktrees:destroy`. */
export function WorktreeStackKit_planOpenTuiDestroyNpmPreview(options: {
  readonly prune: boolean;
  readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  const script = "worktrees:destroy";
  const forwarded = WorktreeStackKit_buildUiDestroyArgs({
    prune: options.prune,
    worktreePath: options.worktreePath,
  });
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: forwarded,
      npmScript: script,
    }),
    forwarded,
    requiredConfirmToken: "DESTROY",
    script,
  };
}

/** Builds the preview plan for `worktrees:update-from-main`. */
export function WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview(options: {
  readonly executionMode: WorktreeStackKit_UiExecutionMode;
  readonly targetBranch: string;
  readonly updateMode: WorktreeStackKit_UiUpdateMode;
  readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  const script = "worktrees:update-from-main";
  const forwarded = WorktreeStackKit_buildUiUpdateFromMainArgs({
    executionMode: options.executionMode,
    mode: options.updateMode,
    targetBranch: options.targetBranch,
    worktreePath: options.worktreePath,
  });
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: forwarded,
      npmScript: script,
    }),
    forwarded,
    requiredConfirmToken: options.executionMode === "push" ? "PUSH" : null,
    script,
  };
}

/** Builds the preview plan for `worktrees:merge`. */
export function WorktreeStackKit_planOpenTuiMergeNpmPreview(options: {
  readonly executionMode: WorktreeStackKit_UiExecutionMode;
  readonly targetBranch: string;
  readonly worktreePath: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  const script = "worktrees:merge";
  const forwarded = WorktreeStackKit_buildUiMergeArgs({
    executionMode: options.executionMode,
    targetBranch: options.targetBranch,
    worktreePath: options.worktreePath,
  });
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: forwarded,
      npmScript: script,
    }),
    forwarded,
    requiredConfirmToken: options.executionMode === "push" ? "MERGE" : null,
    script,
  };
}
