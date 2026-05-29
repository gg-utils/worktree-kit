import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_buildOpenTuiBootstrapFormOptions, WorktreeStackKit_buildOpenTuiRepairDryRunOptions, WorktreeStackKit_buildOpenTuiRepairFormOptions, WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions, WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions, WorktreeStackKit_buildOpenTuiSyncFormOptions, WorktreeStackKit_buildOpenTuiTsxPreviewOptions, WorktreeStackKit_formatOpenTuiBootstrapFormText, WorktreeStackKit_planOpenTuiMaintenanceFormSelection, WorktreeStackKit_planOpenTuiRepairBooleanSelection, WorktreeStackKit_planOpenTuiTsxPreviewSelection, WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel, WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel, WorktreeStackKit_shouldShowOpenTuiRepairFormPanel, WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel, WorktreeStackKit_shouldShowOpenTuiSyncFormPanel, WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel, } from "./opentui-action-scroll-maintenance-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
/** Renders worktrees:repair form controls and direct TSX preview/run navigation. */
export function WorktreeStackKit_OpenTuiActionScrollRepairPanel(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiRepairFormPanel({
        flow: props.flow,
        phase: props.phase,
    }) &&
        !WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel({
            flow: props.flow,
            phase: props.phase,
        })) {
        return null;
    }
    if (WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel({
        flow: props.flow,
        phase: props.phase,
    })) {
        return (_jsxs(_Fragment, { children: [_jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: props.commandPreview }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                        const selectionPlan = WorktreeStackKit_planOpenTuiTsxPreviewSelection({
                            optionValue: option?.value,
                        });
                        if (selectionPlan.type === "run") {
                            void props.runSpawn(props.scriptPaths.repair, props.repairArgv);
                        }
                        if (selectionPlan.type === "back") {
                            props.setPhase(selectionPlan.nextPhase);
                        }
                    }, options: WorktreeStackKit_buildOpenTuiTsxPreviewOptions(), showDescription: true })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:repair" }), props.formError.length > 0 ? _jsx("text", { children: props.formError }) : null, _jsx("text", { children: "Worktree paths (comma-separated, optional = all discovered)" }), _jsx("input", { onChange: (value) => props.setRepairWorktrees(value), value: props.repairWorktrees }), _jsx("text", { children: "Include package .env backfill (--include-package-env)" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_applyOpenTuiRepairBooleanSelection({
                        field: "includePackageEnv",
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions() }), _jsx("text", { children: "Deprecated alias: pass --package-env-mode missing-only (maps to missing-or-blank)" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_applyOpenTuiRepairBooleanSelection({
                        field: "legacyMissingOnly",
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions() }), _jsx("text", { children: "Dry run (--dry-run)" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    WorktreeStackKit_applyOpenTuiRepairBooleanSelection({
                        field: "dryRun",
                        optionValue: option?.value,
                        props,
                    });
                }, options: WorktreeStackKit_buildOpenTuiRepairDryRunOptions() }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const selectionPlan = WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
                        optionValue: option?.value,
                    });
                    if (selectionPlan.type === "preview") {
                        props.repairGoPreview();
                    }
                    if (selectionPlan.type === "menu") {
                        props.goMenu();
                    }
                    if (selectionPlan.type === "quit") {
                        props.requestQuit();
                    }
                }, options: WorktreeStackKit_buildOpenTuiRepairFormOptions(), showDescription: true })] }));
}
/** Renders worktrees:sync-local-files form controls and direct TSX preview/run navigation. */
export function WorktreeStackKit_OpenTuiActionScrollSyncPanel(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiSyncFormPanel({
        flow: props.flow,
        phase: props.phase,
    }) &&
        !WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel({
            flow: props.flow,
            phase: props.phase,
        })) {
        return null;
    }
    if (WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel({
        flow: props.flow,
        phase: props.phase,
    })) {
        return (_jsxs(_Fragment, { children: [_jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: props.commandPreview }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                        const selectionPlan = WorktreeStackKit_planOpenTuiTsxPreviewSelection({
                            optionValue: option?.value,
                        });
                        if (selectionPlan.type === "run") {
                            void props.runSpawn(props.scriptPaths.syncLocalFiles, props.syncArgv);
                        }
                        if (selectionPlan.type === "back") {
                            props.setPhase(selectionPlan.nextPhase);
                        }
                    }, options: WorktreeStackKit_buildOpenTuiTsxPreviewOptions(), showDescription: true })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "worktrees:sync-local-files" }), props.formError.length > 0 ? _jsx("text", { children: props.formError }) : null, _jsx("text", { children: "Source workspace (--source-workspace)" }), _jsx("input", { onChange: (value) => props.setSyncSource(value), value: props.syncSource }), _jsx("text", { children: "Target worktrees (comma-separated, optional = all defaults)" }), _jsx("input", { onChange: (value) => props.setSyncWorktrees(value), value: props.syncWorktrees }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const selectionPlan = WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
                        optionValue: option?.value,
                    });
                    if (selectionPlan.type === "preview") {
                        props.syncGoPreview();
                    }
                    if (selectionPlan.type === "menu") {
                        props.goMenu();
                    }
                    if (selectionPlan.type === "quit") {
                        props.requestQuit();
                    }
                }, options: WorktreeStackKit_buildOpenTuiSyncFormOptions(), showDescription: true })] }));
}
/** Renders platform bootstrap seed diagnostics and direct TSX preview/run navigation. */
export function WorktreeStackKit_OpenTuiActionScrollBootstrapPanel(props) {
    if (!WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel({
        flow: props.flow,
        phase: props.phase,
    }) &&
        !WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel({
            flow: props.flow,
            phase: props.phase,
        })) {
        return null;
    }
    if (WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel({
        flow: props.flow,
        phase: props.phase,
    })) {
        return (_jsxs(_Fragment, { children: [_jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: props.commandPreview }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                        const selectionPlan = WorktreeStackKit_planOpenTuiTsxPreviewSelection({
                            optionValue: option?.value,
                        });
                        if (selectionPlan.type === "run") {
                            void props.runSpawn(props.scriptPaths.bootstrapInstall, []);
                        }
                        if (selectionPlan.type === "back") {
                            props.setPhase(selectionPlan.nextPhase);
                        }
                    }, options: WorktreeStackKit_buildOpenTuiTsxPreviewOptions(), showDescription: true })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("text", { children: "platform bootstrap (platform/commands/install-all.ts)" }), _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("text", { children: WorktreeStackKit_formatOpenTuiBootstrapFormText({
                        installDescription: props.installDescription,
                        seedFacts: props.seedReport,
                    }) }) }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { onSelect: (_i, option) => {
                    const selectionPlan = WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
                        optionValue: option?.value,
                    });
                    if (selectionPlan.type === "preview") {
                        props.bootstrapGoPreview();
                    }
                    if (selectionPlan.type === "menu") {
                        props.goMenu();
                    }
                    if (selectionPlan.type === "quit") {
                        props.requestQuit();
                    }
                }, options: WorktreeStackKit_buildOpenTuiBootstrapFormOptions(), showDescription: true })] }));
}
function WorktreeStackKit_applyOpenTuiRepairBooleanSelection(options) {
    const selectionPlan = WorktreeStackKit_planOpenTuiRepairBooleanSelection({
        field: options.field,
        optionValue: options.optionValue,
    });
    if (selectionPlan.type === "ignore") {
        return;
    }
    if (selectionPlan.field === "dryRun") {
        options.props.setRepairDryRun(selectionPlan.value);
    }
    if (selectionPlan.field === "includePackageEnv") {
        options.props.setRepairIncludePkg(selectionPlan.value);
    }
    if (selectionPlan.field === "legacyMissingOnly") {
        options.props.setRepairLegacyMissingOnly(selectionPlan.value);
    }
}
//# sourceMappingURL=opentui-maintenance-panels.js.map