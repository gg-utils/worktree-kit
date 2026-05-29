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

import { basename } from "node:path";

import {
  WorktreeStackKit_getInkActionEditorKeyHint,
  WorktreeStackKit_getInkActionPlanTone,
  WorktreeStackKit_getInkCreateDraftInputValue,
  WorktreeStackKit_getInkCreateFieldBooleanValue,
  WorktreeStackKit_getInkCreateFieldDisplayValue,
  WorktreeStackKit_getInkCreateRegionLabel,
  WorktreeStackKit_getInkResultStatusTone,
  WorktreeStackKit_getInkSessionStatusTone,
  WorktreeStackKit_renderInkCommandPreview,
} from "./ink-display-view-model.js";
import {
  WORKTREE_STACK_KIT_INK_CREATE_FIELDS,
  WORKTREE_STACK_KIT_INK_CREATE_SECTIONS,
  WorktreeStackKit_getInkCreateField,
  WorktreeStackKit_getInkCreateFieldsForSection,
  WorktreeStackKit_getInkCreateSection,
  WorktreeStackKit_getInkCreateSectionForField,
  WorktreeStackKit_isInkCreateBooleanField,
  type WorktreeStackKit_InkCreateFieldId,
  type WorktreeStackKit_InkCreateSectionId,
} from "./ink-create-model.js";
import {
  WorktreeStackKit_resolveInkCreateDraft,
  type WorktreeStackKit_InkCreateResolutionConfig,
} from "./ink-create-resolution.js";
import type {
  WorktreeStackKit_InkUiActionDefinition,
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiCreateDraft,
  WorktreeStackKit_InkUiCreateHandoff,
  WorktreeStackKit_InkUiCreateInteractionMode,
  WorktreeStackKit_InkUiCreateRegion,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiIssue,
  WorktreeStackKit_InkUiResultModel,
  WorktreeStackKit_InkUiRetainedArtifact,
  WorktreeStackKit_InkUiSessionLine,
  WorktreeStackKit_InkUiSessionModel,
} from "./ink-ui-contracts.js";

/** Badge tones emitted by full-screen view-model helpers for script renderers. */
export type WorktreeStackKit_InkFullscreenBadgeTone =
  | "blocked"
  | "destructive"
  | "editing"
  | "info"
  | "ready"
  | "warning";

