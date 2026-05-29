/**
 * @fileoverview Package-owned OpenTUI panels for record-scoped npm previews, token-guarded
 * confirmations, and worktrees:start/destroy/update-from-main/merge form handoffs.
 *
 * Project adapters inject target-branch policy and the quit side effect while this module owns the
 * reusable OpenTUI rendering and state transitions for start, destroy, update-from-main, merge,
 * generic npm preview, and guarded confirmation panels.
 * Flow: form inputs -> plan npm preview -> preview scrollbox -> optional confirm phase -> invoke injected npm runner.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-npm-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-npm-plans.ts - Pure planners and option builders this module calls to assemble preview commands, confirm tokens, and selection outcomes for each flow.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that stacks these panels with other OpenTUI maintenance and global flows outside the menu shell.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Focusable tab-style select control reused for flags, execution modes, and preview or confirm navigation affordances.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Flow, phase, and pool-kind contracts that gate which panels render and how shared navigation tabs are composed.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS,
  WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS,
  WorktreeStackKit_buildOpenTuiNpmConfirmOptions,
  WorktreeStackKit_buildOpenTuiNpmPreviewOptions,
  WorktreeStackKit_parseOpenTuiExecutionMode,
  WorktreeStackKit_parseOpenTuiUpdateMode,
  WorktreeStackKit_planOpenTuiDestroyNpmPreview,
  WorktreeStackKit_planOpenTuiMergeNpmPreview,
  WorktreeStackKit_planOpenTuiNpmConfirmSelection,
  WorktreeStackKit_planOpenTuiNpmPreviewSelection,
  WorktreeStackKit_planOpenTuiStartNpmPreview,
  WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview,
} from "./opentui-action-scroll-npm-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
  WorktreeStackKit_OpenTuiPoolKind,
} from "./opentui-shell-contracts.js";
import { WorktreeStackKit_openTuiNavTabs } from "./opentui-shell-contracts.js";
import type {
  WorktreeStackKit_UiExecutionMode,
  WorktreeStackKit_UiUpdateMode,
} from "./ui-command-catalog.js";

/** Pending npm-run request rendered by preview/confirmation panels. */
export interface WorktreeStackKit_OpenTuiPendingNpmRun {
  readonly forwarded: string[];
  readonly script: string;
}

interface WorktreeStackKit_OpenTuiNpmPanelSideEffects {
  readonly requestQuit: () => void;
}

interface WorktreeStackKit_OpenTuiRecordScopedPanelBase
  extends WorktreeStackKit_OpenTuiNpmPanelSideEffects {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly getSelectedWorktreePath: () => string | null;
  readonly goMenu: () => void;
  readonly manualWorktreePath: string;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly recordPickIndex: number;
  readonly setCommandPreview: Dispatch<SetStateAction<string>>;
  readonly setFormError: Dispatch<SetStateAction<string>>;
  readonly setManualWorktreePath: Dispatch<SetStateAction<string>>;
  readonly setPendingNpmRun: Dispatch<
    SetStateAction<WorktreeStackKit_OpenTuiPendingNpmRun | null>
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}

/** Props for the worktrees:start record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollStartFormPanelProps
  extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
  readonly setStartOpenWindsurf: Dispatch<SetStateAction<boolean>>;
  readonly startOpenWindsurf: boolean;
}

/** Props for the worktrees:destroy record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollDestroyFormPanelProps
  extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
  readonly destroyPrune: boolean;
  readonly setDestroyPrune: Dispatch<SetStateAction<boolean>>;
}

/** Props for the worktrees:update-from-main record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanelProps
  extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
  readonly setUpdateExec: Dispatch<SetStateAction<WorktreeStackKit_UiExecutionMode>>;
  readonly setUpdateMode: Dispatch<SetStateAction<WorktreeStackKit_UiUpdateMode>>;
  readonly targetBranch: string;
  readonly updateExec: WorktreeStackKit_UiExecutionMode;
  readonly updateMode: WorktreeStackKit_UiUpdateMode;
}

/** Props for the worktrees:merge record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollMergeFormPanelProps
  extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
  readonly mergeExec: WorktreeStackKit_UiExecutionMode;
  readonly setMergeExec: Dispatch<SetStateAction<WorktreeStackKit_UiExecutionMode>>;
  readonly targetBranch: string;
}

/** Props for the generic npm preview panel. */
export interface WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanelProps
  extends WorktreeStackKit_OpenTuiNpmPanelSideEffects {
  readonly commandPreview: string;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly goMenu: () => void;
  readonly pendingNpmRun: WorktreeStackKit_OpenTuiPendingNpmRun | null;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
  readonly requiredConfirmToken: string | null;
  readonly runNpmScript: (npmScript: string, forwarded: string[]) => Promise<void>;
  readonly setConfirmTokenInput: Dispatch<SetStateAction<string>>;
  readonly setPendingNpmRun: Dispatch<
    SetStateAction<WorktreeStackKit_OpenTuiPendingNpmRun | null>
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}

