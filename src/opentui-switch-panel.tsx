/**
 * @fileoverview Owns package-safe OpenTUI rendering for the worktrees:switch form, preview, and confirm-to-spawn handoff in the action-scroll shell.
 *
 * Project adapters inject the configured switch script path plus host quit behavior while this module composes scrollboxes, inputs, and tab-select actions driven by the shared switch planners.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-switch-panel.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-switch-plans.ts - Visibility gates, option catalogs, model updates, and selection planners this panel calls for the switch form and preview phases.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that mounts this panel in the stacked OpenTUI layout during switch flows.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Tab-style select control reused here for form and preview navigation choices.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WorktreeStackKit_buildOpenTuiSwitchFormOptions,
  WorktreeStackKit_buildOpenTuiSwitchPreviewOptions,
  WorktreeStackKit_planOpenTuiSwitchFormSelection,
  WorktreeStackKit_planOpenTuiSwitchPreviewSelection,
  WorktreeStackKit_shouldShowOpenTuiSwitchForm,
  WorktreeStackKit_shouldShowOpenTuiSwitchPreview,
  WorktreeStackKit_updateOpenTuiSwitchFormModel,
} from "./opentui-action-scroll-switch-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
} from "./opentui-shell-contracts.js";
import type { WorktreeStackKit_UiSwitchFormModel } from "./ui-command-catalog.js";

/** Project-supplied script paths used by the switch panel preview runner. */
export interface WorktreeStackKit_OpenTuiSwitchPanelScriptPaths {
  readonly switch: string;
}

/** Props for the switch-flow form/preview panel. */
export interface WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly formError: string;
  readonly goMenu: () => void;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly requestQuit: () => void;
  readonly runSpawn: (scriptUnderRepo: string, argv: string[]) => Promise<void>;
  readonly scriptPaths: WorktreeStackKit_OpenTuiSwitchPanelScriptPaths;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setSwitchModel: Dispatch<SetStateAction<WorktreeStackKit_UiSwitchFormModel>>;
  readonly switchArgv: string[];
  readonly switchGoPreview: () => void;
  readonly switchModel: WorktreeStackKit_UiSwitchFormModel;
  readonly switchPreviewError: string;
  readonly switchPreviewText: string;
}

/** Switch-flow form and preview panel for worktrees:switch. */
export function WorktreeStackKit_OpenTuiActionScrollSwitchPanel(
  props: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps,
) {
  return (
    <>
      {WorktreeStackKit_shouldShowOpenTuiSwitchForm({
        flow: props.flow,
        phase: props.phase,
      }) ? (
        <WorktreeStackKit_OpenTuiActionScrollSwitchFormPanel {...props} />
      ) : null}

      {WorktreeStackKit_shouldShowOpenTuiSwitchPreview({
        flow: props.flow,
        phase: props.phase,
      }) ? (
        <WorktreeStackKit_OpenTuiActionScrollSwitchPreviewPanel {...props} />
      ) : null}
    </>
  );
}

function WorktreeStackKit_OpenTuiActionScrollSwitchFormPanel(
  props: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps,
) {
  return (
    <>
      <text>worktrees:switch</text>
      {props.formError.length > 0 ? <text>{props.formError}</text> : null}
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: "column", gap: 1 }}>
          <text>Prefix (--prefix, optional)</text>
          <input
            onChange={(value) => {
              WorktreeStackKit_setSwitchFormField({
                fieldId: "prefix",
                props,
                value,
              });
            }}
            value={props.switchModel.prefix}
          />
          <text>Stack name (--name, optional)</text>
          <input
            onChange={(value) => {
              WorktreeStackKit_setSwitchFormField({
                fieldId: "stackName",
                props,
                value,
              });
            }}
            value={props.switchModel.stackName}
          />
          <text>Worktrees base (--worktrees-base, default=default)</text>
          <input
            onChange={(value) => {
              WorktreeStackKit_setSwitchFormField({
                fieldId: "worktreesBase",
                props,
                value,
              });
            }}
            value={props.switchModel.worktreesBase}
          />
        </box>
      </scrollbox>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleSwitchFormSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiSwitchFormOptions()}
        showDescription={true}
      />
    </>
  );
}

function WorktreeStackKit_OpenTuiActionScrollSwitchPreviewPanel(
  props: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps,
) {
  return (
    <>
      <text>Preview</text>
      {props.switchPreviewError.length > 0 ? (
        <text>{props.switchPreviewError}</text>
      ) : null}
      <scrollbox style={{ flexGrow: 1 }}>
        <text>{props.switchPreviewText}</text>
      </scrollbox>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleSwitchPreviewSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiSwitchPreviewOptions()}
        showDescription={true}
      />
    </>
  );
}

function WorktreeStackKit_setSwitchFormField(options: {
  readonly fieldId: "prefix" | "stackName" | "worktreesBase";
  readonly props: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps;
  readonly value: string;
}): void {
  options.props.setSwitchModel((model) =>
    WorktreeStackKit_updateOpenTuiSwitchFormModel({
      fieldId: options.fieldId,
      model,
      value: options.value,
    }),
  );
}

function WorktreeStackKit_handleSwitchFormSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiSwitchFormSelection({
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "preview") {
    options.props.switchGoPreview();
    return;
  }
  if (selectionPlan.type === "menu") {
    options.props.goMenu();
    return;
  }
  options.props.requestQuit();
}

function WorktreeStackKit_handleSwitchPreviewSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollSwitchPanelProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiSwitchPreviewSelection({
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "run") {
    void options.props.runSpawn(
      options.props.scriptPaths.switch,
      options.props.switchArgv,
    );
    return;
  }
  options.props.setPhase(selectionPlan.nextPhase);
}
