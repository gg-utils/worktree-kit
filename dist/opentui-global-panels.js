import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_buildOpenTuiPruneStaleFormOptions, WorktreeStackKit_buildOpenTuiRunResultOptions, WorktreeStackKit_buildOpenTuiStateCheckFetchOptions, WorktreeStackKit_buildOpenTuiStateCheckFormOptions, WorktreeStackKit_formatOpenTuiRunExitStatus, WorktreeStackKit_formatOpenTuiRunResultText, WorktreeStackKit_formatOpenTuiRunningOutput, WorktreeStackKit_planOpenTuiPruneStaleFormSelection, WorktreeStackKit_planOpenTuiRunResultSelection, WorktreeStackKit_planOpenTuiStateCheckFetchSelection, WorktreeStackKit_planOpenTuiStateCheckFormSelection, WorktreeStackKit_shouldShowOpenTuiPruneStalePanel, WorktreeStackKit_shouldShowOpenTuiResultPanel, WorktreeStackKit_shouldShowOpenTuiRunPanel, WorktreeStackKit_shouldShowOpenTuiStateCheckPanel, } from "./opentui-action-scroll-global-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
/** Renders the worktrees:state:check form and preview transition. */
export function WorktreeStackKit_OpenTuiActionScrollStateCheckPanel(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiStateCheckPanel({
        flow: props.flow,
        phase: props.phase,
    })) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: props.npmScripts.stateCheck }), _jsx("text", { children: "Pass --fetch to refresh origin refs first" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const selectionPlan = WorktreeStackKit_planOpenTuiStateCheckFetchSelection({
                        optionValue: option?.value,
                    });
                    if (selectionPlan.type === "set-fetch") {
                        props.setStateCheckFetch(selectionPlan.stateCheckFetch);
                    }
                }, options: WorktreeStackKit_buildOpenTuiStateCheckFetchOptions() }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiStateCheckFormSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiStateCheckFormOptions(), showDescription: true })] }));
}
/** Renders the stale-realm prune form and confirmation-token preview transition. */
export function WorktreeStackKit_OpenTuiActionScrollPruneStalePanel(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiPruneStalePanel({
        flow: props.flow,
        phase: props.phase,
    })) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: props.npmScripts.pruneStale }), _jsx("text", { children: "Removes stale realm registry rows for missing workspaces. Requires confirmation." }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_handleOpenTuiPruneStaleFormSelection({
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiPruneStaleFormOptions(), showDescription: true })] }));
}
/** Renders streaming output and post-run result navigation for non-menu flows. */
export function WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels(props) {
    return (_jsxs(_Fragment, { children: [WorktreeStackKit_shouldShowOpenTuiRunPanel({ phase: props.phase }) ? (_jsxs(_Fragment, { children: [_jsxs("text", { children: ["Running ", props.runScript, "\u2026"] }), _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: WorktreeStackKit_formatOpenTuiRunningOutput({
                                runStderr: props.runStderr,
                                runStdout: props.runStdout,
                            }) }) })] })) : null, WorktreeStackKit_shouldShowOpenTuiResultPanel({ phase: props.phase }) ? (_jsxs(_Fragment, { children: [_jsxs("text", { children: ["Exit status: ", WorktreeStackKit_formatOpenTuiRunExitStatus(props)] }), _jsx("text", { children: "Stdout" }), _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: WorktreeStackKit_formatOpenTuiRunResultText({
                                text: props.runStdout,
                            }) }) }), _jsx("text", { children: "Stderr" }), _jsx("scrollbox", { style: { maxHeight: 8 }, children: _jsx("text", { children: WorktreeStackKit_formatOpenTuiRunResultText({
                                text: props.runStderr,
                            }) }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                            const selectionPlan = WorktreeStackKit_planOpenTuiRunResultSelection({
                                optionValue: option?.value,
                            });
                            if (selectionPlan.type === "menu") {
                                props.goMenu();
                            }
                        }, options: WorktreeStackKit_buildOpenTuiRunResultOptions(), showDescription: true })] })) : null] }));
}
function WorktreeStackKit_applyOpenTuiGlobalPreviewPlan(options) {
    options.props.setCommandPreview(options.plan.commandPreview);
    options.props.setPendingNpmRun({
        forwarded: options.plan.forwarded,
        script: options.plan.script,
    });
    options.props.setRequiredConfirmToken(options.plan.requiredConfirmToken);
}
function WorktreeStackKit_handleOpenTuiStateCheckFormSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiStateCheckFormSelection({
        npmScripts: options.props.npmScripts,
        optionValue: options.optionValue,
        stateCheckFetch: options.props.stateCheckFetch,
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
    WorktreeStackKit_applyOpenTuiGlobalPreviewPlan({
        plan: selectionPlan.previewPlan,
        props: options.props,
    });
    options.props.setPhase(selectionPlan.nextPhase);
}
function WorktreeStackKit_handleOpenTuiPruneStaleFormSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiPruneStaleFormSelection({
        npmScripts: options.props.npmScripts,
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
    WorktreeStackKit_applyOpenTuiGlobalPreviewPlan({
        plan: selectionPlan.previewPlan,
        props: options.props,
    });
    options.props.setPhase(selectionPlan.nextPhase);
}
