/**
 * @fileoverview Package-owned OpenTUI action-scroll orchestrator for non-menu worktree flows.
 *
 * Project adapters inject command names, direct TSX script paths, labels, and host quit behavior
 * while this module owns the reusable panel ordering that composes create, record-scoped npm,
 * diagnostics, maintenance, switch, global, and run/result panels.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_OpenTuiActionScroll } from "@gg-utils/worktree-kit/opentui-action-scroll";
 *
 * // Host assembles `WorktreeStackKit_OpenTuiActionScrollProps` from shell state, then renders:
 * <WorktreeStackKit_OpenTuiActionScroll {...props} />;
 * ```
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI shell that mounts this action-scroll stack while a main-menu action is active instead of the idle menu layout.
 * @see packages/worktree-kit/src/opentui-action-scroll.unit.test.ts - Node test runner regression file that asserts the stacked panel wiring owned by this orchestrator.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract that governs the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import type { WorktreeStackKit_OpenTuiDiagnosticsPoolCommands } from "./opentui-action-scroll-diagnostics-pool-plans.js";
import type { WorktreeStackKit_OpenTuiBootstrapSeedFacts } from "./opentui-action-scroll-maintenance-plans.js";
import type { WorktreeStackKit_OpenTuiGlobalNpmScripts } from "./opentui-action-scroll-global-plans.js";
import {
  WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel,
  WorktreeStackKit_OpenTuiActionScrollMergeFormPanel,
  WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel,
  WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel,
  WorktreeStackKit_OpenTuiActionScrollStartFormPanel,
  WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel,
  type WorktreeStackKit_OpenTuiPendingNpmRun,
} from "./opentui-npm-panels.js";
import {
  WorktreeStackKit_OpenTuiActionScrollBootstrapPanel,
  WorktreeStackKit_OpenTuiActionScrollRepairPanel,
  WorktreeStackKit_OpenTuiActionScrollSyncPanel,
  type WorktreeStackKit_OpenTuiMaintenanceScriptPaths,
} from "./opentui-maintenance-panels.js";
import { WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel } from "./opentui-worktree-pick-panel.js";
import { WorktreeStackKit_OpenTuiActionScrollStateCheckPanel } from "./opentui-global-panels.js";
import { WorktreeStackKit_OpenTuiActionScrollPruneStalePanel } from "./opentui-global-panels.js";
import { WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels } from "./opentui-global-panels.js";
import { WorktreeStackKit_OpenTuiActionScrollSwitchPanel } from "./opentui-switch-panel.js";
import {
  WorktreeStackKit_OpenTuiCreateWizardForm,
  WorktreeStackKit_OpenTuiCreateWizardPreview,
  type WorktreeStackKit_OpenTuiCreateWizardScriptPaths,
} from "./opentui-create-wizard-panels.js";
import { WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel } from "./opentui-diagnostics-pool-panel.js";
import type {
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
  WorktreeStackKit_OpenTuiPoolKind,
} from "./opentui-shell-contracts.js";
import type {
  WorktreeStackKit_UiCreateFormModel,
  WorktreeStackKit_UiExecutionMode,
  WorktreeStackKit_UiSwitchFormModel,
  WorktreeStackKit_UiUpdateMode,
} from "./ui-command-catalog.js";
import type { WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions } from "./opentui-create-wizard-form-plans.js";

/** Project configuration injected into the package-owned OpenTUI action-scroll orchestrator. */
export interface WorktreeStackKit_OpenTuiActionScrollConfig {
  readonly bootstrapInstallDescription: string;
  readonly createScriptPaths: WorktreeStackKit_OpenTuiCreateWizardScriptPaths;
  readonly createTextFieldLabelOptions: WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions;
  readonly diagnosticsPoolCommands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
  readonly maintenanceScriptPaths: WorktreeStackKit_OpenTuiMaintenanceScriptPaths;
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
  readonly switchScriptPaths: { readonly switch: string };
  readonly targetBranch: string;
}

