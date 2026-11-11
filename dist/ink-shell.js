import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Package-owned Ink shell renderer for worktree inventory, action overview, and inline editors.
 *
 * Root adapters provide project action catalogs, create-resolution config, inventory loading, and
 * subprocess side effects. This package renderer owns the reusable React/Ink shell layout and keeps
 * script folders focused on configuration/adapters.
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root; that script runs tsx --test over packages/worktree-kit/src, matching every path ending in .unit.test.ts under src, including src/ink-shell.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-app.tsx - Ink app controller that mounts this shell renderer inside reducer-driven session, keyboard routing, and fullscreen handoffs for worktree-stack CLIs.
 * @see packages/worktree-kit/src/ink-shell-view-model.ts - Pure view-model builders supplying header summaries, record rows, legend lines, overview stats, and combined issue rows consumed by this layout.
 * @see packages/worktree-kit/src/ink-shell.unit.test.ts - Node test module asserting bound-shell factory wiring and React element-shape coverage for exports owned by this renderer.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-app-shell-views.tsx - Worktree-stack CLI Ink views that import the published `@gg-utils/worktree-kit/ink-shell` entrypoint alongside other shell slices.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React, { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import { WorktreeStackKit_buildInkShellActionListModel, WorktreeStackKit_buildInkShellCombinedIssuesModel, WorktreeStackKit_buildInkShellDetailModel, WorktreeStackKit_buildInkShellHeaderSummary, WorktreeStackKit_buildInkShellLegendLines, WorktreeStackKit_buildInkShellOverviewModel, WorktreeStackKit_buildInkShellRecordRows, WorktreeStackKit_getInkShellSelectedRecord, } from "./ink-shell-view-model.js";
import { WorktreeStackKit_buildInkFullscreenActionEditorModel, WorktreeStackKit_buildInkFullscreenCreateEditorModel, } from "./ink-fullscreen-view-model.js";
import { WorktreeStackKit_InkActionOptionsPanel } from "./ink-action-options-panel.js";
import { WorktreeStackKit_renderInkIssueLine } from "./ink-issue-line.js";
export { WorktreeStackKit_getInkShellSelectedRecord } from "./ink-shell-view-model.js";
/** Returns stdout dimensions for responsive package-owned Ink shell layouts. */
function WorktreeStackKit_useInkShellStdoutDimensions() {
    const { stdout } = useStdout();
    const [dimensions, setDimensions] = useState([
        stdout.columns ?? 80,
        stdout.rows ?? 24,
    ]);
    useEffect(() => {
        const onResize = () => {
            setDimensions([stdout.columns ?? 80, stdout.rows ?? 24]);
        };
        stdout.on("resize", onResize);
        return () => {
            stdout.off("resize", onResize);
        };
    }, [stdout]);
    return dimensions;
}
/** Maps shell badge tones to Ink colors. */
function WorktreeStackKit_getInkShellToneColor(tone) {
    switch (tone) {
        case "ready":
            return "green";
        case "blocked":
        case "warning":
            return "yellow";
        case "editing":
        case "info":
            return "cyan";
        case "destructive":
            return "red";
        case "muted":
            return "gray";
    }
}
/** Renders a compact shell status badge. */
function InkStatusBadge({ label, tone, }) {
    return (_jsxs(Text, { color: WorktreeStackKit_getInkShellToneColor(tone), children: ["[", label, "]"] }));
}
/** Renders yes/no chips for create boolean fields. */
function InkBooleanChips({ value }) {
    return (_jsxs(Box, { children: [_jsx(InkStatusBadge, { label: "yes", tone: value ? "ready" : "muted" }), _jsx(Text, { color: "gray", children: " " }), _jsx(InkStatusBadge, { label: "no", tone: value ? "muted" : "warning" })] }));
}
/** Renders a package-owned shell screen header. */
function InkScreenHeader({ appName, description, notice, summary, }) {
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: "green", children: appName }), description ? _jsx(Text, { color: "gray", children: description }) : null, summary ? _jsx(Box, { children: summary }) : null, notice ? _jsx(Text, { color: "yellow", children: notice }) : null] }));
}
/** Named shell panel with optional subtitle and badge. */
function InkPanel({ title, subtitle, badgeLabel, badgeTone, children, }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: title }), badgeLabel && badgeTone ? (_jsxs(_Fragment, { children: [_jsx(Text, { children: " " }), _jsx(InkStatusBadge, { label: badgeLabel, tone: badgeTone })] })) : null] }), subtitle ? _jsx(Text, { color: "gray", children: subtitle }) : null, children] }));
}
/** A titled section inside a shell panel. */
function InkPanelSection({ title, children, }) {
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: title }), children] }));
}
/** Renders a command preview block. */
function InkCommandPreview({ commandLine, }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Command" }), _jsx(Text, { wrap: "wrap", children: commandLine })] }));
}
/** Renders keyboard shortcut legend lines. */
function InkLegend({ lines, title = "Keys", }) {
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", gap: 0, children: [title ? (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, children: title }) })) : null, lines.map((line, lineIndex) => {
                const hasPrefix = line.startsWith("Keys: ");
                const cleanLine = hasPrefix ? line.slice(6).trim() : line.trim();
                if (!cleanLine.includes(" | ") && !hasPrefix) {
                    return (_jsx(Text, { color: "gray", children: line }, lineIndex));
                }
                const segments = cleanLine.split(" | ");
                return (_jsx(Box, { flexDirection: "row", flexWrap: "wrap", children: segments.map((segment, segmentIndex) => {
                        const trimmed = segment.trim();
                        if (!trimmed) {
                            return null;
                        }
                        const firstSpace = trimmed.indexOf(" ");
                        const keyCombo = firstSpace > -1 ? trimmed.slice(0, firstSpace) : trimmed;
                        const description = firstSpace > -1 ? trimmed.slice(firstSpace + 1) : "";
                        return (_jsxs(Box, { marginBottom: 1, marginRight: 3, children: [_jsx(Text, { color: "black", backgroundColor: "white", bold: true, children: ` ${keyCombo} ` }), description ? (_jsxs(Text, { color: "gray", children: [" ", description] })) : null] }, segmentIndex));
                    }) }, lineIndex));
            })] }));
}
/**
 * Resolve the selected worktree record from a numeric list index.
 */
