import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * @fileoverview Package-owned Ink renderer for worktree action option panels.
 *
 * This component is product-neutral terminal UI: it renders reusable worktree action toggles and
 * selectors from action definitions and option state, while root script adapters still own launch,
 * inventory loading, subprocess execution, and project-specific command construction.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Defines WorktreeStackKit_InkUiActionDefinition and WorktreeStackKit_InkUiActionOptionState contracts whose fields this panel renders as Ink toggles and selectors.
 * @see packages/worktree-kit/src/ink-shell.tsx - Interactive Ink shell that mounts this panel beside the plan preview so operators can flip action-scoped options while navigating the stack UI.
 * @see packages/worktree-kit/src/ink-action-options-panel.unit.test.ts - Node test runner coverage that invokes the panel with representative actionDefinition ids and asserts React.isValidElement on returned trees.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import { Box, Text } from "ink";
/** Maps package-owned option tones to Ink color tokens. */
function WorktreeStackKit_getInkActionOptionsToneColor(tone) {
    switch (tone) {
        case "ready":
            return "green";
        case "blocked":
        case "warning":
            return "yellow";
        case "staged":
        case "editing":
        case "info":
            return "cyan";
        case "destructive":
            return "red";
        case "muted":
            return "gray";
    }
}
/** Renders a compact tone-colored option badge. */
function WorktreeStackKit_InkActionOptionsBadge({ label, tone, }) {
    return (_jsxs(Text, { color: WorktreeStackKit_getInkActionOptionsToneColor(tone), children: ["[", label, "]"] }));
}
/** Renders a boolean action option with active/inactive chips. */
function WorktreeStackKit_InkActionOptionToggle({ label, shortcut, value, activeTone = "ready", inactiveTone = "muted", }) {
    return (_jsxs(Box, { children: [_jsxs(Text, { children: [label, ": "] }), _jsx(WorktreeStackKit_InkActionOptionsBadge, { label: "yes", tone: value ? activeTone : "muted" }), _jsx(Text, { color: "gray", children: " / " }), _jsx(WorktreeStackKit_InkActionOptionsBadge, { label: "no", tone: value ? "muted" : inactiveTone }), _jsxs(Text, { color: "gray", children: [" (", shortcut, ")"] })] }));
}
/** Renders an enum-like action option with the active choice highlighted. */
function WorktreeStackKit_InkActionOptionSelector({ label, shortcut, value, choices, activeTone = "ready", }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [label, " ", _jsxs(Text, { color: "gray", children: ["(", shortcut, ")"] })] }), _jsx(Box, { children: choices.map((choice, index) => (_jsxs(React.Fragment, { children: [index > 0 ? _jsx(Text, { color: "gray", children: " / " }) : null, _jsx(WorktreeStackKit_InkActionOptionsBadge, { label: choice.label, tone: choice.value === value ? activeTone : "muted" })] }, choice.value))) })] }));
}
/**
 * Action-specific toggles and selectors shown beside the plan preview.
 */
export function WorktreeStackKit_InkActionOptionsPanel({ actionDefinition, actionOptions, poolNextStackEditMode, }) {
    if (actionDefinition.id === "start") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionToggle, { label: "Open in Windsurf after start", shortcut: "space", value: actionOptions.openWindsurfOnStart })] }));
    }
    if (actionDefinition.id === "destroy") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionToggle, { label: "Run git prune after delete", shortcut: "space", value: actionOptions.pruneAfterDestroy })] }));
    }
    if (actionDefinition.id === "update-from-main") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionSelector, { label: "Mode", shortcut: "space", value: actionOptions.updateFromMainExecutionMode, choices: [
                        { value: "plan", label: "Plan only" },
                        { value: "push", label: "Push changes" },
                    ], activeTone: actionOptions.updateFromMainExecutionMode === "push"
                        ? "warning"
                        : "ready" }), _jsx(WorktreeStackKit_InkActionOptionSelector, { label: "Target", shortcut: "m", value: actionOptions.updateFromMainMode, choices: [
                        { value: "live-worktree", label: "Live worktree" },
                        { value: "temp-worktree", label: "New temp worktree" },
                    ], activeTone: actionOptions.updateFromMainMode === "live-worktree"
                        ? "ready"
                        : "warning" })] }));
    }
    if (actionDefinition.id === "merge") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionSelector, { label: "Mode", shortcut: "space", value: actionOptions.mergeExecutionMode, choices: [
                        { value: "plan", label: "Plan only" },
                        { value: "push", label: "Push changes" },
                    ], activeTone: actionOptions.mergeExecutionMode === "push" ? "warning" : "ready" })] }));
    }
    if (actionDefinition.id === "repair") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionToggle, { label: "Dry run", shortcut: "space", value: actionOptions.repairDryRun, activeTone: "warning", inactiveTone: "ready" }), _jsx(WorktreeStackKit_InkActionOptionToggle, { label: "Include package .env files", shortcut: "i", value: actionOptions.repairIncludePackageEnv }), _jsx(WorktreeStackKit_InkActionOptionToggle, { label: "Legacy .env mode", shortcut: "l", value: actionOptions.repairLegacyPackageEnvAlias, activeTone: "warning" }), _jsx(WorktreeStackKit_InkActionOptionSelector, { label: "Scope", shortcut: "t", value: actionOptions.repairScope, choices: [
                        { value: "selected-record", label: "Selected only" },
                        { value: "all-prepared", label: "All worktrees" },
                    ], activeTone: "info" })] }));
    }
    if (actionDefinition.id === "sync-local-files") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionSelector, { label: "Scope", shortcut: "t", value: actionOptions.syncScope, choices: [
                        { value: "selected-record", label: "Selected + root" },
                        { value: "all-discovered", label: "All worktrees" },
                    ], activeTone: "info" }), _jsx(Text, { color: "gray", children: "Source: discovery project root" })] }));
    }
    if (actionDefinition.id === "platform-bootstrap") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Notes" }), _jsx(Text, { color: "gray", children: "Runs npm run platform:install (takes several minutes)" })] }));
    }
    if (actionDefinition.id === "realm-pool-next") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Stack Name" }), _jsxs(Text, { children: ["Value:", " ", _jsx(Text, { color: poolNextStackEditMode ? "yellow" : "cyan", children: actionOptions.poolNextStackName.length > 0
                                ? actionOptions.poolNextStackName
                                : "(empty)" })] }), _jsx(Text, { color: "gray", children: poolNextStackEditMode
                        ? "Type to edit, Backspace to delete, Enter when done"
                        : "Press E to edit the stack name" })] }));
    }
    if (actionDefinition.id === "checkout-state-check") {
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(WorktreeStackKit_InkActionOptionToggle, { label: "Refresh origin refs first", shortcut: "space", value: actionOptions.stateCheckFetch })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Options" }), _jsx(Text, { color: "gray", children: "No additional options" })] }));
}
//# sourceMappingURL=ink-action-options-panel.js.map