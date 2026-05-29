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

import type {
  WorktreeStackKit_InkActionId,
  WorktreeStackKit_InkCreateDraft,
} from "./ink-launch-options.js";
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
export type WorktreeStackKit_InkDisplaySessionStatus =
  | "queued"
  | "starting"
  | "watching-sidecars"
  | "running"
  | "cancelling";

/** Post-execution result states rendered by Ink status badges. */
export type WorktreeStackKit_InkResultStatus =
  | "blocked"
  | "cancelled"
  | "failed"
  | "succeeded";

/** Create-flow focus regions rendered in Ink keyboard legends. */
export type WorktreeStackKit_InkDisplayCreateRegion =
  | "editor"
  | "fields"
  | "preview"
  | "sections";

/** Ink badge tone names shared between view-model helpers and script renderers. */
export type WorktreeStackKit_InkStatusTone =
  | "blocked"
  | "destructive"
  | "info"
  | "ready"
  | "warning";

/** Ink text color names shared between view-model helpers and script renderers. */
export type WorktreeStackKit_InkTextColor = "gray" | "red" | "white";

/** Joins a command name and args array into a single display command line. */
export function WorktreeStackKit_formatInkCliCommandLine(options: {
  readonly args: readonly string[];
  readonly command: string;
}): string {
  return [options.command, ...options.args].join(" ");
}

/** Formats the planned CLI invocation for preview, or a blocked placeholder. */
export function WorktreeStackKit_renderInkCommandPreview(
  plan: WorktreeStackKit_InkActionPlanDisplayInput,
): string {
  if (!plan.request) {
    return "(blocked)";
  }

  return WorktreeStackKit_formatInkCliCommandLine(plan.request);
}

/** Strips newline characters from typed confirmation input. */
export function WorktreeStackKit_sanitizeInkReviewConfirmationInput(
  input: string,
): string {
  return input.replace(/[\r\n]/g, "");
}

/** Maps bridge/stderr session sources to Ink text colors. */
export function WorktreeStackKit_getInkSessionOutputColor(
  source: string,
): WorktreeStackKit_InkTextColor {
  if (source === "stderr") {
    return "red";
  }

  if (source === "bridge") {
    return "gray";
  }

  return "white";
}

/** Per-action keyboard legend string for the inline editor column. */
export function WorktreeStackKit_getInkActionEditorKeyHint(
  actionDefinition: WorktreeStackKit_InkActionDefinitionDisplayInput,
): string {
  if (actionDefinition.id === "create") {
    return "Keys: up/down choose field | left/right choose action | type to edit text | space toggle boolean | backspace delete | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "repair") {
    return "Keys: space dry-run | i include package .env | l legacy missing-only alias | t all vs selected worktree | left/right action | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "sync-local-files") {
    return "Keys: t all-discovered vs selected worktree | left/right action | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "platform-bootstrap") {
    return "Keys: left/right action | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "update-from-main") {
    return "Keys: left/right choose action | space toggle plan/push | m toggle live-worktree/pushed-only | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "merge") {
    return "Keys: left/right choose action | space toggle plan/push | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "realm-pool-next") {
    return "Keys: e edit stack name | type/backspace when editing | enter stop editing | left/right action | enter review | esc back | q quit";
  }

  if (actionDefinition.id === "checkout-state-check") {
    return "Keys: space toggle --fetch | left/right action | enter review | esc back | q quit";
  }

  return "Keys: left/right choose action | space toggle option | enter review | esc back | q quit";
}

/** Classifies whether the built plan can execute or is missing prerequisites. */
export function WorktreeStackKit_getInkActionPlanTone(
  actionPlan: WorktreeStackKit_InkActionPlanDisplayInput,
): "ready" | "blocked" {
  return actionPlan.request ? "ready" : "blocked";
}

/** Maps live session lifecycle states to status badge tones. */
export function WorktreeStackKit_getInkSessionStatusTone(
  sessionStatus: WorktreeStackKit_InkDisplaySessionStatus,
): "info" | "warning" | "ready" {
  if (sessionStatus === "running") {
    return "ready";
  }

  if (sessionStatus === "cancelling") {
    return "warning";
  }

  return "info";
}

/** Maps post-execution result states to destructive, warning, or ready tones. */
export function WorktreeStackKit_getInkResultStatusTone(
  resultStatus: WorktreeStackKit_InkResultStatus,
): "ready" | "warning" | "destructive" {
  if (resultStatus === "succeeded") {
    return "ready";
  }

  if (resultStatus === "failed") {
    return "destructive";
  }

  return "warning";
}

/** Human-readable label for the focused create-flow UI region. */
export function WorktreeStackKit_getInkCreateRegionLabel(
  region: WorktreeStackKit_InkDisplayCreateRegion,
): string {
  switch (region) {
    case "sections":
      return "sections";
    case "fields":
      return "fields";
    case "editor":
      return "editor";
    case "preview":
      return "preview";
  }
}

/** Reads a string draft fragment for text-backed create fields. */
export function WorktreeStackKit_getInkCreateDraftInputValue(options: {
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly fieldId: WorktreeStackKit_InkCreateFieldId;
}): string {
  const value = options.createDraft[options.fieldId];
  return typeof value === "string" ? value : "";
}

/** Reads a boolean draft fragment for chip-backed create fields. */
export function WorktreeStackKit_getInkCreateFieldBooleanValue(options: {
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly fieldId: WorktreeStackKit_InkCreateFieldId;
}): boolean {
  const value = options.createDraft[options.fieldId];
  return typeof value === "boolean" ? value : false;
}

/** Formats a create-field value from a resolved/defaulted draft for display. */
export function WorktreeStackKit_getInkCreateFieldDisplayValue(options: {
  readonly fieldId: WorktreeStackKit_InkCreateFieldId;
  readonly resolvedDraft: WorktreeStackKit_InkCreateDraft;
}): string {
  const value = options.resolvedDraft[options.fieldId];
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value ?? "");
}