export function WorktreeStackKit_getInkShellSelectedRecordFromInventory(inventory, selectedIndex) {
    return WorktreeStackKit_getInkShellSelectedRecord({
        records: inventory.records,
        selectedIndex,
    });
}
/**
 * Shell header with optional notice and inventory summary counts.
 */
function Header({ inventory, noticeMessage, appName, description, }) {
    return (_jsx(InkScreenHeader, { appName: appName, description: description, notice: noticeMessage, summary: _jsx(Text, { children: WorktreeStackKit_buildInkShellHeaderSummary({
                summary: inventory.summary,
            }) }) }));
}
/**
 * Left-column worktree table with per-record status and branch labels.
 */
function RecordList({ inventory, selectedIndex, }) {
    const rows = WorktreeStackKit_buildInkShellRecordRows({
        records: inventory.records,
        selectedIndex,
    });
    return (_jsxs(InkPanel, { title: "Worktrees", subtitle: "Select a worktree to manage", children: [_jsxs(Box, { flexDirection: "row", borderBottom: false, paddingBottom: 1, paddingLeft: 2, children: [_jsx(Box, { width: "40%", children: _jsx(Text, { bold: true, color: "cyan", children: "Name" }) }), _jsx(Box, { width: "20%", children: _jsx(Text, { bold: true, color: "cyan", children: "Status" }) }), _jsx(Box, { width: "40%", children: _jsx(Text, { bold: true, color: "cyan", children: "Branch" }) })] }), rows.length > 0 ? (rows.map((row) => (_jsxs(Box, { flexDirection: "row", paddingBottom: 0, children: [_jsx(Box, { width: "40%", children: _jsxs(Text, { color: row.labelTone ?? undefined, wrap: "truncate-end", children: [row.marker, row.label] }) }), _jsx(Box, { width: "20%", children: _jsx(Text, { color: row.statusTone, wrap: "truncate-end", children: row.statusLabel }) }), _jsx(Box, { width: "40%", children: _jsx(Text, { dimColor: row.dimBranch, color: row.branchTone ?? undefined, wrap: "truncate-end", children: row.branchLabel }) })] }, row.key)))) : (_jsx(Text, { color: "yellow", children: "No git worktrees were discovered." }))] }));
}
/**
 * Embedded action picker with readiness badges for the overview column.
 */
