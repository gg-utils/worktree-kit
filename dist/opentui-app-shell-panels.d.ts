/**
 * @fileoverview Package-owned OpenTUI app-shell renderers for worktree discovery chrome.
 *
 * Project adapters pass inventory records, copy side-effect callbacks, and focused-column state;
 * this module owns product-neutral header, discovery-list, detail, issue, and footer rendering over
 * package-owned OpenTUI view models and serializers.
 * Flow: inventory + selection props -> panel components -> OpenTUI elements and copy serialization hooks.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_OpenTuiShellHeader } from "./opentui-app-shell-panels.js";
 *
 * export function Example() {
 *   return <WorktreeStackKit_OpenTuiShellHeader inventory={null} />;
 * }
 * ```
 *
 * @testing CLI: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-app-shell-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Three-column OpenTUI worktree shell that imports these panel renderers for header, discovery column, detail, issues, and footer chrome.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - View-model builders that shape inventory header text, detail rows, issue rows, and footer key hints consumed by the components in this file.
 * @see packages/worktree-kit/src/opentui-shell-serializers.ts - Clipboard serializers invoked when the issues panel copies merged global and per-record diagnostics text.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TabSelectRenderable } from "@opentui/core";
import { type WorktreeStackKit_OpenTuiInventoryInput, type WorktreeStackKit_OpenTuiIssueInput, type WorktreeStackKit_OpenTuiRecordInput } from "./opentui-app-shell-view-model.js";
import type { WorktreeStackKit_OpenTuiCopyFlash, WorktreeStackKit_OpenTuiFlow, WorktreeStackKit_OpenTuiMenuColumn } from "./opentui-shell-contracts.js";
/** Renders title, subtitle, and loaded inventory summary counts. */
export declare function WorktreeStackKit_OpenTuiShellHeader(props: {
    readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
}): import("react").ReactNode;
/** Renders the worktrees column body for loading, empty, warning, and inventory states. */
export declare function WorktreeStackKit_renderOpenTuiWorktreesDiscoveryColumnBody(options: {
    readonly focusedColumn: WorktreeStackKit_OpenTuiMenuColumn;
    readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
    readonly inventoryLoadError: string | null;
    readonly setRecordPickIndex: Dispatch<SetStateAction<number>>;
    readonly worktreesTabRef: MutableRefObject<TabSelectRenderable | null>;
}): import("react").ReactNode;
/** Renders selected worktree path, branch, metadata, registry, health, and presence flags. */
export declare function WorktreeStackKit_OpenTuiDetailPanel(props: {
    readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
}): import("react").ReactNode;
/** Renders global and selected-record issues when either group is non-empty. */
export declare function WorktreeStackKit_OpenTuiIssuesPanel(props: {
    readonly copyFlash: WorktreeStackKit_OpenTuiCopyFlash;
    readonly globalIssues: readonly WorktreeStackKit_OpenTuiIssueInput[];
    readonly handleCopy: (panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>, text: string) => void;
    readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | undefined;
}): import("react").ReactNode;
/** Renders the keyboard shortcut legend at the bottom of the OpenTUI app shell. */
export declare function WorktreeStackKit_OpenTuiShellFooter(props: {
    readonly flow: WorktreeStackKit_OpenTuiFlow;
}): import("react").ReactNode;
