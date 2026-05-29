import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_buildOpenTuiSwitchFormOptions, WorktreeStackKit_buildOpenTuiSwitchPreviewOptions, WorktreeStackKit_planOpenTuiSwitchFormSelection, WorktreeStackKit_planOpenTuiSwitchPreviewSelection, WorktreeStackKit_shouldShowOpenTuiSwitchForm, WorktreeStackKit_shouldShowOpenTuiSwitchPreview, WorktreeStackKit_updateOpenTuiSwitchFormModel, } from "./opentui-action-scroll-switch-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
/** Switch-flow form and preview panel for worktrees:switch. */
export function WorktreeStackKit_OpenTuiActionScrollSwitchPanel(props) {
    return (_jsxs(_Fragment, { children: [WorktreeStackKit_shouldShowOpenTuiSwitchForm({
                flow: props.flow,
                phase: props.phase,
            }) ? (_jsx(WorktreeStackKit_OpenTuiActionScrollSwitchFormPanel, { ...props })) : null, WorktreeStackKit_shouldShowOpenTuiSwitchPreview({
                flow: props.flow,
                phase: props.phase,
            }) ? (_jsx(WorktreeStackKit_OpenTuiActionScrollSwitchPreviewPanel, { ...props })) : null] }));
}
function WorktreeStackKit_OpenTuiActionScrollSwitchFormPanel(props) {
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:switch" }), props.formError.length > 0 ? _jsx("text", { children: props.formError }) : null, _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsxs("box", { style: { flexDirection: "column", gap: 1 }, children: [_jsx("text", { children: "Prefix (--prefix, optional)" }), _jsx("input", { onChange: (value) => {
                                WorktreeStackKit_setSwitchFormField({
                                    fieldId: "prefix",
                                    props,
                                    value,
                                });
                            }, value: props.switchModel.prefix }), _jsx("text", { children: "Stack name (--name, optional)" }), _jsx("input", { onChange: (value) => {
                                WorktreeStackKit_setSwitchFormField({
                                    fieldId: "stackName",
                                    props,
                                    value,
                                });
                            }, value: props.switchModel.stackName }), _jsx("text", { children: "Worktrees base (--worktrees-base, default=default)" }), _jsx("input", { onChange: (value) => {
                                WorktreeStackKit_setSwitchFormField({
                                    fieldId: "worktreesBase",
                                    props,
                                    value,
                                });
                            }, value: props.switchModel.worktreesBase })] }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleSwitchFormSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiSwitchFormOptions(), showDescription: true })] }));
}
function WorktreeStackKit_OpenTuiActionScrollSwitchPreviewPanel(props) {
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "Preview" }), props.switchPreviewError.length > 0 ? (_jsx("text", { children: props.switchPreviewError })) : null, _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: props.switchPreviewText }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleSwitchPreviewSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiSwitchPreviewOptions(), showDescription: true })] }));
}
function WorktreeStackKit_setSwitchFormField(options) {
    options.props.setSwitchModel((model) => WorktreeStackKit_updateOpenTuiSwitchFormModel({
        fieldId: options.fieldId,
        model,
        value: options.value,
    }));
}
function WorktreeStackKit_handleSwitchFormSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiSwitchFormSelection({
        optionValue: options.optionValue,
    });
    if (selectionPlan.type === "ignore")
        return;
    if (selectionPlan.type === "preview") {
        options.props.switchGoPreview();
        return;
    }
    if (selectionPlan.type === "menu") {
        options.props.goMenu();
        return;
    }
    options.props.requestQuit();
}
function WorktreeStackKit_handleSwitchPreviewSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiSwitchPreviewSelection({
        optionValue: options.optionValue,
    });
    if (selectionPlan.type === "ignore")
        return;
    if (selectionPlan.type === "run") {
        void options.props.runSpawn(options.props.scriptPaths.switch, options.props.switchArgv);
        return;
    }
    options.props.setPhase(selectionPlan.nextPhase);
}
//# sourceMappingURL=opentui-switch-panel.js.map