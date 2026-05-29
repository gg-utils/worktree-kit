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

import type { WorktreeStackKit_InkActionId } from "./ink-launch-options.js";

/** Severity values accepted from worktree discovery inventories. */
export type WorktreeStackKit_InkShellIssueSeverity =
  | "error"
  | "info"
  | "warning";

/** Minimal issue shape needed by Ink shell view-model helpers. */
export type WorktreeStackKit_InkShellIssueInput = {
  readonly code: string;
  readonly message: string;
  readonly severity: WorktreeStackKit_InkShellIssueSeverity;
};

/** Minimal metadata shape needed by Ink shell view-model helpers. */
export type WorktreeStackKit_InkShellRecordMetadataInput = {
  readonly ports: Readonly<Record<string, number>>;
  readonly realmSlug: string | null;
  readonly stackName: string | null;
};

/** Minimal handbook shape needed by Ink shell view-model helpers. */
export type WorktreeStackKit_InkShellRecordHandbookInput = {
  readonly authHost: string | null;
  readonly realmSlug: string | null;
  readonly stackName: string | null;
};

/** Minimal realm registry shape needed by Ink shell view-model helpers. */
export type WorktreeStackKit_InkShellRecordRealmInput = {
  readonly primaryMethod: string;
  readonly status: string;
};

/** Minimal health summary shape needed by Ink shell view-model helpers. */
export type WorktreeStackKit_InkShellRecordHealthInput = {
  readonly healthyProbeCount: number;
  readonly totalProbeCount: number;
};

/** Structural record contract consumed by package-owned Ink shell helpers. */
export type WorktreeStackKit_InkShellRecordInput = {
  readonly branchRef: string | null;
  readonly currentCheckout: boolean;
  readonly handbook: WorktreeStackKit_InkShellRecordHandbookInput | null;
  readonly handbookMarkdownExists: boolean;
  readonly healthSummary: WorktreeStackKit_InkShellRecordHealthInput | null;
  readonly issues: readonly WorktreeStackKit_InkShellIssueInput[];
  readonly label: string;
  readonly metadata: WorktreeStackKit_InkShellRecordMetadataInput | null;
  readonly realmRecord: WorktreeStackKit_InkShellRecordRealmInput | null;
  readonly temporaryMerge: boolean;
  readonly worktreePath: string;
};