/** Text colors emitted by full-screen view-model helpers for script renderers. */
export type WorktreeStackKit_InkFullscreenTextTone =
  | "cyan"
  | "gray"
  | "green"
  | "red"
  | "yellow";

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
export function WorktreeStackKit_buildInkFullscreenCreateEditorModel(options: {
  readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  readonly createDraft: WorktreeStackKit_InkUiCreateDraft;
  readonly createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
  readonly createRegion: WorktreeStackKit_InkUiCreateRegion;
  readonly inventory: WorktreeStackKit_InkUiInventory;
  readonly resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
  readonly selectedCreateFieldIndex: number;
  readonly selectedCreateSectionIndex: number;
}): WorktreeStackKit_InkFullscreenCreateEditorModel {
  const resolvedDraft = WorktreeStackKit_resolveInkCreateDraft({
    config: options.resolutionConfig,
    draft: options.createDraft,
    inventory: options.inventory,
  });
  const selectedSection = WorktreeStackKit_getInkCreateSection(
    options.selectedCreateSectionIndex,
  );
  const selectedField = WorktreeStackKit_getInkCreateField(
    options.selectedCreateFieldIndex,
  );
  const sectionFields = selectedSection
    ? WorktreeStackKit_getInkCreateFieldsForSection(selectedSection.id)
    : [];
  const createPlanTone = WorktreeStackKit_getInkActionPlanTone(
    options.actionPlan,
  );
  const selectedSectionLabel = selectedSection?.label ?? "n/a";
  const selectedFieldIsBoolean = selectedField
    ? WorktreeStackKit_isInkCreateBooleanField(selectedField.id)
    : false;

  return {
    commandPreview: WorktreeStackKit_renderInkCommandPreview(
      options.actionPlan,
    ),
    editorField: selectedField
      ? {
          booleanValue: selectedFieldIsBoolean
            ? WorktreeStackKit_getInkCreateFieldBooleanValue({
                createDraft: options.createDraft,
                fieldId: selectedField.id,
              })
            : null,
          description: selectedField.description,
          inputValue: selectedFieldIsBoolean
            ? null
            : WorktreeStackKit_getInkCreateDraftInputValue({
                createDraft: options.createDraft,
                fieldId: selectedField.id,
              }),
          isBoolean: selectedFieldIsBoolean,
          label: selectedField.label,
          modeLabel:
            options.createInteractionMode === "edit" ? "editing" : "browse",
          resolvedValue: selectedFieldIsBoolean
            ? null
            : WorktreeStackKit_getInkCreateFieldDisplayValue({
                fieldId: selectedField.id,
                resolvedDraft,
              }),
          sectionLabel:
            WorktreeStackKit_getInkCreateSectionForField(selectedField.id)
              ?.label ?? "n/a",
        }
      : null,
    editorFooterHint: WorktreeStackKit_getInkFullscreenCreateEditorFooterHint({
      createInteractionMode: options.createInteractionMode,
      selectedFieldId: selectedField?.id ?? null,
    }),
    fieldRows: sectionFields.map((field) => {
      const fieldIndex = WORKTREE_STACK_KIT_INK_CREATE_FIELDS.findIndex(
        (candidate) => candidate.id === field.id,
      );
      const selected = fieldIndex === options.selectedCreateFieldIndex;
      const isBoolean = WorktreeStackKit_isInkCreateBooleanField(field.id);
      return {
        booleanValue: isBoolean
          ? WorktreeStackKit_getInkCreateFieldBooleanValue({
              createDraft: options.createDraft,
              fieldId: field.id,
            })
          : null,
        displayValue: isBoolean
          ? ""
          : WorktreeStackKit_getInkCreateFieldDisplayValue({
              fieldId: field.id,
              resolvedDraft,
            }),
        editing: selected && options.createInteractionMode === "edit",
        id: field.id,
        isBoolean,
        label: field.label,
        marker: selected ? ">" : " ",
        selected,
        tone: selected ? "cyan" : null,
      };
    }),
    header: {
      badgeLabel:
        options.createInteractionMode === "edit" ? "editing" : "browse",
      badgeTone: options.createInteractionMode === "edit" ? "editing" : "info",
      description:
        "Build a new prepared worktree request, then resolve the created record from refreshed discovery before offering any follow-up start.",
      summaryText: `Focus: ${WorktreeStackKit_getInkCreateRegionLabel(
        options.createRegion,
      )} | Section: ${selectedSectionLabel} | Action: ${createPlanTone}`,
      title: "Create worktree",
    },
    legendLines: WorktreeStackKit_buildInkFullscreenCreateLegendLines({
      createInteractionMode: options.createInteractionMode,
    }),
    noIssuesText: "No blocking or advisory issues for this action.",
    previewBadgeLabel:
      options.createRegion === "preview" ? "focus" : createPlanTone,
    previewBadgeTone:
      options.createRegion === "preview" ? "editing" : createPlanTone,
    previewRows: [
      {
        key: "predicted-path",
        label: "Predicted path",
        value: resolvedDraft.predictedWorktreePath,
      },
      {
        key: "predicted-folder",
        label: "Predicted folder",
        value: basename(resolvedDraft.predictedWorktreePath),
      },
      { key: "slot", label: "Slot", value: resolvedDraft.slotInput },
      {
        key: "root-branch",
        label: "Root branch",
        value: resolvedDraft.rootBranch || "(needs stack name)",
      },
      {
        key: "submodule-branch",
        label: "Submodule branch",
        value: resolvedDraft.submoduleBranch || "(needs stack name)",
      },
    ],
    preflightIssues: options.actionPlan.issues,
    sectionDescription: selectedSection?.description ?? null,
    sectionRows: WORKTREE_STACK_KIT_INK_CREATE_SECTIONS.map(
      (section, index) => {
        const selected = index === options.selectedCreateSectionIndex;
        return {
          id: section.id,
          label: section.label,
          marker: selected ? ">" : " ",
          selected,
          tone: selected ? "cyan" : null,
        };
      },
    ),
    selectedSectionLabel,
    summaryLines: options.actionPlan.summaryLines,
  };
}

