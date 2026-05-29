/**
 * @fileoverview Package-owned OpenTUI worktree app-shell layout and main-menu routing around the action-scroll panel.
 *
 * Root adapters inject inventory loading, clipboard side effects, subprocess preview callbacks, and
 * local config while this module owns the reusable three-column OpenTUI layout, header/detail/issue
 * rendering, discovery list rendering, footer chrome, copy serialization, and main-menu transition
 * routing into embedded action-scroll flows.
 * Flow: shell props + tab refs -> column panels -> menu availability plan -> setFlow/setPhase/column focus and optional run-artifact resets.
 *
 * @testing CLI: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-app-shell.unit.test.ts
 * @testing CLI: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-shell-panels.tsx - Header, worktrees discovery column, issues, detail, footer, and action-scroll host panels composed by this shell layout.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Scrollable action runner panel mounted in the detail column when the shell leaves the main menu flow.
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.ts - Menu option catalog and selection planner invoked from the actions column tab-select handler in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TabSelectRenderable } from "@opentui/core";
import type { WorktreeStackKit_OpenTuiActionScrollProps } from "./opentui-action-scroll.js";
import type { WorktreeStackKit_OpenTuiCopyFlash, WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiMenuColumn } from "./opentui-shell-contracts.js";
/** Host clipboard callback retained by root adapters. */
export type WorktreeStackKit_OpenTuiAppShellCopyHandler = (panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>, text: string) => void;
/** Props for the package-owned OpenTUI app shell layout. */
export interface WorktreeStackKit_OpenTuiAppShellProps {
    readonly actionScrollProps: WorktreeStackKit_OpenTuiActionScrollProps;
    readonly actionsTabRef: MutableRefObject<TabSelectRenderable | null>;
    readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
    readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
    readonly handleCopy: WorktreeStackKit_OpenTuiAppShellCopyHandler;
    readonly inventoryLoadError: string | null;
    readonly resetRunArtifacts: () => void;
    readonly setFocusedColumn: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiMenuColumn>>;
    readonly setFlow: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiFlow>>;
    readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
    readonly worktreesTabRef: MutableRefObject<TabSelectRenderable | null>;
}
/** Renders the full OpenTUI worktree app shell around the active action-scroll panel. */
export declare function WorktreeStackKit_OpenTuiAppShell(props: WorktreeStackKit_OpenTuiAppShellProps): import("react").ReactNode;
//# sourceMappingURL=opentui-app-shell.d.ts.map