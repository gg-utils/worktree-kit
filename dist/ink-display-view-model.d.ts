/**
 * @fileoverview Pure display and tone helpers for worktree Ink shells.
 *
 * React/Ink components, inventory resolution, command execution, and project-specific create-draft
 * defaults stay in script adapters. This module owns reusable command-preview strings, keyboard
 * hints, status tones, confirmation normalization, and create-field display extraction for any
 * worktree Ink UI that supplies explicit structural inputs.
 *
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/ink-display-view-model.unit.test.ts - Node regression tests covering command-preview strings, status tones, editor key hints, confirmation sanitization, and create-field display extraction owned by this module.
 * @see packages/worktree-kit/src/ink-fullscreen-view-model.ts - Fullscreen Ink view-model helpers that import these display primitives to keep TSX renderers thin and renderer-agnostic.
 * @see packages/worktree-kit/src/ink-launch-options.ts - Launcher argv and action-id types (`WorktreeStackKit_InkCreateDraft`, `WorktreeStackKit_InkActionId`) that define the minimal structural inputs these helpers consume.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-app-display-helpers.ts - Worktree-stack CLI adapter importing the published `@gg-utils/worktree-kit/ink-display-view-model` surface after resolving project-specific create-draft defaults.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkActionId, WorktreeStackKit_InkCreateDraft } from "./ink-launch-options.js";
import type { WorktreeStackKit_InkCreateFieldId } from "./ink-create-model.js";
/** Minimal command request shape needed to render an Ink command preview. */
export type WorktreeStackKit_InkCommandPreviewRequestInput = {
    readonly args: readonly string[];
    readonly command: string;
};
/** Minimal action-plan shape needed by package-owned display helpers. */
export type WorktreeStackKit_InkActionPlanDisplayInput = {
    readonly request: WorktreeStackKit_InkCommandPreviewRequestInput | null;
};
/** Minimal action-definition shape needed by keyboard-hint helpers. */
export type WorktreeStackKit_InkActionDefinitionDisplayInput = {
    readonly id: WorktreeStackKit_InkActionId;
};
/** Live session lifecycle states rendered by Ink status badges. */
export type WorktreeStackKit_InkDisplaySessionStatus = "queued" | "starting" | "watching-sidecars" | "running" | "cancelling";
/** Post-execution result states rendered by Ink status badges. */
export type WorktreeStackKit_InkResultStatus = "blocked" | "cancelled" | "failed" | "succeeded";
/** Create-flow focus regions rendered in Ink keyboard legends. */
export type WorktreeStackKit_InkDisplayCreateRegion = "editor" | "fields" | "preview" | "sections";
/** Ink badge tone names shared between view-model helpers and script renderers. */
export type WorktreeStackKit_InkStatusTone = "blocked" | "destructive" | "info" | "ready" | "warning";
/** Ink text color names shared between view-model helpers and script renderers. */
export type WorktreeStackKit_InkTextColor = "gray" | "red" | "white";
/** Joins a command name and args array into a single display command line. */
export declare function WorktreeStackKit_formatInkCliCommandLine(options: {
    readonly args: readonly string[];
    readonly command: string;
}): string;
/** Formats the planned CLI invocation for preview, or a blocked placeholder. */
export declare function WorktreeStackKit_renderInkCommandPreview(plan: WorktreeStackKit_InkActionPlanDisplayInput): string;
/** Strips newline characters from typed confirmation input. */
export declare function WorktreeStackKit_sanitizeInkReviewConfirmationInput(input: string): string;
/** Maps bridge/stderr session sources to Ink text colors. */
export declare function WorktreeStackKit_getInkSessionOutputColor(source: string): WorktreeStackKit_InkTextColor;
/** Per-action keyboard legend string for the inline editor column. */
export declare function WorktreeStackKit_getInkActionEditorKeyHint(actionDefinition: WorktreeStackKit_InkActionDefinitionDisplayInput): string;
/** Classifies whether the built plan can execute or is missing prerequisites. */
export declare function WorktreeStackKit_getInkActionPlanTone(actionPlan: WorktreeStackKit_InkActionPlanDisplayInput): "ready" | "blocked";
/** Maps live session lifecycle states to status badge tones. */
export declare function WorktreeStackKit_getInkSessionStatusTone(sessionStatus: WorktreeStackKit_InkDisplaySessionStatus): "info" | "warning" | "ready";
/** Maps post-execution result states to destructive, warning, or ready tones. */
export declare function WorktreeStackKit_getInkResultStatusTone(resultStatus: WorktreeStackKit_InkResultStatus): "ready" | "warning" | "destructive";
/** Human-readable label for the focused create-flow UI region. */
export declare function WorktreeStackKit_getInkCreateRegionLabel(region: WorktreeStackKit_InkDisplayCreateRegion): string;
/** Reads a string draft fragment for text-backed create fields. */
export declare function WorktreeStackKit_getInkCreateDraftInputValue(options: {
    readonly createDraft: WorktreeStackKit_InkCreateDraft;
    readonly fieldId: WorktreeStackKit_InkCreateFieldId;
}): string;
/** Reads a boolean draft fragment for chip-backed create fields. */
export declare function WorktreeStackKit_getInkCreateFieldBooleanValue(options: {
    readonly createDraft: WorktreeStackKit_InkCreateDraft;
    readonly fieldId: WorktreeStackKit_InkCreateFieldId;
}): boolean;
/** Formats a create-field value from a resolved/defaulted draft for display. */
export declare function WorktreeStackKit_getInkCreateFieldDisplayValue(options: {
    readonly fieldId: WorktreeStackKit_InkCreateFieldId;
    readonly resolvedDraft: WorktreeStackKit_InkCreateDraft;
}): string;
//# sourceMappingURL=ink-display-view-model.d.ts.map