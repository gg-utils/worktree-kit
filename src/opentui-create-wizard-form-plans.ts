/**
 * @fileoverview Reusable OpenTUI create-wizard form schema and update helpers.
 *
 * The package owns field ordering, labels, select-option catalogs, default model construction from
 * explicit caller-supplied defaults, pure model update reducers, and form/preview navigation
 * planning. Package-owned OpenTUI panels consume these catalogs while script adapters keep local
 * preview helpers, process execution, and project config values such as the default base branch,
 * metadata source, and worktrees folder.
 *
 * @testing Node test runner: cd packages/worktree-kit && npx tsx --test src/opentui-create-wizard-form-plans.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI flow/phase types and preview-tab constants consumed here for preview visibility and create/preview navigation option wiring.
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Declares WorktreeStackKit_UiCreateFormModel that createOpenTuiCreateFormModel seeds and the apply* reducers update without I/O.
 * @see packages/worktree-kit/src/opentui-create-wizard-panels.tsx - Create wizard panels import field catalogs and planOpenTui* helpers to render rows and interpret user selections in the create flow.
 * @see packages/worktree-kit/src/opentui-create-wizard-form-plans.unit.test.ts - Node test module asserting defaults, select/text reducers, and navigation plan branches for the contracts in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import type { WorktreeStackKit_OpenTuiSelectOption } from "./opentui-shell-contracts.js";
import {
  WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS,
  WorktreeStackKit_openTuiNavTabs,
  type WorktreeStackKit_OpenTuiFlow,
  type WorktreeStackKit_OpenTuiPhase,
} from "./opentui-shell-contracts.js";
import type { WorktreeStackKit_UiCreateFormModel } from "./ui-command-catalog.js";

export type { WorktreeStackKit_UiCreateFormModel } from "./ui-command-catalog.js";

/** Text-input fields rendered by the OpenTUI create wizard. */
export type WorktreeStackKit_OpenTuiCreateTextFieldId =
  | "baseBranch"
  | "realm"
  | "rootBranch"
  | "slot"
  | "stackName"
  | "submoduleBranch"
  | "worktreePathOverride"
  | "worktreesBase";

/** Select fields rendered by the OpenTUI create wizard. */
export type WorktreeStackKit_OpenTuiCreateSelectFieldId =
  | "copyEnvFromMain"
  | "installPreferOffline"
  | "installSkipExisting"
  | "openWindsurf"
  | "runInstall"
  | "startMode";

/** Explicit project/config defaults needed to seed the package-owned create model. */
export type WorktreeStackKit_OpenTuiCreateFormDefaults = {
  readonly baseBranch: string;
  readonly metadataSource: string;
  readonly worktreesBase: string;
};

/** Explicit project/config labels needed for create text-field defaults. */
export type WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions = {
  readonly baseBranchDefaultLabel: string;
  readonly rootBranchDefaultLabel: string;
};

/** Metadata for one text-input row in the create wizard. */
export type WorktreeStackKit_OpenTuiCreateTextField = {
  readonly id: WorktreeStackKit_OpenTuiCreateTextFieldId;
  readonly label: string;
};

/** Metadata for one select row in the create wizard. */
export type WorktreeStackKit_OpenTuiCreateSelectField = {
  readonly id: WorktreeStackKit_OpenTuiCreateSelectFieldId;
  readonly label: string;
  readonly options: readonly WorktreeStackKit_OpenTuiSelectOption[];
};

/** Pure result of selecting a create-preview navigation row. */
export type WorktreeStackKit_OpenTuiCreatePreviewSelectionPlan =
  | { readonly nextPhase: WorktreeStackKit_OpenTuiPhase; readonly type: "back" }
  | { readonly type: "ignore" }
  | { readonly type: "run" };

/** Pure result of selecting a create-form navigation row. */
export type WorktreeStackKit_OpenTuiCreateFormSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "preview" }
  | { readonly type: "quit" };

const WORKTREE_STACK_KIT_OPENTUI_CREATE_COPY_ENV_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Skip fallback", name: "no", value: "no" },
  { description: "Use fallback", name: "yes", value: "yes" },
];

const WORKTREE_STACK_KIT_OPENTUI_CREATE_RUN_INSTALL_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Run install", name: "yes", value: "yes" },
  { description: "Skip install", name: "no", value: "no" },
];

const WORKTREE_STACK_KIT_OPENTUI_CREATE_SKIP_EXISTING_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Skip if exists", name: "yes", value: "yes" },
  { description: "Standard install", name: "no", value: "no" },
];

const WORKTREE_STACK_KIT_OPENTUI_CREATE_PREFER_OFFLINE_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Prefer offline", name: "yes", value: "yes" },
  { description: "Require online", name: "no", value: "no" },
];

const WORKTREE_STACK_KIT_OPENTUI_CREATE_OPEN_WINDSURF_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Skip", name: "no", value: "no" },
  { description: "Open in Windsurf", name: "yes", value: "yes" },
];

const WORKTREE_STACK_KIT_OPENTUI_CREATE_START_MODE_OPTIONS: ReadonlyArray<
  WorktreeStackKit_OpenTuiSelectOption
