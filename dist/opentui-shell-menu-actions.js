/**
 * @fileoverview Reusable OpenTUI main-menu availability and action-selection planning.
 *
 * Script adapters translate project inventory and framework events into these package-owned pure
 * helpers. The package owns stable flow prerequisites, disabled-row rendering, and flow/phase
 * routing while callers retain process termination, refs, and React/OpenTUI state setters.
 *
 * @testing CLI: cd packages/worktree-kit && npm run test -- src/opentui-shell-menu-actions.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow, column, phase, and menu-row contracts referenced when planned selections transition away from the main menu.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Shell renderer that feeds tab-select values into the planners here and applies the resulting flow transitions beside this module.
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.unit.test.ts - Node:test unit module covering catalog-driven availability gating, strikethrough labels, and guarded selection planning for exports in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
const WORKTREE_STACK_KIT_OPENTUI_DEFAULT_MENU_CATALOG = [
    {
        description: "worktrees:create",
        name: "Create",
        requires: "always",
        value: "create",
    },
    {
        description: "worktrees:switch",
        name: "Switch (prefix × stack)",
        requires: "records",
        value: "switch",
    },
    {
        description: "worktrees:repair",
        name: "Repair",
        requires: "selected-record",
        value: "repair",
    },
    {
        description: "worktrees:sync-local-files",
        name: "Sync local files",
        requires: "records",
        value: "sync",
    },
    {
        description: "platform:install",
        name: "Bootstrap",
        requires: "always",
        value: "bootstrap",
    },
    {
        description: "worktrees:start",
        name: "Start worktree",
        requires: "selected-record",
        value: "start",
    },
    {
        description: "worktrees:destroy",
        name: "Destroy worktree",
        requires: "selected-record",
        value: "destroy",
    },
    {
        description: "worktrees:update-from-main",
        name: "Update from main",
        requires: "selected-record",
        value: "updateFromMain",
    },
    {
        description: "worktrees:merge",
        name: "Merge to main",
        requires: "selected-record",
        value: "merge",
    },
    {
        description: "local:edge diagnostics",
        name: "Diagnostics",
        requires: "always",
        value: "diagnostics",
    },
    {
        description: "Realm pool",
        name: "Realm pool",
        requires: "realms",
        value: "pool",
    },
    {
        description: "local:edge:realm:prune",
        name: "Prune stale realms",
        requires: "realms",
        value: "pruneStale",
    },
    {
        description: "worktrees:state:check",
        name: "Checkout state check",
        requires: "always",
        value: "checkoutState",
    },
    {
        description: "Exit",
        name: "Quit",
        requires: "always",
        value: "quit",
    },
];
/** Applies Unicode combining long stroke overlay for unavailable menu labels. */
export function WorktreeStackKit_applyOpenTuiStrikethrough(text) {
    return [...text].map((character) => `${character}\u0336`).join("");
}
function WorktreeStackKit_openTuiMenuRequirementIsMet(options) {
    switch (options.requirement) {
        case "always":
            return true;
        case "records":
            return options.availability.hasRecords;
        case "realms":
            return options.availability.hasRealms;
        case "selected-record":
            return options.availability.hasSelectedRecord;
    }
}
/** Builds main-menu action options, striking through entries when prerequisites are missing. */
export function WorktreeStackKit_buildOpenTuiMenuOptions(options) {
    return WORKTREE_STACK_KIT_OPENTUI_DEFAULT_MENU_CATALOG.map((item) => {
        const enabled = WorktreeStackKit_openTuiMenuRequirementIsMet({
            availability: options.availability,
            requirement: item.requires,
        });
        if (enabled) {
            return {
                description: item.description,
                disabled: false,
                name: item.name,
                value: item.value,
            };
        }
        return {
            description: `${item.description} (unavailable)`,
            disabled: true,
            name: WorktreeStackKit_applyOpenTuiStrikethrough(item.name),
            value: item.value,
        };
    });
}
function WorktreeStackKit_openTuiFlowPhase(flow) {
    if (flow === "diagnostics" || flow === "pool") {
        return "submenu";
    }
    if (flow === "start" ||
        flow === "destroy" ||
        flow === "updateFromMain" ||
        flow === "merge") {
        return "pick";
    }
    return "form";
}
function WorktreeStackKit_parseOpenTuiMenuActionValue(value) {
    return WORKTREE_STACK_KIT_OPENTUI_DEFAULT_MENU_CATALOG.find((item) => item.value === value)?.value ?? null;
}
/** Plans the side effects a script adapter should apply for a selected main-menu option. */
export function WorktreeStackKit_planOpenTuiMenuActionSelection(options) {
    const actionValue = WorktreeStackKit_parseOpenTuiMenuActionValue(options.optionValue);
    if (!actionValue) {
        return { type: "ignore" };
    }
    const menuOption = WorktreeStackKit_buildOpenTuiMenuOptions({
        availability: options.availability,
    }).find((option) => option.value === actionValue);
    if (!menuOption || menuOption.disabled) {
        return { type: "ignore" };
    }
    if (actionValue === "quit") {
        return { type: "quit" };
    }
    return {
        flow: actionValue,
        focusedColumn: "detail",
        phase: WorktreeStackKit_openTuiFlowPhase(actionValue),
        resetRunArtifacts: true,
        type: "transition",
    };
}
//# sourceMappingURL=opentui-shell-menu-actions.js.map