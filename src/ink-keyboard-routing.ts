/**
 * @fileoverview Reusable Ink keyboard routing for worktree-stack style action browsers.
 *
 * This module owns product-neutral key precedence for quit/escape/refresh, shell list navigation,
 * editor-rail hotkeys, create-form editing, pool-next stack editing, result follow-up shortcuts,
 * and destructive review confirmation typing. Script adapters provide concrete reducer action types,
 * action plans, side effects, and React/Ink rendering.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/ink-keyboard-routing.unit.test.ts
 * @testing Node test runner: npm run worktree-kit:test from the repo root runs every packages/worktree-kit src/*.unit.test.ts file, including this module.
 * @see packages/worktree-kit/src/ink-action-catalog.ts - Ordered action catalog whose ids this router indexes for editor-rail hotkeys and must stay aligned with dispatch branches.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink shell that wires `useInput` into these helpers so quit, list navigation, editor rails, result follow-up, and review keys reach the shared reducer.
 * @see packages/worktree-kit/src/ink-display-view-model.ts - Review confirmation sanitization consumed when destructive plans require typed confirmation tokens on the review screen.
 * @see packages/worktree-kit/src/ink-keyboard-routing.unit.test.ts - Node `node:test` coverage asserting dispatch outcomes for quit, shell navigation, editor rails, result follow-up, and review confirmation routing.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import {
  WORKTREE_STACK_KIT_INK_ACTIONS,
  type WorktreeStackKit_InkActionDefinition,
} from "./ink-action-catalog.js";
import {
  WorktreeStackKit_isInkCreateBooleanField,
  type WorktreeStackKit_InkCreateField,
} from "./ink-create-model.js";
import { WorktreeStackKit_sanitizeInkReviewConfirmationInput } from "./ink-display-view-model.js";
import type { WorktreeStackKit_InkActionId } from "./ink-launch-options.js";

/** Structural subset of Ink's key object used by reusable keyboard routing. */
export type WorktreeStackKit_InkKeyboardKey = {
  readonly backspace?: boolean;
  readonly ctrl?: boolean;
  readonly delete?: boolean;
  readonly downArrow?: boolean;
  readonly escape?: boolean;
  readonly leftArrow?: boolean;
  readonly meta?: boolean;
  readonly return?: boolean;
  readonly rightArrow?: boolean;
  readonly tab?: boolean;
  readonly upArrow?: boolean;
};

/** Ink screen states whose key handling is package-owned. */
export type WorktreeStackKit_InkKeyboardScreen =
  | "action-editor"
  | "result"
  | "review"
  | "session"
  | "shell";

/** Focusable high-level columns in the worktree Ink shell. */
export type WorktreeStackKit_InkKeyboardFocusedColumn =
  | "actions"
  | "editor"
  | "records";

/** Review-screen action-plan subset needed for destructive confirmation routing. */
export type WorktreeStackKit_InkKeyboardReviewActionPlan = {
  readonly request: unknown | null;
  readonly requiredConfirmationToken: string | null;
};

/** Minimal state subset needed by create and pool-next editor key routing. */
export type WorktreeStackKit_InkEditorKeyboardState = {
  readonly createInteractionMode: "browse" | "edit";
  readonly createRegion: "editor" | "fields" | "preview" | "sections";
  readonly poolNextStackEditMode: boolean;
  readonly selectedActionIndex: number;
};

/** Minimal review-screen state subset needed by confirmation key routing. */
export type WorktreeStackKit_InkReviewKeyboardState<
  ActionPlan extends WorktreeStackKit_InkKeyboardReviewActionPlan,
> = {
  readonly activePlan: ActionPlan | null;
  readonly reviewConfirmationInput: string;
  readonly screen: WorktreeStackKit_InkKeyboardScreen;
};

