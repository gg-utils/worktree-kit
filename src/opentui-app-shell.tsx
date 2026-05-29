/**
 * @fileoverview Package-owned OpenTUI worktree app-shell layout and main-menu routing around the action-scroll panel.
 *
 * Root adapters inject inventory loading, clipboard side effects, subprocess preview callbacks, and
 * local config while this module owns the reusable three-column OpenTUI layout, header/detail/issue
 * rendering, discovery list rendering, footer chrome, copy serialization, and main-menu transition
 * routing into embedded action-scroll flows.
 * Flow: shell props + tab refs -> column panels -> menu availability plan -> setFlow/setPhase/column focus and optional run-artifact resets.
 *
 * @testing CLI: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-app-shell.unit.test.ts
 * @testing CLI: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-shell-panels.tsx - Header, worktrees discovery column, issues, detail, footer, and action-scroll host panels composed by this shell layout.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Scrollable action runner panel mounted in the detail column when the shell leaves the main menu flow.
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.ts - Menu option catalog and selection planner invoked from the actions column tab-select handler in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { TabSelectRenderable } from "@opentui/core";

import { WorktreeStackKit_OpenTuiActionScroll } from "./opentui-action-scroll.js";
import type { WorktreeStackKit_OpenTuiActionScrollProps } from "./opentui-action-scroll.js";
import {
  WorktreeStackKit_formatOpenTuiCopyLabel,
  WorktreeStackKit_getOpenTuiCopyTone,
  WorktreeStackKit_getOpenTuiSelectedRecord,
  type WorktreeStackKit_OpenTuiInventoryInput,
  type WorktreeStackKit_OpenTuiRecordInput,
} from "./opentui-app-shell-view-model.js";
import {
  WorktreeStackKit_OpenTuiDetailPanel,
  WorktreeStackKit_OpenTuiIssuesPanel,
  WorktreeStackKit_OpenTuiShellFooter,
  WorktreeStackKit_OpenTuiShellHeader,
  WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody,
} from "./opentui-app-shell-panels.js";
import {
  WorktreeStackKit_buildOpenTuiMenuOptions,
  WorktreeStackKit_planOpenTuiMenuActionSelection,
  type WorktreeStackKit_OpenTuiMenuAvailability,
} from "./opentui-shell-menu-actions.js";
import {
  WorktreeStackKit_serializeOpenTuiActions,
  WorktreeStackKit_serializeOpenTuiRecordDetail,
  WorktreeStackKit_serializeOpenTuiWorktreesList,
} from "./opentui-shell-serializers.js";
import type {
  WorktreeStackKit_OpenTuiCopyFlash,
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiMenuColumn,
} from "./opentui-shell-contracts.js";
import { WorktreeStackKit_openTuiFlowTitle } from "./opentui-shell-contracts.js";

/** Host clipboard callback retained by root adapters. */
export type WorktreeStackKit_OpenTuiAppShellCopyHandler = (
  panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>,
  text: string,
) => void;

/** Props for the package-owned OpenTUI app shell layout. */
export interface WorktreeStackKit_OpenTuiAppShellProps {
  readonly actionScrollProps: WorktreeStackKit_OpenTuiActionScrollProps;
  readonly actionsTabRef: MutableRefObject<TabSelectRenderable | null>;
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly handleCopy: WorktreeStackKit_OpenTuiAppShellCopyHandler;
  readonly inventoryLoadError: string | null;
  readonly resetRunArtifacts: () => void;
  readonly setFocusedColumn: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiMenuColumn>>;
  readonly setFlow: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiFlow>>;
  readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
  readonly worktreesTabRef: MutableRefObject<TabSelectRenderable | null>;
}

