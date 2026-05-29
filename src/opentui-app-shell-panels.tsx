/**
 * @fileoverview Package-owned OpenTUI app-shell renderers for worktree discovery chrome.
 *
 * Project adapters pass inventory records, copy side-effect callbacks, and focused-column state;
 * this module owns product-neutral header, discovery-list, detail, issue, and footer rendering over
 * package-owned OpenTUI view models and serializers.
 * Flow: inventory + selection props -> panel components -> OpenTUI elements and copy serialization hooks.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_OpenTuiShellHeader } from "./opentui-app-shell-panels.js";
 *
 * export function Example() {
 *   return <WorktreeStackKit_OpenTuiShellHeader inventory={null} />;
 * }
 * ```
 *
 * @testing CLI: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-app-shell-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Three-column OpenTUI worktree shell that imports these panel renderers for header, discovery column, detail, issues, and footer chrome.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - View-model builders that shape inventory header text, detail rows, issue rows, and footer key hints consumed by the components in this file.
 * @see packages/worktree-kit/src/opentui-shell-serializers.ts - Clipboard serializers invoked when the issues panel copies merged global and per-record diagnostics text.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { TabSelectRenderable } from "@opentui/core";

import {
  WorktreeStackKit_buildOpenTuiDetailRows,
  WorktreeStackKit_buildOpenTuiFooterControls,
  WorktreeStackKit_buildOpenTuiInventoryHeaderModel,
  WorktreeStackKit_buildOpenTuiIssuePanelModel,
  WorktreeStackKit_formatOpenTuiCopyLabel,
  WorktreeStackKit_getOpenTuiCopyTone,
  type WorktreeStackKit_OpenTuiInventoryInput,
  type WorktreeStackKit_OpenTuiIssueInput,
  type WorktreeStackKit_OpenTuiRecordInput,
} from "./opentui-app-shell-view-model.js";
import {
  WorktreeStackKit_serializeOpenTuiIssues,
} from "./opentui-shell-serializers.js";
import type {
  WorktreeStackKit_OpenTuiCopyFlash,
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiMenuColumn,
} from "./opentui-shell-contracts.js";

/** Renders title, subtitle, and loaded inventory summary counts. */
export function WorktreeStackKit_OpenTuiShellHeader(props: {
  readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
}) {
  const headerModel = WorktreeStackKit_buildOpenTuiInventoryHeaderModel({
    inventory: props.inventory,
  });

  return (
    <box style={{ flexDirection: "column", paddingBottom: 1 }}>
      <text fg="green">
        <b>Worktree OpenTUI</b>
      </text>
      <text fg="gray">
        Additive discovery and action shell for prepared worktrees and shared
        local-edge state.
      </text>
      {headerModel.loaded ? (
        <>
          <text>
            <b>{headerModel.recordsLine}</b>
          </text>
          <text fg="gray">{headerModel.realmsLine}</text>
        </>
      ) : (
        <text>{headerModel.loadingText}</text>
      )}
    </box>
  );
}

/** Renders the worktrees column body for loading, empty, warning, and inventory states. */
export function WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody(options: {
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
  readonly inventoryLoadError: string | null;
  readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
  readonly worktreesTabRef: MutableRefObject<TabSelectRenderable | null>;
}) {
  if (options.inventoryLoadError) {
    return <text fg="red">Discovery warning: {options.inventoryLoadError}</text>;
  }
  if (!options.inventory) {
    return <text>Loading worktree discovery…</text>;
  }
  if (options.inventory.records.length === 0) {
    return <text fg="gray">No worktrees found.</text>;
  }

  return (
    <tab-select
      ref={options.worktreesTabRef}
      focused={options.focusedColumn === "worktrees"}
      selectedBackgroundColor="green"
      selectedTextColor="black"
      focusedBackgroundColor="#1a3a1a"
      options={options.inventory.records.map((record, index) =>
        WorktreeStackKit_buildOpenTuiDiscoveryOption({ index, record }),
      )}
      onChange={(index) => {
        WorktreeStackKit_updateRecordPickIndex({
          index,
          setRecordPickIndex: options.setRecordPickIndex,
        });
      }}
      onSelect={(index) => {
        WorktreeStackKit_updateRecordPickIndex({
          index,
          setRecordPickIndex: options.setRecordPickIndex,
        });
      }}
    />
  );
}