/** Reducer actions emitted by package-owned keyboard routing. */
export type WorktreeStackKit_InkKeyboardAction<ActionPlan> =
  | { readonly type: "append-create-field-input"; readonly value: string }
  | { readonly type: "append-pool-next-stack-input"; readonly value: string }
  | { readonly type: "append-review-confirmation"; readonly value: string }
  | { readonly type: "backspace-create-field-input" }
  | { readonly type: "backspace-pool-next-stack-input" }
  | { readonly type: "backspace-review-confirmation" }
  | { readonly type: "close-overlay" }
  | { readonly type: "cycle-repair-target-scope" }
  | { readonly type: "cycle-sync-target-scope" }
  | { readonly type: "focus-column-left" }
  | { readonly type: "focus-column-right" }
  | { readonly type: "focus-next-create-region" }
  | { readonly type: "navigate-down" }
  | { readonly type: "navigate-up" }
  | { readonly type: "open-action-editor" }
  | { readonly type: "open-review"; readonly plan: ActionPlan }
  | { readonly type: "refresh-requested" }
  | { readonly type: "select-next-create-field" }
  | { readonly type: "select-next-create-section" }
  | { readonly type: "select-previous-create-field" }
  | { readonly type: "select-previous-create-section" }
  | { readonly type: "session-status"; readonly status: "cancelling" }
  | { readonly type: "start-create-field-edit" }
  | { readonly type: "start-session"; readonly plan: ActionPlan }
  | { readonly type: "stop-create-field-edit" }
  | { readonly type: "toggle-create-field" }
  | { readonly type: "toggle-pool-next-stack-edit" }
  | { readonly type: "toggle-primary-action-option" }
  | { readonly type: "toggle-repair-legacy-package-alias" }
  | { readonly type: "toggle-secondary-action-option" };

/** Dispatch handle shared by worktree Ink keyboard helper functions. */
export type WorktreeStackKit_InkKeyboardDispatch<ActionPlan> = (
  action: WorktreeStackKit_InkKeyboardAction<ActionPlan>,
) => void;

/** Mutable cancel callback ref used by session quit routing without importing React. */
export type WorktreeStackKit_InkKeyboardCancelRef = {
  current: null | (() => void);
};

/** Keyboard and selection snapshot for editor-column routing. */
export type WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan> = {
  readonly createTextFieldActive: boolean;
  readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
  readonly input: string;
  readonly key: WorktreeStackKit_InkKeyboardKey;
  readonly poolNextTextActive: boolean;
  readonly selectedAction: Pick<WorktreeStackKit_InkActionDefinition, "id">;
  readonly selectedActionPlan: ActionPlan | null;
  readonly selectedCreateField: WorktreeStackKit_InkCreateField | null;
  readonly state: WorktreeStackKit_InkEditorKeyboardState;
};

/**
 * Handle q / esc / r before screen-specific routing.
 *
 * @remarks Returns `true` when the caller should stop routing the current key tick.
 */
export function WorktreeStackKit_tryConsumeInkQuitEscapeRefreshKeys<ActionPlan>(
  options: {
    readonly activeRunCancelRef: WorktreeStackKit_InkKeyboardCancelRef;
    readonly auxiliaryTextEditActive: boolean;
    readonly createTextFieldActive: boolean;
    readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
    readonly exit: () => void;
    readonly input: string;
    readonly key: WorktreeStackKit_InkKeyboardKey;
    readonly poolNextTextActive: boolean;
    readonly screen: WorktreeStackKit_InkKeyboardScreen;
    readonly sessionModel: unknown | null;
  },
): boolean {
  if (options.input === "q" && !options.auxiliaryTextEditActive) {
    if (
      options.screen === "session" &&
      options.sessionModel &&
      options.activeRunCancelRef.current
    ) {
      options.activeRunCancelRef.current();
      options.dispatch({ type: "session-status", status: "cancelling" });
      return true;
    }
    options.exit();
    return true;
  }
  if (options.key.escape) {
    if (options.poolNextTextActive) {
      options.dispatch({ type: "toggle-pool-next-stack-edit" });
      return true;
    }
    if (options.createTextFieldActive) {
      options.dispatch({ type: "stop-create-field-edit" });
      return true;
    }
    if (options.screen === "session") {
      return true;
    }
    options.dispatch({ type: "close-overlay" });
    return true;
  }
  if (options.input === "r" && !options.auxiliaryTextEditActive) {
    options.dispatch({ type: "refresh-requested" });
    return true;
  }
  return false;
}

/**
 * Handle shell list-column navigation when focus is outside the editor rail.
 *
 * @remarks Returns `true` when list-column handling swallowed the tick, including unmatched keys.
 */
