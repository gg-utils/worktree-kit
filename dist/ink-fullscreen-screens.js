import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Package-owned Ink full-screen renderers for worktree review/session/result flows.
 *
 * The screens compose package-owned full-screen view models, issue rendering, status badges, command
 * previews, output capture blocks, and terminal sizing. Root launchers still own inventory loading,
 * reducer wiring, config loading, and subprocess side effects.
 *
 * @testing Node test: npm run worktree-kit:test from the repository root runs packages/worktree-kit unit tests including ink-fullscreen-screens.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-fullscreen-view-model.ts - View-model builders that normalize headers, legends, command previews, and section copy these Ink screens render.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Action plan, session line, and result model contracts passed into the exported review, session, and result screen components.
 * @see packages/worktree-kit/src/ink-issue-line.tsx - Issue-line renderer embedded in the review and result issue panels owned by this module.
 * @see packages/worktree-kit/src/ink-display-view-model.ts - Session output color mapping applied when rendering captured lines inside session and result output blocks here.
 * @see packages/worktree-kit/src/ink-fullscreen-screens.unit.test.ts - Node:test coverage that imports these screens and asserts stable element wiring against fixture contracts.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import { WorktreeStackKit_buildInkFullscreenResultModel, WorktreeStackKit_buildInkFullscreenReviewModel, WorktreeStackKit_buildInkFullscreenSessionModel, } from "./ink-fullscreen-view-model.js";