/** Builds the package-owned model consumed by the non-create action editor renderer. */
export function WorktreeStackKit_buildInkFullscreenActionEditorModel(options: {
  readonly actionDefinition: WorktreeStackKit_InkUiActionDefinition;
  readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
}): WorktreeStackKit_InkFullscreenActionEditorModel {
  const actionPlanTone = WorktreeStackKit_getInkActionPlanTone(
    options.actionPlan,
  );
  return {
    commandPreview: WorktreeStackKit_renderInkCommandPreview(
      options.actionPlan,
    ),
    header: {
      badgeLabel: actionPlanTone,
      badgeTone: actionPlanTone,
      description: options.actionDefinition.description,
      summaryText: null,
      title: options.actionDefinition.label,
    },
    legendLines: [
      WorktreeStackKit_getInkActionEditorKeyHint(options.actionDefinition),
    ],
    noIssuesText: "No blocking or advisory issues for this action.",
    preflightIssues: options.actionPlan.issues,
    summaryLines: options.actionPlan.summaryLines,
    targetText: options.actionPlan.targetPath ?? "Global control-plane action",
  };
}

/** Builds the package-owned model consumed by the typed confirmation review renderer. */
export function WorktreeStackKit_buildInkFullscreenReviewModel(options: {
  readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  readonly reviewConfirmationInput: string;
}): WorktreeStackKit_InkFullscreenReviewModel {
  const requiredConfirmationToken = options.actionPlan.request
    ? options.actionPlan.requiredConfirmationToken
    : null;
  const reviewConfirmed =
    requiredConfirmationToken === null ||
    options.reviewConfirmationInput === requiredConfirmationToken;

  return {
    commandPreview: WorktreeStackKit_renderInkCommandPreview(
      options.actionPlan,
    ),
    currentInputDisplay:
      options.reviewConfirmationInput.length > 0
        ? options.reviewConfirmationInput
        : "(empty)",
    currentInputTone: reviewConfirmed ? "green" : "yellow",
    destructiveConfirmationText: options.actionPlan.destructiveConfirmationText,
    header: {
      badgeLabel: options.actionPlan.request ? "ready" : "blocked",
      badgeTone: options.actionPlan.request ? "ready" : "blocked",
      description: null,
      summaryText: null,
      title: `${options.actionPlan.actionLabel} review`,
    },
    legendLines: [
      options.actionPlan.request
        ? options.actionPlan.request.sessionKind === "task"
          ? "Press enter to run this task request through the session screen."
          : "Press enter to start the runtime session with sidecar and retained-artifact tracking."
        : "This plan is blocked. Enter will open the blocked result state.",
      "Keys: enter continue | backspace edit confirmation | esc back | q quit",
    ],
    noIssuesText: "No review issues were found for this command plan.",
    requiredConfirmationToken,
    retainedArtifacts: options.actionPlan.retainedArtifacts,
    reviewConfirmed,
    reviewIssues: options.actionPlan.issues,
    summaryLines: options.actionPlan.summaryLines,
  };
}

/** Builds the package-owned model consumed by the live session renderer. */
export function WorktreeStackKit_buildInkFullscreenSessionModel(options: {
  readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  readonly lines: readonly WorktreeStackKit_InkUiSessionLine[];
  readonly sessionStatus: WorktreeStackKit_InkUiSessionModel["status"];
  readonly startedAt: string | null;
}): WorktreeStackKit_InkFullscreenSessionModel {
  return {
    commandPreview: WorktreeStackKit_renderInkCommandPreview(
      options.actionPlan,
    ),
    header: {
      badgeLabel: options.sessionStatus,
      badgeTone: WorktreeStackKit_getInkSessionStatusTone(
        options.sessionStatus,
      ),
      description: null,
      summaryText: `Started at: ${options.startedAt ?? "starting..."}`,
      title: `${options.actionPlan.actionLabel} session`,
    },
    legendLines: [
      "Session is live. Escape is disabled while the child process is running.",
      options.sessionStatus === "cancelling"
        ? "Cancellation requested. Waiting for the child process to exit cleanly."
        : "Press q to cancel the live session and wait for the result screen.",
    ],
    outputLines: options.lines,
    outputMaxLines: 14,
    retainedArtifacts: options.actionPlan.retainedArtifacts,
    startedAtText: options.startedAt ?? "starting...",
    summaryLines: options.actionPlan.summaryLines,
    waitingOutputText: "Waiting for command output...",
  };
}