/** Structural inventory summary contract consumed by package-owned Ink shell helpers. */
export type WorktreeStackKit_InkShellInventorySummaryInput = {
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

/** Structural inventory contract consumed by package-owned Ink shell helpers. */
export type WorktreeStackKit_InkShellInventoryInput = {
  readonly globalIssues: readonly WorktreeStackKit_InkShellIssueInput[];
  readonly records: readonly WorktreeStackKit_InkShellRecordInput[];
  readonly summary: WorktreeStackKit_InkShellInventorySummaryInput;
};

/** Minimal action definition shape used by Ink shell action lists. */
export type WorktreeStackKit_InkShellActionDefinitionInput = {
  readonly id: WorktreeStackKit_InkActionId;
  readonly label: string;
};

/** Minimal action plan shape used by Ink shell action lists and badges. */
export type WorktreeStackKit_InkShellActionPlanInput = {
  readonly request: { readonly command?: string } | null;
};

/** Text colors emitted by shell view models for Ink renderers. */
export type WorktreeStackKit_InkShellTextColor =
  | "cyan"
  | "gray"
  | "green"
  | "red"
  | "yellow";

/** Status badge tones emitted by shell view models for Ink renderers. */
export type WorktreeStackKit_InkShellStatusTone = "blocked" | "info" | "ready";

/** One row in the worktree list column. */
export type WorktreeStackKit_InkShellRecordRow = {
  readonly branchLabel: string;
  readonly branchTone: WorktreeStackKit_InkShellTextColor | null;
  readonly dimBranch: boolean;
  readonly key: string;
  readonly label: string;
  readonly labelTone: WorktreeStackKit_InkShellTextColor | null;
  readonly marker: "> " | "  ";
  readonly statusLabel: string;
  readonly statusTone: WorktreeStackKit_InkShellTextColor;
};

/** One row in the action list column. */
export type WorktreeStackKit_InkShellActionRow = {
  readonly key: string;
  readonly label: string;
  readonly marker: ">" | " ";
  readonly selected: boolean;
  readonly statusLabel: "Needs Setup" | "Ready";
  readonly statusTone: "blocked" | "ready";
};

/** Action list model including the synthetic Detail row. */
export type WorktreeStackKit_InkShellActionListModel = {
  readonly detailSelected: boolean;
  readonly rows: readonly WorktreeStackKit_InkShellActionRow[];
};

/** Selected-record detail row model. */
export type WorktreeStackKit_InkShellDetailRow = {
  readonly key: string;
  readonly text: string;
};

/** Detail panel model for a selected record, or an empty-state prompt. */
export type WorktreeStackKit_InkShellDetailModel =
  | { readonly empty: true; readonly prompt: string }
  | {
      readonly badgeLabel: "Current" | null;
      readonly badgeTone: "info" | null;
      readonly empty: false;
      readonly issueRows: readonly WorktreeStackKit_InkShellIssueRow[];
      readonly noIssuesText: string;
      readonly rows: readonly WorktreeStackKit_InkShellDetailRow[];
    };

/** Issue row model shared by overview and combined issue panels. */
export type WorktreeStackKit_InkShellIssueRow = {
  readonly icon: "!" | "✗" | "·";
  readonly key: string;
  readonly message: string;
  readonly tone: WorktreeStackKit_InkShellTextColor;
};

/** Combined global + selected-record issue panel model. */
export type WorktreeStackKit_InkShellCombinedIssuesModel = {
  readonly count: number;
  readonly rows: readonly WorktreeStackKit_InkShellIssueRow[];
  readonly visible: boolean;
};

/** Overview column model for summary stats and badge. */
export type WorktreeStackKit_InkShellOverviewModel = {
  readonly badgeLabel: string | null;
  readonly badgeTone: WorktreeStackKit_InkShellStatusTone | null;
  readonly globalIssueRows: readonly WorktreeStackKit_InkShellIssueRow[];
  readonly gettingStartedLines: readonly string[];
  readonly noGlobalIssuesText: string;
  readonly statLines: readonly string[];
};

/** Shell focus column values used by package-owned legend helpers. */
export type WorktreeStackKit_InkShellFocusedColumn =
  | "actions"
  | "editor"
  | "records";

/** Create interaction modes used by package-owned legend helpers. */
export type WorktreeStackKit_InkShellCreateInteractionMode = "browse" | "edit";

/** Header summary line for the top of the Ink shell. */
export function WorktreeStackKit_buildInkShellHeaderSummary(options: {
  readonly summary: WorktreeStackKit_InkShellInventorySummaryInput;
}): string {
  return `Worktrees: ${options.summary.totalRecords} | Ready: ${options.summary.managedRecords} | Issues: ${options.summary.brokenRecords}`;
}

/** Returns the selected record, or `null` when index state is incomplete. */
export function WorktreeStackKit_getInkShellSelectedRecord<
  RecordType,
>(options: {
  readonly records: readonly RecordType[];
  readonly selectedIndex: number;
}): RecordType | null {
  return options.records[options.selectedIndex] ?? null;
}

/** Builds worktree list rows with selected-state markers, branch labels, and status colors. */
export function WorktreeStackKit_buildInkShellRecordRows(options: {
  readonly records: readonly WorktreeStackKit_InkShellRecordInput[];
  readonly selectedIndex: number;
}): WorktreeStackKit_InkShellRecordRow[] {
  return options.records.map((record, index) => {
    const selected = index === options.selectedIndex;
    const status = WorktreeStackKit_getInkShellRecordStatus(record);
    return {
      branchLabel: WorktreeStackKit_formatInkShellBranch(
        record.branchRef,
        "detached",
      ),
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
export function WorktreeStackKit_buildInkShellActionListModel(options: {
  readonly actionDefinitions: readonly WorktreeStackKit_InkShellActionDefinitionInput[];
  readonly actionPlans: readonly (
    | WorktreeStackKit_InkShellActionPlanInput
    | undefined
  )[];
  readonly selectedActionIndex: number;
}): WorktreeStackKit_InkShellActionListModel {
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
export function WorktreeStackKit_buildInkShellDetailModel(options: {
  readonly record: WorktreeStackKit_InkShellRecordInput | null;
}): WorktreeStackKit_InkShellDetailModel {
  const { record } = options;
  if (!record) {
    return { empty: true, prompt: "Select a worktree to view details" };
  }

  const rows: WorktreeStackKit_InkShellDetailRow[] = [
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
      text: `Realm: ${
        record.realmRecord
          ? `${record.realmRecord.status} (${record.realmRecord.primaryMethod})`
          : "Not registered"
      }`,
    },
    {
      key: "health",
      text: `Health: ${
        record.healthSummary
          ? `${record.healthSummary.healthyProbeCount}/${record.healthSummary.totalProbeCount} healthy`
          : "No health data"
      }`,
    },
    {
      key: "config",
      text: `Config: ${record.metadata ? "Found" : "Missing"} | Handbook: ${
        record.handbook ? "Found" : "Missing"
      }`,
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
export function WorktreeStackKit_buildInkShellCombinedIssuesModel(options: {
  readonly globalIssues: readonly WorktreeStackKit_InkShellIssueInput[];
  readonly selectedRecord: WorktreeStackKit_InkShellRecordInput | null;
}): WorktreeStackKit_InkShellCombinedIssuesModel {
  const rows = [
    ...options.globalIssues.map(WorktreeStackKit_buildInkShellIssueRow),
    ...(options.selectedRecord?.issues ?? []).map(
      WorktreeStackKit_buildInkShellIssueRow,
    ),
  ];
  return {
    count: rows.length,
    rows,
    visible: rows.length > 0,
  };
}

/** Builds overview-column text and issue models. */
export function WorktreeStackKit_buildInkShellOverviewModel(options: {
  readonly actionPlan:
    | WorktreeStackKit_InkShellActionPlanInput
    | null
    | undefined;
  readonly inventory: WorktreeStackKit_InkShellInventoryInput;
}): WorktreeStackKit_InkShellOverviewModel {
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
    globalIssueRows: options.inventory.globalIssues.map(
      WorktreeStackKit_buildInkShellIssueRow,
    ),
    noGlobalIssuesText: "No issues",
    statLines: [
      `Standalone: ${options.inventory.summary.detachedRecords}`,
      `Active: ${options.inventory.summary.activeRealms} | Inactive: ${options.inventory.summary.inactiveRealms}`,
      `Stale: ${options.inventory.summary.staleRealms} | Healthy: ${options.inventory.summary.healthyRealms}`,
      `Unhealthy: ${options.inventory.summary.unhealthyRealms} | Last Check: ${
        options.inventory.summary.healthRunAt ?? "n/a"
      }`,
    ],
  };
}

/** Builds keyboard legend lines for shell focus state. */
export function WorktreeStackKit_buildInkShellLegendLines(options: {
  readonly createInteractionMode: WorktreeStackKit_InkShellCreateInteractionMode;
  readonly focusedColumn: WorktreeStackKit_InkShellFocusedColumn;
  readonly selectedActionId: WorktreeStackKit_InkActionId | null;
}): string[] {
  if (
    options.focusedColumn === "editor" &&
    options.selectedActionId === "create"
  ) {
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

function WorktreeStackKit_getInkShellActionPlanTone(
  actionPlan: WorktreeStackKit_InkShellActionPlanInput,
): "blocked" | "ready" {
  return actionPlan.request ? "ready" : "blocked";
}

function WorktreeStackKit_getInkShellRecordStatus(
  record: WorktreeStackKit_InkShellRecordInput,
): {
  readonly label: string;
  readonly tone: WorktreeStackKit_InkShellTextColor;
} {
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

function WorktreeStackKit_formatInkShellBranch(
  branchRef: string | null,
  fallback: string,
): string {
  return branchRef ? branchRef.replace("refs/heads/", "") : fallback;
}

function WorktreeStackKit_buildInkShellIssueRow(
  issue: WorktreeStackKit_InkShellIssueInput,
): WorktreeStackKit_InkShellIssueRow {
  return {
    icon: WorktreeStackKit_getInkShellIssueIcon(issue.severity),
    key: `${issue.code}:${issue.message}`,
    message: issue.message,
    tone: WorktreeStackKit_getInkShellIssueTone(issue.severity),
  };
}

function WorktreeStackKit_getInkShellIssueTone(
  severity: WorktreeStackKit_InkShellIssueSeverity,
): WorktreeStackKit_InkShellTextColor {
  if (severity === "error") {
    return "red";
  }
  if (severity === "warning") {
    return "yellow";
  }
  return "gray";
}

function WorktreeStackKit_getInkShellIssueIcon(
  severity: WorktreeStackKit_InkShellIssueSeverity,
): "!" | "✗" | "·" {
  if (severity === "error") {
    return "✗";
  }
  if (severity === "warning") {
    return "!";
  }
  return "·";
}
