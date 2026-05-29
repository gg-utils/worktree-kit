/**
 * @fileoverview Reusable OpenTUI action-scroll switch-flow planners.
 *
 * Package-owned switch panels consume these helpers for switch-flow visibility, option
 * construction, form-model patching, npm preview formatting, and tab-select selection plans while
 * script adapters keep project command-path and host side-effect bindings.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_planOpenTuiSwitchPreview } from "./opentui-action-scroll-switch-plans.js";
 *
 * const preview = WorktreeStackKit_planOpenTuiSwitchPreview({
 *   model: { prefix: "", stackName: "demo", worktreesBase: "default" },
 * });
 * ```
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-switch-plans.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test, including opentui-action-scroll-switch-plans.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Supplies argv and npm command-line preview helpers consumed when turning switch-form state into preview argv plus stable `npm run` text.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Defines switch-flow phases, navigation tabs, and select-option shapes these planners assemble for OpenTUI tab-select wiring.
 * @see packages/worktree-kit/src/opentui-switch-panel.tsx - Primary OpenTUI switch panel that calls these visibility gates, option builders, model updates, and selection plans for the worktree switch flow.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - App controller that imports switch preview planning when wiring preview data alongside the broader OpenTUI action-scroll shell.
 * @see packages/worktree-kit/src/opentui-action-scroll-switch-plans.unit.test.ts - Node test runner regression coverage for switch-flow planners and preview strings owned in this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import {
  WorktreeStackKit_buildOpenTuiSwitchArgv,
  WorktreeStackKit_formatUiNpmRunCommand,
  type WorktreeStackKit_UiSwitchFormModel,
} from "./ui-command-catalog.js";
import {
  WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS,
  WorktreeStackKit_openTuiNavTabs,
  type WorktreeStackKit_OpenTuiFlow,
  type WorktreeStackKit_OpenTuiPhase,
  type WorktreeStackKit_OpenTuiSelectOption,
} from "./opentui-shell-contracts.js";

/** Editable OpenTUI switch-form field ids. */
export type WorktreeStackKit_OpenTuiSwitchFormFieldId =
  | "prefix"
  | "stackName"
  | "worktreesBase";

/** Pure preview data produced from the current switch-form model. */
export type WorktreeStackKit_OpenTuiSwitchPreviewPlan = {
  readonly argv: string[];
  readonly previewText: string;
};

/** Pure result of selecting an action in the switch form footer. */
export type WorktreeStackKit_OpenTuiSwitchFormSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | { readonly type: "preview" };

/** Pure result of selecting an action in the switch preview footer. */
export type WorktreeStackKit_OpenTuiSwitchPreviewSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "run" }
  | { readonly nextPhase: WorktreeStackKit_OpenTuiPhase; readonly type: "back" };

const WORKTREE_STACK_KIT_OPENTUI_SWITCH_NPM_SCRIPT = "worktrees:switch";

/** Whether the switch form should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiSwitchForm(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "switch" && options.phase === "form";
}

/** Whether the switch preview should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiSwitchPreview(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "switch" && options.phase === "preview";
}

/** Builds the continue/navigation selector options for the switch form. */
export function WorktreeStackKit_buildOpenTuiSwitchFormOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [
    {
      description: "Preview command",
      name: "Continue",
      value: "next",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds the run/back selector options for the switch preview. */
export function WorktreeStackKit_buildOpenTuiSwitchPreviewOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [...WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS];
}

/** Applies one text-field edit without coupling scripts to object spread. */
export function WorktreeStackKit_updateOpenTuiSwitchFormModel(options: {
  readonly fieldId: WorktreeStackKit_OpenTuiSwitchFormFieldId;
  readonly model: WorktreeStackKit_UiSwitchFormModel;
  readonly value: string;
}): WorktreeStackKit_UiSwitchFormModel {
  switch (options.fieldId) {
    case "prefix":
      return { ...options.model, prefix: options.value };
    case "stackName":
      return { ...options.model, stackName: options.value };
    case "worktreesBase":
      return { ...options.model, worktreesBase: options.value };
  }
}

/** Builds switch argv and a stable npm preview string from the current form model. */
export function WorktreeStackKit_planOpenTuiSwitchPreview(options: {
  readonly model: WorktreeStackKit_UiSwitchFormModel;
}): WorktreeStackKit_OpenTuiSwitchPreviewPlan {
  const argv = WorktreeStackKit_buildOpenTuiSwitchArgv(options.model);
  return {
    argv,
    previewText: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: argv,
      npmScript: WORKTREE_STACK_KIT_OPENTUI_SWITCH_NPM_SCRIPT,
    }),
  };
}

/** Plans state transitions for the switch form action selector. */
export function WorktreeStackKit_planOpenTuiSwitchFormSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiSwitchFormSelectionPlan {
  switch (options.optionValue) {
    case "next":
      return { type: "preview" };
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    default:
      return { type: "ignore" };
  }
}

/** Plans state transitions for the switch preview action selector. */
export function WorktreeStackKit_planOpenTuiSwitchPreviewSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiSwitchPreviewSelectionPlan {
  switch (options.optionValue) {
    case "run":
      return { type: "run" };
    case "back":
      return { nextPhase: "form", type: "back" };
    default:
      return { type: "ignore" };
  }
}
