/**
 * @fileoverview Package-owned OpenTUI app controller for worktree-stack launch surfaces.
 *
 * Root scripts inject repository configuration, inventory loading, clipboard I/O, preview adapters,
 * and subprocess spawners. This package hook owns the reusable React state machine around the
 * worktree OpenTUI shell: menu flow, action-scroll props, copy flash, keyboard focus routing,
 * preview construction, run lifecycle state, and cleanup.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see scripts/worktree-stack/ui/cli-opentui/app.tsx - OpenTUI CLI host that injects repo inventory, clipboard, preview, and spawn adapters into WorktreeStackKit_useOpenTuiAppController before mounting the kit shell.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Render-only shell that receives shellProps and actionScrollProps assembled here for menu flow, previews, and run output chrome.
 * @see packages/worktree-kit/src/opentui-app-run-lifecycle.ts - Shared stdout/stderr append and phase transitions used when this controller spawns npm or TSX maintenance commands.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiInventory } from "./ink-ui-contracts.js";
import type { WorktreeStackKit_OpenTuiActionScrollConfig } from "./opentui-action-scroll.js";
import type { WorktreeStackKit_OpenTuiAppShellProps } from "./opentui-app-shell.js";
import { type WorktreeStackKit_OpenTuiRunOutputHandlers, type WorktreeStackKit_OpenTuiRunStartResult } from "./opentui-app-run-lifecycle.js";
import { type WorktreeStackKit_OpenTuiBootstrapSeedFacts } from "./opentui-action-scroll-maintenance-plans.js";
import { type WorktreeStackKit_OpenTuiCreateFormDefaults } from "./opentui-create-wizard-form-plans.js";
import { type WorktreeStackKit_OpenTuiCreatePreview, type WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem } from "./opentui-create-preview.js";
import { type WorktreeStackKit_OpenTuiKeyEventLike } from "./opentui-shell-keyboard.js";
type OpenTuiAppControllerPortSummaryItem<TPorts extends Readonly<Record<string, number>>> = WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem<TPorts>;
/** Input contract for host-owned inventory discovery. */
export type WorktreeStackKit_OpenTuiAppControllerLoadInventory = (options: {
    readonly projectRoot: string;
}) => Promise<WorktreeStackKit_InkUiInventory>;
/** Input contract for host-owned OpenTUI command spawners. */
export type WorktreeStackKit_OpenTuiAppControllerStartRun = (options: {
    readonly argv: string[];
    readonly handlers: WorktreeStackKit_OpenTuiRunOutputHandlers;
    readonly repoRoot: string;
    readonly script: string;
}) => WorktreeStackKit_OpenTuiRunStartResult;
/** Input contract for project-owned create-preview derivation. */
export type WorktreeStackKit_OpenTuiAppControllerPreviewCreate<TPorts extends Readonly<Record<string, number>>> = (options: {
    readonly dateToken: string;
    readonly repoRoot: string;
    readonly requestedRealmSlug: string;
    readonly slot: number;
    readonly stackName: string;
    readonly worktreePathOverride: string;
    readonly worktreesBase: string;
}) => WorktreeStackKit_OpenTuiCreatePreview<TPorts>;
/** Project configuration and side-effect adapters consumed by the package-owned controller. */
export interface WorktreeStackKit_OpenTuiAppControllerOptions<TPorts extends Readonly<Record<string, number>>> {
    readonly actionScrollConfig: WorktreeStackKit_OpenTuiActionScrollConfig;
    readonly bootstrapNpmScript: string;
    readonly bootstrapSeedFacts: WorktreeStackKit_OpenTuiBootstrapSeedFacts;
    readonly copyToClipboard: (text: string) => boolean;
    readonly createFormDefaults: WorktreeStackKit_OpenTuiCreateFormDefaults;
    readonly createPreviewPortSummaryItems: readonly OpenTuiAppControllerPortSummaryItem<TPorts>[];
    readonly defaultSyncSource: string;
    readonly loadInventory: WorktreeStackKit_OpenTuiAppControllerLoadInventory;
    readonly previewCreate: WorktreeStackKit_OpenTuiAppControllerPreviewCreate<TPorts>;
    readonly repoRoot: string;
    readonly requestQuit: () => void;
    readonly resolveDefaultWorktreesBase: (repoRoot: string) => string;
    readonly startNpmRun: WorktreeStackKit_OpenTuiAppControllerStartRun;
    readonly startTsxRun: WorktreeStackKit_OpenTuiAppControllerStartRun;
}
/** Return bundle passed directly into the package-owned OpenTUI app shell. */
export interface WorktreeStackKit_OpenTuiAppControllerResult {
    readonly handleKeyboardKey: (key: WorktreeStackKit_OpenTuiKeyEventLike) => void;
    readonly shellProps: WorktreeStackKit_OpenTuiAppShellProps;
}
/** Creates the reusable OpenTUI shell controller while keeping project I/O injected by scripts. */
export declare function WorktreeStackKit_useOpenTuiAppController<TPorts extends Readonly<Record<string, number>>>(options: WorktreeStackKit_OpenTuiAppControllerOptions<TPorts>): WorktreeStackKit_OpenTuiAppControllerResult;
export {};
//# sourceMappingURL=opentui-app-controller.d.ts.map