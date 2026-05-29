import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions, WorktreeStackKit_buildOpenTuiWorktreePickOptions, WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection, WorktreeStackKit_planOpenTuiWorktreePickSelection, WorktreeStackKit_shouldShowOpenTuiWorktreePick, } from "./opentui-action-scroll-worktree-pick.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
/** Worktree pick list and manual path capture shared by record-scoped flows. */
export function WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiWorktreePick({
        flow: props.flow,
        phase: props.phase,
    })) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "Select a worktree" }), props.records && props.records.length > 0 ? (_jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiWorktreePickSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiWorktreePickOptions({
                    records: props.records,
                }), showDescription: true })) : (_jsxs(_Fragment, { children: [_jsx("text", { children: "No git worktrees in discovery. Enter an absolute or repo-relative path." }), _jsx("input", { onChange: (value) => props.setManualWorktreePath(value), value: props.manualWorktreePath }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                            WorktreeStackKit_handleOpenTuiEmptyWorktreePickSelection({
                                optionValue: option?.value,
                                props,
                            });
                        }, options: WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions(), showDescription: true })] }))] }));
}
function WorktreeStackKit_handleOpenTuiWorktreePickSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiWorktreePickSelection({
        optionValue: options.optionValue,
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
    if (selectionPlan.type === "continue") {
        options.props.setPhase(selectionPlan.nextPhase);
        return;
    }
    options.props.setRecordPickIndex(selectionPlan.recordPickIndex);
}
function WorktreeStackKit_handleOpenTuiEmptyWorktreePickSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection({
        optionValue: options.optionValue,
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
    options.props.setRecordPickIndex(selectionPlan.recordPickIndex);
    options.props.setPhase(selectionPlan.nextPhase);
}
//# sourceMappingURL=opentui-worktree-pick-panel.js.map