/** Props for the guarded npm confirmation panel. */
export interface WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanelProps
  extends WorktreeStackKit_OpenTuiNpmPanelSideEffects {
  readonly confirmTokenInput: string;
  readonly formError: string;
  readonly goMenu: () => void;
  readonly pendingNpmRun: WorktreeStackKit_OpenTuiPendingNpmRun | null;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly requiredConfirmToken: string | null;
  readonly runNpmScript: (npmScript: string, forwarded: string[]) => Promise<void>;
  readonly setConfirmTokenInput: Dispatch<SetStateAction<string>>;
  readonly setFormError: Dispatch<SetStateAction<string>>;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
}

/** Start-flow flag form for worktrees:start preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollStartFormPanel(
  props: WorktreeStackKit_OpenTuiActionScrollStartFormPanelProps,
) {
  if (props.flow !== "start" || props.phase !== "form") {
    return null;
  }

  return (
    <>
      <text>worktrees:start</text>
      <text>Target: {props.getSelectedWorktreePath() ?? "(missing path)"}</text>
      {props.recordPickIndex < 0 ? (
        <>
          <text>Worktree path (--worktree)</text>
          <input
            onChange={(value) => props.setManualWorktreePath(value)}
            value={props.manualWorktreePath}
          />
        </>
      ) : null}
      <text>Open Windsurf (yes = --open-windsurf)</text>
      <input
        onChange={(value) =>
          props.setStartOpenWindsurf(value.trim().toLowerCase() === "yes")
        }
        value={props.startOpenWindsurf ? "yes" : "no"}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiStartSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Destroy-flow flag form for worktrees:destroy preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel(
  props: WorktreeStackKit_OpenTuiActionScrollDestroyFormPanelProps,
) {
  if (props.flow !== "destroy" || props.phase !== "form") {
    return null;
  }

  return (
    <>
      <text>worktrees:destroy</text>
      <text>Target: {props.getSelectedWorktreePath() ?? "(missing path)"}</text>
      {props.recordPickIndex < 0 ? (
        <>
          <text>Worktree path (--worktree)</text>
          <input
            onChange={(value) => props.setManualWorktreePath(value)}
            value={props.manualWorktreePath}
          />
        </>
      ) : null}
      <text>Git worktree prune after remove (--prune)</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          if (option?.value === "yes") props.setDestroyPrune(true);
          if (option?.value === "no") props.setDestroyPrune(false);
        }}
        options={[
          { description: "Prune git worktrees", name: "yes", value: "yes" },
          { description: "Skip git worktrees prune", name: "no", value: "no" },
        ]}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiDestroySelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Update-from-main flag form for worktrees:update-from-main preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel(
  props: WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanelProps,
) {
  if (props.flow !== "updateFromMain" || props.phase !== "form") {
    return null;
  }

  return (
    <>
      <text>worktrees:update-from-main</text>
      <text>Target: {props.getSelectedWorktreePath() ?? "(missing path)"}</text>
      {props.recordPickIndex < 0 ? (
        <>
          <text>Worktree path (--worktree)</text>
          <input
            onChange={(value) => props.setManualWorktreePath(value)}
            value={props.manualWorktreePath}
          />
        </>
      ) : null}
      <text>Mode</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const parsedUpdateMode = WorktreeStackKit_parseOpenTuiUpdateMode(
            option?.value,
          );
          if (parsedUpdateMode) {
            props.setUpdateMode(parsedUpdateMode);
          }
        }}
        options={[...WORKTREE_STACK_KIT_OPENTUI_UPDATE_MODE_OPTIONS]}
      />
      <text>Execution</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const parsedExecutionMode =
            WorktreeStackKit_parseOpenTuiExecutionMode(option?.value);
          if (parsedExecutionMode) {
            props.setUpdateExec(parsedExecutionMode);
          }
        }}
        options={[...WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS]}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiUpdateFromMainSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Merge-flow flag form for worktrees:merge preview handoff. */
