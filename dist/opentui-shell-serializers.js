/**
 * @fileoverview Plaintext serializers for worktree OpenTUI shell clipboard exports.
 *
 * Package-owned serializers keep record/action/issue formatting reusable while script adapters keep
 * host clipboard side effects. The functions accept structural inventory records so callers can use
 * richer project discovery models without importing root scripts into the package.
 *
 * @testing CLI: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI app shell that imports the worktree list, actions, and record-detail serializers for clipboard copy actions.
 * @see packages/worktree-kit/src/opentui-app-shell-panels.tsx - Issues panel surface that imports only the merged global and per-record issues serializer for clipboard copy from the diagnostics column.
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.ts - Menu option builder whose availability inputs gate the plaintext actions catalog produced here.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - Inventory, record, and issue input contracts every serializer entrypoint accepts without pulling root scripts into the package.
 * @see packages/worktree-kit/src/opentui-shell-serializers.unit.test.ts - Node (tsx) unit coverage for list, record-detail, actions, and issues plaintext formatting.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { WorktreeStackKit_buildOpenTuiMenuOptions, } from "./opentui-shell-menu-actions.js";
/** Builds a numbered plaintext list of discovered worktrees for clipboard export. */
export function WorktreeStackKit_serializeOpenTuiWorktreesList(options) {
    if (!options.inventory) {
        return "Loading worktree discovery…";
    }
    if (options.inventory.records.length === 0) {
        return "No worktrees found.";
    }
    return options.inventory.records
        .map((record, index) => {
        const branch = WorktreeStackKit_formatOpenTuiBranchForClipboard(record.branchRef);
        const name = record.metadata?.stackName ??
            record.handbook?.stackName ??
            record.label;
        const status = WorktreeStackKit_formatOpenTuiRecordStatusForClipboard({
            record,
        });
        const slot = record.metadata?.slot != null ? `slot ${record.metadata.slot}` : "";
        return `${index + 1}. ${name}  ${[status, slot, branch]
            .filter((part) => part.length > 0)
            .join("  ")}`;
    })
        .join("\n");
}
/** Renders the selected worktree's paths, metadata, registry, and health lines as plaintext. */
export function WorktreeStackKit_serializeOpenTuiRecordDetail(options) {
    const { record } = options;
    if (!record) {
        return "No worktree selected.";
    }
    const metadata = record.metadata;
    const handbook = record.handbook;
    const registryInfo = record.realmRecord
        ? `${record.realmRecord.status} (${record.realmRecord.primaryMethod})`
        : "not registered";
    const healthInfo = record.healthSummary
        ? `${record.healthSummary.healthyProbeCount}/${record.healthSummary.totalProbeCount} probes healthy`
        : "no health data";
    const lines = [
        record.worktreePath,
        `Branch: ${WorktreeStackKit_formatOpenTuiBranchForClipboard(record.branchRef)}`,
        `Stack: ${metadata?.stackName ?? handbook?.stackName ?? "(unknown)"}`,
        `Realm: ${metadata?.realmSlug ?? handbook?.realmSlug ?? "(none)"}`,
        `Registry: ${registryInfo}`,
        `Health: ${healthInfo}`,
    ];
    const ports = Object.entries(metadata?.ports ?? {});
    if (ports.length > 0) {
        lines.push(`Ports: ${ports.map(([key, value]) => `${key}=${value}`).join(", ")}`);
    }
    if (handbook?.authHost) {
        lines.push(`Auth host: ${handbook.authHost}`);
    }
    lines.push(`Meta: ${record.metadata ? "✓" : "✗"} | HB: ${record.handbook ? "✓" : "✗"} | MD: ${record.handbookMarkdownExists ? "✓" : "✗"}`);
    return lines.join("\n");
}
/** Builds a newline-separated catalog of enabled actions for clipboard export. */
export function WorktreeStackKit_serializeOpenTuiActions(options) {
    return WorktreeStackKit_buildOpenTuiMenuOptions({
        availability: WorktreeStackKit_buildOpenTuiMenuAvailability({
            inventory: options.inventory,
            selectedRecord: options.selectedRecord,
        }),
    })
        .map((option) => `${option.name} — ${option.description}`)
        .join("\n");
}
/** Serializes global and per-record discovery issues for clipboard export. */
export function WorktreeStackKit_serializeOpenTuiIssues(options) {
    const lines = [];
    if (options.globalIssues.length > 0) {
        lines.push("Global:");
        options.globalIssues.forEach((issue) => lines.push(`  - ${issue.message}`));
    }
    if (options.recordIssues.length > 0) {
        lines.push(`${options.label}:`);
        options.recordIssues.forEach((issue) => lines.push(`  - ${issue.message}`));
    }
    return lines.join("\n");
}
function WorktreeStackKit_buildOpenTuiMenuAvailability(options) {
    return {
        hasRealms: (options.inventory?.summary.activeRealms ?? 0) +
            (options.inventory?.summary.inactiveRealms ?? 0) >
            0,
        hasRecords: (options.inventory?.records.length ?? 0) > 0,
        hasSelectedRecord: options.selectedRecord != null,
    };
}
function WorktreeStackKit_formatOpenTuiBranchForClipboard(branchRef) {
    return branchRef ? branchRef.replace("refs/heads/", "") : "detached";
}
function WorktreeStackKit_formatOpenTuiRecordStatusForClipboard(options) {
    if (options.record.issues.length > 0) {
        return "⚠ Issues";
    }
    if (options.record.currentCheckout) {
        return "● Current";
    }
    if (options.record.temporaryMerge) {
        return "⇄ Merge";
    }
    return "";
}
//# sourceMappingURL=opentui-shell-serializers.js.map