/** Props bundle for the non-menu action scroll panel. */
export interface WorktreeStackKit_OpenTuiActionScrollProps
  extends WorktreeStackKit_OpenTuiActionScrollConfig {
  readonly bootstrapGoPreview: () => void;
  readonly commandPreview: string;
  readonly confirmTokenInput: string;
  readonly createArgv: string[];
  readonly createGoPreview: () => void;
  readonly createModel: WorktreeStackKit_UiCreateFormModel;
  readonly createPreviewError: string;
  readonly createPreviewText: string;
  readonly destroyPrune: boolean;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly formError: string;
  readonly getSelectedWorktreePath: () => string | null;
  readonly goMenu: () => void;
  readonly inventory: WorktreeStackKit_InkUiInventory | null;
  readonly manualWorktreePath: string;
  readonly mergeExec: WorktreeStackKit_UiExecutionMode;
  readonly pendingNpmRun: WorktreeStackKit_OpenTuiPendingNpmRun | null;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
  readonly poolNextStackName: string;
  readonly recordPickIndex: number;
  readonly recordSummary: (record: WorktreeStackKit_InkUiRecord) => string;
  readonly repairArgv: string[];
  readonly repairGoPreview: () => void;
  readonly repairWorktrees: string;
  readonly requestQuit: () => void;
  readonly requiredConfirmToken: string | null;
  readonly runNpmScript: (npmScript: string, forwarded: string[]) => Promise<void>;
  readonly runScript: string;
  readonly runSpawn: (scriptUnderRepo: string, argv: string[]) => Promise<void>;
  readonly runStatus: number | null;
  readonly runStderr: string;
  readonly runStdout: string;
  readonly seedReport: WorktreeStackKit_OpenTuiBootstrapSeedFacts;
  readonly setCommandPreview: Dispatch<SetStateAction<string>>;
  readonly setConfirmTokenInput: Dispatch<SetStateAction<string>>;
  readonly setCreateModel: Dispatch<SetStateAction<WorktreeStackKit_UiCreateFormModel>>;
  readonly setDestroyPrune: Dispatch<SetStateAction<boolean>>;
  readonly setFormError: Dispatch<SetStateAction<string>>;
  readonly setManualWorktreePath: Dispatch<SetStateAction<string>>;
  readonly setMergeExec: Dispatch<SetStateAction<WorktreeStackKit_UiExecutionMode>>;
  readonly setPendingNpmRun: Dispatch<
    SetStateAction<WorktreeStackKit_OpenTuiPendingNpmRun | null>
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setPoolKind: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPoolKind>>;
  readonly setPoolNextStackName: Dispatch<SetStateAction<string>>;
  readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
  readonly setRepairDryRun: Dispatch<SetStateAction<boolean>>;
  readonly setRepairIncludePkg: Dispatch<SetStateAction<boolean>>;
  readonly setRepairLegacyMissingOnly: Dispatch<SetStateAction<boolean>>;
  readonly setRepairWorktrees: Dispatch<SetStateAction<string>>;
  readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
  readonly setStartOpenWindsurf: Dispatch<SetStateAction<boolean>>;
  readonly setStateCheckFetch: Dispatch<SetStateAction<boolean>>;
  readonly setSwitchModel: Dispatch<SetStateAction<WorktreeStackKit_UiSwitchFormModel>>;
  readonly setSyncSource: Dispatch<SetStateAction<string>>;
  readonly setSyncWorktrees: Dispatch<SetStateAction<string>>;
  readonly setUpdateExec: Dispatch<SetStateAction<WorktreeStackKit_UiExecutionMode>>;
  readonly setUpdateMode: Dispatch<SetStateAction<WorktreeStackKit_UiUpdateMode>>;
  readonly startOpenWindsurf: boolean;
  readonly stateCheckFetch: boolean;
  readonly switchArgv: string[];
  readonly switchGoPreview: () => void;
  readonly switchModel: WorktreeStackKit_UiSwitchFormModel;
  readonly switchPreviewError: string;
  readonly switchPreviewText: string;
  readonly syncArgv: string[];
  readonly syncGoPreview: () => void;
  readonly syncSource: string;
  readonly syncWorktrees: string;
  readonly updateExec: WorktreeStackKit_UiExecutionMode;
  readonly updateMode: WorktreeStackKit_UiUpdateMode;
}