/** Builds the package-owned model consumed by the post-run result renderer. */
export function WorktreeStackKit_buildInkFullscreenResultModel(options: {
  readonly actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  readonly result: WorktreeStackKit_InkUiResultModel;
}): WorktreeStackKit_InkFullscreenResultModel {
  return {
    commandPreview: WorktreeStackKit_renderInkCommandPreview(
      options.actionPlan,
    ),
    createHandoff: options.result.createHandoff
      ? WorktreeStackKit_buildInkFullscreenCreateHandoffModel(
          options.result.createHandoff,
        )
      : null,
    executionRows: [
      {
        key: "exit-code",
        label: "Exit code",
        value:
          options.result.exitCode === null
            ? "n/a"
            : String(options.result.exitCode),
      },
      { key: "signal", label: "Signal", value: options.result.signal ?? "n/a" },
      {
        key: "started-at",
        label: "Started at",
        value: options.result.startedAt ?? "n/a",
      },
      {
        key: "ended-at",
        label: "Ended at",
        value: options.result.endedAt ?? "n/a",
      },
      {
        key: "discovery-refresh",
        label: "Discovery refresh",
        value: options.result.refreshRequested ? "requested" : "not requested",
      },
    ],
    header: {
      badgeLabel: options.result.status,
      badgeTone: WorktreeStackKit_getInkResultStatusTone(options.result.status),
      description: null,
      summaryText: null,
      title: `${options.actionPlan.actionLabel} result`,
    },
    legendLines: [
      options.result.createHandoff?.followUpStartPlan
        ? "Keys: s follow-up start | esc back | r refresh | q quit"
        : "Keys: esc back | r refresh | q quit",
    ],
    message: options.result.message,
    noIssuesText: "No planning issues were recorded for this action.",
    outputLines: options.result.lines,
    outputMaxLines: 16,
    planningIssues: options.actionPlan.issues,
    retainedArtifacts: options.actionPlan.retainedArtifacts,
    summaryLines: options.actionPlan.summaryLines,
  };
}

function WorktreeStackKit_getInkFullscreenCreateEditorFooterHint(options: {
  readonly createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
  readonly selectedFieldId: WorktreeStackKit_InkCreateFieldId | null;
}): string {
  if (
    options.selectedFieldId &&
    WorktreeStackKit_isInkCreateBooleanField(options.selectedFieldId)
  ) {
    return "Boolean fields toggle directly in browse mode.";
  }

  if (options.createInteractionMode === "edit") {
    return "Editing mode is active for this text field.";
  }

  return "Press e to enter edit mode for the active text field.";
}

function WorktreeStackKit_buildInkFullscreenCreateLegendLines(options: {
  readonly createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
}): readonly string[] {
  if (options.createInteractionMode === "edit") {
    return [
      "Keys: type text | backspace delete | enter stop editing | esc stop editing",
      "While editing, left/right action switching and quit are disabled.",
    ];
  }

  return [
    "Keys: left/right choose action | tab focus region | up/down browse sections or fields",
    "Keys: e edit text field | space toggle boolean | enter review | esc back | r refresh | q quit",
  ];
}

function WorktreeStackKit_buildInkFullscreenCreateHandoffModel(
  createHandoff: WorktreeStackKit_InkUiCreateHandoff,
): WorktreeStackKit_InkFullscreenCreateHandoffModel {
  return {
    ambiguousWarningText:
      createHandoff.status === "ambiguous"
        ? "Refreshed discovery found multiple candidate worktrees. Review the paths before starting anything."
        : null,
    candidatePaths: createHandoff.candidatePaths,
    followUpStartPrompt: createHandoff.followUpStartPlan
      ? "Follow-up start is ready. Press s to queue it for the resolved worktree."
      : null,
    matchedWorktreePath: createHandoff.matchedWorktreePath,
    notFoundTextLines:
      createHandoff.status === "not-found"
        ? [
            "Refreshed discovery did not find a matching worktree yet.",
            "Re-run discovery or inspect the create command output before attempting any follow-up start.",
          ]
        : [],
    predictedWorktreePath: createHandoff.predictedWorktreePath,
    requestedLine: `Requested: ${createHandoff.requestedStackName} | slot ${createHandoff.requestedSlot}`,
    status: createHandoff.status,
    statusTone: createHandoff.status === "resolved" ? "ready" : "warning",
  };
}
