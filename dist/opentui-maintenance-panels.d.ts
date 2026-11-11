/**
 * @fileoverview Package-owned OpenTUI maintenance panels for repair, sync-local-files, and platform
 * bootstrap flows.
 *
 * Project adapters inject direct TSX script paths, bootstrap copy, and quit side effects while this
 * module owns reusable OpenTUI rendering for repair, sync-local-files, bootstrap, and direct TSX
 * preview/run navigation.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-maintenance-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-maintenance-plans.ts - Option catalogs, visibility gates, and selection planners this module calls when wiring repair toggles, sync/bootstrap forms, and TSX preview actions.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Focusable tab-style select control reused here for boolean repair fields, form navigation, and preview/run choices.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that imports these panels and stacks them with other non-menu OpenTUI flows.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */
import type { Dispatch, SetStateAction } from "react";
import { type WorktreeStackKit_OpenTuiBootstrapSeedFacts } from "./opentui-action-scroll-maintenance-plans.js";
import type { WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiPhase } from "./opentui-shell-contracts.js";
/** Direct TSX script paths supplied by project OpenTUI adapters. */
export interface WorktreeStackKit_OpenTuiMaintenanceScriptPaths {
    readonly bootstrapInstall: string;
    readonly repair: string;
    readonly syncLocalFiles: string;
}
/** Common side-effect callbacks injected by project OpenTUI adapters. */
export interface WorktreeStackKit_OpenTuiMaintenanceSideEffects {
    readonly requestQuit: () => void;
    readonly runSpawn: (scriptUnderRepo: string, argv: string[]) => Promise<void>;
}
/** Props for the worktrees:repair form controls and direct TSX preview/run navigation. */
export interface WorktreeStackKit_OpenTuiActionScrollRepairPanelProps extends WorktreeStackKit_OpenTuiMaintenanceSideEffects {
    readonly commandPreview: string;
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly formError: string;
    readonly goMenu: () => void;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly repairArgv: string[];
    readonly repairGoPreview: () => void;
    readonly repairWorktrees: string;
    readonly scriptPaths: Pick<WorktreeStackKit_OpenTuiMaintenanceScriptPaths, "repair">;
    readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
    readonly setRepairDryRun: Dispatch<SetStateAction<boolean>>;
    readonly setRepairIncludePkg: Dispatch<SetStateAction<boolean>>;
    readonly setRepairLegacyMissingOnly: Dispatch<SetStateAction<boolean>>;
    readonly setRepairWorktrees: Dispatch<SetStateAction<string>>;
}
/** Renders worktrees:repair form controls and direct TSX preview/run navigation. */
export declare function WorktreeStackKit_OpenTuiActionScrollRepairPanel(props: WorktreeStackKit_OpenTuiActionScrollRepairPanelProps): import("react").ReactNode;
/** Props for worktrees:sync-local-files form controls and direct TSX preview/run navigation. */
export interface WorktreeStackKit_OpenTuiActionScrollSyncPanelProps extends WorktreeStackKit_OpenTuiMaintenanceSideEffects {
    readonly commandPreview: string;
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly formError: string;
    readonly goMenu: () => void;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly scriptPaths: Pick<WorktreeStackKit_OpenTuiMaintenanceScriptPaths, "syncLocalFiles">;
    readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
    readonly setSyncSource: Dispatch<SetStateAction<string>>;
    readonly setSyncWorktrees: Dispatch<SetStateAction<string>>;
    readonly syncArgv: string[];
    readonly syncGoPreview: () => void;
    readonly syncSource: string;
    readonly syncWorktrees: string;
}
/** Renders worktrees:sync-local-files form controls and direct TSX preview/run navigation. */
export declare function WorktreeStackKit_OpenTuiActionScrollSyncPanel(props: WorktreeStackKit_OpenTuiActionScrollSyncPanelProps): import("react").ReactNode;
/** Props for platform bootstrap seed diagnostics and direct TSX preview/run navigation. */
export interface WorktreeStackKit_OpenTuiActionScrollBootstrapPanelProps extends WorktreeStackKit_OpenTuiMaintenanceSideEffects {
    readonly bootstrapGoPreview: () => void;
    readonly commandPreview: string;
    readonly flow: WorktreeStackKit_OpenTuiFlow;
    readonly goMenu: () => void;
    readonly installDescription: string;
    readonly phase: WorktreeStackKit_OpenTuiPhase;
    readonly scriptPaths: Pick<WorktreeStackKit_OpenTuiMaintenanceScriptPaths, "bootstrapInstall">;
    readonly seedReport: WorktreeStackKit_OpenTuiBootstrapSeedFacts;
    readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
}
/** Renders platform bootstrap seed diagnostics and direct TSX preview/run navigation. */
export declare function WorktreeStackKit_OpenTuiActionScrollBootstrapPanel(props: WorktreeStackKit_OpenTuiActionScrollBootstrapPanelProps): import("react").ReactNode;
