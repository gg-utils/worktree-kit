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
import type { WorktreeStackKit_OpenTuiNpmRunPreviewPlan } from "./opentui-action-scroll-npm-plans.js";
import { type WorktreeStackKit_OpenTuiFlow, type WorktreeStackKit_OpenTuiPhase, type WorktreeStackKit_OpenTuiPoolKind, type WorktreeStackKit_OpenTuiSelectOption } from "./opentui-shell-contracts.js";
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
export type WorktreeStackKit_OpenTuiDiagnosticsAction = "health" | "realmList" | "router";
/** Realm-pool submenu actions displayed by the OpenTUI pool flow. */
export type WorktreeStackKit_OpenTuiPoolAction = "guide" | "list" | "next" | "prepare";
/** Pure result of selecting an item in the diagnostics submenu. */
export type WorktreeStackKit_OpenTuiDiagnosticsSelectionPlan = {
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
/** Pure result of selecting an item in the realm-pool submenu. */
export type WorktreeStackKit_OpenTuiPoolSubmenuSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "menu";
} | {
    readonly type: "quit";
} | {
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
    readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
    readonly type: "preview";
} | {
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
    readonly type: "form";
};
/** Pure result of selecting an item in the realm-pool-next form footer. */
export type WorktreeStackKit_OpenTuiPoolNextFormSelectionPlan = {
    readonly type: "ignore";
} | {
    readonly type: "quit";
} | {
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly type: "back";
} | {
    readonly message: string;
    readonly type: "validation-error";
} | {
    readonly clearFormError: boolean;
    readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
    readonly previewPlan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
    readonly type: "preview";
};
/** Whether the diagnostics submenu should render for the current action-scroll flow/phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Whether the realm-pool submenu should render for the current action-scroll flow/phase. */
export declare function WorktreeStackKit_shouldShowOpenTuiPoolSubmenu(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean;
/** Whether the realm-pool-next form should render for the current action-scroll state. */
export declare function WorktreeStackKit_shouldShowOpenTuiPoolNextForm(options: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
}): boolean;
/** Builds the diagnostics submenu option list from project-supplied command names. */
export declare function WorktreeStackKit_buildOpenTuiDiagnosticsOptions(options: {
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): WorktreeStackKit_OpenTuiSelectOption[];
/** Builds the realm-pool submenu option list from project-supplied command names. */
export declare function WorktreeStackKit_buildOpenTuiPoolSubmenuOptions(options: {
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): WorktreeStackKit_OpenTuiSelectOption[];
/** Builds the realm-pool-next form action options. */
export declare function WorktreeStackKit_buildOpenTuiPoolNextFormOptions(): (WorktreeStackKit_OpenTuiSelectOption[]);
/** Builds a shared npm preview plan for diagnostics and realm-pool fixed-script actions. */
export declare function WorktreeStackKit_planOpenTuiDiagnosticsPoolNpmPreview(options: {
    readonly forwarded: readonly string[];
    readonly script: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
/** Resolves a diagnostics action to the configured npm script name. */
export declare function WorktreeStackKit_resolveOpenTuiDiagnosticsScript(options: {
    readonly action: WorktreeStackKit_OpenTuiDiagnosticsAction;
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): string;
/** Resolves a realm-pool fixed-preview action to the configured npm script name. */
export declare function WorktreeStackKit_resolveOpenTuiPoolScript(options: {
    readonly action: Exclude<WorktreeStackKit_OpenTuiPoolAction, "next">;
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
}): string;
/** Plans state transitions for the diagnostics submenu selector. */
export declare function WorktreeStackKit_planOpenTuiDiagnosticsSelection(options: {
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiDiagnosticsSelectionPlan;
/** Plans state transitions for the realm-pool submenu selector. */
export declare function WorktreeStackKit_planOpenTuiPoolSubmenuSelection(options: {
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
    readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiPoolSubmenuSelectionPlan;
/** Builds the realm-pool-next npm preview plan after validating the stack-name input. */
export declare function WorktreeStackKit_planOpenTuiPoolNextPreview(options: {
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
    readonly poolNextStackName: string;
}): WorktreeStackKit_OpenTuiNpmRunPreviewPlan | null;
/** Plans state transitions for the realm-pool-next form action selector. */
export declare function WorktreeStackKit_planOpenTuiPoolNextFormSelection(options: {
    readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
    readonly optionValue: string | undefined;
    readonly poolNextStackName: string;
}): WorktreeStackKit_OpenTuiPoolNextFormSelectionPlan;
//# sourceMappingURL=opentui-action-scroll-diagnostics-pool-plans.d.ts.map