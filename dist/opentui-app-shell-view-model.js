/**
 * @fileoverview Pure view-model helpers for worktree OpenTUI app shells.
 *
 * Script adapters keep React/OpenTUI rendering, clipboard I/O, inventory loading, and subprocess
 * dispatch. This package module owns structural record summaries, selected-record/path resolution,
 * header/detail/issue/footer text models, and small label helpers that are reusable across terminal
 * shells without depending on this repository's script paths.
 *
 * @testing Node test runner via tsx: cd packages/worktree-kit && npm run test -- src/opentui-app-shell-view-model.unit.test.ts
 * @testing Node test runner via tsx: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Defines `WorktreeStackKit_OpenTuiFlow` and copy-flash types imported here for footer controls and copy-affordance tone/label helpers.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Package OpenTUI shell component that maps inventory and selection state into header, detail, issue, and footer models using the pure builders exported from this module.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - Controller surface that coordinates worktree inventory/action flows and supplies the structural record inputs these view-model helpers format for the shell.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.unit.test.ts - Node `node:test` suite via tsx that locks header/detail/issue/footer builder behavior and record-summary formatting against the contracts owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Returns the selected record, or `null` when inventory/index state is incomplete. */
export function WorktreeStackKit_getOpenTuiSelectedRecord(options) {
    return options.records?.[options.recordPickIndex] ?? null;
}
/** Resolves the selected worktree path from records or a manual override. */
export function WorktreeStackKit_resolveOpenTuiSelectedWorktreePath(options) {
    if (!options.records || options.records.length === 0) {
        const trimmed = options.manualWorktreePath.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return options.records[options.recordPickIndex]?.worktreePath ?? null;
}
/** Formats a one-line stack/slot/realm summary for worktree picker rows and previews. */
export function WorktreeStackKit_formatOpenTuiRecordSummary(record) {
    const stack = record.metadata?.stackName ?? record.handbook?.stackName ?? record.label;
    const realm = record.metadata?.realmSlug ?? record.handbook?.realmSlug ?? "?";
    const slot = record.metadata?.slot != null ? String(record.metadata.slot) : "?";
    return `${stack} | slot ${slot} | realm ${realm}`;
}
/** Builds header lines for loaded or still-loading inventories. */
export function WorktreeStackKit_buildOpenTuiInventoryHeaderModel(options) {
    if (!options.inventory) {
        return { loaded: false, loadingText: "Loading inventory..." };
    }
    const { summary } = options.inventory;
    return {
        loaded: true,
        recordsLine: [
            `Records: ${summary.totalRecords}`,
            `Managed: ${summary.managedRecords}`,
            `Broken: ${summary.brokenRecords}`,
            `Detached: ${summary.detachedRecords}`,
        ].join(" | "),
        realmsLine: [
            `Realms: active ${summary.activeRealms}`,
            `inactive ${summary.inactiveRealms}`,
            `stale ${summary.staleRealms}`,
            `healthy ${summary.healthyRealms}`,
            `unhealthy ${summary.unhealthyRealms}`,
        ].join(" | ") +
            (summary.healthRunAt ? ` | run ${summary.healthRunAt}` : ""),
    };
}
/** Builds detail rows for the selected worktree detail panel. */
export function WorktreeStackKit_buildOpenTuiDetailRows(options) {
    const { record } = options;
    if (!record) {
        return [];
    }
    const ports = Object.entries(record.metadata?.ports ?? {});
    const rows = [
        { kind: "path", value: record.worktreePath },
        {
            kind: "field",
            label: "Branch:",
            value: WorktreeStackKit_formatBranch(record.branchRef),
        },
        {
            kind: "field",
            label: "Stack:",
            value: record.metadata?.stackName ?? record.handbook?.stackName ?? "(unknown)",
        },
        {
            kind: "field",
            label: "Realm:",
            value: record.metadata?.realmSlug ?? record.handbook?.realmSlug ?? "(none)",
        },
        {
            kind: "field",
            label: "Registry:",
            value: record.realmRecord
                ? `${record.realmRecord.status} (${record.realmRecord.primaryMethod})`
                : "not registered",
        },
        {
            kind: "field",
            label: "Health:",
            value: record.healthSummary
                ? `${record.healthSummary.healthyProbeCount}/${record.healthSummary.totalProbeCount} probes healthy`
                : "no health data",
        },
    ];
    if (ports.length > 0) {
        rows.push({
            kind: "field",
            label: "Ports:",
            value: ports.map(([key, value]) => `${key}=${value}`).join(", "),
        });
    }
    if (record.handbook?.authHost) {
        rows.push({
            kind: "field",
            label: "Auth host:",
            value: record.handbook.authHost,
        });
    }
    rows.push({
        kind: "meta",
        value: `Meta: ${record.metadata ? "✓" : "✗"} | HB: ${record.handbook ? "✓" : "✗"} | MD: ${record.handbookMarkdownExists ? "✓" : "✗"}`,
    });
    return rows;
}
/** Builds grouped issue rows for the issues panel. */
export function WorktreeStackKit_buildOpenTuiIssuePanelModel(options) {
    const recordIssues = options.record?.issues ?? [];
    return {
        globalRows: options.globalIssues.map((issue) => WorktreeStackKit_buildOpenTuiIssueRow({ issue, prefix: "g" })),
        hasIssues: options.globalIssues.length > 0 || recordIssues.length > 0,
        recordLabel: options.record?.label ?? "Selected",
        recordRows: recordIssues.map((issue) => WorktreeStackKit_buildOpenTuiIssueRow({ issue, prefix: "r" })),
    };
}
/** Label used by clickable copy affordances. */
export function WorktreeStackKit_formatOpenTuiCopyLabel(options) {
    return options.copyFlash === options.panel ? "[✓ Copied]" : "[📋 Copy]";
}
/** Tone used by clickable copy affordances. */
export function WorktreeStackKit_getOpenTuiCopyTone(options) {
    return options.copyFlash === options.panel ? "green" : "gray";
}
/** Footer controls shown at the bottom of the OpenTUI app shell. */
export function WorktreeStackKit_buildOpenTuiFooterControls(options) {
    return [
        {
            background: "blue",
            foreground: "white",
            keyLabel: "←/→",
            text: options.flow === "menu" ? "Switch Column" : "Locked",
        },
        {
            background: "cyan",
            foreground: "black",
            keyLabel: "↑/↓",
            text: "Navigate",
        },
        {
            background: "green",
            foreground: "black",
            keyLabel: "Enter",
            text: "Select",
        },
        {
            background: "magenta",
            foreground: "white",
            keyLabel: "C",
            text: "Copy Panel",
        },
        {
            background: "yellow",
            foreground: "black",
            keyLabel: "Esc",
            text: options.flow === "menu" ? "—" : "Back to Menu",
        },
        {
            background: "red",
            foreground: "white",
            keyLabel: "Ctrl+C",
            text: "Quit",
        },
    ];
}
function WorktreeStackKit_buildOpenTuiIssueRow(options) {
    return {
        key: `${options.prefix}:${options.issue.code}:${options.issue.message}`,
        message: options.issue.message,
        tone: WorktreeStackKit_getOpenTuiIssueTone(options.issue.severity),
    };
}
function WorktreeStackKit_getOpenTuiIssueTone(severity) {
    if (severity === "error") {
        return "red";
    }
    if (severity === "warning") {
        return "yellow";
    }
    return "gray";
}
function WorktreeStackKit_formatBranch(branchRef) {
    return branchRef ? branchRef.replace("refs/heads/", "") : "detached";
}
//# sourceMappingURL=opentui-app-shell-view-model.js.map