function ActionList({ actionDefinitions, actionPlans, selectedActionIndex, }) {
    const actionListModel = WorktreeStackKit_buildInkShellActionListModel({
        actionDefinitions,
        actionPlans,
        selectedActionIndex,
    });
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, children: "Actions" }), _jsx(Box, { children: _jsxs(Text, { color: actionListModel.detailSelected ? "cyan" : undefined, children: [actionListModel.detailSelected ? ">" : " ", " Detail"] }) }), actionListModel.rows.map((row) => (_jsxs(Box, { children: [_jsxs(Text, { color: row.selected ? "cyan" : undefined, children: [row.marker, " ", row.label, " "] }), _jsx(InkStatusBadge, { label: row.statusLabel, tone: row.statusTone })] }, row.key)))] }));
}
/**
 * Right-column metadata for the selected worktree or an empty-state prompt.
 */
function DetailPanel({ record, }) {
    const detailModel = WorktreeStackKit_buildInkShellDetailModel({ record });
    if (detailModel.empty) {
        return (_jsx(InkPanel, { title: "Details", children: _jsx(Text, { color: "yellow", children: detailModel.prompt }) }));
    }
    return (_jsxs(InkPanel, { title: "Details", badgeLabel: detailModel.badgeLabel, badgeTone: detailModel.badgeTone ?? undefined, children: [detailModel.rows.map((row) => (_jsx(Text, { children: row.text }, row.key))), _jsx(InkPanelSection, { title: "Issues", children: detailModel.issueRows.length > 0 ? (detailModel.issueRows.map((issue) => (_jsxs(Text, { color: issue.tone, children: [issue.icon, " ", issue.message] }, issue.key)))) : (_jsx(Text, { color: "gray", children: detailModel.noIssuesText })) })] }));
}
/**
 * Overview stats, global issues, and embedded action list for the shell column.
 */
function SummaryPanel({ inventory, actionDefinitions, actionPlans, selectedActionIndex, }) {
    const overviewModel = WorktreeStackKit_buildInkShellOverviewModel({
        actionPlan: actionPlans[selectedActionIndex],
        inventory,
    });
    return (_jsxs(InkPanel, { title: "Overview", badgeLabel: overviewModel.badgeLabel, badgeTone: overviewModel.badgeTone ?? undefined, children: [overviewModel.statLines.map((line) => (_jsx(Text, { children: line }, line))), _jsx(InkPanelSection, { title: "Issues", children: overviewModel.globalIssueRows.length > 0 ? (overviewModel.globalIssueRows.map((issue) => (_jsxs(Text, { color: issue.tone, children: [issue.icon, " ", issue.message] }, issue.key)))) : (_jsx(Text, { color: "gray", children: overviewModel.noGlobalIssuesText })) }), _jsx(InkPanelSection, { title: "Getting Started", children: overviewModel.gettingStartedLines.map((line) => (_jsx(Text, { color: "gray", children: line }, line))) }), _jsx(ActionList, { actionDefinitions: actionDefinitions, actionPlans: actionPlans, selectedActionIndex: selectedActionIndex })] }));
}
/**
 * Deep preview of the selected action plan, issues, toggles, and CLI preview.
 */
function ActionPreviewPanel({ actionDefinition, actionPlan, actionOptions, poolNextStackEditMode, selectedRecord, }) {
    const actionPreviewModel = WorktreeStackKit_buildInkFullscreenActionEditorModel({
        actionDefinition,
        actionPlan,
    });
    return (_jsxs(InkPanel, { title: actionDefinition.label, badgeLabel: actionPreviewModel.header.badgeLabel, badgeTone: actionPreviewModel.header.badgeTone, children: [_jsx(Text, { children: actionDefinition.description }), _jsxs(Text, { children: ["Scope: ", _jsx(Text, { color: "cyan", children: actionDefinition.scope })] }), actionDefinition.scope === "record" && selectedRecord ? (_jsxs(Text, { children: ["Target: ", selectedRecord.worktreePath] })) : null, _jsx(WorktreeStackKit_InkActionOptionsPanel, { actionDefinition: actionDefinition, actionOptions: actionOptions, poolNextStackEditMode: poolNextStackEditMode }), _jsx(InkPanelSection, { title: "Plan Summary", children: actionPreviewModel.summaryLines.length > 0 ? (actionPreviewModel.summaryLines.map((line) => (_jsxs(Text, { children: ["- ", line] }, line)))) : (_jsx(Text, { color: "gray", children: "No plan summary lines." })) }), _jsx(InkPanelSection, { title: "Issues", children: actionPreviewModel.preflightIssues.length > 0 ? (actionPreviewModel.preflightIssues.map(WorktreeStackKit_renderInkIssueLine)) : (_jsx(Text, { color: "gray", children: actionPreviewModel.noIssuesText })) }), actionPlan.request ? (_jsx(InkPanelSection, { title: "Command Preview", children: _jsx(InkCommandPreview, { commandLine: actionPreviewModel.commandPreview }) })) : null] }));
}
/**
 * Combined global and selected-record issue panel for the records column.
 */