/** Renders selected worktree path, branch, metadata, registry, health, and presence flags. */
export function WorktreeStackKit_OpenTuiDetailPanel(props: {
  readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
}) {
  const detailRows = WorktreeStackKit_buildOpenTuiDetailRows({
    record: props.selectedRecord,
  });
  if (detailRows.length === 0) {
    return <text fg="gray">Select a worktree to view details.</text>;
  }

  return (
    <>
      {detailRows.map((row) => {
        if (row.kind === "path") {
          return (
            <text fg="gray" key={`path:${row.value}`}>
              {row.value}
            </text>
          );
        }
        if (row.kind === "meta") {
          return (
            <text fg="gray" key={`meta:${row.value}`}>
              {row.value}
            </text>
          );
        }
        return (
          <box style={{ flexDirection: "row", gap: 1 }} key={row.label}>
            <text>
              <b>{row.label}</b>
            </text>
            <text fg="gray">{row.value}</text>
          </box>
        );
      })}
    </>
  );
}

/** Renders global and selected-record issues when either group is non-empty. */
export function WorktreeStackKit_OpenTuiIssuesPanel(props: {
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly globalIssues: readonly WorktreeStackKit_OpenTuiIssueInput[];
  readonly handleCopy: (
    panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>,
    text: string,
  ) => void;
  readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
}) {
  const issueModel = WorktreeStackKit_buildOpenTuiIssuePanelModel({
    globalIssues: props.globalIssues,
    record: props.selectedRecord,
  });
  if (!issueModel.hasIssues) {
    return null;
  }

  return (
    <box
      style={{ flexDirection: "column", padding: 1, width: "35%" }}
      border={true}
      borderStyle="single"
      borderColor="red"
      title="Issues"
    >
      <box
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: 1,
        }}
      >
        <text
          fg={WorktreeStackKit_getOpenTuiCopyTone({
            copyFlash: props.copyFlash,
            panel: "issues",
          })}
          onMouseDown={() =>
            props.handleCopy(
              "issues",
              WorktreeStackKit_serializeOpenTuiIssues({
                globalIssues: props.globalIssues,
                label: props.selectedRecord?.label ?? "Selected",
                recordIssues: props.selectedRecord?.issues ?? [],
              }),
            )
          }
        >
          {WorktreeStackKit_formatOpenTuiCopyLabel({
            copyFlash: props.copyFlash,
            panel: "issues",
          })}
        </text>
      </box>
      {issueModel.globalRows.length > 0 && (
        <>
          <text fg="yellow">
            <b>Global</b>
          </text>
          {issueModel.globalRows.map((issue) => (
            <text fg={issue.tone} key={issue.key}>
              {" "}
              - {issue.message}
            </text>
          ))}
        </>
      )}
      {issueModel.recordRows.length > 0 && (
        <>
          <text fg="red">
            <b>{issueModel.recordLabel}</b>
          </text>
          {issueModel.recordRows.map((issue) => (
            <text fg={issue.tone} key={issue.key}>
              {" "}
              - {issue.message}
            </text>
          ))}
        </>
      )}
    </box>
  );
}

/** Renders the keyboard shortcut legend at the bottom of the OpenTUI app shell. */
export function WorktreeStackKit_OpenTuiShellFooter(props: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
}) {
  return (
    <box
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      {WorktreeStackKit_buildOpenTuiFooterControls({ flow: props.flow }).map(
        (control) => (
          <box style={{ flexDirection: "row", gap: 1 }} key={control.keyLabel}>
            <text fg={control.foreground} bg={control.background}>
              <b> {control.keyLabel} </b>
            </text>
            <text fg="white">{control.text}</text>
          </box>
        ),
      )}
    </box>
  );
}

function WorktreeStackKit_buildOpenTuiDiscoveryOption(options: {
  readonly index: number;
  readonly record: WorktreeStackKit_OpenTuiRecordInput;
}) {
  const branchLabel = options.record.branchRef
    ? options.record.branchRef.replace("refs/heads/", "")
    : "detached";
  let statusTag = "";
  if (options.record.issues.length > 0) statusTag = "⚠ Issues";
  else if (options.record.currentCheckout) statusTag = "● Current";
  else if (options.record.temporaryMerge) statusTag = "⇄ Merge";
  const slotTag =
    options.record.metadata?.slot != null
      ? `slot ${options.record.metadata.slot}`
      : "";
  const parts = [statusTag, slotTag, branchLabel].filter(Boolean);
  return {
    description: parts.join("  "),
    name:
      options.record.metadata?.stackName ??
      options.record.handbook?.stackName ??
      options.record.label,
    value: String(options.index),
  };
}

function WorktreeStackKit_updateRecordPickIndex(options: {
  readonly index: number;
  readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
}): void {
  if (!Number.isNaN(options.index)) {
    options.setRecordPickIndex(options.index);
  }
}