export function WorktreeStackKit_tryConsumeInkShellListNavigationKeys<ActionPlan>(
  options: {
    readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
    readonly focusedColumn: WorktreeStackKit_InkKeyboardFocusedColumn;
    readonly input: string;
    readonly key: WorktreeStackKit_InkKeyboardKey;
    readonly screen: WorktreeStackKit_InkKeyboardScreen;
    readonly selectedActionIndex: number;
  },
): boolean {
  if (options.screen !== "shell") {
    return false;
  }
  if (options.focusedColumn === "editor") {
    return false;
  }
  const { key, input, dispatch } = options;
  if (key.leftArrow || input === "h") {
    dispatch({ type: "focus-column-left" });
    return true;
  }
  if (key.rightArrow || input === "l") {
    dispatch({ type: "focus-column-right" });
    return true;
  }
  if (key.upArrow || input === "k") {
    dispatch({ type: "navigate-up" });
    return true;
  }
  if (key.downArrow || input === "j") {
    dispatch({ type: "navigate-down" });
    return true;
  }
  if (key.return && options.selectedActionIndex >= 0) {
    dispatch({ type: "open-action-editor" });
  }
  return true;
}

/** Consume left/right arrow keys that should not reach action hotkeys. */
function WorktreeStackKit_tryConsumeInkEditorArrowGuards<ActionPlan>(
  options: WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan>,
): boolean {
  const { key, dispatch } = options;
  if (!options.poolNextTextActive && !options.createTextFieldActive) {
    if (key.leftArrow) {
      dispatch({ type: "close-overlay" });
      return true;
    }
    if (key.rightArrow) {
      return true;
    }
  } else if (key.leftArrow || key.rightArrow) {
    return true;
  }
  return false;
}

/** Route keyboard input for the create action while the editor column is focused. */
function WorktreeStackKit_tryConsumeInkCreateActionEditorKeys<ActionPlan>(
  options: WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan>,
): boolean {
  const { state, key, input, dispatch } = options;
  const selectedCreateField = options.selectedCreateField;
  if (state.createInteractionMode === "edit") {
    if (key.backspace || key.delete) {
      dispatch({ type: "backspace-create-field-input" });
      return true;
    }
    if (key.return) {
      dispatch({ type: "stop-create-field-edit" });
      return true;
    }
    if (!key.ctrl && !key.meta && !key.tab && input.length > 0) {
      dispatch({ type: "append-create-field-input", value: input });
      return true;
    }
    return true;
  }

  if (key.tab) {
    dispatch({ type: "focus-next-create-region" });
    return true;
  }
  if (key.upArrow) {
    if (state.createRegion === "sections") {
      dispatch({ type: "select-previous-create-section" });
      return true;
    }
    if (state.createRegion === "fields") {
      dispatch({ type: "select-previous-create-field" });
      return true;
    }
  }
  if (key.downArrow) {
    if (state.createRegion === "sections") {
      dispatch({ type: "select-next-create-section" });
      return true;
    }
    if (state.createRegion === "fields") {
      dispatch({ type: "select-next-create-field" });
      return true;
    }
  }
  if (key.backspace || key.delete) {
    return true;
  }
  if (
    input === "e" &&
    selectedCreateField &&
    !WorktreeStackKit_isInkCreateBooleanField(selectedCreateField.id)
  ) {
    dispatch({ type: "start-create-field-edit" });
    return true;
  }
  if (input === " ") {
    if (
      selectedCreateField &&
      WorktreeStackKit_isInkCreateBooleanField(selectedCreateField.id)
    ) {
      dispatch({ type: "toggle-create-field" });
    }
    return true;
  }
  return false;
}

/** Route keyboard input for the pool-next stack editor overlay. */
function WorktreeStackKit_tryConsumeInkRealmPoolNextEditorKeys<ActionPlan>(
  options: WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan>,
): boolean {
  const { state, key, input, dispatch } = options;
  if (state.poolNextStackEditMode) {
    if (key.backspace || key.delete) {
      dispatch({ type: "backspace-pool-next-stack-input" });
      return true;
    }
    if (key.return) {
      dispatch({ type: "toggle-pool-next-stack-edit" });
      return true;
    }
    if (!key.ctrl && !key.meta && !key.tab && input.length > 0) {
      dispatch({ type: "append-pool-next-stack-input", value: input });
      return true;
    }
    return true;
  }
  if (input === "e") {
    dispatch({ type: "toggle-pool-next-stack-edit" });
    return true;
  }
  return false;
}