function CombinedIssuesPanel({ inventory, selectedRecord, }) {
    const issueModel = WorktreeStackKit_buildInkShellCombinedIssuesModel({
        globalIssues: inventory.globalIssues,
        selectedRecord,
    });
    if (!issueModel.visible) {
        return null;
    }
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "round", borderColor: "red", paddingX: 1, children: [_jsxs(Text, { bold: true, color: "red", children: ["\u26A0 Issues (", issueModel.count, ")"] }), issueModel.rows.map((issue) => (_jsxs(Text, { color: issue.tone, wrap: "truncate-end", children: [issue.icon, " ", issue.message] }, issue.key)))] }));
}
/**
 * Primary two-column Ink shell listing worktrees, actions, and contextual detail panels.
 */
export function WorktreeStackKit_InkShell({ inventory, selectedIndex, selectedActionIndex, focusedColumn, actionPlans, actionOptions, poolNextStackEditMode, noticeMessage, createDraft, createInteractionMode, createRegion, selectedCreateSectionIndex, selectedCreateFieldIndex, actionDefinitions, resolutionConfig, appName = "Worktree Manager", description = "Manage git worktrees and local development environments", }) {
    const [, rows] = WorktreeStackKit_useInkShellStdoutDimensions();
    const selectedRecord = WorktreeStackKit_getInkShellSelectedRecordFromInventory(inventory, selectedIndex);
    const selectedAction = selectedActionIndex >= 0
        ? (actionDefinitions[selectedActionIndex] ?? null)
        : null;
    const selectedPlan = selectedActionIndex >= 0
        ? (actionPlans[selectedActionIndex] ?? null)
        : null;
    const isEditorFocused = focusedColumn === "editor";
    const legendLines = WorktreeStackKit_buildInkShellLegendLines({
        createInteractionMode,
        focusedColumn,
        selectedActionId: selectedAction?.id ?? null,
    });
    return (_jsxs(Box, { flexDirection: "column", minHeight: rows, children: [_jsx(Header, { inventory: inventory, noticeMessage: noticeMessage ?? null, appName: appName, description: description }), _jsxs(Box, { flexGrow: 1, children: [_jsxs(Box, { width: 46, flexDirection: "column", borderStyle: "round", borderColor: focusedColumn === "records" ? "cyan" : "gray", paddingX: 1, children: [_jsxs(Text, { bold: true, color: focusedColumn === "records" ? "cyan" : "gray", children: ["Worktrees ", focusedColumn === "records" ? "◂" : ""] }), _jsx(RecordList, { inventory: inventory, selectedIndex: selectedIndex }), _jsx(CombinedIssuesPanel, { inventory: inventory, selectedRecord: selectedRecord })] }), _jsxs(Box, { width: 42, flexDirection: "column", borderStyle: "round", borderColor: focusedColumn === "actions" ? "cyan" : "gray", paddingX: 1, children: [_jsxs(Text, { bold: true, color: focusedColumn === "actions" ? "cyan" : "gray", children: ["Actions ", focusedColumn === "actions" ? "▸" : ""] }), _jsx(SummaryPanel, { inventory: inventory, actionDefinitions: actionDefinitions, actionPlans: actionPlans, selectedActionIndex: selectedActionIndex })] }), _jsx(Box, { flexGrow: 1, flexDirection: "column", borderStyle: "round", borderColor: isEditorFocused ? "cyan" : "gray", paddingX: 1, children: isEditorFocused && selectedAction && selectedPlan ? (_jsx(InlineActionEditor, { actionDefinition: selectedAction, actionPlan: selectedPlan, actionOptions: actionOptions, poolNextStackEditMode: poolNextStackEditMode, inventory: inventory, createDraft: createDraft, createInteractionMode: createInteractionMode, createRegion: createRegion, selectedCreateSectionIndex: selectedCreateSectionIndex, selectedCreateFieldIndex: selectedCreateFieldIndex, resolutionConfig: resolutionConfig })) : selectedAction && selectedPlan ? (_jsx(ActionPreviewPanel, { actionDefinition: selectedAction, actionPlan: selectedPlan, actionOptions: actionOptions, poolNextStackEditMode: poolNextStackEditMode, selectedRecord: selectedRecord })) : (_jsx(DetailPanel, { record: selectedRecord })) })] }), _jsx(InkLegend, { lines: legendLines })] }));
}
/**
 * Creates a shell component with project action definitions and create-resolution config bound.
 */