> = [
  { description: "Do not start", name: "none", value: "none" },
  {
    description: "Open standard terminal",
    name: "terminal",
    value: "terminal",
  },
  { description: "Open iTerm2", name: "iTerm", value: "iterm" },
];

/** Builds ordered text fields for the create wizard from explicit project/default labels. */
export function WorktreeStackKit_buildOpenTuiCreateTextFields(
  options: WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions,
): WorktreeStackKit_OpenTuiCreateTextField[] {
  return [
    { id: "stackName", label: "Stack name (--name)" },
    { id: "slot", label: "Slot (--slot)" },
    { id: "realm", label: "Realm (--realm, optional)" },
    { id: "worktreesBase", label: "Worktrees base (--worktrees-base)" },
    {
      id: "worktreePathOverride",
      label: "Worktree path override (--worktree-path, optional)",
    },
    {
      id: "baseBranch",
      label: `Base branch (default ${options.baseBranchDefaultLabel})`,
    },
    {
      id: "rootBranch",
      label: `Root branch (optional, default ${options.rootBranchDefaultLabel})`,
    },
    { id: "submoduleBranch", label: "Submodule branch (optional)" },
  ];
}

/** Ordered select fields for the create wizard. */
export const WORKTREE_STACK_KIT_OPENTUI_CREATE_SELECT_FIELDS: ReadonlyArray<
  WorktreeStackKit_OpenTuiCreateSelectField
> = [
  {
    id: "copyEnvFromMain",
    label: "DEPRECATED fallback: --copy-env-from-main (legacy recovery only)",
    options: WORKTREE_STACK_KIT_OPENTUI_CREATE_COPY_ENV_OPTIONS,
  },
  {
    id: "runInstall",
    label: "Run npm install after setup (--no-install)",
    options: WORKTREE_STACK_KIT_OPENTUI_CREATE_RUN_INSTALL_OPTIONS,
  },
  {
    id: "installSkipExisting",
    label: "Install skip existing node_modules (--install-skip-existing)",
    options: WORKTREE_STACK_KIT_OPENTUI_CREATE_SKIP_EXISTING_OPTIONS,
  },
  {
    id: "installPreferOffline",
    label: "Install prefer offline (--install-prefer-online)",
    options: WORKTREE_STACK_KIT_OPENTUI_CREATE_PREFER_OFFLINE_OPTIONS,
  },
  {
    id: "startMode",
    label: "Start after creation (--start)",
    options: WORKTREE_STACK_KIT_OPENTUI_CREATE_START_MODE_OPTIONS,
  },
  {
    id: "openWindsurf",
    label: "Open Windsurf (--open-windsurf)",
    options: WORKTREE_STACK_KIT_OPENTUI_CREATE_OPEN_WINDSURF_OPTIONS,
  },
];

/** Navigation option that advances from the create form to command preview. */
export const WORKTREE_STACK_KIT_OPENTUI_CREATE_CONTINUE_TAB: WorktreeStackKit_OpenTuiSelectOption =
  { description: "Preview command", name: "Continue", value: "next" };

/** Builds the continue/menu/quit selector options for the create form panel. */
export function WorktreeStackKit_buildOpenTuiCreateFormOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [
    WORKTREE_STACK_KIT_OPENTUI_CREATE_CONTINUE_TAB,
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Whether the create preview should render for the current action-scroll flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiCreatePreviewPanel(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return options.flow === "create" && options.phase === "preview";
}

/** Builds the run/back selector options for the create preview panel. */
export function WorktreeStackKit_buildOpenTuiCreatePreviewOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [...WORKTREE_STACK_KIT_OPENTUI_PREVIEW_TABS];
}

/** Plans state transitions for create preview navigation. */
export function WorktreeStackKit_planOpenTuiCreatePreviewSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiCreatePreviewSelectionPlan {
  switch (options.optionValue) {
    case "back":
      return { nextPhase: "form", type: "back" };
    case "run":
      return { type: "run" };
    default:
      return { type: "ignore" };
  }
}

/** Plans state transitions or side-effect requests for create-form navigation. */
export function WorktreeStackKit_planOpenTuiCreateFormSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiCreateFormSelectionPlan {
  switch (options.optionValue) {
    case "next":
      return { type: "preview" };
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    default:
      return { type: "ignore" };
  }
}

/** Seeds the create form from explicit project defaults and package-owned UI defaults. */
export function WorktreeStackKit_createOpenTuiCreateFormModel(
  defaults: WorktreeStackKit_OpenTuiCreateFormDefaults,
): WorktreeStackKit_UiCreateFormModel {
  return {
    baseBranch: defaults.baseBranch,
    copyEnvFromMain: false,
    installPreferOffline: true,
    installSkipExisting: false,
    metadataSource: defaults.metadataSource,
    openWindsurf: false,
    realm: "",
    rootBranch: "",
    runInstall: true,
    slot: "",
    stackName: "",
    startMode: "none",
    submoduleBranch: "",
    worktreePathOverride: "",
    worktreesBase: defaults.worktreesBase,
  };
}

