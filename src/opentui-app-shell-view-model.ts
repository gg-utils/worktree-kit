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

import type {
  WorktreeStackKit_OpenTuiCopyFlash,
  WorktreeStackKit_OpenTuiFlow,
} from "./opentui-shell-contracts.js";

/** Severity values accepted from worktree discovery inventories. */
export type WorktreeStackKit_OpenTuiIssueSeverity =
  | "error"
  | "info"
  | "warning";

/** Minimal issue shape needed by OpenTUI shell view-model helpers. */
export type WorktreeStackKit_OpenTuiIssueInput = {
  readonly code: string;
  readonly message: string;
  readonly severity: WorktreeStackKit_OpenTuiIssueSeverity;
};

/** Minimal metadata shape needed by OpenTUI shell view-model helpers. */
export type WorktreeStackKit_OpenTuiRecordMetadataInput = {
  readonly ports: Readonly<Record<string, number>>;
  readonly realmSlug: string | null;
  readonly slot: number | null;
  readonly stackName: string | null;
};

/** Minimal handbook shape needed by OpenTUI shell view-model helpers. */
export type WorktreeStackKit_OpenTuiRecordHandbookInput = {
  readonly authHost: string | null;
  readonly realmSlug: string | null;
  readonly stackName: string | null;
};

/** Minimal realm registry shape needed by OpenTUI shell view-model helpers. */
export type WorktreeStackKit_OpenTuiRecordRealmInput = {
  readonly primaryMethod: string;
  readonly status: string;
};

/** Minimal health summary shape needed by OpenTUI shell view-model helpers. */
export type WorktreeStackKit_OpenTuiRecordHealthInput = {
  readonly healthyProbeCount: number;
  readonly totalProbeCount: number;
};

/** Structural record contract consumed by package-owned OpenTUI view-model helpers. */
export type WorktreeStackKit_OpenTuiRecordInput = {
  readonly branchRef: string | null;
  readonly currentCheckout: boolean;
  readonly handbook: WorktreeStackKit_OpenTuiRecordHandbookInput | null;
  readonly handbookMarkdownExists: boolean;
  readonly healthSummary: WorktreeStackKit_OpenTuiRecordHealthInput | null;
  readonly issues: readonly WorktreeStackKit_OpenTuiIssueInput[];
  readonly label: string;
  readonly metadata: WorktreeStackKit_OpenTuiRecordMetadataInput | null;
  readonly realmRecord: WorktreeStackKit_OpenTuiRecordRealmInput | null;
  readonly temporaryMerge: boolean;
  readonly worktreePath: string;
};

/** Structural summary contract consumed by package-owned OpenTUI header helpers. */
export type WorktreeStackKit_OpenTuiInventorySummaryInput = {
  readonly activeRealms: number;
  readonly brokenRecords: number;
  readonly detachedRecords: number;
  readonly healthRunAt: string | null;
  readonly healthyRealms: number;
  readonly inactiveRealms: number;
  readonly managedRecords: number;
  readonly staleRealms: number;
  readonly totalRecords: number;
  readonly unhealthyRealms: number;
};

/** Structural inventory contract consumed by package-owned OpenTUI view-model helpers. */
export type WorktreeStackKit_OpenTuiInventoryInput = {
  readonly globalIssues: readonly WorktreeStackKit_OpenTuiIssueInput[];
  readonly records: readonly WorktreeStackKit_OpenTuiRecordInput[];
  readonly summary: WorktreeStackKit_OpenTuiInventorySummaryInput;
};

/** Header text model for the top of the OpenTUI app shell. */
export type WorktreeStackKit_OpenTuiInventoryHeaderModel =
  | { readonly loaded: false; readonly loadingText: string }
  | {
      readonly loaded: true;
      readonly recordsLine: string;
      readonly realmsLine: string;
    };

/** Detail row rendered by the right-column menu-state detail panel. */
export type WorktreeStackKit_OpenTuiDetailRow =
  | { readonly kind: "path"; readonly value: string }
  | { readonly kind: "field"; readonly label: string; readonly value: string }
  | { readonly kind: "meta"; readonly value: string };

/** Issue row rendered in the issues panel. */
export type WorktreeStackKit_OpenTuiIssueRow = {
  readonly key: string;
  readonly message: string;
  readonly tone: WorktreeStackKit_OpenTuiTextTone;
};

/** Issues panel model for global and selected-record issue groups. */
export type WorktreeStackKit_OpenTuiIssuePanelModel = {
  readonly globalRows: readonly WorktreeStackKit_OpenTuiIssueRow[];
  readonly hasIssues: boolean;
  readonly recordLabel: string;
  readonly recordRows: readonly WorktreeStackKit_OpenTuiIssueRow[];
};

/** Footer control model rendered at the bottom of the OpenTUI app shell. */
export type WorktreeStackKit_OpenTuiFooterControl = {
  readonly background: WorktreeStackKit_OpenTuiTextTone;
  readonly foreground: WorktreeStackKit_OpenTuiTextTone;
  readonly keyLabel: string;
  readonly text: string;
};

/** Color/tone names shared by package view models and script-side renderers. */
export type WorktreeStackKit_OpenTuiTextTone =
  | "black"
  | "blue"
  | "cyan"
  | "gray"
  | "green"
  | "magenta"
  | "red"
  | "white"
  | "yellow";

