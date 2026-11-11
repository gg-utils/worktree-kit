/**
 * @fileoverview Pure view-model helpers for worktree Ink full-screen flows.
 *
 * Script adapters keep React/Ink components, project inventory loading, action-option controls,
 * process output widgets, and subprocess side effects. This module owns renderer-agnostic models
 * for the create wizard, action editor, review gate, live session, and result diagnostics so root
 * TSX files can stay focused on wiring package data into terminal components.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-fullscreen-view-model.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-fullscreen-screens.tsx - Full-screen Ink screen components that consume these builder outputs to render headers, legends, tables, and session output without duplicating plan or draft logic.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI action-plan, create-draft, session-line, and result contracts this module shapes into fullscreen header, preview, and diagnostics models.
 * @see packages/worktree-kit/src/ink-display-view-model.ts - Command-preview rendering and tone helpers composed here so fullscreen models stay aligned with the rest of the Ink shell display vocabulary.
 * @see packages/worktree-kit/src/ink-fullscreen-view-model.unit.test.ts - Node test runner regression coverage for create, action, review, session, and result fullscreen model builders owned by this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_InkCreateFieldId, type WorktreeStackKit_InkCreateSectionId } from "./ink-create-model.js";
import { type WorktreeStackKit_InkCreateResolutionConfig } from "./ink-create-resolution.js";
import type { WorktreeStackKit_InkUiActionDefinition, WorktreeStackKit_InkUiActionRequestPlan, WorktreeStackKit_InkUiCreateDraft, WorktreeStackKit_InkUiCreateHandoff, WorktreeStackKit_InkUiCreateInteractionMode, WorktreeStackKit_InkUiCreateRegion, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiIssue, WorktreeStackKit_InkUiResultModel, WorktreeStackKit_InkUiRetainedArtifact, WorktreeStackKit_InkUiSessionLine, WorktreeStackKit_InkUiSessionModel } from "./ink-ui-contracts.js";
/** Badge tones emitted by full-screen view-model helpers for script renderers. */
export type WorktreeStackKit_InkFullscreenBadgeTone = "blocked" | "destructive" | "editing" | "info" | "ready" | "warning";
/** Text colors emitted by full-screen view-model helpers for script renderers. */
export type WorktreeStackKit_InkFullscreenTextTone = "cyan" | "gray" | "green" | "red" | "yellow";
/** Header metadata shared by the full-screen create/action/review/session/result flows. */
export type WorktreeStackKit_InkFullscreenHeaderModel = {
    readonly badgeLabel: string;
    readonly badgeTone: WorktreeStackKit_InkFullscreenBadgeTone;
    readonly description: string | null;
    readonly summaryText: string | null;
    readonly title: string;
};
/** One navigator row in the create wizard section column. */
export type WorktreeStackKit_InkFullscreenCreateSectionRow = {
    readonly id: WorktreeStackKit_InkCreateSectionId;
    readonly label: string;
    readonly marker: ">" | " ";
    readonly selected: boolean;
    readonly tone: "cyan" | null;
};
/** One field row in the create wizard field column. */
export type WorktreeStackKit_InkFullscreenCreateFieldRow = {
    readonly booleanValue: boolean | null;
    readonly displayValue: string;
    readonly editing: boolean;
    readonly id: WorktreeStackKit_InkCreateFieldId;
    readonly isBoolean: boolean;
    readonly label: string;
    readonly marker: ">" | " ";
    readonly selected: boolean;
    readonly tone: "cyan" | null;
};
/** Active editor details for the selected create field. */
export type WorktreeStackKit_InkFullscreenCreateEditorFieldModel = {
    readonly booleanValue: boolean | null;
    readonly description: string;
    readonly inputValue: string | null;
    readonly isBoolean: boolean;
    readonly label: string;
    readonly modeLabel: "browse" | "editing";
    readonly resolvedValue: string | null;
    readonly sectionLabel: string;
};
/** Simple label/value row used by full-screen details and previews. */
export type WorktreeStackKit_InkFullscreenDetailRow = {
    readonly key: string;
    readonly label: string;
    readonly value: string;
};
/** Renderer-agnostic model for the full-screen create wizard. */
export type WorktreeStackKit_InkFullscreenCreateEditorModel = {
    readonly commandPreview: string;
    readonly editorField: WorktreeStackKit_InkFullscreenCreateEditorFieldModel | null;
    readonly editorFooterHint: string;
    readonly fieldRows: readonly WorktreeStackKit_InkFullscreenCreateFieldRow[];
    readonly header: WorktreeStackKit_InkFullscreenHeaderModel;
    readonly legendLines: readonly string[];
    readonly noIssuesText: string;
    readonly previewBadgeLabel: string;
    readonly previewBadgeTone: WorktreeStackKit_InkFullscreenBadgeTone;
    readonly previewRows: readonly WorktreeStackKit_InkFullscreenDetailRow[];
    readonly preflightIssues: readonly WorktreeStackKit_InkUiIssue[];
    readonly sectionDescription: string | null;
    readonly sectionRows: readonly WorktreeStackKit_InkFullscreenCreateSectionRow[];
    readonly selectedSectionLabel: string;
    readonly summaryLines: readonly string[];
};
/** Renderer-agnostic model for the non-create action editor. */
export type WorktreeStackKit_InkFullscreenActionEditorModel = {
    readonly commandPreview: string;
    readonly header: WorktreeStackKit_InkFullscreenHeaderModel;
    readonly legendLines: readonly string[];
    readonly noIssuesText: string;
    readonly preflightIssues: readonly WorktreeStackKit_InkUiIssue[];
    readonly summaryLines: readonly string[];
    readonly targetText: string;
};
/** Renderer-agnostic model for the typed confirmation review gate. */
export type WorktreeStackKit_InkFullscreenReviewModel = {
    readonly commandPreview: string;
    readonly currentInputDisplay: string;
    readonly currentInputTone: "green" | "yellow";
    readonly destructiveConfirmationText: string | null;
    readonly header: WorktreeStackKit_InkFullscreenHeaderModel;
    readonly legendLines: readonly string[];
    readonly noIssuesText: string;
    readonly requiredConfirmationToken: string | null;
    readonly retainedArtifacts: readonly WorktreeStackKit_InkUiRetainedArtifact[];
    readonly reviewConfirmed: boolean;
    readonly reviewIssues: readonly WorktreeStackKit_InkUiIssue[];
    readonly summaryLines: readonly string[];
};
/** Renderer-agnostic model for the live session screen. */
export type WorktreeStackKit_InkFullscreenSessionModel = {
    readonly commandPreview: string;
    readonly header: WorktreeStackKit_InkFullscreenHeaderModel;
    readonly legendLines: readonly string[];
    readonly outputLines: readonly WorktreeStackKit_InkUiSessionLine[];
    readonly outputMaxLines: number;
    readonly retainedArtifacts: readonly WorktreeStackKit_InkUiRetainedArtifact[];
    readonly startedAtText: string;
    readonly summaryLines: readonly string[];
    readonly waitingOutputText: string;
};
/** Renderer-agnostic create-handoff details for post-create result diagnostics. */
export type WorktreeStackKit_InkFullscreenCreateHandoffModel = {
    readonly ambiguousWarningText: string | null;
    readonly candidatePaths: readonly string[];
    readonly followUpStartPrompt: string | null;
    readonly matchedWorktreePath: string | null;
    readonly notFoundTextLines: readonly string[];
    readonly predictedWorktreePath: string;
    readonly requestedLine: string;
    readonly status: WorktreeStackKit_InkUiCreateHandoff["status"];
    readonly statusTone: "ready" | "warning";
};
/** Renderer-agnostic model for the post-run result screen. */
export type WorktreeStackKit_InkFullscreenResultModel = {
    readonly commandPreview: string;
    readonly createHandoff: WorktreeStackKit_InkFullscreenCreateHandoffModel | null;
    readonly executionRows: readonly WorktreeStackKit_InkFullscreenDetailRow[];
    readonly header: WorktreeStackKit_InkFullscreenHeaderModel;
    readonly legendLines: readonly string[];
    readonly message: string;
    readonly noIssuesText: string;
    readonly outputLines: readonly WorktreeStackKit_InkUiSessionLine[];
    readonly outputMaxLines: number;
    readonly planningIssues: readonly WorktreeStackKit_InkUiIssue[];
    readonly retainedArtifacts: readonly WorktreeStackKit_InkUiRetainedArtifact[];
    readonly summaryLines: readonly string[];
};
/** Builds the package-owned model consumed by the full-screen create wizard renderer. */
export declare function WorktreeStackKit_buildInkFullscreenCreateEditorModel(options: {
    readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    readonly createDraft: WorktreeStackKit_InkUiCreateDraft;
    readonly createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
    readonly createRegion: WorktreeStackKit_InkUiCreateRegion;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
    readonly selectedCreateFieldIndex: number;
    readonly selectedCreateSectionIndex: number;
}): WorktreeStackKit_InkFullscreenCreateEditorModel;
/** Builds the package-owned model consumed by the non-create action editor renderer. */
export declare function WorktreeStackKit_buildInkFullscreenActionEditorModel(options: {
    readonly actionDefinition: WorktreeStackKit_InkUiActionDefinition;
    readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
}): WorktreeStackKit_InkFullscreenActionEditorModel;
/** Builds the package-owned model consumed by the typed confirmation review renderer. */
export declare function WorktreeStackKit_buildInkFullscreenReviewModel(options: {
    readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    readonly reviewConfirmationInput: string;
}): WorktreeStackKit_InkFullscreenReviewModel;
/** Builds the package-owned model consumed by the live session renderer. */
export declare function WorktreeStackKit_buildInkFullscreenSessionModel(options: {
    readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    readonly lines: readonly WorktreeStackKit_InkUiSessionLine[];
    readonly sessionStatus: WorktreeStackKit_InkUiSessionModel["status"];
    readonly startedAt: string | null;
}): WorktreeStackKit_InkFullscreenSessionModel;
/** Builds the package-owned model consumed by the post-run result renderer. */
export declare function WorktreeStackKit_buildInkFullscreenResultModel(options: {
    readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
    readonly result: WorktreeStackKit_InkUiResultModel;
}): WorktreeStackKit_InkFullscreenResultModel;