/** Renders the full OpenTUI worktree app shell around the active action-scroll panel. */
export function WorktreeStackKit_OpenTuiAppShell(
  props: WorktreeStackKit_OpenTuiAppShellProps,
) {
  const { actionScrollProps } = props;
  const selectedRecord = WorktreeStackKit_getOpenTuiSelectedRecord({
    recordPickIndex: actionScrollProps.recordPickIndex,
    records: actionScrollProps.inventory?.records,
  });
  const selectedRecordOrUndefined = selectedRecord ?? undefined;

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
      <WorktreeStackKit_OpenTuiShellHeader
        inventory={actionScrollProps.inventory}
      />
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 0 }}>
        <box style={{ flexDirection: "row", flexGrow: 1, gap: 0 }}>
          <WorktreeStackKit_OpenTuiWorktreesColumn
            copyFlash={props.copyFlash}
            focusedColumn={props.focusedColumn}
            handleCopy={props.handleCopy}
            inventory={actionScrollProps.inventory}
            inventoryLoadError={props.inventoryLoadError}
            setRecordPickIndex={props.setRecordPickIndex}
            worktreesTabRef={props.worktreesTabRef}
          />
          <WorktreeStackKit_OpenTuiIssuesPanel
            copyFlash={props.copyFlash}
            globalIssues={actionScrollProps.inventory?.globalIssues ?? []}
            handleCopy={props.handleCopy}
            selectedRecord={selectedRecordOrUndefined}
          />
          <WorktreeStackKit_OpenTuiActionsColumn
            actionsTabRef={props.actionsTabRef}
            actionScrollProps={actionScrollProps}
            copyFlash={props.copyFlash}
            focusedColumn={props.focusedColumn}
            handleCopy={props.handleCopy}
            resetRunArtifacts={props.resetRunArtifacts}
            selectedRecord={selectedRecordOrUndefined}
            setFlow={props.setFlow}
            setFocusedColumn={props.setFocusedColumn}
            worktreesTabRef={props.worktreesTabRef}
          />
          <WorktreeStackKit_OpenTuiDetailOrActionColumn
            actionScrollProps={actionScrollProps}
            copyFlash={props.copyFlash}
            focusedColumn={props.focusedColumn}
            handleCopy={props.handleCopy}
            selectedRecord={selectedRecordOrUndefined}
          />
        </box>
        <WorktreeStackKit_OpenTuiShellFooter flow={actionScrollProps.flow} />
      </box>
    </box>
  );
}

function WorktreeStackKit_OpenTuiWorktreesColumn(props: {
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly handleCopy: WorktreeStackKit_OpenTuiAppShellCopyHandler;
  readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
  readonly inventoryLoadError: string | null;
  readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
  readonly worktreesTabRef: MutableRefObject<TabSelectRenderable | null>;
}) {
  return (
    <box
      style={{ flexDirection: "column", flexGrow: 1, width: "35%", padding: 1 }}
      border={true}
      borderStyle={props.focusedColumn === "worktrees" ? "double" : "single"}
      borderColor={props.focusedColumn === "worktrees" ? "green" : "gray"}
      title={props.focusedColumn === "worktrees" ? "▸ Worktrees" : "Worktrees"}
    >
      <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <text fg="gray">Browse discovered worktree records.</text>
        <text
          fg={WorktreeStackKit_getOpenTuiCopyTone({
            copyFlash: props.copyFlash,
            panel: "worktrees",
          })}
          onMouseDown={() =>
            props.handleCopy(
              "worktrees",
              WorktreeStackKit_serializeOpenTuiWorktreesList({
                inventory: props.inventory,
              }),
            )
          }
        >
          {WorktreeStackKit_formatOpenTuiCopyLabel({
            copyFlash: props.copyFlash,
            panel: "worktrees",
          })}
        </text>
      </box>
      {WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody({
        focusedColumn: props.focusedColumn,
        inventory: props.inventory,
        inventoryLoadError: props.inventoryLoadError,
        setRecordPickIndex: props.setRecordPickIndex,
        worktreesTabRef: props.worktreesTabRef,
      })}
    </box>
  );
}

function WorktreeStackKit_OpenTuiActionsColumn(props: {
  readonly actionsTabRef: MutableRefObject<TabSelectRenderable | null>;
  readonly actionScrollProps: WorktreeStackKit_OpenTuiActionScrollProps;
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly handleCopy: WorktreeStackKit_OpenTuiAppShellCopyHandler;
  readonly resetRunArtifacts: () => void;
  readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
  readonly setFlow: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiFlow>>;
  readonly setFocusedColumn: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiMenuColumn>>;
  readonly worktreesTabRef: MutableRefObject<TabSelectRenderable | null>;
}) {
  const availability = WorktreeStackKit_getOpenTuiMenuAvailability({
    inventory: props.actionScrollProps.inventory,
    selectedRecord: props.selectedRecord,
  });

  return (
    <box
      style={{ flexDirection: "column", flexGrow: 1, width: "30%", padding: 1 }}
      border={true}
      borderStyle={props.focusedColumn === "actions" ? "double" : "single"}
      borderColor={props.focusedColumn === "actions" ? "yellow" : "gray"}
      title={props.focusedColumn === "actions" ? "▸ Actions" : "Actions"}
    >
      <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <text fg="gray">Available commands.</text>
        <text
          fg={WorktreeStackKit_getOpenTuiCopyTone({
            copyFlash: props.copyFlash,
            panel: "actions",
          })}
          onMouseDown={() =>
            props.handleCopy(
              "actions",
              WorktreeStackKit_serializeOpenTuiActions({
                inventory: props.actionScrollProps.inventory,
                selectedRecord: props.selectedRecord,
              }),
            )
          }
        >
          {WorktreeStackKit_formatOpenTuiCopyLabel({
            copyFlash: props.copyFlash,
            panel: "actions",
          })}
        </text>
      </box>
      <tab-select
        ref={props.actionsTabRef}
        focused={props.focusedColumn === "actions"}
        selectedBackgroundColor="yellow"
        selectedTextColor="black"
        focusedBackgroundColor="#3a3a1a"
        options={WorktreeStackKit_buildOpenTuiMenuOptions({ availability })}
        showDescription={true}
        onSelect={(_index, option) => {
          WorktreeStackKit_handleOpenTuiMainMenuActionSelection({
            availability,
            optionValue: option?.value,
            props,
          });
        }}
      />
    </box>
  );
}

