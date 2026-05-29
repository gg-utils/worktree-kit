/**
 * @fileoverview Reusable OpenTUI action-scroll maintenance-flow planners.
 *
 * Repair, sync-local-files, bootstrap, and direct TSX preview panels keep rendering and subprocess
 * dispatch in script adapters while this package owns their pure visibility predicates, option
 * catalogs, boolean selection reducers, bootstrap text formatting, and preview navigation plans.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI shell flow, phase, navigation tabs, and preview-tab constants imported here for phase-gated visibility checks and selector rows.
 * @see packages/worktree-kit/src/opentui-maintenance-panels.tsx - Maintenance panels that consume these pure planners for repair, sync-local-files, and bootstrap OpenTUI flows.
 * @see packages/worktree-kit/src/opentui-action-scroll-maintenance-plans.unit.test.ts - Jest regression coverage for boolean-selection plans, maintenance navigation plans, and bootstrap preview text owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS, WorktreeStackKit_openTuiNavTabs, } from "./opentui-shell-contracts.js";
const WORKTREE_STACK_KIT_OPENTUI_REPAIR_INCLUDE_PACKAGE_ENV_OPTIONS = [
    {
        description: "Include package .env",
        name: "yes",
        value: "yes",
    },
    { description: "Skip package .env", name: "no", value: "no" },
];
const WORKTREE_STACK_KIT_OPENTUI_REPAIR_LEGACY_MISSING_ONLY_OPTIONS = [
    {
        description: "Use legacy missing-only mode",
        name: "yes",
        value: "yes",
    },
    { description: "Standard recovery", name: "no", value: "no" },
];
const WORKTREE_STACK_KIT_OPENTUI_REPAIR_DRY_RUN_OPTIONS = [
    {
        description: "Run with --dry-run flag",
        name: "yes",
        value: "yes",
    },
    { description: "Apply changes", name: "no", value: "no" },
];
/** Whether the repair form should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiRepairFormPanel(options) {
    return options.flow === "repair" && options.phase === "form";
}
/** Whether the repair preview should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel(options) {
    return options.flow === "repair" && options.phase === "preview";
}
/** Whether the sync-local-files form should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiSyncFormPanel(options) {
    return options.flow === "sync" && options.phase === "form";
}
/** Whether the sync-local-files preview should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel(options) {
    return options.flow === "sync" && options.phase === "preview";
}
/** Whether the platform bootstrap form should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel(options) {
    return options.flow === "bootstrap" && options.phase === "form";
}
/** Whether the platform bootstrap preview should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel(options) {
    return options.flow === "bootstrap" && options.phase === "preview";
}
/** Builds the include-package-env selector options for the repair form. */
export function WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions() {
    return [...WORKTREE_STACK_KIT_OPENTUI_REPAIR_INCLUDE_PACKAGE_ENV_OPTIONS];
}
/** Builds the legacy package-env-mode selector options for the repair form. */
export function WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions() {
    return [...WORKTREE_STACK_KIT_OPENTUI_REPAIR_LEGACY_MISSING_ONLY_OPTIONS];
}
/** Builds the dry-run selector options for the repair form. */
export function WorktreeStackKit_buildOpenTuiRepairDryRunOptions() {
    return [...WORKTREE_STACK_KIT_OPENTUI_REPAIR_DRY_RUN_OPTIONS];
}
/** Builds the continue/navigation selector options for the repair form. */
export function WorktreeStackKit_buildOpenTuiRepairFormOptions() {
    return [
        { description: "Preview", name: "Continue", value: "next" },
        ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
    ];
}
/** Builds the continue/navigation selector options for the sync-local-files form. */
export function WorktreeStackKit_buildOpenTuiSyncFormOptions() {
    return [
        { description: "Preview", name: "Continue", value: "next" },
        ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
    ];
}
/** Builds the continue/navigation selector options for the platform bootstrap form. */
export function WorktreeStackKit_buildOpenTuiBootstrapFormOptions() {
    return [
        {
            description: "Preview install command",
            name: "Continue",
            value: "next",
        },
        ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
    ];
}
/** Builds the run/back selector options for direct TSX preview panels. */
export function WorktreeStackKit_buildOpenTuiTsxPreviewOptions() {
    return [...WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS];
}
/** Plans state updates for selecting one repair boolean option. */
export function WorktreeStackKit_planOpenTuiRepairBooleanSelection(options) {
    if (options.optionValue === "yes") {
        return { field: options.field, type: "set-boolean", value: true };
    }
    if (options.optionValue === "no") {
        return { field: options.field, type: "set-boolean", value: false };
    }
    return { type: "ignore" };
}
/** Plans state transitions for repair/sync/bootstrap form navigation. */
export function WorktreeStackKit_planOpenTuiMaintenanceFormSelection(options) {
    switch (options.optionValue) {
        case "menu":
            return { type: "menu" };
        case "next":
            return { type: "preview" };
        case "quit":
            return { type: "quit" };
        default:
            return { type: "ignore" };
    }
}
/** Plans state transitions for direct TSX preview navigation. */
export function WorktreeStackKit_planOpenTuiTsxPreviewSelection(options) {
    switch (options.optionValue) {
        case "back":
            return { nextPhase: "form", type: "back" };
        case "run":
            return { type: "run" };
        default:
            return { type: "ignore" };
    }
}
/** Formats the platform bootstrap form body from explicit seed facts. */
export function WorktreeStackKit_formatOpenTuiBootstrapFormText(options) {
    return [
        `Local logical env seed present: ${options.seedFacts.localLogicalEnvironmentPresent ? "yes" : "no"}`,
        options.seedFacts.localLogicalEnvironmentFilePath,
        "",
        options.installDescription,
    ].join("\n");
}
/** Formats the platform bootstrap preview body with configured command strings and seed facts. */
export function WorktreeStackKit_formatOpenTuiBootstrapPreviewText(options) {
    return [
        options.npmInstallCommand,
        options.tsxInstallCommand,
        "",
        "Local bootstrap seed:",
        `  ${options.seedFacts.localLogicalEnvironmentFilePath}`,
        `  present: ${options.seedFacts.localLogicalEnvironmentPresent ? "yes" : "no"}`,
    ].join("\n");
}
//# sourceMappingURL=opentui-action-scroll-maintenance-plans.js.map