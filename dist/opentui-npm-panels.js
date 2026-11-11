import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "@opentui/react/jsx-runtime";
import { WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS, WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS, WorktreeStackKit_buildOpenTuiNpmConfirmOptions, WorktreeStackKit_buildOpenTuiNpmPreviewOptions, WorktreeStackKit_parseOpenTuiExecutionMode, WorktreeStackKit_parseOpenTuiUpdateMode, WorktreeStackKit_planOpenTuiDestroyNpmPreview, WorktreeStackKit_planOpenTuiMergeNpmPreview, WorktreeStackKit_planOpenTuiNpmConfirmSelection, WorktreeStackKit_planOpenTuiNpmPreviewSelection, WorktreeStackKit_planOpenTuiStartNpmPreview, WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview, } from "./opentui-action-scroll-npm-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import { WorktreeStackKit_openTuiNavTabs } from "./opentui-shell-contracts.js";
/** Start-flow flag form for worktrees:start preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollStartFormPanel(props) {
    if (props.flow !== "start" || props.phase !== "form") {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:start" }), _jsxs("text", { children: ["Target: ", props.getSelectedWorktreePath() ?? "(missing path)"] }), props.recordPickIndex < 0 ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Worktree path (--worktree)" }), _jsx("input", { onChange: (value) => props.setManualWorktreePath(value), value: props.manualWorktreePath })] })) : null, _jsx("text", { children: "Open Windsurf (yes = --open-windsurf)" }), _jsx("input", { onChange: (value) => props.setStartOpenWindsurf(value.trim().toLowerCase() === "yes"), value: props.startOpenWindsurf ? "yes" : "no" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiStartSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions(), showDescription: true })] }));
}
/** Destroy-flow flag form for worktrees:destroy preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel(props) {
    if (props.flow !== "destroy" || props.phase !== "form") {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:destroy" }), _jsxs("text", { children: ["Target: ", props.getSelectedWorktreePath() ?? "(missing path)"] }), props.recordPickIndex < 0 ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Worktree path (--worktree)" }), _jsx("input", { onChange: (value) => props.setManualWorktreePath(value), value: props.manualWorktreePath })] })) : null, _jsx("text", { children: "Git worktree prune after remove (--prune)" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    if (option?.value === "yes")
                        props.setDestroyPrune(true);
                    if (option?.value === "no")
                        props.setDestroyPrune(false);
                }, options: [
                    { description: "Prune git worktrees", name: "yes", value: "yes" },
                    { description: "Skip git worktrees prune", name: "no", value: "no" },
                ] }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiDestroySelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions(), showDescription: true })] }));
}
/** Update-from-main flag form for worktrees:update-from-main preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel(props) {
    if (props.flow !== "updateFromMain" || props.phase !== "form") {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:update-from-main" }), _jsxs("text", { children: ["Target: ", props.getSelectedWorktreePath() ?? "(missing path)"] }), props.recordPickIndex < 0 ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Worktree path (--worktree)" }), _jsx("input", { onChange: (value) => props.setManualWorktreePath(value), value: props.manualWorktreePath })] })) : null, _jsx("text", { children: "Mode" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const parsedUpdateMode = WorktreeStackKit_parseOpenTuiUpdateMode(option?.value);
                    if (parsedUpdateMode) {
                        props.setUpdateMode(parsedUpdateMode);
                    }
                }, options: [...WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS] }), _jsx("text", { children: "Execution" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const parsedExecutionMode = WorktreeStackKit_parseOpenTuiExecutionMode(option?.value);
                    if (parsedExecutionMode) {
                        props.setUpdateExec(parsedExecutionMode);
                    }
                }, options: [...WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS] }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiUpdateFromMainSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions(), showDescription: true })] }));
}
/** Merge-flow flag form for worktrees:merge preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollMergeFormPanel(props) {
    if (props.flow !== "merge" || props.phase !== "form") {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:merge" }), _jsxs("text", { children: ["Target: ", props.getSelectedWorktreePath() ?? "(missing path)"] }), props.recordPickIndex < 0 ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Worktree path (--worktree)" }), _jsx("input", { onChange: (value) => props.setManualWorktreePath(value), value: props.manualWorktreePath })] })) : null, _jsx("text", { children: "Execution" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const parsedExecutionMode = WorktreeStackKit_parseOpenTuiExecutionMode(option?.value);
                    if (parsedExecutionMode) {
                        props.setMergeExec(parsedExecutionMode);
                    }
                }, options: [...WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS] }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiMergeSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions(), showDescription: true })] }));
}
/** npm-run preview panel with optional confirm token gate before execution. */
export function WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel(props) {
    if (props.phase !== "preview" || !props.pendingNpmRun) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "Preview" }), props.requiredConfirmToken ? (_jsxs("text", { children: ["Confirmation required: type ", props.requiredConfirmToken, " (case-sensitive) before Run."] })) : null, _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: props.commandPreview }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiNpmPreviewSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiNpmPreviewOptions({
                    requiresConfirmToken: props.requiredConfirmToken !== null,
                }), showDescription: true })] }));
}
/** Token confirmation gate immediately before a guarded npm run. */
export function WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel(props) {
    if (props.phase !== "confirm" || !props.pendingNpmRun || !props.requiredConfirmToken) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsxs("text", { children: ["Type ", props.requiredConfirmToken, " to run: npm run ", props.pendingNpmRun.script] }), props.formError.length > 0 ? _jsx("text", { children: props.formError }) : null, _jsx("input", { onChange: (value) => props.setConfirmTokenInput(value), value: props.confirmTokenInput }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiNpmConfirmSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiNpmConfirmOptions(), showDescription: true })] }));
}
function WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions() {
    return [
        {
            description: "Preview npm command",
            name: "Continue",
            value: "next",
        },
        ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
    ];
}
function WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) {
    if (options.optionValue === "menu") {
        options.props.goMenu();
        return "handled";
    }
    if (options.optionValue === "quit") {
        options.props.requestQuit();
        return "handled";
    }
    return options.optionValue === "next" ? "continue" : "handled";
}
function WorktreeStackKit_requireOpenTuiWorktreePath(options) {
    const pathValue = options.props.getSelectedWorktreePath();
    if (!pathValue) {
        options.props.setFormError("Worktree path is required.");
        return null;
    }
    options.props.setFormError("");
    return pathValue;
}
function WorktreeStackKit_applyOpenTuiNpmPreviewPlan(options) {
    options.props.setCommandPreview(options.plan.commandPreview);
    options.props.setPendingNpmRun({
        forwarded: options.plan.forwarded,
        script: options.plan.script,
    });
    options.props.setRequiredConfirmToken(options.plan.requiredConfirmToken);
    options.props.setPhase("preview");
}
function WorktreeStackKit_handleOpenTuiStartSelection(options) {
    if (WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue") {
        return;
    }
    const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
        props: options.props,
    });
    if (!pathValue)
        return;
    WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
        plan: WorktreeStackKit_planOpenTuiStartNpmPreview({
            openWindsurf: options.props.startOpenWindsurf,
            worktreePath: pathValue,
        }),
        props: options.props,
    });
}
function WorktreeStackKit_handleOpenTuiDestroySelection(options) {
    if (WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue") {
        return;
    }
    const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
        props: options.props,
    });
    if (!pathValue)
        return;
    WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
        plan: WorktreeStackKit_planOpenTuiDestroyNpmPreview({
            prune: options.props.destroyPrune,
            worktreePath: pathValue,
        }),
        props: options.props,
    });
}
function WorktreeStackKit_handleOpenTuiUpdateFromMainSelection(options) {
    if (WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue") {
        return;
    }
    const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
        props: options.props,
    });
    if (!pathValue)
        return;
    WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
        plan: WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview({
            executionMode: options.props.updateExec,
            targetBranch: options.props.targetBranch,
            updateMode: options.props.updateMode,
            worktreePath: pathValue,
        }),
        props: options.props,
    });
}
function WorktreeStackKit_handleOpenTuiMergeSelection(options) {
    if (WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue") {
        return;
    }
    const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
        props: options.props,
    });
    if (!pathValue)
        return;
    WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
        plan: WorktreeStackKit_planOpenTuiMergeNpmPreview({
            executionMode: options.props.mergeExec,
            targetBranch: options.props.targetBranch,
            worktreePath: pathValue,
        }),
        props: options.props,
    });
}
function WorktreeStackKit_handleOpenTuiNpmPreviewSelection(options) {
    if (!options.props.pendingNpmRun)
        return;
    const selectionPlan = WorktreeStackKit_planOpenTuiNpmPreviewSelection({
        flow: options.props.flow,
        optionValue: options.optionValue,
        poolKind: options.props.poolKind,
        requiresConfirmToken: options.props.requiredConfirmToken !== null,
    });
    if (selectionPlan.type === "ignore")
        return;
    if (selectionPlan.type === "menu") {
        options.props.goMenu();
        return;
    }
    if (selectionPlan.type === "quit") {
        options.props.requestQuit();
        return;
    }
    if (selectionPlan.type === "run") {
        void options.props.runNpmScript(options.props.pendingNpmRun.script, options.props.pendingNpmRun.forwarded);
        return;
    }
    if (selectionPlan.type === "confirm") {
        options.props.setPhase("confirm");
        return;
    }
    if (selectionPlan.type === "back") {
        options.props.setPendingNpmRun(null);
        options.props.setRequiredConfirmToken(null);
        options.props.setConfirmTokenInput("");
        options.props.setPhase(selectionPlan.nextPhase);
    }
}
function WorktreeStackKit_handleOpenTuiNpmConfirmSelection(options) {
    if (!options.props.pendingNpmRun || !options.props.requiredConfirmToken)
        return;
    const selectionPlan = WorktreeStackKit_planOpenTuiNpmConfirmSelection({
        confirmTokenInput: options.props.confirmTokenInput,
        optionValue: options.optionValue,
        requiredConfirmToken: options.props.requiredConfirmToken,
    });
    if (selectionPlan.type === "ignore")
        return;
    if (selectionPlan.type === "menu") {
        options.props.goMenu();
        return;
    }
    if (selectionPlan.type === "quit") {
        options.props.requestQuit();
        return;
    }
    if (selectionPlan.type === "validation-error") {
        options.props.setFormError(selectionPlan.message);
        return;
    }
    if (selectionPlan.type === "run") {
        options.props.setFormError("");
        void options.props.runNpmScript(options.props.pendingNpmRun.script, options.props.pendingNpmRun.forwarded);
        return;
    }
    if (selectionPlan.type === "back") {
        options.props.setPhase(selectionPlan.nextPhase);
    }
}