export function WorktreeStackKit_createBoundInkShell({ actionDefinitions, resolutionConfig, }) {
    return function WorktreeStackKit_BoundInkShell(props) {
        return (_jsx(WorktreeStackKit_InkShell, { ...props, actionDefinitions: actionDefinitions, resolutionConfig: resolutionConfig }));
    };
}
/**
 * Full-height create wizard or generic option editor in the shell editor column.
 */
function InlineActionEditor({ actionDefinition, actionPlan, actionOptions, poolNextStackEditMode, inventory, createDraft, createInteractionMode, createRegion, selectedCreateSectionIndex, selectedCreateFieldIndex, resolutionConfig, }) {
    if (actionDefinition.id === "create") {
        const createModel = WorktreeStackKit_buildInkFullscreenCreateEditorModel({
            actionPlan,
            createDraft,
            createInteractionMode,
            createRegion,
            inventory,
            resolutionConfig,
            selectedCreateFieldIndex,
            selectedCreateSectionIndex,
        });
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { bold: true, color: "cyan", children: ["Create worktree", " ", _jsx(InkStatusBadge, { label: createModel.header.badgeLabel, tone: createModel.header.badgeTone })] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: createRegion === "sections" ? "cyan" : "gray", children: "Sections" }), createModel.sectionRows.map((section) => (_jsxs(Text, { color: section.tone ?? undefined, children: [section.marker, " ", section.label] }, section.id)))] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: createRegion === "fields" ? "cyan" : "gray", children: "Fields" }), createModel.fieldRows.map((field) => (_jsxs(Box, { children: [_jsxs(Text, { color: field.tone ?? undefined, children: [field.marker, " ", field.label, ":", " ", !field.isBoolean
                                            ? field.displayValue.length > 0
                                                ? field.displayValue
                                                : "(empty)"
                                            : ""] }), field.isBoolean ? (_jsx(InkBooleanChips, { value: field.booleanValue ?? false })) : null, field.editing ? (_jsxs(_Fragment, { children: [_jsx(Text, { children: " " }), _jsx(InkStatusBadge, { label: "editing", tone: "editing" })] })) : null] }, field.id)))] }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { bold: true, color: createRegion === "preview" ? "cyan" : "gray", children: ["Preview", " ", _jsx(InkStatusBadge, { label: createModel.previewBadgeLabel, tone: createModel.previewBadgeTone })] }), createModel.previewRows.map((row) => (_jsxs(Text, { children: [row.label, ": ", row.value] }, row.key)))] }), actionPlan.request ? (_jsx(InkPanelSection, { title: "Command Preview", children: _jsx(InkCommandPreview, { commandLine: createModel.commandPreview }) })) : null] }));
    }
    // Generic action editor (non-create)
    const actionEditorModel = WorktreeStackKit_buildInkFullscreenActionEditorModel({
        actionDefinition,
        actionPlan,
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { bold: true, color: "cyan", children: [actionDefinition.label, " ", _jsx(InkStatusBadge, { label: actionEditorModel.header.badgeLabel, tone: actionEditorModel.header.badgeTone })] }), _jsx(InkPanelSection, { title: "Target", children: _jsx(Text, { children: actionEditorModel.targetText }) }), _jsx(WorktreeStackKit_InkActionOptionsPanel, { actionDefinition: actionDefinition, actionOptions: actionOptions, poolNextStackEditMode: poolNextStackEditMode }), actionPlan.request ? (_jsx(InkPanelSection, { title: "Command Preview", children: _jsx(InkCommandPreview, { commandLine: actionEditorModel.commandPreview }) })) : null, _jsxs(InkPanelSection, { title: "Preflight Notes", children: [actionEditorModel.summaryLines.map((line) => (_jsxs(Text, { children: ["- ", line] }, line))), actionEditorModel.preflightIssues.length > 0 ? (actionEditorModel.preflightIssues.map(WorktreeStackKit_renderInkIssueLine)) : (_jsx(Text, { color: "gray", children: actionEditorModel.noIssuesText }))] })] }));
}
