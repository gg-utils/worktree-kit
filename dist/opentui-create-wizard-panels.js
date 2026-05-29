import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "@opentui/react/jsx-runtime";
import { WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS, WorktreeStackKit_applyOpenTuiCreateSelectChange, WorktreeStackKit_applyOpenTuiCreateTextChange, WorktreeStackKit_buildOpenTuiCreateFormOptions, WorktreeStackKit_buildOpenTuiCreatePreviewOptions, WorktreeStackKit_buildOpenTuiCreateTextFields, WorktreeStackKit_getOpenTuiCreateTextValue, WorktreeStackKit_planOpenTuiCreateFormSelection, WorktreeStackKit_planOpenTuiCreatePreviewSelection, WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel, } from "./opentui-create-wizard-form-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
/** Create flow form fields plus continue/menu/quit navigation for worktrees:create. */
export function WorktreeStackKit_OpenTuiCreateWizardForm(props) {
    const textFields = WorktreeStackKit_buildOpenTuiCreateTextFields(props.textFieldLabelOptions);
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:create" }), props.formError.length > 0 ? _jsx("text", { children: props.formError }) : null, _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsxs("box", { style: { flexDirection: "column", gap: 1 }, children: [textFields.map((field) => (_jsxs("box", { style: { flexDirection: "column", gap: 1 }, children: [_jsx("text", { children: field.label }), _jsx("input", { onChange: (value) => {
                                        WorktreeStackKit_setCreateTextField({
                                            fieldId: field.id,
                                            props,
                                            value,
                                        });
                                    }, value: WorktreeStackKit_getOpenTuiCreateTextValue({
                                        fieldId: field.id,
                                        model: props.createModel,
                                    }) })] }, field.id))), WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS.map((field) => (_jsxs("box", { style: { flexDirection: "column", gap: 1 }, children: [_jsx("text", { children: field.label }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                                        WorktreeStackKit_setCreateSelectField({
                                            fieldId: field.id,
                                            props,
                                            value: option?.value ?? "",
                                        });
                                    }, options: [...field.options] })] }, field.id)))] }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleCreateFormSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiCreateFormOptions(), showDescription: true })] }));
}
/** Renders the create command preview plus run/back navigation. */
export function WorktreeStackKit_OpenTuiCreateWizardPreview(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel({
        flow: props.flow,
        phase: props.phase,
    })) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "Preview" }), props.createPreviewError.length > 0 ? (_jsx("text", { children: props.createPreviewError })) : null, _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: props.createPreviewText }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleCreatePreviewSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiCreatePreviewOptions(), showDescription: true })] }));
}
function WorktreeStackKit_setCreateTextField(options) {
    options.props.setCreateModel((model) => WorktreeStackKit_applyOpenTuiCreateTextChange({
        fieldId: options.fieldId,
        model,
        value: options.value,
    }));
}
function WorktreeStackKit_setCreateSelectField(options) {
    options.props.setCreateModel((model) => WorktreeStackKit_applyOpenTuiCreateSelectChange({
        fieldId: options.fieldId,
        model,
        value: options.value,
    }));
}
function WorktreeStackKit_handleCreateFormSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiCreateFormSelection({
        optionValue: options.optionValue,
    });
    if (selectionPlan.type === "ignore")
        return;
    if (selectionPlan.type === "preview") {
        options.props.createGoPreview();
        return;
    }
    if (selectionPlan.type === "menu") {
        options.props.goMenu();
        return;
    }
    options.props.requestQuit();
}
function WorktreeStackKit_handleCreatePreviewSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiCreatePreviewSelection({
        optionValue: options.optionValue,
    });
    if (selectionPlan.type === "ignore")
        return;
    if (selectionPlan.type === "run") {
        void options.props.runSpawn(options.props.scriptPaths.create, options.props.createArgv);
        return;
    }
    options.props.setPhase(selectionPlan.nextPhase);
}
//# sourceMappingURL=opentui-create-wizard-panels.js.map