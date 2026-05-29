/**
 * @fileoverview Reusable OpenTUI action-scroll diagnostics and realm-pool planners.
 *
 * OpenTUI script panels keep rendering, project command configuration, and process side effects
 * while this package owns visibility checks, option catalogs, command-preview construction, and
 * selection plans for diagnostics and realm-pool subflows.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-diagnostics-pool-plans.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow, phase, pool-kind, and option contracts consumed by visibility checks and nav tabs assembled here.
 * @see packages/worktree-kit/src/opentui-action-scroll-npm-plans.ts - Preview plan result type threaded through the diagnostics and realm-pool preview selection branches owned here.
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Npm preview string formatting and pool-next forwarded args used when building preview plans in this module.
 * @see packages/worktree-kit/src/opentui-action-scroll-diagnostics-pool-plans.unit.test.ts - Unit tests that lock selection-plan and submenu visibility behavior implemented in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import type {
  WorktreeStackKit_OpenTuiNpmRunPreviewPlan,
} from "./opentui-action-scroll-npm-plans.js";

import {
  WorktreeStackKit_buildUiPoolNextArgs,
  WorktreeStackKit_formatUiNpmRunCommand,
} from "./ui-command-catalog.js";
import {
  WorktreeStackKit_openTuiNavTabs,
  type WorktreeStackKit_OpenTuiFlow,
  type WorktreeStackKit_OpenTuiPhase,
  type WorktreeStackKit_OpenTuiPoolKind,
  type WorktreeStackKit_OpenTuiSelectOption,
} from "./opentui-shell-contracts.js";

/** Project-supplied npm command names consumed by diagnostics and realm-pool OpenTUI flows. */
export type WorktreeStackKit_OpenTuiDiagnosticsPoolCommands = {
  readonly diagnostics: {
    readonly healthcheckScript: string;
    readonly realmListScript: string;
    readonly routerStatusScript: string;
  };
  readonly realmPool: {
    readonly guideScript: string;
    readonly listScript: string;
    readonly nextScript: string;
    readonly prepareScript: string;
  };
};

/** Diagnostics submenu actions that map directly to npm previews. */
export type WorktreeStackKit_OpenTuiDiagnosticsAction =
  | "health"
  | "realmList"
  | "router";

/** Realm-pool submenu actions displayed by the OpenTUI pool flow. */
export type WorktreeStackKit_OpenTuiPoolAction =
  | "guide"
  | "list"
  | "next"
  | "prepare";

/** Pure result of selecting an item in the diagnostics submenu. */
export type WorktreeStackKit_OpenTuiDiagnosticsSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | {
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
      readonly type: "preview";
    };

/** Pure result of selecting an item in the realm-pool submenu. */
export type WorktreeStackKit_OpenTuiPoolSubmenuSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | {
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
      readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
      readonly type: "preview";
    }
  | {
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
      readonly type: "form";
    };

/** Pure result of selecting an item in the realm-pool-next form footer. */
export type WorktreeStackKit_OpenTuiPoolNextFormSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "quit" }
  | { readonly nextPhase: WorktreeStackKit_OpenTuiPhase; readonly type: "back" }
  | { readonly message: string; readonly type: "validation-error" }
  | {
      readonly clearFormError: boolean;
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
      readonly type: "preview";
    };

/** Whether the diagnostics submenu should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "diagnostics" && options.phase === "submenu";
}

/** Whether the realm-pool submenu should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiPoolSubmenu(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "pool" && options.phase === "submenu";
}

/** Whether the realm-pool-next form should render for the current action-scroll state. */
export function WorktreeStackKit_shouldShowOpenTuiPoolNextForm(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
}): boolean {
  return options.flow === "pool" && options.phase === "form" && options.poolKind === "next";
}

