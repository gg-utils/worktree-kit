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
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiPhase, WorktreeStackKit_OpenTuiPoolKind } from "./opentui-shell-contracts.js";
import type { WorktreeStackKit_UiExecutionMode, WorktreeStackKit_UiUpdateMode } from "./ui-command-catalog.js";
/** Pending npm-run request rendered by preview/confirmation panels. */
export interface WorktreeStackKit_OpenTuiPendingNpmRun {
    readonly forwarded: string[];
    readonly script: string;
}
interface WorktreeStackKit_OpenTuiNpmPanelSideEffects {
    readonly requestQuit: () => void;
}
interface WorktreeStackKit_OpenTuiRecordScopedPanelBase extends WorktreeStackKit_OpenTuiNpmPanelSideEffects {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly getSelectedWorktreePath: () => string | null;
    readonly goMenu: () => void;
    readonly manualWorktreePath: string;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly recordPickIndex: number;
    readonly setCommandPreview: Dispatch<SetStateAction<string>>;
    readonly setFormError: Dispatch<SetStateAction<string>>;
    readonly setManualWorktreePath: Dispatch<SetStateAction<string>>;
    readonly setPendingNpmRun: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPendingNpmRun | null>>;
    readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
    readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}
/** Props for the worktrees:start record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollStartFormPanelProps extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
    readonly setStartOpenWindsurf: Dispatch<SetStateAction<boolean>>;
    readonly startOpenWindsurf: boolean;
}
/** Props for the worktrees:destroy record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollDestroyFormPanelProps extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
    readonly destroyPrune: boolean;
    readonly setDestroyPrune: Dispatch<SetStateAction<boolean>>;
}
/** Props for the worktrees:update-from-main record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanelProps extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
    readonly setUpdateExec: Dispatch<SetStateAction<WorktreeStackKit_UiExecutionMode>>;
    readonly setUpdateMode: Dispatch<SetStateAction<WorktreeStackKit_UiUpdateMode>>;
    readonly targetBranch: string;
    readonly updateExec: WorktreeStackKit_UiExecutionMode;
    readonly updateMode: WorktreeStackKit_UiUpdateMode;
}
/** Props for the worktrees:merge record-scoped form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollMergeFormPanelProps extends WorktreeStackKit_OpenTuiRecordScopedPanelBase {
    readonly mergeExec: WorktreeStackKit_UiExecutionMode;
    readonly setMergeExec: Dispatch<SetStateAction<WorktreeStackKit_UiExecutionMode>>;
    readonly targetBranch: string;
}
/** Props for the generic npm preview panel. */
export interface WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanelProps extends WorktreeStackKit_OpenTuiNpmPanelSideEffects {
    readonly commandPreview: string;
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly goMenu: () => void;
    readonly pendingNpmRun: WorktreeStackKit_OpenTuiPendingNpmRun | null;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
    readonly requiredConfirmToken: string | null;
    readonly runNpmScript: (npmScript: string, forwarded: string[]) => Promise<void>;
    readonly setConfirmTokenInput: Dispatch<SetStateAction<string>>;
    readonly setPendingNpmRun: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPendingNpmRun | null>>;
    readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
    readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}
/** Props for the guarded npm confirmation panel. */
export interface WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanelProps extends WorktreeStackKit_OpenTuiNpmPanelSideEffects {
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
export declare function WorktreeStackKit_OpenTuiActionScrollStartFormPanel(props: WorktreeStackKit_OpenTuiActionScrollStartFormPanelProps): import("react").ReactNode;
/** Destroy-flow flag form for worktrees:destroy preview handoff. */
export declare function WorktreeStackKit_OpenTuiActionScrollDestroyFormPanel(props: WorktreeStackKit_OpenTuiActionScrollDestroyFormPanelProps): import("react").ReactNode;
/** Update-from-main flag form for worktrees:update-from-main preview handoff. */
export declare function WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanel(props: WorktreeStackKit_OpenTuiActionScrollUpdateFromMainFormPanelProps): import("react").ReactNode;
/** Merge-flow flag form for worktrees:merge preview handoff. */
export declare function WorktreeStackKit_OpenTuiActionScrollMergeFormPanel(props: WorktreeStackKit_OpenTuiActionScrollMergeFormPanelProps): import("react").ReactNode;
/** npm-run preview panel with optional confirm token gate before execution. */
export declare function WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanel(props: WorktreeStackKit_OpenTuiActionScrollNpmPreviewPanelProps): import("react").ReactNode;
/** Token confirmation gate immediately before a guarded npm run. */
export declare function WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanel(props: WorktreeStackKit_OpenTuiActionScrollNpmConfirmPanelProps): import("react").ReactNode;
export {};
//# sourceMappingURL=opentui-npm-panels.d.ts.map