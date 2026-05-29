import { jsx as _jsx, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_OpenTuiActionScroll } from "./opentui-action-scroll.js";
import { WorktreeStackKit_formatOpenTuiCopyLabel, WorktreeStackKit_getOpenTuiCopyTone, WorktreeStackKit_getOpenTuiSelectedRecord, } from "./opentui-app-shell-view-model.js";
import { WorktreeStackKit_OpenTuiDetailPanel, WorktreeStackKit_OpenTuiIssuesPanel, WorktreeStackKit_OpenTuiShellFooter, WorktreeStackKit_OpenTuiShellHeader, WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody, } from "./opentui-app-shell-panels.js";
import { WorktreeStackKit_buildOpenTuiMenuOptions, WorktreeStackKit_planOpenTuiMenuActionSelection, } from "./opentui-shell-menu-actions.js";
import { WorktreeStackKit_serializeOpenTuiActions, WorktreeStackKit_serializeOpenTuiRecordDetail, WorktreeStackKit_serializeOpenTuiWorktreesList, } from "./opentui-shell-serializers.js";
import { WorktreeStackKit_openTuiFlowTitle } from "./opentui-shell-contracts.js";
/** Renders the full OpenTUI worktree app shell around the active action-scroll panel. */
export function WorktreeStackKit_OpenTuiAppShell(props) {
    const { actionScrollProps } = props;
    const selectedRecord = WorktreeStackKit_getOpenTuiSelectedRecord({
        recordPickIndex: actionScrollProps.recordPickIndex,
        records: actionScrollProps.inventory?.records,
    });
    const selectedRecordOrUndefined = selectedRecord ?? undefined;
    return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx(WorktreeStackKit_OpenTuiShellHeader, { inventory: actionScrollProps.inventory }), _jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 0 }, children: [_jsxs("box", { style: { flexDirection: "row", flexGrow: 1, gap: 0 }, children: [_jsx(WorktreeStackKit_OpenTuiWorktreesColumn, { copyFlash: props.copyFlash, focusedColumn: props.focusedColumn, handleCopy: props.handleCopy, inventory: actionScrollProps.inventory, inventoryLoadError: props.inventoryLoadError, setRecordPickIndex: props.setRecordPickIndex, worktreesTabRef: props.worktreesTabRef }), _jsx(WorktreeStackKit_OpenTuiIssuesPanel, { copyFlash: props.copyFlash, globalIssues: actionScrollProps.inventory?.globalIssues ?? [], handleCopy: props.handleCopy, selectedRecord: selectedRecordOrUndefined }), _jsx(WorktreeStackKit_OpenTuiActionsColumn, { actionsTabRef: props.actionsTabRef, actionScrollProps: actionScrollProps, copyFlash: props.copyFlash, focusedColumn: props.focusedColumn, handleCopy: props.handleCopy, resetRunArtifacts: props.resetRunArtifacts, selectedRecord: selectedRecordOrUndefined, setFlow: props.setFlow, setFocusedColumn: props.setFocusedColumn, worktreesTabRef: props.worktreesTabRef }), _jsx(WorktreeStackKit_OpenTuiDetailOrActionColumn, { actionScrollProps: actionScrollProps, copyFlash: props.copyFlash, focusedColumn: props.focusedColumn, handleCopy: props.handleCopy, selectedRecord: selectedRecordOrUndefined })] }), _jsx(WorktreeStackKit_OpenTuiShellFooter, { flow: actionScrollProps.flow })] })] }));
}
function WorktreeStackKit_OpenTuiWorktreesColumn(props) {
    return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, width: "35%", padding: 1 }, border: true, borderStyle: props.focusedColumn === "worktrees" ? "double" : "single", borderColor: props.focusedColumn === "worktrees" ? "green" : "gray", title: props.focusedColumn === "worktrees" ? "▸ Worktrees" : "Worktrees", children: [_jsxs("box", { style: { flexDirection: "row", justifyContent: "space-between" }, children: [_jsx("text", { fg: "gray", children: "Browse discovered worktree records." }), _jsx("text", { fg: WorktreeStackKit_getOpenTuiCopyTone({
                            copyFlash: props.copyFlash,
                            panel: "worktrees",
                        }), onMouseDown: () => props.handleCopy("worktrees", WorktreeStackKit_serializeOpenTuiWorktreesList({
                            inventory: props.inventory,
                        })), children: WorktreeStackKit_formatOpenTuiCopyLabel({
                            copyFlash: props.copyFlash,
                            panel: "worktrees",
                        }) })] }), WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody({
                focusedColumn: props.focusedColumn,
                inventory: props.inventory,
                inventoryLoadError: props.inventoryLoadError,
                setRecordPickIndex: props.setRecordPickIndex,
                worktreesTabRef: props.worktreesTabRef,
            })] }));
}
function WorktreeStackKit_OpenTuiActionsColumn(props) {
    const availability = WorktreeStackKit_getOpenTuiMenuAvailability({
        inventory: props.actionScrollProps.inventory,
        selectedRecord: props.selectedRecord,
    });
    return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, width: "30%", padding: 1 }, border: true, borderStyle: props.focusedColumn === "actions" ? "double" : "single", borderColor: props.focusedColumn === "actions" ? "yellow" : "gray", title: props.focusedColumn === "actions" ? "▸ Actions" : "Actions", children: [_jsxs("box", { style: { flexDirection: "row", justifyContent: "space-between" }, children: [_jsx("text", { fg: "gray", children: "Available commands." }), _jsx("text", { fg: WorktreeStackKit_getOpenTuiCopyTone({
                            copyFlash: props.copyFlash,
                            panel: "actions",
                        }), onMouseDown: () => props.handleCopy("actions", WorktreeStackKit_serializeOpenTuiActions({
                            inventory: props.actionScrollProps.inventory,
                            selectedRecord: props.selectedRecord,
                        })), children: WorktreeStackKit_formatOpenTuiCopyLabel({
                            copyFlash: props.copyFlash,
                            panel: "actions",
                        }) })] }), _jsx("tab-select", { ref: props.actionsTabRef, focused: props.focusedColumn === "actions", selectedBackgroundColor: "yellow", selectedTextColor: "black", focusedBackgroundColor: "#3a3a1a", options: WorktreeStackKit_buildOpenTuiMenuOptions({ availability }), showDescription: true, onSelect: (_index, option) => {
                    WorktreeStackKit_handleOpenTuiMainMenuActionSelection({
                        availability,
                        optionValue: option?.value,
                        props,
                    });
                } })] }));
}
function WorktreeStackKit_OpenTuiDetailOrActionColumn(props) {
    const { flow, phase } = props.actionScrollProps;
    return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, width: "35%", padding: 1 }, border: true, borderStyle: props.focusedColumn === "detail" ? "double" : "single", borderColor: props.focusedColumn === "detail" ? "cyan" : "gray", title: WorktreeStackKit_buildOpenTuiDetailTitle({
            focusedColumn: props.focusedColumn,
            flow,
            phase,
        }), children: [_jsxs("box", { style: { flexDirection: "row", justifyContent: "space-between" }, children: [_jsx("text", { fg: "gray", children: flow === "menu"
                            ? "Selected worktree properties."
                            : WorktreeStackKit_openTuiFlowTitle({ flow, phase }) }), flow === "menu" ? (_jsx("text", { fg: WorktreeStackKit_getOpenTuiCopyTone({
                            copyFlash: props.copyFlash,
                            panel: "detail",
                        }), onMouseDown: () => props.handleCopy("detail", WorktreeStackKit_serializeOpenTuiRecordDetail({
                            record: props.selectedRecord,
                        })), children: WorktreeStackKit_formatOpenTuiCopyLabel({
                            copyFlash: props.copyFlash,
                            panel: "detail",
                        }) })) : null] }), flow === "menu" ? (_jsx(WorktreeStackKit_OpenTuiDetailPanel, { selectedRecord: props.selectedRecord })) : (_jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx(WorktreeStackKit_OpenTuiActionScroll, { ...props.actionScrollProps }) }))] }));
}
function WorktreeStackKit_handleOpenTuiMainMenuActionSelection(options) {
    const plan = WorktreeStackKit_planOpenTuiMenuActionSelection({
        availability: options.availability,
        optionValue: options.optionValue,
    });
    if (plan.type === "ignore")
        return;
    if (plan.type === "quit") {
        options.props.actionScrollProps.requestQuit();
        return;
    }
    options.props.setFocusedColumn(plan.focusedColumn);
    options.props.actionsTabRef.current?.blur();
    options.props.worktreesTabRef.current?.blur();
    options.props.setFlow(plan.flow);
    options.props.actionScrollProps.setPhase(plan.phase);
    if (plan.resetRunArtifacts) {
        options.props.resetRunArtifacts();
        options.props.actionScrollProps.setConfirmTokenInput("");
        options.props.actionScrollProps.setPendingNpmRun(null);
        options.props.actionScrollProps.setRequiredConfirmToken(null);
    }
}
function WorktreeStackKit_getOpenTuiMenuAvailability(options) {
    return {
        hasRealms: (options.inventory?.summary.activeRealms ?? 0) +
            (options.inventory?.summary.inactiveRealms ?? 0) >
            0,
        hasRecords: (options.inventory?.records.length ?? 0) > 0,
        hasSelectedRecord: options.selectedRecord !== undefined,
    };
}
function WorktreeStackKit_buildOpenTuiDetailTitle(options) {
    if (options.flow !== "menu") {
        return `▸ ${WorktreeStackKit_openTuiFlowTitle({
            flow: options.flow,
            phase: options.phase,
        })}`;
    }
    return options.focusedColumn === "detail" ? "▸ Detail" : "Detail";
}
//# sourceMappingURL=opentui-app-shell.js.map