/** Builds the diagnostics submenu option list from project-supplied command names. */
export function WorktreeStackKit_buildOpenTuiDiagnosticsOptions(options: {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): WorktreeStackKit_OpenTuiSelectOption[] {
  return [
    {
      description: options.commands.diagnostics.realmListScript,
      name: "List realms",
      value: "realmList",
    },
    {
      description: options.commands.diagnostics.routerStatusScript,
      name: "Router status",
      value: "router",
    },
    {
      description: options.commands.diagnostics.healthcheckScript,
      name: "Healthcheck",
      value: "health",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds the realm-pool submenu option list from project-supplied command names. */
export function WorktreeStackKit_buildOpenTuiPoolSubmenuOptions(options: {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): WorktreeStackKit_OpenTuiSelectOption[] {
  return [
    {
      description: options.commands.realmPool.listScript,
      name: "List pool",
      value: "list",
    },
    {
      description: options.commands.realmPool.guideScript,
      name: "Guide",
      value: "guide",
    },
    {
      description: options.commands.realmPool.prepareScript,
      name: "Prepare",
      value: "prepare",
    },
    {
      description: options.commands.realmPool.nextScript,
      name: "Preview next (stack name)",
      value: "next",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds the realm-pool-next form action options. */
export function WorktreeStackKit_buildOpenTuiPoolNextFormOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [
    { description: "Build preview", name: "Continue", value: "next" },
    { description: "Back to pool menu", name: "Back", value: "menu" },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: false }),
  ];
}

/** Builds a shared npm preview plan for diagnostics and realm-pool fixed-script actions. */
export function WorktreeStackKit_planOpenTuiDiagnosticsPoolNpmPreview(options: {
  readonly forwarded: readonly string[];
  readonly script: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan {
  return {
    commandPreview: WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: options.forwarded,
      npmScript: options.script,
    }),
    forwarded: [...options.forwarded],
    requiredConfirmToken: null,
    script: options.script,
  };
}

/** Resolves a diagnostics action to the configured npm script name. */
export function WorktreeStackKit_resolveOpenTuiDiagnosticsScript(options: {
  readonly action: WorktreeStackKit_OpenTuiDiagnosticsAction;
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): string {
  switch (options.action) {
    case "realmList":
      return options.commands.diagnostics.realmListScript;
    case "router":
      return options.commands.diagnostics.routerStatusScript;
    case "health":
      return options.commands.diagnostics.healthcheckScript;
  }
}

/** Resolves a realm-pool fixed-preview action to the configured npm script name. */
export function WorktreeStackKit_resolveOpenTuiPoolScript(options: {
  readonly action: Exclude<WorktreeStackKit_OpenTuiPoolAction, "next">;
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): string {
  switch (options.action) {
    case "list":
      return options.commands.realmPool.listScript;
    case "guide":
      return options.commands.realmPool.guideScript;
    case "prepare":
      return options.commands.realmPool.prepareScript;
  }
}

/** Plans state transitions for the diagnostics submenu selector. */
export function WorktreeStackKit_planOpenTuiDiagnosticsSelection(options: {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiDiagnosticsSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "health":
    case "realmList":
    case "router": {
      const script = WorktreeStackKit_resolveOpenTuiDiagnosticsScript({
        action: options.optionValue,
        commands: options.commands,
      });
      return {
        nextPhase: "preview",
        previewPlan: WorktreeStackKit_planOpenTuiDiagnosticsPoolNpmPreview({
          forwarded: [],
          script,
        }),
        type: "preview",
      };
    }
    default:
      return { type: "ignore" };
  }
}

/** Plans state transitions for the realm-pool submenu selector. */
export function WorktreeStackKit_planOpenTuiPoolSubmenuSelection(options: {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiPoolSubmenuSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "next":
      return { nextPhase: "form", poolKind: "next", type: "form" };
    case "guide":
    case "list":
    case "prepare": {
      const script = WorktreeStackKit_resolveOpenTuiPoolScript({
        action: options.optionValue,
        commands: options.commands,
      });
      return {
        nextPhase: "preview",
        poolKind: options.optionValue,
        previewPlan: WorktreeStackKit_planOpenTuiDiagnosticsPoolNpmPreview({
          forwarded: [],
          script,
        }),
        type: "preview",
      };
    }
    default:
      return { type: "ignore" };
  }
}

/** Builds the realm-pool-next npm preview plan after validating the stack-name input. */
export function WorktreeStackKit_planOpenTuiPoolNextPreview(options: {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
  readonly poolNextStackName: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan | null {
  const trimmed = options.poolNextStackName.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return WorktreeStackKit_planOpenTuiDiagnosticsPoolNpmPreview({
    forwarded: WorktreeStackKit_buildUiPoolNextArgs(trimmed),
    script: options.commands.realmPool.nextScript,
  });
}

/** Plans state transitions for the realm-pool-next form action selector. */
export function WorktreeStackKit_planOpenTuiPoolNextFormSelection(options: {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
  readonly optionValue: string | undefined;
  readonly poolNextStackName: string;
}): WorktreeStackKit_OpenTuiPoolNextFormSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { nextPhase: "submenu", type: "back" };
    case "quit":
      return { type: "quit" };
    case "next": {
      const previewPlan = WorktreeStackKit_planOpenTuiPoolNextPreview({
        commands: options.commands,
        poolNextStackName: options.poolNextStackName,
      });
      if (previewPlan === null) {
        return { message: "Stack name is required.", type: "validation-error" };
      }
      return {
        clearFormError: true,
        nextPhase: "preview",
        previewPlan,
        type: "preview",
      };
    }
    default:
      return { type: "ignore" };
  }
}
