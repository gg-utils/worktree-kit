import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { WorktreeStackKit_buildOpenTuiDetailRows, WorktreeStackKit_buildOpenTuiFooterControls, WorktreeStackKit_buildOpenTuiInventoryHeaderModel, WorktreeStackKit_buildOpenTuiIssuePanelModel, WorktreeStackKit_formatOpenTuiCopyLabel, WorktreeStackKit_getOpenTuiCopyTone, } from "./opentui-app-shell-view-model.js";
import { WorktreeStackKit_serializeOpenTuiIssues, } from "./opentui-shell-serializers.js";
/** Renders title, subtitle, and loaded inventory summary counts. */
export function WorktreeStackKit_OpenTuiShellHeader(props) {
    const headerModel = WorktreeStackKit_buildOpenTuiInventoryHeaderModel({
        inventory: props.inventory,
    });
    return (_jsxs("box", { style: { flexDirection: "column", paddingBottom: 1 }, children: [_jsx("text", { fg: "green", children: _jsx("b", { children: "Worktree OpenTUI" }) }), _jsx("text", { fg: "gray", children: "Additive discovery and action shell for prepared worktrees and shared local-edge state." }), headerModel.loaded ? (_jsxs(_Fragment, { children: [_jsx("text", { children: _jsx("b", { children: headerModel.recordsLine }) }), _jsx("text", { fg: "gray", children: headerModel.realmsLine })] })) : (_jsx("text", { children: headerModel.loadingText }))] }));
}
/** Renders the worktrees column body for loading, empty, warning, and inventory states. */
export function WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody(options) {
    if (options.inventoryLoadError) {
        return _jsxs("text", { fg: "red", children: ["Discovery warning: ", options.inventoryLoadError] });
    }
    if (!options.inventory) {
        return _jsx("text", { children: "Loading worktree discovery\u2026" });
    }
    if (options.inventory.records.length === 0) {
        return _jsx("text", { fg: "gray", children: "No worktrees found." });
    }
    return (_jsx("tab-select", { ref: options.worktreesTabRef, focused: options.focusedColumn === "worktrees", selectedBackgroundColor: "green", selectedTextColor: "black", focusedBackgroundColor: "#1a3a1a", options: options.inventory.records.map((record, index) => WorktreeStackKit_buildOpenTuiDiscoveryOption({ index, record })), onChange: (index) => {
            WorktreeStackKit_updateRecordPickIndex({
                index,
                setRecordPickIndex: options.setRecordPickIndex,
            });
        }, onSelect: (index) => {
            WorktreeStackKit_updateRecordPickIndex({
                index,
                setRecordPickIndex: options.setRecordPickIndex,
            });
        } }));
}
/** Renders selected worktree path, branch, metadata, registry, health, and presence flags. */
export function WorktreeStackKit_OpenTuiDetailPanel(props) {
    const detailRows = WorktreeStackKit_buildOpenTuiDetailRows({
        record: props.selectedRecord,
    });
    if (detailRows.length === 0) {
        return _jsx("text", { fg: "gray", children: "Select a worktree to view details." });
    }
    return (_jsx(_Fragment, { children: detailRows.map((row) => {
            if (row.kind === "path") {
                return (_jsx("text", { fg: "gray", children: row.value }, `path:${row.value}`));
            }
            if (row.kind === "meta") {
                return (_jsx("text", { fg: "gray", children: row.value }, `meta:${row.value}`));
            }
            return (_jsxs("box", { style: { flexDirection: "row", gap: 1 }, children: [_jsx("text", { children: _jsx("b", { children: row.label }) }), _jsx("text", { fg: "gray", children: row.value })] }, row.label));
        }) }));
}
/** Renders global and selected-record issues when either group is non-empty. */
export function WorktreeStackKit_OpenTuiIssuesPanel(props) {
    const issueModel = WorktreeStackKit_buildOpenTuiIssuePanelModel({
        globalIssues: props.globalIssues,
        record: props.selectedRecord,
    });
    if (!issueModel.hasIssues) {
        return null;
    }
    return (_jsxs("box", { style: { flexDirection: "column", padding: 1, width: "35%" }, border: true, borderStyle: "single", borderColor: "red", title: "Issues", children: [_jsx("box", { style: {
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginBottom: 1,
                }, children: _jsx("text", { fg: WorktreeStackKit_getOpenTuiCopyTone({
                        copyFlash: props.copyFlash,
                        panel: "issues",
                    }), onMouseDown: () => props.handleCopy("issues", WorktreeStackKit_serializeOpenTuiIssues({
                        globalIssues: props.globalIssues,
                        label: props.selectedRecord?.label ?? "Selected",
                        recordIssues: props.selectedRecord?.issues ?? [],
                    })), children: WorktreeStackKit_formatOpenTuiCopyLabel({
                        copyFlash: props.copyFlash,
                        panel: "issues",
                    }) }) }), issueModel.globalRows.length > 0 && (_jsxs(_Fragment, { children: [_jsx("text", { fg: "yellow", children: _jsx("b", { children: "Global" }) }), issueModel.globalRows.map((issue) => (_jsxs("text", { fg: issue.tone, children: [" ", "- ", issue.message] }, issue.key)))] })), issueModel.recordRows.length > 0 && (_jsxs(_Fragment, { children: [_jsx("text", { fg: "red", children: _jsx("b", { children: issueModel.recordLabel }) }), issueModel.recordRows.map((issue) => (_jsxs("text", { fg: issue.tone, children: [" ", "- ", issue.message] }, issue.key)))] }))] }));
}
/** Renders the keyboard shortcut legend at the bottom of the OpenTUI app shell. */
export function WorktreeStackKit_OpenTuiShellFooter(props) {
    return (_jsx("box", { style: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 1,
            paddingLeft: 1,
            paddingRight: 1,
        }, children: WorktreeStackKit_buildOpenTuiFooterControls({ flow: props.flow }).map((control) => (_jsxs("box", { style: { flexDirection: "row", gap: 1 }, children: [_jsx("text", { fg: control.foreground, bg: control.background, children: _jsxs("b", { children: [" ", control.keyLabel, " "] }) }), _jsx("text", { fg: "white", children: control.text })] }, control.keyLabel))) }));
}
function WorktreeStackKit_buildOpenTuiDiscoveryOption(options) {
    const branchLabel = options.record.branchRef
        ? options.record.branchRef.replace("refs/heads/", "")
        : "detached";
    let statusTag = "";
    if (options.record.issues.length > 0)
        statusTag = "⚠ Issues";
    else if (options.record.currentCheckout)
        statusTag = "● Current";
    else if (options.record.temporaryMerge)
        statusTag = "⇄ Merge";
    const slotTag = options.record.metadata?.slot != null
        ? `slot ${options.record.metadata.slot}`
        : "";
    const parts = [statusTag, slotTag, branchLabel].filter(Boolean);
    return {
        description: parts.join("  "),
        name: options.record.metadata?.stackName ??
            options.record.handbook?.stackName ??
            options.record.label,
        value: String(options.index),
    };
}
function WorktreeStackKit_updateRecordPickIndex(options) {
    if (!Number.isNaN(options.index)) {
        options.setRecordPickIndex(options.index);
    }
}