function WorktreeStackKit_OpenTuiDetailOrActionColumn(props: {
  readonly actionScrollProps: WorktreeStackKit_OpenTuiActionScrollProps;
  readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly handleCopy: WorktreeStackKit_OpenTuiAppShellCopyHandler;
  readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
}) {
  const { flow, phase } = props.actionScrollProps;

  return (
    <box
      style={{ flexDirection: "column", flexGrow: 1, width: "35%", padding: 1 }}
      border={true}
      borderStyle={props.focusedColumn === "detail" ? "double" : "single"}
      borderColor={props.focusedColumn === "detail" ? "cyan" : "gray"}
      title={WorktreeStackKit_buildOpenTuiDetailTitle({
        focusedColumn: props.focusedColumn,
        flow,
        phase,
      })}
    >
      <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <text fg="gray">
          {flow === "menu"
            ? "Selected worktree properties."
            : WorktreeStackKit_openTuiFlowTitle({ flow, phase })}
        </text>
        {flow === "menu" ? (
          <text
            fg={WorktreeStackKit_getOpenTuiCopyTone({
              copyFlash: props.copyFlash,
              panel: "detail",
            })}
            onMouseDown={() =>
              props.handleCopy(
                "detail",
                WorktreeStackKit_serializeOpenTuiRecordDetail({
                  record: props.selectedRecord,
                }),
              )
            }
          >
            {WorktreeStackKit_formatOpenTuiCopyLabel({
              copyFlash: props.copyFlash,
              panel: "detail",
            })}
          </text>
        ) : null}
      </box>
      {flow === "menu" ? (
        <WorktreeStackKit_OpenTuiDetailPanel
          selectedRecord={props.selectedRecord}
        />
      ) : (
        <scrollbox style={{ flexGrow: 1 }}>
          <WorktreeStackKit_OpenTuiActionScroll {...props.actionScrollProps} />
        </scrollbox>
      )}
    </box>
  );
}

function WorktreeStackKit_handleOpenTuiMainMenuActionSelection(options: {
  readonly availability: WorktreeStackKit_OpenTuiMenuAvailability;
  readonly optionValue: string | undefined;
  readonly props: Parameters<typeof WorktreeStackKit_OpenTuiActionsColumn>[0];
}): void {
  const plan = WorktreeStackKit_planOpenTuiMenuActionSelection({
    availability: options.availability,
    optionValue: options.optionValue,
  });

  if (plan.type === "ignore") return;
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

function WorktreeStackKit_getOpenTuiMenuAvailability(options: {
  readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
  readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
}): WorktreeStackKit_OpenTuiMenuAvailability {
  return {
    hasRealms:
      (options.inventory?.summary.activeRealms ?? 0) +
        (options.inventory?.summary.inactiveRealms ?? 0) >
      0,
    hasRecords: (options.inventory?.records.length ?? 0) > 0,
    hasSelectedRecord: options.selectedRecord !== undefined,
  };
}

function WorktreeStackKit_buildOpenTuiDetailTitle(options: {
  readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiActionScrollProps["phase"];
}): string {
  if (options.flow !== "menu") {
    return `▸ ${WorktreeStackKit_openTuiFlowTitle({
      flow: options.flow,
      phase: options.phase,
    })}`;
  }
  return options.focusedColumn === "detail" ? "▸ Detail" : "Detail";
}