export function WorktreeStackKit_OpenTuiActionScrollMergeFormPanel(
  props: WorktreeStackKit_OpenTuiActionScrollMergeFormPanelProps,
) {
  if (props.flow !== "merge" || props.phase !== "form") {
    return null;
  }

  return (
    <>
      <text>worktrees:merge</text>
      <text>Target: {props.getSelectedWorktreePath() ?? "(missing path)"}</text>
      {props.recordPickIndex < 0 ? (
        <>
          <text>Worktree path (--worktree)</text>
          <input
            onChange={(value) => props.setManualWorktreePath(value)}
            value={props.manualWorktreePath}
          />
        </>
      ) : null}
      <text>Execution</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const parsedExecutionMode =
            WorktreeStackKit_parseOpenTuiExecutionMode(option?.value);
          if (parsedExecutionMode) {
            props.setMergeExec(parsedExecutionMode);
          }
        }}
        options={[...WORKTREE_STACK_KIT_OPENTUI_EXECUTION_MODE_OPTIONS]}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiMergeSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions()}
        showDescription={true}
      />
    </>
  );
}

/** npm-run preview panel with optional confirm token gate before execution. */
export function WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel(
  props: WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanelProps,
) {
  if (props.phase !== "preview" || !props.pendingNpmRun) {
    return null;
  }

  return (
    <>
      <text>Preview</text>
      {props.requiredConfirmToken ? (
        <text>
          Confirmation required: type {props.requiredConfirmToken} (case-sensitive)
          before Run.
        </text>
      ) : null}
      <scrollbox style={{ flexGrow: 1 }}>
        <text>{props.commandPreview}</text>
      </scrollbox>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiNpmPreviewSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiNpmPreviewOptions({
          requiresConfirmToken: props.requiredConfirmToken !== null,
        })}
        showDescription={true}
      />
    </>
  );
}

/** Token confirmation gate immediately before a guarded npm run. */
export function WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel(
  props: WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanelProps,
) {
  if (props.phase !== "confirm" || !props.pendingNpmRun || !props.requiredConfirmToken) {
    return null;
  }

  return (
    <>
      <text>
        Type {props.requiredConfirmToken} to run: npm run {props.pendingNpmRun.script}
      </text>
      {props.formError.length > 0 ? <text>{props.formError}</text> : null}
      <input
        onChange={(value) => props.setConfirmTokenInput(value)}
        value={props.confirmTokenInput}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiNpmConfirmSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiNpmConfirmOptions()}
        showDescription={true}
      />
    </>
  );
}

function WorktreeStackKit_buildOpenTuiRecordScopedContinueOptions() {
  return [
    {
      description: "Preview npm command",
      name: "Continue",
      value: "next",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

function WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiRecordScopedPanelBase;
}): "continue" | "handled" {
  if (options.optionValue === "menu") {
    options.props.goMenu();
    return "handled";
  }
  if (options.optionValue === "quit") {
    options.props.requestQuit();
    return "handled";
  }
  return options.optionValue === "next" ? "continue" : "handled";
}

function WorktreeStackKit_requireOpenTuiWorktreePath(options: {
  readonly props: WorktreeStackKit_OpenTuiRecordScopedPanelBase;
}): string | null {
  const pathValue = options.props.getSelectedWorktreePath();
  if (!pathValue) {
    options.props.setFormError("Worktree path is required.");
    return null;
  }
  options.props.setFormError("");
  return pathValue;
}

function WorktreeStackKit_applyOpenTuiNpmPreviewPlan(options: {
  readonly plan: {
    readonly commandPreview: string;
    readonly forwarded: string[];
    readonly requiredConfirmToken: string | null;
    readonly script: string;
  };
  readonly props: WorktreeStackKit_OpenTuiRecordScopedPanelBase;
}): void {
  options.props.setCommandPreview(options.plan.commandPreview);
  options.props.setPendingNpmRun({
    forwarded: options.plan.forwarded,
    script: options.plan.script,
  });
  options.props.setRequiredConfirmToken(options.plan.requiredConfirmToken);
  options.props.setPhase("preview");
}

function WorktreeStackKit_handleOpenTuiStartSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollStartFormPanelProps;
}): void {
  if (
    WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue"
  ) {
    return;
  }
  const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
    props: options.props,
  });
  if (!pathValue) return;
  WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
    plan: WorktreeStackKit_planOpenTuiStartNpmPreview({
      openWindsurf: options.props.startOpenWindsurf,
      worktreePath: pathValue,
    }),
    props: options.props,
  });
}

