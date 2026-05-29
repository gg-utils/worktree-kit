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
import { type WorktreeStackKit_OpenTuiPendingNpmRun } from "./opentui-npm-panels.js";
import { type WorktreeStackKit_OpenTuiMaintenanceScriptPaths } from "./opentui-maintenance-panels.js";
import { type WorktreeStackKit_OpenTuiCreateWizardScriptPaths } from "./opentui-create-wizard-panels.js";
import type { WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord } from "./ink-ui-contracts.js";
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiPhase, WorktreeStackKit_OpenTuiPoolKind } from "./opentui-shell-contracts.js";
import type { WorktreeStackKit_UiCreateFormModel, WorktreeStackKit_UiExecutionMode, WorktreeStackKit_UiSwitchFormModel, WorktreeStackKit_UiUpdateMode } from "./ui-command-catalog.js";
import type { WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions } from "./opentui-create-wizard-form-plans.js";
/** Project configuration injected into the package-owned OpenTUI action-scroll orchestrator. */
export interface WorktreeStackKit_OpenTuiActionScrollConfig {
    readonly bootstrapInstallDescription: string;
    readonly createScriptPaths: WorktreeStackKit_OpenTuiCreateWizardScriptPaths;
    readonly createTextFieldLabelOptions: WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions;
    readonly diagnosticsPoolCommands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
    readonly maintenanceScriptPaths: WorktreeStackKit_OpenTuiMaintenanceScriptPaths;
    readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
    readonly switchScriptPaths: {
        readonly switch: string;
    };
    readonly targetBranch: string;
}
/** Props bundle for the non-menu action scroll panel. */
export interface WorktreeStackKit_OpenTuiActionScrollProps extends WorktreeStackKit_OpenTuiActionScrollConfig {
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
    readonly setPendingNpmRun: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPendingNpmRun | null>>;
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
export declare function WorktreeStackKit_OpenTuiActionScroll(props: WorktreeStackKit_OpenTuiActionScrollProps): import("react").ReactNode;
//# sourceMappingURL=opentui-action-scroll.d.ts.map