/**
 * @fileoverview Pure view-model helpers for worktree Ink shell renderers.
 *
 * Script adapters keep React/Ink components, project inventory loading, clipboard/TTY behavior, and
 * subprocess side effects. This module owns structural row models for the shell header, worktree
 * list, overview/action list, selected-record details, issue summaries, and keyboard legends.
 *
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including ink-shell-view-model.unit.test.ts).
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/ink-shell-view-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-shell.tsx - Ink shell renderer that maps these row and panel models into React/Ink columns and re-exports the selected-record helper for keyboard-driven navigation.
 * @see packages/worktree-kit/src/ink-launch-options.ts - Action-id vocabulary consumed here for action-list keys so shell rows stay aligned with launcher argv parsing and help contracts.
 * @see packages/worktree-kit/src/ink-shell-view-model.unit.test.ts - Node test module asserting header summaries, record/action/detail/issue models, overview stats, and legend copy produced by these pure builders.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Header summary line for the top of the Ink shell. */
export function WorktreeStackKit_buildInkShellHeaderSummary(options) {
    return `Worktrees: ${options.summary.totalRecords} | Ready: ${options.summary.managedRecords} | Issues: ${options.summary.brokenRecords}`;
}
/** Returns the selected record, or `null` when index state is incomplete. */
export function WorktreeStackKit_getInkShellSelectedRecord(options) {
    return options.records[options.selectedIndex] ?? null;
}
/** Builds worktree list rows with selected-state markers, branch labels, and status colors. */
export function WorktreeStackKit_buildInkShellRecordRows(options) {
    return options.records.map((record, index) => {
        const selected = index === options.selectedIndex;
        const status = WorktreeStackKit_getInkShellRecordStatus(record);
        return {
            branchLabel: WorktreeStackKit_formatInkShellBranch(record.branchRef, "detached"),
            branchTone: selected ? "cyan" : null,
            dimBranch: !selected,
            key: record.worktreePath,
            label: record.label,
            labelTone: selected ? "cyan" : null,
            marker: selected ? "> " : "  ",
            statusLabel: status.label,
            statusTone: status.tone,
        };
    });
}
/** Builds action-list rows including readiness badges. */
export function WorktreeStackKit_buildInkShellActionListModel(options) {
    return {
        detailSelected: options.selectedActionIndex === -1,
        rows: options.actionDefinitions.map((definition, index) => {
            const selected = index === options.selectedActionIndex;
            const ready = Boolean(options.actionPlans[index]?.request);
            return {
                key: definition.id,
                label: definition.label,
                marker: selected ? ">" : " ",
                selected,
                statusLabel: ready ? "Ready" : "Needs Setup",
                statusTone: ready ? "ready" : "blocked",
            };
        }),
    };
}
/** Builds detail-panel rows for the selected record, including issue row models. */
export function WorktreeStackKit_buildInkShellDetailModel(options) {
    const { record } = options;
    if (!record) {
        return { empty: true, prompt: "Select a worktree to view details" };
    }
    const rows = [
        { key: "path", text: record.worktreePath },
        {
            key: "branch",
            text: `Branch: ${WorktreeStackKit_formatInkShellBranch(record.branchRef, "standalone")}`,
        },
        {
            key: "stack",
            text: `Stack: ${record.metadata?.stackName ?? record.handbook?.stackName ?? "Unknown"}`,
        },
        {
            key: "realm",
            text: `Realm: ${record.metadata?.realmSlug ?? record.handbook?.realmSlug ?? "None"}`,
        },
        {
            key: "registry",
            text: `Realm: ${record.realmRecord
                ? `${record.realmRecord.status} (${record.realmRecord.primaryMethod})`
                : "Not registered"}`,
        },
        {
            key: "health",
            text: `Health: ${record.healthSummary
                ? `${record.healthSummary.healthyProbeCount}/${record.healthSummary.totalProbeCount} healthy`
                : "No health data"}`,
        },
        {
            key: "config",
            text: `Config: ${record.metadata ? "Found" : "Missing"} | Handbook: ${record.handbook ? "Found" : "Missing"}`,
        },
        {
            key: "guide",
            text: `Guide: ${record.handbookMarkdownExists ? "Found" : "Missing"}`,
        },
    ];
    const ports = Object.entries(record.metadata?.ports ?? {});
    if (ports.length > 0) {
        rows.push({
            key: "ports",
            text: `Ports: ${ports.map(([key, value]) => `${key}=${value}`).join(", ")}`,
        });
    }
    if (record.handbook?.authHost) {
        rows.push({
            key: "auth-host",
            text: `Auth host: ${record.handbook.authHost}`,
        });
    }
    return {
        badgeLabel: record.currentCheckout ? "Current" : null,
        badgeTone: record.currentCheckout ? "info" : null,
        empty: false,
        issueRows: record.issues.map(WorktreeStackKit_buildInkShellIssueRow),
        noIssuesText: "No issues",
        rows,
    };
}
/** Builds the combined global + selected-record issue panel model. */
export function WorktreeStackKit_buildInkShellCombinedIssuesModel(options) {
    const rows = [
        ...options.globalIssues.map(WorktreeStackKit_buildInkShellIssueRow),
        ...(options.selectedRecord?.issues ?? []).map(WorktreeStackKit_buildInkShellIssueRow),
    ];
    return {
        count: rows.length,
        rows,
        visible: rows.length > 0,
    };
}
/** Builds overview-column text and issue models. */
export function WorktreeStackKit_buildInkShellOverviewModel(options) {
    const actionTone = options.actionPlan
        ? WorktreeStackKit_getInkShellActionPlanTone(options.actionPlan)
        : null;
    return {
        badgeLabel: actionTone,
        badgeTone: actionTone,
        gettingStartedLines: [
            "Select a worktree, then choose an action to run",
            "Use arrow keys to navigate, Enter to configure",
        ],
        globalIssueRows: options.inventory.globalIssues.map(WorktreeStackKit_buildInkShellIssueRow),
        noGlobalIssuesText: "No issues",
        statLines: [
            `Standalone: ${options.inventory.summary.detachedRecords}`,
            `Active: ${options.inventory.summary.activeRealms} | Inactive: ${options.inventory.summary.inactiveRealms}`,
            `Stale: ${options.inventory.summary.staleRealms} | Healthy: ${options.inventory.summary.healthyRealms}`,
            `Unhealthy: ${options.inventory.summary.unhealthyRealms} | Last Check: ${options.inventory.summary.healthRunAt ?? "n/a"}`,
        ],
    };
}
/** Builds keyboard legend lines for shell focus state. */
export function WorktreeStackKit_buildInkShellLegendLines(options) {
    if (options.focusedColumn === "editor" &&
        options.selectedActionId === "create") {
        return options.createInteractionMode === "edit"
            ? ["Type to edit  Backspace to delete  Enter/Esc when done"]
            : [
                "Tab: Next panel  ↑/↓: Browse  E: Edit  Space: Toggle  Enter: Review  Esc: Back",
            ];
    }
    if (options.focusedColumn === "editor") {
        return ["Space: Toggle  Enter: Review  ←: Return  Esc: Back"];
    }
    return ["←/→: Columns  ↑/↓: Browse  Enter: Action  R: Refresh  Q: Quit"];
}
function WorktreeStackKit_getInkShellActionPlanTone(actionPlan) {
    return actionPlan.request ? "ready" : "blocked";
}
function WorktreeStackKit_getInkShellRecordStatus(record) {
    if (record.currentCheckout) {
        return { label: "Current", tone: "cyan" };
    }
    if (record.temporaryMerge) {
        return { label: "Temp", tone: "yellow" };
    }
    if (record.issues.length > 0) {
        return { label: "Needs Fix", tone: "red" };
    }
    return { label: "Ready", tone: "green" };
}
function WorktreeStackKit_formatInkShellBranch(branchRef, fallback) {
    return branchRef ? branchRef.replace("refs/heads/", "") : fallback;
}
function WorktreeStackKit_buildInkShellIssueRow(issue) {
    return {
        icon: WorktreeStackKit_getInkShellIssueIcon(issue.severity),
        key: `${issue.code}:${issue.message}`,
        message: issue.message,
        tone: WorktreeStackKit_getInkShellIssueTone(issue.severity),
    };
}
function WorktreeStackKit_getInkShellIssueTone(severity) {
    if (severity === "error") {
        return "red";
    }
    if (severity === "warning") {
        return "yellow";
    }
    return "gray";
}
function WorktreeStackKit_getInkShellIssueIcon(severity) {
    if (severity === "error") {
        return "✗";
    }
    if (severity === "warning") {
        return "!";
    }
    return "·";
}
//# sourceMappingURL=ink-shell-view-model.js.map