/** Apply repair/sync/update hotkeys and enter-review from the focused action rail. */
function WorktreeStackKit_dispatchInkEditorRailHotkeys<ActionPlan>(
  options: WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan>,
): void {
  const { input, key, state, selectedActionPlan, dispatch } = options;
  const selectedActionFromIndex =
    WORKTREE_STACK_KIT_INK_ACTIONS[state.selectedActionIndex];
  if (input === "t") {
    if (selectedActionFromIndex?.id === "repair") {
      dispatch({ type: "cycle-repair-target-scope" });
      return;
    }
    if (selectedActionFromIndex?.id === "sync-local-files") {
      dispatch({ type: "cycle-sync-target-scope" });
      return;
    }
  }
  if (input === "l") {
    if (selectedActionFromIndex?.id === "repair") {
      dispatch({ type: "toggle-repair-legacy-package-alias" });
      return;
    }
  }
  if (input === "i") {
    if (selectedActionFromIndex?.id === "repair") {
      dispatch({ type: "toggle-secondary-action-option" });
      return;
    }
  }
  if (input === " ") {
    dispatch({ type: "toggle-primary-action-option" });
    return;
  }
  if (input === "m") {
    const selectedActionForMerge =
      WORKTREE_STACK_KIT_INK_ACTIONS[state.selectedActionIndex];
    if (selectedActionForMerge?.id === "update-from-main") {
      dispatch({ type: "toggle-secondary-action-option" });
    }
    return;
  }
  if (key.return && selectedActionPlan) {
    dispatch({ type: "open-review", plan: selectedActionPlan });
  }
}

/**
 * Editor-column keyboard routing for the shell action rail and inline editors.
 *
 * @remarks Mirrors historical control flow: arrow guards, per-action blocks, then shared rail hotkeys.
 */
export function WorktreeStackKit_dispatchInkEditorColumnInput<ActionPlan>(
  options: WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan>,
): void {
  if (WorktreeStackKit_tryConsumeInkEditorArrowGuards(options)) {
    return;
  }
  if (
    options.selectedAction.id === "create" &&
    WorktreeStackKit_tryConsumeInkCreateActionEditorKeys(options)
  ) {
    return;
  }
  if (
    options.selectedAction.id === "realm-pool-next" &&
    WorktreeStackKit_tryConsumeInkRealmPoolNextEditorKeys(options)
  ) {
    return;
  }
  WorktreeStackKit_dispatchInkEditorRailHotkeys(options);
}

/** Handle follow-up start shortcut on the post-run result screen. */
export function WorktreeStackKit_tryConsumeInkResultScreenKeys<ActionPlan>(
  options: {
    readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
    readonly followUpStartPlan: ActionPlan | null | undefined;
    readonly input: string;
    readonly screen: WorktreeStackKit_InkKeyboardScreen;
  },
): boolean {
  if (options.screen !== "result") {
    return false;
  }
  if (options.input === "s" && options.followUpStartPlan) {
    options.dispatch({
      type: "start-session",
      plan: options.followUpStartPlan,
    });
  }
  return true;
}

/** Route review-screen confirmation typing and session start from review. */
export function WorktreeStackKit_dispatchInkReviewScreenKeys<
  ActionPlan extends WorktreeStackKit_InkKeyboardReviewActionPlan,
>(options: {
  readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
  readonly input: string;
  readonly key: WorktreeStackKit_InkKeyboardKey;
  readonly state: WorktreeStackKit_InkReviewKeyboardState<ActionPlan>;
}): void {
  const { input, key, state, dispatch } = options;
  if (state.screen !== "review") {
    return;
  }
  const activePlan = state.activePlan;
  if (!activePlan) {
    return;
  }

  const requiresDestroyConfirmation =
    activePlan.request !== null && activePlan.requiredConfirmationToken !== null;
  const requiredConfirmationToken = activePlan.requiredConfirmationToken;

  if (requiresDestroyConfirmation && (key.backspace || key.delete)) {
    dispatch({ type: "backspace-review-confirmation" });
    return;
  }

  if (
    requiresDestroyConfirmation &&
    !key.ctrl &&
    !key.meta &&
    !key.tab &&
    !key.return
  ) {
    const value = WorktreeStackKit_sanitizeInkReviewConfirmationInput(
      input,
    ).toUpperCase();
    if (value.length > 0) {
      dispatch({ type: "append-review-confirmation", value });
      return;
    }
  }

  if (key.return && state.activePlan) {
    if (
      requiresDestroyConfirmation &&
      state.reviewConfirmationInput !== requiredConfirmationToken
    ) {
      return;
    }
    dispatch({ type: "start-session", plan: state.activePlan });
  }
}

/** Type guard-friendly helper for callers that need the shared action ids. */
export function WorktreeStackKit_isInkKeyboardActionId(
  actionId: string,
): actionId is WorktreeStackKit_InkActionId {
  return WORKTREE_STACK_KIT_INK_ACTIONS.some((action) => action.id === actionId);
}
