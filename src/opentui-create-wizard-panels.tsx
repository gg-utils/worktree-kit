/**
 * @fileoverview OpenTUI panel renderers for the interactive worktrees:create wizard form and preview phases.
 *
 * This file owns package-safe OpenTUI JSX for editing create parameters, navigating preview versus menu versus quit,
 * and handing argv plus script paths to the adapter-provided spawn runner when the user confirms execution.
 * Project adapters inject default-label config, the configured create command path, and host quit behavior at the shell boundary.
 * Flow: shell props -> text/select inputs -> selection plans -> preview pane or spawn handoff.
 *
 * @example
 * ```typescript
 * import {
 *   WorktreeStackKit_OpenTuiCreateWizardForm,
 *   type WorktreeStackKit_OpenTuiCreateWizardFormProps,
 * } from "./opentui-create-wizard-panels.js";
 *
 * export function CreateFormMountPoint(props: WorktreeStackKit_OpenTuiCreateWizardFormProps) {
 *   return <WorktreeStackKit_OpenTuiCreateWizardForm {...props} />;
 * }
 * ```
 *
 * @testing CLI: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-create-wizard-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-create-wizard-form-plans.ts - Text and select field catalogs plus pure selection planners consumed when rendering rows and interpreting tab-select actions in this module.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Non-menu action-scroll shell that mounts these panels during the create flow inside the OpenTUI console.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Focusable tab-select primitive embedded here for keyboard-first navigation across create form and preview controls.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS,
  WorktreeStackKit_applyOpenTuiCreateSelectChange,
  WorktreeStackKit_applyOpenTuiCreateTextChange,
  WorktreeStackKit_buildOpenTuiCreateFormOptions,
  WorktreeStackKit_buildOpenTuiCreatePreviewOptions,
  WorktreeStackKit_buildOpenTuiCreateTextFields,
  WorktreeStackKit_getOpenTuiCreateTextValue,
  WorktreeStackKit_planOpenTuiCreateFormSelection,
  WorktreeStackKit_planOpenTuiCreatePreviewSelection,
  WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel,
  type WorktreeStackKit_OpenTuiCreateSelectFieldId,
  type WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions,
  type WorktreeStackKit_OpenTuiCreateTextFieldId,
  type WorktreeStackKit_UiCreateFormModel,
} from "./opentui-create-wizard-form-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
} from "./opentui-shell-contracts.js";

/** Project-supplied script paths used by the create preview runner. */
export interface WorktreeStackKit_OpenTuiCreateWizardScriptPaths {
  readonly create: string;
}

/** Props for the worktrees:create form panel. */
export interface WorktreeStackKit_OpenTuiCreateWizardFormProps {
  readonly createGoPreview: () => void;
  readonly createModel: WorktreeStackKit_UiCreateFormModel;
  readonly formError: string;
  readonly goMenu: () => void;
  readonly requestQuit: () => void;
  readonly setCreateModel: Dispatch<SetStateAction<WorktreeStackKit_UiCreateFormModel>>;
  readonly textFieldLabelOptions: WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions;
}

/** Props for the worktrees:create preview panel. */
export interface WorktreeStackKit_OpenTuiCreateWizardPreviewProps {
  readonly createArgv: string[];
  readonly createPreviewError: string;
  readonly createPreviewText: string;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly runSpawn: (scriptUnderRepo: string, argv: string[]) => Promise<void>;
  readonly scriptPaths: WorktreeStackKit_OpenTuiCreateWizardScriptPaths;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
}

/** Create flow form fields plus continue/menu/quit navigation for worktrees:create. */
export function WorktreeStackKit_OpenTuiCreateWizardForm(
  props: WorktreeStackKit_OpenTuiCreateWizardFormProps,
) {
  const textFields = WorktreeStackKit_buildOpenTuiCreateTextFields(
    props.textFieldLabelOptions,
  );

  return (
    <>
      <text>worktrees:create</text>
      {props.formError.length > 0 ? <text>{props.formError}</text> : null}
      <scrollbox style={{ flexGrow: 1 }}>
        <box style={{ flexDirection: "column", gap: 1 }}>
          {textFields.map((field) => (
            <box key={field.id} style={{ flexDirection: "column", gap: 1 }}>
              <text>{field.label}</text>
              <input
                onChange={(value) => {
                  WorktreeStackKit_setCreateTextField({
                    fieldId: field.id,
                    props,
                    value,
                  });
                }}
                value={WorktreeStackKit_getOpenTuiCreateTextValue({
                  fieldId: field.id,
                  model: props.createModel,
                })}
              />
            </box>
          ))}
          {WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS.map((field) => (
            <box key={field.id} style={{ flexDirection: "column", gap: 1 }}>
              <text>{field.label}</text>
              <WorktreeStackKit_OpenTuiAutoFocusTabSelect
                onSelect={(_i, option) => {
                  WorktreeStackKit_setCreateSelectField({
                    fieldId: field.id,
                    props,
                    value: option?.value ?? "",
                  });
                }}
                options={[...field.options]}
              />
            </box>
          ))}
        </box>
      </scrollbox>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleCreateFormSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiCreateFormOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Renders the create command preview plus run/back navigation. */
export function WorktreeStackKit_OpenTuiCreateWizardPreview(
  props: WorktreeStackKit_OpenTuiCreateWizardPreviewProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  return (
    <>
      <text>Preview</text>
      {props.createPreviewError.length > 0 ? (
        <text>{props.createPreviewError}</text>
      ) : null}
      <scrollbox style={{ flexGrow: 1 }}>
        <text>{props.createPreviewText}</text>
      </scrollbox>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleCreatePreviewSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiCreatePreviewOptions()}
        showDescription={true}
      />
    </>
  );
}

function WorktreeStackKit_setCreateTextField(options: {
  readonly fieldId: WorktreeStackKit_OpenTuiCreateTextFieldId;
  readonly props: WorktreeStackKit_OpenTuiCreateWizardFormProps;
  readonly value: string;
}): void {
  options.props.setCreateModel((model) =>
    WorktreeStackKit_applyOpenTuiCreateTextChange({
      fieldId: options.fieldId,
      model,
      value: options.value,
    }),
  );
}

function WorktreeStackKit_setCreateSelectField(options: {
  readonly fieldId: WorktreeStackKit_OpenTuiCreateSelectFieldId;
  readonly props: WorktreeStackKit_OpenTuiCreateWizardFormProps;
  readonly value: string;
}): void {
  options.props.setCreateModel((model) =>
    WorktreeStackKit_applyOpenTuiCreateSelectChange({
      fieldId: options.fieldId,
      model,
      value: options.value,
    }),
  );
}

function WorktreeStackKit_handleCreateFormSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiCreateWizardFormProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiCreateFormSelection({
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "preview") {
    options.props.createGoPreview();
    return;
  }
  if (selectionPlan.type === "menu") {
    options.props.goMenu();
    return;
  }
  options.props.requestQuit();
}

function WorktreeStackKit_handleCreatePreviewSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiCreateWizardPreviewProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiCreatePreviewSelection({
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "run") {
    void options.props.runSpawn(
      options.props.scriptPaths.create,
      options.props.createArgv,
    );
    return;
  }
  options.props.setPhase(selectionPlan.nextPhase);
}
