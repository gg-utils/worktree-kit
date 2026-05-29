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
import { type WorktreeStackKit_OpenTuiCreateTextFieldLabelOptions, type WorktreeStackKit_UiCreateFormModel } from "./opentui-create-wizard-form-plans.js";
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiPhase } from "./opentui-shell-contracts.js";
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
export declare function WorktreeStackKit_OpenTuiCreateWizardForm(props: WorktreeStackKit_OpenTuiCreateWizardFormProps): import("react").ReactNode;
/** Renders the create command preview plus run/back navigation. */
export declare function WorktreeStackKit_OpenTuiCreateWizardPreview(props: WorktreeStackKit_OpenTuiCreateWizardPreviewProps): import("react").ReactNode;
//# sourceMappingURL=opentui-create-wizard-panels.d.ts.map