function WorktreeStackKit_handleOpenTuiDestroySelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollDestroyFormPanelProps;
}): void {
  if (
    WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue"
  ) {
    return;
  }
  const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
    props: options.props,
  });
  if (!pathValue) return;
  WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
    plan: WorktreeStackKit_planOpenTuiDestroyNpmPreview({
      prune: options.props.destroyPrune,
      worktreePath: pathValue,
    }),
    props: options.props,
  });
}

function WorktreeStackKit_handleOpenTuiUpdateFromMainSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanelProps;
}): void {
  if (
    WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue"
  ) {
    return;
  }
  const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
    props: options.props,
  });
  if (!pathValue) return;
  WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
    plan: WorktreeStackKit_planOpenTuiUpdateFromMainNpmPreview({
      executionMode: options.props.updateExec,
      targetBranch: options.props.targetBranch,
      updateMode: options.props.updateMode,
      worktreePath: pathValue,
    }),
    props: options.props,
  });
}

function WorktreeStackKit_handleOpenTuiMergeSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollMergeFormPanelProps;
}): void {
  if (
    WorktreeStackKit_applyOpenTuiRecordScopedNavigation(options) !== "continue"
  ) {
    return;
  }
  const pathValue = WorktreeStackKit_requireOpenTuiWorktreePath({
    props: options.props,
  });
  if (!pathValue) return;
  WorktreeStackKit_applyOpenTuiNpmPreviewPlan({
    plan: WorktreeStackKit_planOpenTuiMergeNpmPreview({
      executionMode: options.props.mergeExec,
      targetBranch: options.props.targetBranch,
      worktreePath: pathValue,
    }),
    props: options.props,
  });
}

function WorktreeStackKit_handleOpenTuiNpmPreviewSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanelProps;
}): void {
  if (!options.props.pendingNpmRun) return;
  const selectionPlan = WorktreeStackKit_planOpenTuiNpmPreviewSelection({
    flow: options.props.flow,
    optionValue: options.optionValue,
    poolKind: options.props.poolKind,
    requiresConfirmToken: options.props.requiredConfirmToken !== null,
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
  if (selectionPlan.type === "run") {
    void options.props.runNpmScript(
      options.props.pendingNpmRun.script,
      options.props.pendingNpmRun.forwarded,
    );
    return;
  }
  if (selectionPlan.type === "confirm") {
    options.props.setPhase("confirm");
    return;
  }
  if (selectionPlan.type === "back") {
    options.props.setPendingNpmRun(null);
    options.props.setRequiredConfirmToken(null);
    options.props.setConfirmTokenInput("");
    options.props.setPhase(selectionPlan.nextPhase);
  }
}

function WorktreeStackKit_handleOpenTuiNpmConfirmSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanelProps;
}): void {
  if (!options.props.pendingNpmRun || !options.props.requiredConfirmToken) return;
  const selectionPlan = WorktreeStackKit_planOpenTuiNpmConfirmSelection({
    confirmTokenInput: options.props.confirmTokenInput,
    optionValue: options.optionValue,
    requiredConfirmToken: options.props.requiredConfirmToken,
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
  if (selectionPlan.type === "validation-error") {
    options.props.setFormError(selectionPlan.message);
    return;
  }
  if (selectionPlan.type === "run") {
    options.props.setFormError("");
    void options.props.runNpmScript(
      options.props.pendingNpmRun.script,
      options.props.pendingNpmRun.forwarded,
    );
    return;
  }
  if (selectionPlan.type === "back") {
    options.props.setPhase(selectionPlan.nextPhase);
  }
}