import { WorktreeStackKit_getInkSessionOutputColor } from "./ink-display-view-model.js";
import { WorktreeStackKit_renderInkIssueLine } from "./ink-issue-line.js";
/** Returns stdout dimensions for responsive package-owned Ink layouts. */
function WorktreeStackKit_useInkStdoutDimensions() {
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
/** Maps badge tones emitted by full-screen view models to Ink colors. */
function WorktreeStackKit_getInkFullscreenBadgeColor(tone) {
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
    }
}
/** Renders a compact tone-colored badge. */
function WorktreeStackKit_InkFullscreenStatusBadge({ label, tone, }) {
    return (_jsxs(Text, { color: WorktreeStackKit_getInkFullscreenBadgeColor(tone), children: ["[", label, "]"] }));
}
/** Top-of-screen package-owned header for worktree Ink full-screen flows. */
function WorktreeStackKit_InkFullscreenHeader({ appName, title, description, summary, badgeLabel, badgeTone, }) {
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: "green", children: appName }), title || badgeLabel ? (_jsxs(Box, { children: [title ? _jsx(Text, { bold: true, children: title }) : null, title && badgeLabel ? _jsx(Text, { children: " " }) : null, badgeLabel && badgeTone ? (_jsx(WorktreeStackKit_InkFullscreenStatusBadge, { label: badgeLabel, tone: badgeTone })) : null] })) : null, description ? _jsx(Text, { color: "gray", children: description }) : null, summary ? _jsx(Box, { children: summary }) : null] }));
}
/** A titled section inside a full-screen flow. */
function WorktreeStackKit_InkFullscreenPanelSection({ title, children, }) {
    return (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: title }), children] }));
}
/** Renders a titled command preview block. */
function WorktreeStackKit_InkFullscreenCommandPreview({ commandLine, title = "Command", }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: title }), _jsx(Text, { wrap: "wrap", children: commandLine })] }));
}
/** Renders keyboard shortcut legend lines. */
function WorktreeStackKit_InkFullscreenLegend({ lines, title = "Keys", }) {
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
/** Returns the last `count` items from a readonly line collection. */
function WorktreeStackKit_sliceRecentInkOutputLines(lines, count) {
    if (lines.length <= count) {
        return [...lines];
    }
    return lines.slice(lines.length - count);
}
/** Renders recent process output with optional source prefixes. */
function WorktreeStackKit_InkFullscreenCapturedOutputBlock({ lines, maxLines, bracketSource = false, }) {
    const recent = WorktreeStackKit_sliceRecentInkOutputLines(lines, maxLines);
    return (_jsx(Box, { flexDirection: "column", children: recent.map((line, index) => (_jsx(Text, { color: WorktreeStackKit_getInkSessionOutputColor(line.source), children: bracketSource ? `[${line.source}] ${line.text}` : line.text }, `${line.source}:${String(index)}`))) }));
}
/** Typed confirmation gate before spawning runtime or task sessions. */
export function WorktreeStackKit_InkReviewScreen({ actionPlan, reviewConfirmationInput, }) {
    const reviewModel = WorktreeStackKit_buildInkFullscreenReviewModel({
        actionPlan,
        reviewConfirmationInput,
    });
    const [, rows] = WorktreeStackKit_useInkStdoutDimensions();
    return (_jsxs(Box, { flexDirection: "column", minHeight: rows, children: [_jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsx(WorktreeStackKit_InkFullscreenHeader, { appName: "Worktree Ink", title: reviewModel.header.title, badgeLabel: reviewModel.header.badgeLabel, badgeTone: reviewModel.header.badgeTone }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Command", children: _jsx(WorktreeStackKit_InkFullscreenCommandPreview, { commandLine: reviewModel.commandPreview }) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Plan", children: reviewModel.summaryLines.map((line) => (_jsxs(Text, { children: ["- ", line] }, line))) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Issues", children: reviewModel.reviewIssues.length > 0 ? (reviewModel.reviewIssues.map(WorktreeStackKit_renderInkIssueLine)) : (_jsx(Text, { color: "gray", children: reviewModel.noIssuesText })) }), reviewModel.destructiveConfirmationText ? (_jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Destructive note", children: _jsx(Text, { children: reviewModel.destructiveConfirmationText }) })) : null, reviewModel.retainedArtifacts.length > 0 ? (_jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Retained Artifacts", children: reviewModel.retainedArtifacts.map((artifact) => (_jsxs(Text, { children: ["- ", artifact.label, ": ", artifact.path] }, artifact.id))) })) : null, reviewModel.requiredConfirmationToken ? (_jsxs(WorktreeStackKit_InkFullscreenPanelSection, { title: "Confirmation", children: [_jsxs(Text, { children: ["Type `", reviewModel.requiredConfirmationToken, "` to unlock execution for this action."] }), _jsxs(Text, { children: ["Current input:", " ", _jsx(Text, { color: reviewModel.currentInputTone, children: reviewModel.currentInputDisplay })] })] })) : null] }), _jsx(WorktreeStackKit_InkFullscreenLegend, { lines: reviewModel.legendLines })] }));
}
/** Live child-process output with cancellable session affordances. */
export function WorktreeStackKit_InkSessionScreen({ actionPlan, lines, sessionStatus, startedAt, }) {
    const sessionModel = WorktreeStackKit_buildInkFullscreenSessionModel({
        actionPlan,
        lines,
        sessionStatus,
        startedAt,
    });
    const [, rows] = WorktreeStackKit_useInkStdoutDimensions();
    return (_jsxs(Box, { flexDirection: "column", minHeight: rows, children: [_jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsx(WorktreeStackKit_InkFullscreenHeader, { appName: "Worktree Ink", title: sessionModel.header.title, badgeLabel: sessionModel.header.badgeLabel, badgeTone: sessionModel.header.badgeTone, summary: _jsx(Text, { children: sessionModel.header.summaryText }) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Command", children: _jsx(WorktreeStackKit_InkFullscreenCommandPreview, { commandLine: sessionModel.commandPreview }) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Plan", children: sessionModel.summaryLines.map((line) => (_jsxs(Text, { children: ["- ", line] }, line))) }), sessionModel.retainedArtifacts.length > 0 ? (_jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Retained Artifacts", children: sessionModel.retainedArtifacts.map((artifact) => (_jsxs(Text, { children: ["- ", artifact.label, ": ", artifact.path] }, artifact.id))) })) : null, _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Recent Output", children: sessionModel.outputLines.length > 0 ? (_jsx(WorktreeStackKit_InkFullscreenCapturedOutputBlock, { lines: sessionModel.outputLines, maxLines: sessionModel.outputMaxLines, bracketSource: true })) : (_jsx(Text, { color: "gray", children: sessionModel.waitingOutputText })) })] }), _jsx(WorktreeStackKit_InkFullscreenLegend, { lines: sessionModel.legendLines })] }));
}
/** Post-run diagnostics including optional create-resolution handoff UI. */
export function WorktreeStackKit_InkResultScreen({ actionPlan, result, }) {
    const resultModel = WorktreeStackKit_buildInkFullscreenResultModel({
        actionPlan,
        result,
    });
    const [, rows] = WorktreeStackKit_useInkStdoutDimensions();
    return (_jsxs(Box, { flexDirection: "column", minHeight: rows, children: [_jsxs(Box, { flexGrow: 1, flexDirection: "column", children: [_jsx(WorktreeStackKit_InkFullscreenHeader, { appName: "Worktree Ink", title: resultModel.header.title, badgeLabel: resultModel.header.badgeLabel, badgeTone: resultModel.header.badgeTone }), _jsx(Text, { children: resultModel.message }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Command", children: _jsx(WorktreeStackKit_InkFullscreenCommandPreview, { commandLine: resultModel.commandPreview }) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Plan", children: resultModel.summaryLines.map((line) => (_jsxs(Text, { children: ["- ", line] }, line))) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Issues", children: resultModel.planningIssues.length > 0 ? (resultModel.planningIssues.map(WorktreeStackKit_renderInkIssueLine)) : (_jsx(Text, { color: "gray", children: resultModel.noIssuesText })) }), _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Execution", children: resultModel.executionRows.map((row) => (_jsxs(Text, { children: [row.label, ": ", row.value] }, row.key))) }), resultModel.createHandoff ? (_jsxs(WorktreeStackKit_InkFullscreenPanelSection, { title: "Create Handoff", children: [_jsx(WorktreeStackKit_InkFullscreenStatusBadge, { label: resultModel.createHandoff.status, tone: resultModel.createHandoff.statusTone }), _jsx(Text, { children: resultModel.createHandoff.requestedLine }), _jsxs(Text, { children: ["Predicted path: ", resultModel.createHandoff.predictedWorktreePath] }), resultModel.createHandoff.status === "resolved" ? (_jsxs(_Fragment, { children: [_jsxs(Text, { children: ["Resolved worktree:", " ", resultModel.createHandoff.matchedWorktreePath ?? "(none)"] }), resultModel.createHandoff.followUpStartPrompt ? (_jsx(Text, { color: "gray", children: resultModel.createHandoff.followUpStartPrompt })) : null] })) : null, resultModel.createHandoff.status === "ambiguous" ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: "yellow", children: resultModel.createHandoff.ambiguousWarningText }), resultModel.createHandoff.candidatePaths.map((path) => (_jsxs(Text, { children: ["- Candidate: ", path] }, path)))] })) : null, resultModel.createHandoff.status === "not-found" ? (_jsx(_Fragment, { children: resultModel.createHandoff.notFoundTextLines.map((line, index) => (_jsx(Text, { color: index === 0 ? "yellow" : "gray", children: line }, line))) })) : null] })) : null, resultModel.retainedArtifacts.length > 0 ? (_jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Retained Artifacts", children: resultModel.retainedArtifacts.map((artifact) => (_jsxs(Text, { children: ["- ", artifact.label, ": ", artifact.path] }, artifact.id))) })) : null, _jsx(WorktreeStackKit_InkFullscreenPanelSection, { title: "Recent Output", children: resultModel.outputLines.length > 0 ? (_jsx(WorktreeStackKit_InkFullscreenCapturedOutputBlock, { lines: resultModel.outputLines, maxLines: resultModel.outputMaxLines, bracketSource: true })) : (_jsx(Text, { color: "gray", children: "No process output was captured for this result." })) })] }), _jsx(WorktreeStackKit_InkFullscreenLegend, { lines: resultModel.legendLines })] }));
}
//# sourceMappingURL=ink-fullscreen-screens.js.map