/** Reads a text-field value from the create form model. */
export function WorktreeStackKit_getOpenTuiCreateTextValue(options: {
  readonly fieldId: WorktreeStackKit_OpenTuiCreateTextFieldId;
  readonly model: WorktreeStackKit_UiCreateFormModel;
}): string {
  switch (options.fieldId) {
    case "baseBranch":
      return options.model.baseBranch;
    case "realm":
      return options.model.realm;
    case "rootBranch":
      return options.model.rootBranch;
    case "slot":
      return options.model.slot;
    case "stackName":
      return options.model.stackName;
    case "submoduleBranch":
      return options.model.submoduleBranch;
    case "worktreePathOverride":
      return options.model.worktreePathOverride;
    case "worktreesBase":
      return options.model.worktreesBase;
  }
}

/** Applies one text-input edit to the create form model. */
export function WorktreeStackKit_applyOpenTuiCreateTextChange(options: {
  readonly fieldId: WorktreeStackKit_OpenTuiCreateTextFieldId;
  readonly model: WorktreeStackKit_UiCreateFormModel;
  readonly value: string;
}): WorktreeStackKit_UiCreateFormModel {
  switch (options.fieldId) {
    case "baseBranch":
      return { ...options.model, baseBranch: options.value };
    case "realm":
      return { ...options.model, realm: options.value };
    case "rootBranch":
      return { ...options.model, rootBranch: options.value };
    case "slot":
      return { ...options.model, slot: options.value };
    case "stackName":
      return { ...options.model, stackName: options.value };
    case "submoduleBranch":
      return { ...options.model, submoduleBranch: options.value };
    case "worktreePathOverride":
      return { ...options.model, worktreePathOverride: options.value };
    case "worktreesBase":
      return { ...options.model, worktreesBase: options.value };
  }
}

/** Applies one select option to the create form model, ignoring unexpected option payloads. */
export function WorktreeStackKit_applyOpenTuiCreateSelectChange(options: {
  readonly fieldId: WorktreeStackKit_OpenTuiCreateSelectFieldId;
  readonly model: WorktreeStackKit_UiCreateFormModel;
  readonly value: string;
}): WorktreeStackKit_UiCreateFormModel {
  switch (options.fieldId) {
    case "copyEnvFromMain":
      return WorktreeStackKit_applyOpenTuiCreateBooleanSelect({
        booleanKey: "copyEnvFromMain",
        model: options.model,
        value: options.value,
      });
    case "installPreferOffline":
      return WorktreeStackKit_applyOpenTuiCreateBooleanSelect({
        booleanKey: "installPreferOffline",
        model: options.model,
        value: options.value,
      });
    case "installSkipExisting":
      return WorktreeStackKit_applyOpenTuiCreateBooleanSelect({
        booleanKey: "installSkipExisting",
        model: options.model,
        value: options.value,
      });
    case "openWindsurf":
      return WorktreeStackKit_applyOpenTuiCreateBooleanSelect({
        booleanKey: "openWindsurf",
        model: options.model,
        value: options.value,
      });
    case "runInstall":
      return WorktreeStackKit_applyOpenTuiCreateBooleanSelect({
        booleanKey: "runInstall",
        model: options.model,
        value: options.value,
      });
    case "startMode":
      return WorktreeStackKit_applyOpenTuiCreateStartModeSelect({
        model: options.model,
        value: options.value,
      });
  }
}

type WorktreeStackKit_OpenTuiCreateBooleanKey =
  | "copyEnvFromMain"
  | "installPreferOffline"
  | "installSkipExisting"
  | "openWindsurf"
  | "runInstall";

function WorktreeStackKit_applyOpenTuiCreateBooleanSelect(options: {
  readonly booleanKey: WorktreeStackKit_OpenTuiCreateBooleanKey;
  readonly model: WorktreeStackKit_UiCreateFormModel;
  readonly value: string;
}): WorktreeStackKit_UiCreateFormModel {
  const booleanValue = WorktreeStackKit_parseOpenTuiCreateBooleanSelect(
    options.value,
  );
  if (booleanValue === null) {
    return options.model;
  }

  switch (options.booleanKey) {
    case "copyEnvFromMain":
      return { ...options.model, copyEnvFromMain: booleanValue };
    case "installPreferOffline":
      return { ...options.model, installPreferOffline: booleanValue };
    case "installSkipExisting":
      return { ...options.model, installSkipExisting: booleanValue };
    case "openWindsurf":
      return { ...options.model, openWindsurf: booleanValue };
    case "runInstall":
      return { ...options.model, runInstall: booleanValue };
  }
}

function WorktreeStackKit_parseOpenTuiCreateBooleanSelect(
  value: string,
): boolean | null {
  if (value === "yes") {
    return true;
  }
  if (value === "no") {
    return false;
  }
  return null;
}

function WorktreeStackKit_applyOpenTuiCreateStartModeSelect(options: {
  readonly model: WorktreeStackKit_UiCreateFormModel;
  readonly value: string;
}): WorktreeStackKit_UiCreateFormModel {
  if (
    options.value === "none" ||
    options.value === "terminal" ||
    options.value === "iterm"
  ) {
    return { ...options.model, startMode: options.value };
  }
  return options.model;
}