/** Returns the selected record, or `null` when inventory/index state is incomplete. */
export function WorktreeStackKit_getOpenTuiSelectedRecord<RecordType>(options: {
  readonly recordPickIndex: number;
  readonly records: readonly RecordType[] | null | undefined;
}): RecordType | null {
  return options.records?.[options.recordPickIndex] ?? null;
}

/** Resolves the selected worktree path from records or a manual override. */
export function WorktreeStackKit_resolveOpenTuiSelectedWorktreePath<
  RecordType extends { readonly worktreePath: string },
>(options: {
  readonly manualWorktreePath: string;
  readonly recordPickIndex: number;
  readonly records: readonly RecordType[] | null | undefined;
}): string | null {
  if (!options.records || options.records.length === 0) {
    const trimmed = options.manualWorktreePath.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return options.records[options.recordPickIndex]?.worktreePath ?? null;
}

/** Formats a one-line stack/slot/realm summary for worktree picker rows and previews. */
export function WorktreeStackKit_formatOpenTuiRecordSummary(
  record: WorktreeStackKit_OpenTuiRecordInput,
): string {
  const stack =
    record.metadata?.stackName ?? record.handbook?.stackName ?? record.label;
  const realm = record.metadata?.realmSlug ?? record.handbook?.realmSlug ?? "?";
  const slot =
    record.metadata?.slot != null ? String(record.metadata.slot) : "?";
  return `${stack} | slot ${slot} | realm ${realm}`;
}

/** Builds header lines for loaded or still-loading inventories. */
export function WorktreeStackKit_buildOpenTuiInventoryHeaderModel(options: {
  readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
}): WorktreeStackKit_OpenTuiInventoryHeaderModel {
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
    realmsLine:
      [
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
export function WorktreeStackKit_buildOpenTuiDetailRows(options: {
  readonly record: WorktreeStackKit_OpenTuiRecordInput | null | undefined;
}): WorktreeStackKit_OpenTuiDetailRow[] {
  const { record } = options;
  if (!record) {
    return [];
  }

  const ports = Object.entries(record.metadata?.ports ?? {});
  const rows: WorktreeStackKit_OpenTuiDetailRow[] = [
    { kind: "path", value: record.worktreePath },
    {
      kind: "field",
      label: "Branch:",
      value: WorktreeStackKit_formatBranch(record.branchRef),
    },
    {
      kind: "field",
      label: "Stack:",
      value:
        record.metadata?.stackName ?? record.handbook?.stackName ?? "(unknown)",
    },
    {
      kind: "field",
      label: "Realm:",
      value:
        record.metadata?.realmSlug ?? record.handbook?.realmSlug ?? "(none)",
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
    value: `Meta: ${record.metadata ? "✓" : "✗"} | HB: ${
      record.handbook ? "✓" : "✗"
    } | MD: ${record.handbookMarkdownExists ? "✓" : "✗"}`,
  });
  return rows;
}

/** Builds grouped issue rows for the issues panel. */
export function WorktreeStackKit_buildOpenTuiIssuePanelModel(options: {
  readonly globalIssues: readonly WorktreeStackKit_OpenTuiIssueInput[];
  readonly record: WorktreeStackKit_OpenTuiRecordInput | null | undefined;
}): WorktreeStackKit_OpenTuiIssuePanelModel {
  const recordIssues = options.record?.issues ?? [];
  return {
    globalRows: options.globalIssues.map((issue) =>
      WorktreeStackKit_buildOpenTuiIssueRow({ issue, prefix: "g" }),
    ),
    hasIssues: options.globalIssues.length > 0 || recordIssues.length > 0,
    recordLabel: options.record?.label ?? "Selected",
    recordRows: recordIssues.map((issue) =>
      WorktreeStackKit_buildOpenTuiIssueRow({ issue, prefix: "r" }),
    ),
  };
}

/** Label used by clickable copy affordances. */
export function WorktreeStackKit_formatOpenTuiCopyLabel(options: {
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>;
}): string {
  return options.copyFlash === options.panel ? "[✓ Copied]" : "[📋 Copy]";
}

/** Tone used by clickable copy affordances. */
export function WorktreeStackKit_getOpenTuiCopyTone(options: {
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>;
}): WorktreeStackKit_OpenTuiTextTone {
  return options.copyFlash === options.panel ? "green" : "gray";
}

/** Footer controls shown at the bottom of the OpenTUI app shell. */
export function WorktreeStackKit_buildOpenTuiFooterControls(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
}): WorktreeStackKit_OpenTuiFooterControl[] {
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

function WorktreeStackKit_buildOpenTuiIssueRow(options: {
  readonly issue: WorktreeStackKit_OpenTuiIssueInput;
  readonly prefix: "g" | "r";
}): WorktreeStackKit_OpenTuiIssueRow {
  return {
    key: `${options.prefix}:${options.issue.code}:${options.issue.message}`,
    message: options.issue.message,
    tone: WorktreeStackKit_getOpenTuiIssueTone(options.issue.severity),
  };
}

function WorktreeStackKit_getOpenTuiIssueTone(
  severity: WorktreeStackKit_OpenTuiIssueSeverity,
): WorktreeStackKit_OpenTuiTextTone {
  if (severity === "error") {
    return "red";
  }
  if (severity === "warning") {
    return "yellow";
  }
  return "gray";
}

function WorktreeStackKit_formatBranch(branchRef: string | null): string {
  return branchRef ? branchRef.replace("refs/heads/", "") : "detached";
}
