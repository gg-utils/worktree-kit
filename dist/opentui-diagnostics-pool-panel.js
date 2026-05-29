import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_buildOpenTuiDiagnosticsOptions, WorktreeStackKit_buildOpenTuiPoolNextFormOptions, WorktreeStackKit_buildOpenTuiPoolSubmenuOptions, WorktreeStackKit_planOpenTuiDiagnosticsSelection, WorktreeStackKit_planOpenTuiPoolNextFormSelection, WorktreeStackKit_planOpenTuiPoolSubmenuSelection, WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu, WorktreeStackKit_shouldShowOpenTuiPoolNextForm, WorktreeStackKit_shouldShowOpenTuiPoolSubmenu, } from "./opentui-action-scroll-diagnostics-pool-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
/** Renders diagnostics npm submenu, realm-pool submenu, and pool-next stack name form. */
export function WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel(props) {
    const { commands, flow, formError, goMenu, phase, poolKind, poolNextStackName, requestQuit, setCommandPreview, setFormError, setPendingNpmRun, setPhase, setPoolKind, setPoolNextStackName, setRequiredConfirmToken, } = props;
    return (_jsxs(_Fragment, { children: [WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu({
                flow,
                phase,
            }) ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Diagnostics (npm run)" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                            const selectionPlan = WorktreeStackKit_planOpenTuiDiagnosticsSelection({
                                commands,
                                optionValue: option?.value,
                            });
                            if (selectionPlan.type === "ignore")
                                return;
                            if (selectionPlan.type === "menu") {
                                goMenu();
                                return;
                            }
                            if (selectionPlan.type === "quit") {
                                requestQuit();
                                return;
                            }
                            if (selectionPlan.type === "preview") {
                                const { previewPlan } = selectionPlan;
                                setPhase(selectionPlan.nextPhase);
                                setCommandPreview(previewPlan.commandPreview);
                                setPendingNpmRun({
                                    forwarded: previewPlan.forwarded,
                                    script: previewPlan.script,
                                });
                                setRequiredConfirmToken(previewPlan.requiredConfirmToken);
                            }
                        }, options: WorktreeStackKit_buildOpenTuiDiagnosticsOptions({
                            commands,
                        }), showDescription: true })] })) : null, WorktreeStackKit_shouldShowOpenTuiPoolSubmenu({ flow, phase }) ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Realm pool" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                            const selectionPlan = WorktreeStackKit_planOpenTuiPoolSubmenuSelection({
                                commands,
                                optionValue: option?.value,
                            });
                            if (selectionPlan.type === "ignore")
                                return;
                            if (selectionPlan.type === "menu") {
                                goMenu();
                                return;
                            }
                            if (selectionPlan.type === "quit") {
                                requestQuit();
                                return;
                            }
                            if (selectionPlan.type === "form") {
                                setPoolKind(selectionPlan.poolKind);
                                setPhase(selectionPlan.nextPhase);
                                return;
                            }
                            if (selectionPlan.type === "preview") {
                                const { previewPlan } = selectionPlan;
                                setPoolKind(selectionPlan.poolKind);
                                setPhase(selectionPlan.nextPhase);
                                setCommandPreview(previewPlan.commandPreview);
                                setPendingNpmRun({
                                    forwarded: previewPlan.forwarded,
                                    script: previewPlan.script,
                                });
                                setRequiredConfirmToken(previewPlan.requiredConfirmToken);
                            }
                        }, options: WorktreeStackKit_buildOpenTuiPoolSubmenuOptions({
                            commands,
                        }), showDescription: true })] })) : null, WorktreeStackKit_shouldShowOpenTuiPoolNextForm({
                flow,
                phase,
                poolKind,
            }) ? (_jsxs(_Fragment, { children: [_jsx("text", { children: "Realm pool next \u2014 stack name (--stack-name)" }), formError.length > 0 ? _jsx("text", { children: formError }) : null, _jsx("input", { onChange: (value) => setPoolNextStackName(value), value: poolNextStackName }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                            const selectionPlan = WorktreeStackKit_planOpenTuiPoolNextFormSelection({
                                commands,
                                optionValue: option?.value,
                                poolNextStackName,
                            });
                            if (selectionPlan.type === "ignore")
                                return;
                            if (selectionPlan.type === "validation-error") {
                                setFormError(selectionPlan.message);
                                return;
                            }
                            if (selectionPlan.type === "preview") {
                                const { previewPlan } = selectionPlan;
                                if (selectionPlan.clearFormError) {
                                    setFormError("");
                                }
                                setPhase(selectionPlan.nextPhase);
                                setCommandPreview(previewPlan.commandPreview);
                                setPendingNpmRun({
                                    forwarded: previewPlan.forwarded,
                                    script: previewPlan.script,
                                });
                                setRequiredConfirmToken(previewPlan.requiredConfirmToken);
                                return;
                            }
                            if (selectionPlan.type === "back") {
                                setPhase(selectionPlan.nextPhase);
                                return;
                            }
                            if (selectionPlan.type === "quit") {
                                requestQuit();
                            }
                        }, options: WorktreeStackKit_buildOpenTuiPoolNextFormOptions(), showDescription: true })] })) : null] }));
}
//# sourceMappingURL=opentui-diagnostics-pool-panel.js.map