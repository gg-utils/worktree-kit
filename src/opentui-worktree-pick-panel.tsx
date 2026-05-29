/**
 * @fileoverview Package-owned OpenTUI panel for record-scoped worktree selection.
 *
 * Script adapters translate project inventory records into minimal package-safe rows while this
 * module owns the worktree-pick list, manual-path capture, and selection transitions shared by
 * start, destroy, update-from-main, and merge flows.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-worktree-pick-panel.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-worktree-pick.ts - Option builders, visibility gates, and selection planners this panel invokes when tab-select or empty-state controls advance phase, menu, quit, or record index.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Tab-style select wrapper that applies mount-time focus so the populated and empty-state pick lists rendered here receive arrow-key navigation in keyboard-first shells.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that mounts this panel during pick phases across record-scoped flows.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Flow and phase contracts read by visibility helpers to decide when this panel should render inside the stacked OpenTUI layout.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions,
  WorktreeStackKit_buildOpenTuiWorktreePickOptions,
  type WorktreeStackKit_OpenTuiWorktreePickRecordOption,
  WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection,
  WorktreeStackKit_planOpenTuiWorktreePickSelection,
  WorktreeStackKit_shouldShowOpenTuiWorktreePick,
} from "./opentui-action-scroll-worktree-pick.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
} from "./opentui-shell-contracts.js";

/** Props for the record-scoped worktree picker panel. */
export interface WorktreeStackKit_OpenTuiActionScrollWorktreePickPanelProps {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly goMenu: () => void;
  readonly manualWorktreePath: string;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly records: readonly WorktreeStackKit_OpenTuiWorktreePickRecordOption[] | null;
  readonly requestQuit: () => void;
  readonly setManualWorktreePath: Dispatch<SetStateAction<string>>;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
}

/** Worktree pick list and manual path capture shared by record-scoped flows. */
export function WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel(
  props: WorktreeStackKit_OpenTuiActionScrollWorktreePickPanelProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiWorktreePick({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  return (
    <>
      <text>Select a worktree</text>
      {props.records && props.records.length > 0 ? (
        <WorktreeStackKit_OpenTuiAutoFocusTabSelect
          onSelect={(_i, option) => {
            WorktreeStackKit_handleOpenTuiWorktreePickSelection({
              optionValue: option?.value,
              props,
            });
          }}
          options={WorktreeStackKit_buildOpenTuiWorktreePickOptions({
            records: props.records,
          })}
          showDescription={true}
        />
      ) : (
        <>
          <text>
            No git worktrees in discovery. Enter an absolute or repo-relative path.
          </text>
          <input
            onChange={(value) => props.setManualWorktreePath(value)}
            value={props.manualWorktreePath}
          />
          <WorktreeStackKit_OpenTuiAutoFocusTabSelect
            onSelect={(_i, option) => {
              WorktreeStackKit_handleOpenTuiEmptyWorktreePickSelection({
                optionValue: option?.value,
                props,
              });
            }}
            options={WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions()}
            showDescription={true}
          />
        </>
      )}
    </>
  );
}

function WorktreeStackKit_handleOpenTuiWorktreePickSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollWorktreePickPanelProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiWorktreePickSelection({
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "menu") {
    options.props.goMenu();
    return;
  }
  if (selectionPlan.type === "quit") {
    options.props.requestQuit();
    return;
  }
  if (selectionPlan.type === "continue") {
    options.props.setPhase(selectionPlan.nextPhase);
    return;
  }
  options.props.setRecordPickIndex(selectionPlan.recordPickIndex);
}

function WorktreeStackKit_handleOpenTuiEmptyWorktreePickSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollWorktreePickPanelProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection({
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "menu") {
    options.props.goMenu();
    return;
  }
  if (selectionPlan.type === "quit") {
    options.props.requestQuit();
    return;
  }
  options.props.setRecordPickIndex(selectionPlan.recordPickIndex);
  options.props.setPhase(selectionPlan.nextPhase);
}