/** Renders the stacked wizard/runner panels shown when a main-menu action is active. */
export function WorktreeStackKit_OpenTuiActionScroll(
  props: WorktreeStackKit_OpenTuiActionScrollProps,
) {
  return (
    <>
      <WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel
        commands={props.diagnosticsPoolCommands}
        flow={props.flow}
        formError={props.formError}
        goMenu={props.goMenu}
        phase={props.phase}
        poolKind={props.poolKind}
        poolNextStackName={props.poolNextStackName}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setFormError={props.setFormError}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setPoolKind={props.setPoolKind}
        setPoolNextStackName={props.setPoolNextStackName}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
      />

      <WorktreeStackKit_OpenTuiActionScrollWorktreePickPanel
        flow={props.flow}
        goMenu={props.goMenu}
        manualWorktreePath={props.manualWorktreePath}
        phase={props.phase}
        records={WorktreeStackKit_buildOpenTuiActionScrollRecordOptions(props)}
        requestQuit={props.requestQuit}
        setManualWorktreePath={props.setManualWorktreePath}
        setPhase={props.setPhase}
        setRecordPickIndex={props.setRecordPickIndex}
      />

      <WorktreeStackKit_OpenTuiActionScrollStartFormPanel
        flow={props.flow}
        getSelectedWorktreePath={props.getSelectedWorktreePath}
        goMenu={props.goMenu}
        manualWorktreePath={props.manualWorktreePath}
        phase={props.phase}
        recordPickIndex={props.recordPickIndex}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setFormError={props.setFormError}
        setManualWorktreePath={props.setManualWorktreePath}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
        setStartOpenWindsurf={props.setStartOpenWindsurf}
        startOpenWindsurf={props.startOpenWindsurf}
      />

      <WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel
        destroyPrune={props.destroyPrune}
        flow={props.flow}
        getSelectedWorktreePath={props.getSelectedWorktreePath}
        goMenu={props.goMenu}
        manualWorktreePath={props.manualWorktreePath}
        phase={props.phase}
        recordPickIndex={props.recordPickIndex}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setDestroyPrune={props.setDestroyPrune}
        setFormError={props.setFormError}
        setManualWorktreePath={props.setManualWorktreePath}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
      />

      <WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel
        flow={props.flow}
        getSelectedWorktreePath={props.getSelectedWorktreePath}
        goMenu={props.goMenu}
        manualWorktreePath={props.manualWorktreePath}
        phase={props.phase}
        recordPickIndex={props.recordPickIndex}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setFormError={props.setFormError}
        setManualWorktreePath={props.setManualWorktreePath}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
        setUpdateExec={props.setUpdateExec}
        setUpdateMode={props.setUpdateMode}
        targetBranch={props.targetBranch}
        updateExec={props.updateExec}
        updateMode={props.updateMode}
      />

      <WorktreeStackKit_OpenTuiActionScrollMergeFormPanel
        flow={props.flow}
        getSelectedWorktreePath={props.getSelectedWorktreePath}
        goMenu={props.goMenu}
        manualWorktreePath={props.manualWorktreePath}
        mergeExec={props.mergeExec}
        phase={props.phase}
        recordPickIndex={props.recordPickIndex}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setFormError={props.setFormError}
        setManualWorktreePath={props.setManualWorktreePath}
        setMergeExec={props.setMergeExec}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
        targetBranch={props.targetBranch}
      />

      <WorktreeStackKit_OpenTuiActionScrollStateCheckPanel
        flow={props.flow}
        goMenu={props.goMenu}
        npmScripts={props.npmScripts}
        phase={props.phase}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
        setStateCheckFetch={props.setStateCheckFetch}
        stateCheckFetch={props.stateCheckFetch}
      />

      <WorktreeStackKit_OpenTuiActionScrollPruneStalePanel
        flow={props.flow}
        goMenu={props.goMenu}
        npmScripts={props.npmScripts}
        phase={props.phase}
        requestQuit={props.requestQuit}
        setCommandPreview={props.setCommandPreview}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
      />

      <WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel
        commandPreview={props.commandPreview}
        flow={props.flow}
        goMenu={props.goMenu}
        pendingNpmRun={props.pendingNpmRun}
        phase={props.phase}
        poolKind={props.poolKind}
        requiredConfirmToken={props.requiredConfirmToken}
        requestQuit={props.requestQuit}
        runNpmScript={props.runNpmScript}
        setConfirmTokenInput={props.setConfirmTokenInput}
        setPendingNpmRun={props.setPendingNpmRun}
        setPhase={props.setPhase}
        setRequiredConfirmToken={props.setRequiredConfirmToken}
      />

      <WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel
        confirmTokenInput={props.confirmTokenInput}
        formError={props.formError}
        goMenu={props.goMenu}
        pendingNpmRun={props.pendingNpmRun}
        phase={props.phase}
        requestQuit={props.requestQuit}
        requiredConfirmToken={props.requiredConfirmToken}
        runNpmScript={props.runNpmScript}
        setConfirmTokenInput={props.setConfirmTokenInput}
        setFormError={props.setFormError}
        setPhase={props.setPhase}
      />

      {props.flow === "create" && props.phase === "form" ? (
        <WorktreeStackKit_OpenTuiCreateWizardForm
          createGoPreview={props.createGoPreview}
          createModel={props.createModel}
          formError={props.formError}
          goMenu={props.goMenu}
          requestQuit={props.requestQuit}
          setCreateModel={props.setCreateModel}
          textFieldLabelOptions={props.createTextFieldLabelOptions}
        />
      ) : null}

      <WorktreeStackKit_OpenTuiCreateWizardPreview
        createArgv={props.createArgv}
        createPreviewError={props.createPreviewError}
        createPreviewText={props.createPreviewText}
        flow={props.flow}
        phase={props.phase}
        runSpawn={props.runSpawn}
        scriptPaths={props.createScriptPaths}
        setPhase={props.setPhase}
      />

      <WorktreeStackKit_OpenTuiActionScrollSwitchPanel
        flow={props.flow}
        formError={props.formError}
        goMenu={props.goMenu}
        phase={props.phase}
        requestQuit={props.requestQuit}
        runSpawn={props.runSpawn}
        scriptPaths={props.switchScriptPaths}
        setPhase={props.setPhase}
        setSwitchModel={props.setSwitchModel}
        switchArgv={props.switchArgv}
        switchGoPreview={props.switchGoPreview}
        switchModel={props.switchModel}
        switchPreviewError={props.switchPreviewError}
        switchPreviewText={props.switchPreviewText}
      />

      <WorktreeStackKit_OpenTuiActionScrollRepairPanel
        commandPreview={props.commandPreview}
        flow={props.flow}
        formError={props.formError}
        goMenu={props.goMenu}
        phase={props.phase}
        repairArgv={props.repairArgv}
        repairGoPreview={props.repairGoPreview}
        repairWorktrees={props.repairWorktrees}
        requestQuit={props.requestQuit}
        runSpawn={props.runSpawn}
        scriptPaths={{ repair: props.maintenanceScriptPaths.repair }}
        setPhase={props.setPhase}
        setRepairDryRun={props.setRepairDryRun}
        setRepairIncludePkg={props.setRepairIncludePkg}
        setRepairLegacyMissingOnly={props.setRepairLegacyMissingOnly}
        setRepairWorktrees={props.setRepairWorktrees}
      />

      <WorktreeStackKit_OpenTuiActionScrollSyncPanel
        commandPreview={props.commandPreview}
        flow={props.flow}
        formError={props.formError}
        goMenu={props.goMenu}
        phase={props.phase}
        requestQuit={props.requestQuit}
        runSpawn={props.runSpawn}
        scriptPaths={{ syncLocalFiles: props.maintenanceScriptPaths.syncLocalFiles }}
        setPhase={props.setPhase}
        setSyncSource={props.setSyncSource}
        setSyncWorktrees={props.setSyncWorktrees}
        syncArgv={props.syncArgv}
        syncGoPreview={props.syncGoPreview}
        syncSource={props.syncSource}
        syncWorktrees={props.syncWorktrees}
      />

      <WorktreeStackKit_OpenTuiActionScrollBootstrapPanel
        bootstrapGoPreview={props.bootstrapGoPreview}
        commandPreview={props.commandPreview}
        flow={props.flow}
        goMenu={props.goMenu}
        installDescription={props.bootstrapInstallDescription}
        phase={props.phase}
        requestQuit={props.requestQuit}
        runSpawn={props.runSpawn}
        scriptPaths={{ bootstrapInstall: props.maintenanceScriptPaths.bootstrapInstall }}
        seedReport={props.seedReport}
        setPhase={props.setPhase}
      />

      <WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels
        goMenu={props.goMenu}
        phase={props.phase}
        runScript={props.runScript}
        runStatus={props.runStatus}
        runStderr={props.runStderr}
        runStdout={props.runStdout}
      />
    </>
  );
}

function WorktreeStackKit_buildOpenTuiActionScrollRecordOptions(
  props: Pick<
    WorktreeStackKit_OpenTuiActionScrollProps,
    "inventory" | "recordSummary"
  >,
) {
  return (
    props.inventory?.records.map((record) => ({
      description: record.worktreePath,
      name: props.recordSummary(record),
    })) ?? null
  );
}
