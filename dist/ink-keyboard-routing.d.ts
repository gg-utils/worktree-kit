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
import { type WorktreeStackKit_InkActionDefinition } from "./ink-action-catalog.js";
import { type WorktreeStackKit_InkCreateField } from "./ink-create-model.js";
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
export type WorktreeStackKit_InkKeyboardScreen = "action-editor" | "result" | "review" | "session" | "shell";
/** Focusable high-level columns in the worktree Ink shell. */
export type WorktreeStackKit_InkKeyboardFocusedColumn = "actions" | "editor" | "records";
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
export type WorktreeStackKit_InkReviewKeyboardState<ActionPlan extends WorktreeStackKit_InkKeyboardReviewActionPlan> = {
    readonly activePlan: ActionPlan | null;
    readonly reviewConfirmationInput: string;
    readonly screen: WorktreeStackKit_InkKeyboardScreen;
};
/** Reducer actions emitted by package-owned keyboard routing. */
export type WorktreeStackKit_InkKeyboardAction<ActionPlan> = {
    readonly type: "append-create-field-input";
    readonly value: string;
} | {
    readonly type: "append-pool-next-stack-input";
    readonly value: string;
} | {
    readonly type: "append-review-confirmation";
    readonly value: string;
} | {
    readonly type: "backspace-create-field-input";
} | {
    readonly type: "backspace-pool-next-stack-input";
} | {
    readonly type: "backspace-review-confirmation";
} | {
    readonly type: "close-overlay";
} | {
    readonly type: "cycle-repair-target-scope";
} | {
    readonly type: "cycle-sync-target-scope";
} | {
    readonly type: "focus-column-left";
} | {
    readonly type: "focus-column-right";
} | {
    readonly type: "focus-next-create-region";
} | {
    readonly type: "navigate-down";
} | {
    readonly type: "navigate-up";
} | {
    readonly type: "open-action-editor";
} | {
    readonly type: "open-review";
    readonly plan: ActionPlan;
} | {
    readonly type: "refresh-requested";
} | {
    readonly type: "select-next-create-field";
} | {
    readonly type: "select-next-create-section";
} | {
    readonly type: "select-previous-create-field";
} | {
    readonly type: "select-previous-create-section";
} | {
    readonly type: "session-status";
    readonly status: "cancelling";
} | {
    readonly type: "start-create-field-edit";
} | {
    readonly type: "start-session";
    readonly plan: ActionPlan;
} | {
    readonly type: "stop-create-field-edit";
} | {
    readonly type: "toggle-create-field";
} | {
    readonly type: "toggle-pool-next-stack-edit";
} | {
    readonly type: "toggle-primary-action-option";
} | {
    readonly type: "toggle-repair-legacy-package-alias";
} | {
    readonly type: "toggle-secondary-action-option";
};
/** Dispatch handle shared by worktree Ink keyboard helper functions. */
export type WorktreeStackKit_InkKeyboardDispatch<ActionPlan> = (action: WorktreeStackKit_InkKeyboardAction<ActionPlan>) => void;
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
export declare function WorktreeStackKit_tryConsumeInkQuitEscapeRefreshKeys<ActionPlan>(options: {
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
}): boolean;
/**
 * Handle shell list-column navigation when focus is outside the editor rail.
 *
 * @remarks Returns `true` when list-column handling swallowed the tick, including unmatched keys.
 */
export declare function WorktreeStackKit_tryConsumeInkShellListNavigationKeys<ActionPlan>(options: {
    readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
    readonly focusedColumn: WorktreeStackKit_InkKeyboardFocusedColumn;
    readonly input: string;
    readonly key: WorktreeStackKit_InkKeyboardKey;
    readonly screen: WorktreeStackKit_InkKeyboardScreen;
    readonly selectedActionIndex: number;
}): boolean;
/**
 * Editor-column keyboard routing for the shell action rail and inline editors.
 *
 * @remarks Mirrors historical control flow: arrow guards, per-action blocks, then shared rail hotkeys.
 */
export declare function WorktreeStackKit_dispatchInkEditorColumnInput<ActionPlan>(options: WorktreeStackKit_InkEditorColumnInputOptions<ActionPlan>): void;
/** Handle follow-up start shortcut on the post-run result screen. */
export declare function WorktreeStackKit_tryConsumeInkResultScreenKeys<ActionPlan>(options: {
    readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
    readonly followUpStartPlan: ActionPlan | null | undefined;
    readonly input: string;
    readonly screen: WorktreeStackKit_InkKeyboardScreen;
}): boolean;
/** Route review-screen confirmation typing and session start from review. */
export declare function WorktreeStackKit_dispatchInkReviewScreenKeys<ActionPlan extends WorktreeStackKit_InkKeyboardReviewActionPlan>(options: {
    readonly dispatch: WorktreeStackKit_InkKeyboardDispatch<ActionPlan>;
    readonly input: string;
    readonly key: WorktreeStackKit_InkKeyboardKey;
    readonly state: WorktreeStackKit_InkReviewKeyboardState<ActionPlan>;
}): void;
/** Type guard-friendly helper for callers that need the shared action ids. */
export declare function WorktreeStackKit_isInkKeyboardActionId(actionId: string): actionId is WorktreeStackKit_InkActionId;
//# sourceMappingURL=ink-keyboard-routing.d.ts.map