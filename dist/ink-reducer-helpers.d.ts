/**
 * @fileoverview Reusable pure helper functions for worktree Ink reducer state transitions.
 *
 * This module owns index clamping, create-region navigation, and default action-option state used
 * by worktree Ink reducer adapters. Project UI reducers keep inventory, session, and command-plan
 * contracts while delegating these generic transition primitives to the package.
 *
 * @example
 * ```typescript
 * import {
 *   WorktreeStackKit_clampInkRecordIndex,
 *   WorktreeStackKit_createDefaultInkActionOptions,
 * } from "@gg-utils/worktree-kit/ink-reducer-helpers";
 *
 * const actionOptions = WorktreeStackKit_createDefaultInkActionOptions();
 * const selectedIndex = WorktreeStackKit_clampInkRecordIndex({
 *   index: 5,
 *   recordCount: 3,
 * });
 * ```
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/ink-reducer-helpers.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute every packages/worktree-kit src/*.unit.test.ts file via tsx --test, including ink-reducer-helpers.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-reducer.ts - Ink reducer entrypoint that composes these helpers into the full dispatch table and initial state factory for the worktree Ink shell.
 * @see packages/worktree-kit/src/ink-create-model.ts - Create wizard section and field catalog consulted while this module clamps indices and steps create-form focus.
 * @see packages/worktree-kit/src/ink-reducer-helpers.unit.test.ts - Node test runner regression coverage for clamping, navigation, overlay, session, and action-option transitions owned here.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository standard defining the audited file-overview tag order and @see path discipline used by this header.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkActionId } from "./ink-launch-options.js";
import type { WorktreeStackKit_InkCreateDraft } from "./ink-launch-options.js";
/** Execution mode for worktree Ink plan/push operations. */
export type WorktreeStackKit_InkExecutionMode = "plan" | "push";
/** Refresh mode for update-from-main operations. */
export type WorktreeStackKit_InkUpdateFromMainMode = "live-worktree" | "pushed-only";
/** Region IDs for the create form layout. */
export type WorktreeStackKit_InkCreateRegion = "sections" | "fields" | "editor" | "preview";
/** Interaction mode for the create form. */
export type WorktreeStackKit_InkCreateInteractionMode = "browse" | "edit";
/** Focused column in the worktree Ink main shell layout. */
export type WorktreeStackKit_InkFocusedColumn = "records" | "actions" | "editor";
/** Screen ids for the worktree Ink reducer shell. */
export type WorktreeStackKit_InkScreen = "shell" | "action-editor" | "review" | "session" | "result";
/** Persisted option state across Ink UI actions. */
export type WorktreeStackKit_InkActionOptionState = {
    readonly mergeExecutionMode: WorktreeStackKit_InkExecutionMode;
    readonly openWindsurfOnStart: boolean;
    readonly poolNextStackName: string;
    readonly pruneAfterDestroy: boolean;
    readonly repairDryRun: boolean;
    readonly repairIncludePackageEnv: boolean;
    readonly repairLegacyPackageEnvAlias: boolean;
    readonly repairScope: "all-prepared" | "selected-record";
    readonly stateCheckFetch: boolean;
    readonly syncScope: "all-discovered" | "selected-record";
    readonly updateFromMainExecutionMode: WorktreeStackKit_InkExecutionMode;
    readonly updateFromMainMode: WorktreeStackKit_InkUpdateFromMainMode;
};
/** Async inventory loading status for worktree Ink reducer shells. */
export type WorktreeStackKit_InkLoadStatus = "loading" | "ready" | "error";
/** Builds the default persisted action-option state for a new Ink reducer session. */
export declare function WorktreeStackKit_createDefaultInkActionOptions(): WorktreeStackKit_InkActionOptionState;
/** Supported reducer events for the async Ink inventory-load lifecycle. */
export type WorktreeStackKit_InkLoadAction<TInventory> = {
    readonly type: "load-start";
} | {
    readonly type: "load-success";
    readonly inventory: TInventory;
    readonly recordCount: number;
} | {
    readonly type: "load-error";
    readonly errorMessage: string;
};
/** Minimal load lifecycle state updated by package-owned inventory transitions. */
export type WorktreeStackKit_InkLoadState<TInventory, TPlan, TSession, TResult> = {
    readonly activePlan: TPlan | null;
    readonly errorMessage: string | null;
    readonly inventory: TInventory | null;
    readonly resultModel: TResult | null;
    readonly screen: WorktreeStackKit_InkScreen;
    readonly selectedActionIndex: number;
    readonly selectedIndex: number;
    readonly sessionModel: TSession | null;
    readonly status: WorktreeStackKit_InkLoadStatus;
};
/** Applies one async inventory-load lifecycle transition. */
export declare function WorktreeStackKit_applyInkLoadAction<TInventory, TPlan, TSession, TResult, TState extends WorktreeStackKit_InkLoadState<TInventory, TPlan, TSession, TResult>>(options: {
    readonly action: WorktreeStackKit_InkLoadAction<TInventory>;
    readonly state: TState;
}): (TState & {
    status: string;
    errorMessage: null;
}) | (TState & {
    status: string;
    inventory: TInventory;
    errorMessage: null;
    selectedIndex: number;
    selectedActionIndex: number;
}) | (TState & {
    status: string;
    errorMessage: string;
    screen: string;
    activePlan: null;
    sessionModel: null;
    resultModel: null;
});
/** Supported reducer event for applying a resolved launch target at startup. */
export type WorktreeStackKit_InkLaunchTargetAction<TCreateDraft, TActionOptions extends object> = {
    readonly type: "apply-launch-target";
    readonly actionOptionsPatch: Partial<TActionOptions> | null;
    readonly createDraft: TCreateDraft;
    readonly noticeMessage: string | null;
    readonly screen: WorktreeStackKit_InkScreen;
    readonly selectedActionIndex: number;
    readonly selectedIndex: number;
};
/** Minimal launch-target state reset by package-owned startup target resolution. */
export type WorktreeStackKit_InkLaunchTargetState<TCreateDraft, TActionOptions extends object, TPlan, TSession, TResult> = {
    readonly actionOptions: TActionOptions;
    readonly activePlan: TPlan | null;
    readonly createDraft: TCreateDraft;
    readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
    readonly createRegion: WorktreeStackKit_InkCreateRegion;
    readonly noticeMessage: string | null;
    readonly poolNextStackEditMode: boolean;
    readonly resultModel: TResult | null;
    readonly reviewConfirmationInput: string;
    readonly screen: WorktreeStackKit_InkScreen;
    readonly selectedActionIndex: number;
    readonly selectedCreateFieldIndex: number;
    readonly selectedCreateSectionIndex: number;
    readonly selectedIndex: number;
    readonly sessionModel: TSession | null;
};
/** Applies a package-owned startup launch-target transition. */
export declare function WorktreeStackKit_applyInkLaunchTargetAction<TCreateDraft, TActionOptions extends object, TPlan, TSession, TResult, TState extends WorktreeStackKit_InkLaunchTargetState<TCreateDraft, TActionOptions, TPlan, TSession, TResult>>(options: {
    readonly action: WorktreeStackKit_InkLaunchTargetAction<TCreateDraft, TActionOptions>;
    readonly recordCount: number;
    readonly state: TState;
}): TState & {
    selectedIndex: number;
    selectedActionIndex: number;
    selectedCreateSectionIndex: number;
    selectedCreateFieldIndex: number;
    createRegion: string;
    createInteractionMode: string;
    screen: WorktreeStackKit_InkScreen;
    createDraft: TCreateDraft;
    noticeMessage: string | null;
    activePlan: null;
    sessionModel: null;
    resultModel: null;
    reviewConfirmationInput: string;
    poolNextStackEditMode: boolean;
    actionOptions: TActionOptions;
};
/** Clamps a record-list selection index to the current inventory bounds. */
export declare function WorktreeStackKit_clampInkRecordIndex(options: {
    readonly index: number;
    readonly recordCount: number;
}): number;
/** Clamps the action-rail index, preserving `-1` as the no-selection sentinel. */
export declare function WorktreeStackKit_clampInkActionIndex(index: number): number;
/** Clamps the create-flow section index to configured wizard sections. */
export declare function WorktreeStackKit_clampInkCreateSectionIndex(index: number): number;
/** Resolves the first navigable field index for a create wizard section. */
export declare function WorktreeStackKit_getFirstInkCreateFieldIndexForSection(sectionIndex: number): number;
/** Lists global field indices for every field rendered in a create section. */
export declare function WorktreeStackKit_getInkCreateFieldIndicesForSection(sectionIndex: number): number[];
/** Steps create-field focus within the current section along ordered field ids. */
export declare function WorktreeStackKit_stepInkCreateFieldIndexWithinSection(options: {
    readonly currentFieldIndex: number;
    readonly direction: 1 | -1;
    readonly sectionIndex: number;
}): number;
/** Rotates create UI focus across the fixed create-region ring. */
export declare function WorktreeStackKit_stepInkCreateRegion(options: {
    readonly direction: 1 | -1;
    readonly region: WorktreeStackKit_InkCreateRegion;
}): WorktreeStackKit_InkCreateRegion;
/** Supported reducer events for navigating create-form sections, fields, and regions. */
export type WorktreeStackKit_InkCreateNavigationAction = {
    readonly type: "select-next-create-field";
} | {
    readonly type: "select-previous-create-field";
} | {
    readonly type: "select-next-create-section";
} | {
    readonly type: "select-previous-create-section";
} | {
    readonly type: "focus-next-create-region";
} | {
    readonly type: "focus-previous-create-region";
};
/** Minimal create-navigation state updated by package-owned create-form transitions. */
export type WorktreeStackKit_InkCreateNavigationState = {
    readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
    readonly createRegion: WorktreeStackKit_InkCreateRegion;
    readonly selectedCreateFieldIndex: number;
    readonly selectedCreateSectionIndex: number;
};
/** Applies one create-form section/field/region navigation transition. */
export declare function WorktreeStackKit_applyInkCreateNavigationAction<TState extends WorktreeStackKit_InkCreateNavigationState>(options: {
    readonly action: WorktreeStackKit_InkCreateNavigationAction;
    readonly state: TState;
}): TState;
export declare function WorktreeStackKit_applyInkCreateNavigationAction(options: {
    readonly action: WorktreeStackKit_InkCreateNavigationAction;
    readonly state: WorktreeStackKit_InkCreateNavigationState;
}): WorktreeStackKit_InkCreateNavigationState;
/** Supported reducer events for navigating the main Ink shell. */
export type WorktreeStackKit_InkShellNavigationAction = {
    readonly type: "select-next";
} | {
    readonly type: "select-previous";
} | {
    readonly type: "select-next-action";
} | {
    readonly type: "select-previous-action";
} | {
    readonly type: "focus-column-left";
} | {
    readonly type: "focus-column-right";
} | {
    readonly type: "navigate-up";
} | {
    readonly type: "navigate-down";
} | {
    readonly type: "open-action-editor";
};
/** Minimal shell state needed for package-owned navigation transitions. */
export type WorktreeStackKit_InkShellNavigationState = {
    readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
    readonly focusedColumn: WorktreeStackKit_InkFocusedColumn;
    readonly poolNextStackEditMode: boolean;
    readonly selectedActionIndex: number;
    readonly selectedIndex: number;
};
/** Applies one main-shell keyboard/navigation reducer event. */
export declare function WorktreeStackKit_applyInkShellNavigationAction<TState extends WorktreeStackKit_InkShellNavigationState>(options: {
    readonly action: WorktreeStackKit_InkShellNavigationAction;
    readonly recordCount: number;
    readonly state: TState;
}): TState;
export declare function WorktreeStackKit_applyInkShellNavigationAction(options: {
    readonly action: WorktreeStackKit_InkShellNavigationAction;
    readonly recordCount: number;
    readonly state: WorktreeStackKit_InkShellNavigationState;
}): WorktreeStackKit_InkShellNavigationState;
/** Minimal completed-result contract needed for reducer refresh decisions. */
export type WorktreeStackKit_InkResultShape = {
    readonly refreshRequested: boolean;
};
/** Supported reducer events for review/result overlays and refresh notices. */
export type WorktreeStackKit_InkOverlayAction<TPlan, TResult> = {
    readonly type: "open-review";
    readonly plan: TPlan;
} | {
    readonly type: "show-result";
    readonly result: TResult;
} | {
    readonly type: "append-review-confirmation";
    readonly value: string;
} | {
    readonly type: "backspace-review-confirmation";
} | {
    readonly type: "close-overlay";
} | {
    readonly type: "refresh-requested";
};
/** Minimal overlay state needed for package-owned review/result transitions. */
export type WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult> = {
    readonly activePlan: TPlan | null;
    readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
    readonly focusedColumn: WorktreeStackKit_InkFocusedColumn;
    readonly noticeMessage: string | null;
    readonly poolNextStackEditMode: boolean;
    readonly refreshToken: number;
    readonly resultModel: TResult | null;
    readonly reviewConfirmationInput: string;
    readonly screen: WorktreeStackKit_InkScreen;
    readonly selectedActionIndex: number;
    readonly sessionModel: TSession | null;
};
/** Applies one review/result overlay reducer event. */
export declare function WorktreeStackKit_applyInkOverlayAction<TPlan, TSession, TResult extends WorktreeStackKit_InkResultShape, TState extends WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>>(options: {
    readonly action: WorktreeStackKit_InkOverlayAction<TPlan, TResult>;
    readonly state: TState;
}): TState;
export declare function WorktreeStackKit_applyInkOverlayAction<TPlan, TSession, TResult extends WorktreeStackKit_InkResultShape>(options: {
    readonly action: WorktreeStackKit_InkOverlayAction<TPlan, TResult>;
    readonly state: WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>;
}): WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>;
/** Supported reducer events for editing the create-form field currently in focus. */
export type WorktreeStackKit_InkCreateFieldAction = {
    readonly type: "start-create-field-edit";
} | {
    readonly type: "stop-create-field-edit";
} | {
    readonly type: "append-create-field-input";
    readonly value: string;
} | {
    readonly type: "backspace-create-field-input";
} | {
    readonly type: "toggle-create-field";
};
/** Result of applying one create-field reducer event. */
export type WorktreeStackKit_InkCreateFieldActionResult = {
    readonly createDraft: WorktreeStackKit_InkCreateDraft;
    readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
    readonly createRegion: WorktreeStackKit_InkCreateRegion;
};
/** Minimal full-state shape updated by package-owned create-field reducer events. */
export type WorktreeStackKit_InkCreateFieldState = WorktreeStackKit_InkCreateFieldActionResult & {
    readonly selectedCreateFieldIndex: number;
};
type WorktreeStackKit_InkCreateFieldStateActionResult<TState> = Omit<TState, keyof WorktreeStackKit_InkCreateFieldActionResult> & WorktreeStackKit_InkCreateFieldActionResult;
/** Applies one create-field edit/toggle reducer event to the current create-form state. */
export declare function WorktreeStackKit_applyInkCreateFieldAction(options: {
    readonly action: WorktreeStackKit_InkCreateFieldAction;
    readonly createDraft: WorktreeStackKit_InkCreateDraft;
    readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
    readonly createRegion: WorktreeStackKit_InkCreateRegion;
    readonly selectedCreateFieldIndex: number;
}): WorktreeStackKit_InkCreateFieldActionResult;
/** Applies one create-field reducer event to a full Ink reducer state. */
export declare function WorktreeStackKit_applyInkCreateFieldStateAction<TState extends WorktreeStackKit_InkCreateFieldState>(options: {
    readonly action: WorktreeStackKit_InkCreateFieldAction;
    readonly state: TState;
}): WorktreeStackKit_InkCreateFieldStateActionResult<TState>;
/** Supported reducer action-option event names. */
export type WorktreeStackKit_InkActionOptionActionType = "toggle-primary-action-option" | "toggle-secondary-action-option" | "toggle-repair-legacy-package-alias" | "cycle-repair-target-scope" | "cycle-sync-target-scope";
/** Supported reducer text/edit events for the realm-pool next stack-name option. */
export type WorktreeStackKit_InkPoolNextStackAction = {
    readonly type: "toggle-pool-next-stack-edit";
} | {
    readonly type: "append-pool-next-stack-input";
    readonly value: string;
} | {
    readonly type: "backspace-pool-next-stack-input";
};
/** Returns action-option state after applying the focused action's primary option toggle. */
export declare function WorktreeStackKit_applyPrimaryInkActionOption(options: {
    readonly actionId: WorktreeStackKit_InkActionId;
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
}): WorktreeStackKit_InkActionOptionState;
/** Returns action-option state after applying the focused action's secondary option toggle. */
export declare function WorktreeStackKit_applySecondaryInkActionOption(options: {
    readonly actionId: WorktreeStackKit_InkActionId;
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
}): WorktreeStackKit_InkActionOptionState;
/** Applies one action-option reducer event for the selected action id. */
export declare function WorktreeStackKit_applyInkActionOptionAction(options: {
    readonly actionId: WorktreeStackKit_InkActionId;
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
    readonly actionType: WorktreeStackKit_InkActionOptionActionType;
}): WorktreeStackKit_InkActionOptionState;
/** Minimal full-state shape for focused action-option reducer transitions. */
export type WorktreeStackKit_InkFocusedActionOptionState = {
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
    readonly selectedActionIndex: number;
};
type WorktreeStackKit_InkFocusedActionOptionStateResult<TState> = Omit<TState, "actionOptions"> & {
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
};
/** Applies an action-option reducer event to the action focused by the selected action index. */
export declare function WorktreeStackKit_applyFocusedInkActionOptionAction<TState extends WorktreeStackKit_InkFocusedActionOptionState>(options: {
    readonly actionType: WorktreeStackKit_InkActionOptionActionType;
    readonly state: TState;
}): WorktreeStackKit_InkFocusedActionOptionStateResult<TState>;
/** Result of applying a realm-pool next stack-name edit event. */
export type WorktreeStackKit_InkPoolNextStackActionResult = {
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
    readonly poolNextStackEditMode: boolean;
};
/** Applies one realm-pool next stack-name edit reducer event. */
export declare function WorktreeStackKit_applyInkPoolNextStackAction(options: {
    readonly actionId: WorktreeStackKit_InkActionId;
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
    readonly action: WorktreeStackKit_InkPoolNextStackAction;
    readonly poolNextStackEditMode: boolean;
}): WorktreeStackKit_InkPoolNextStackActionResult;
/** Minimal full-state shape for focused realm-pool next stack-name transitions. */
export type WorktreeStackKit_InkFocusedPoolNextStackState = WorktreeStackKit_InkFocusedActionOptionState & {
    readonly poolNextStackEditMode: boolean;
};
type WorktreeStackKit_InkFocusedPoolNextStackStateResult<TState> = Omit<TState, "actionOptions" | "poolNextStackEditMode"> & {
    readonly actionOptions: WorktreeStackKit_InkActionOptionState;
    readonly poolNextStackEditMode: boolean;
};
/** Applies a realm-pool next stack-name event to the currently focused action row. */
export declare function WorktreeStackKit_applyFocusedInkPoolNextStackAction<TState extends WorktreeStackKit_InkFocusedPoolNextStackState>(options: {
    readonly action: WorktreeStackKit_InkPoolNextStackAction;
    readonly state: TState;
}): WorktreeStackKit_InkFocusedPoolNextStackStateResult<TState>;
/** Session status values used by package-owned Ink session helpers. */
export type WorktreeStackKit_InkSessionStatus = "queued" | "starting" | "watching-sidecars" | "running" | "cancelling";
/** Minimal command request contract needed to build a display command line. */
export type WorktreeStackKit_InkCommandRequestShape = {
    command: string;
    args: readonly string[];
};
/** Generic active session model built by the Ink reducer helpers. */
export type WorktreeStackKit_InkSessionModel<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine> = {
    actionLabel: string;
    commandLine: string;
    lines: TLine[];
    request: TRequest;
    startedAt: string | null;
    status: WorktreeStackKit_InkSessionStatus;
};
/** Session telemetry events that mutate an active session model. */
export type WorktreeStackKit_InkSessionAction<TLine> = {
    readonly type: "session-started";
    readonly startedAt: string;
} | {
    readonly type: "session-status";
    readonly status: WorktreeStackKit_InkSessionStatus;
} | {
    readonly type: "session-line";
    readonly line: TLine;
};
/** Builds the queued session snapshot for a runnable action request. */
export declare function WorktreeStackKit_buildInkSessionModel<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine>(options: {
    readonly actionLabel: string;
    readonly request: TRequest;
}): WorktreeStackKit_InkSessionModel<TRequest, TLine>;
/** Applies one session telemetry event when a session model is mounted. */
export declare function WorktreeStackKit_applyInkSessionAction<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine>(options: {
    readonly action: WorktreeStackKit_InkSessionAction<TLine>;
    readonly sessionModel: WorktreeStackKit_InkSessionModel<TRequest, TLine> | null;
}): WorktreeStackKit_InkSessionModel<TRequest, TLine> | null;
/** Minimal full-state shape updated by package-owned session telemetry events. */
export type WorktreeStackKit_InkSessionState<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine> = {
    readonly sessionModel: WorktreeStackKit_InkSessionModel<TRequest, TLine> | null;
};
type WorktreeStackKit_InkSessionStateActionResult<TState, TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine> = Omit<TState, "sessionModel"> & WorktreeStackKit_InkSessionState<TRequest, TLine>;
/** Applies one session telemetry reducer event to a full Ink reducer state. */
export declare function WorktreeStackKit_applyInkSessionStateAction<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine, TState extends WorktreeStackKit_InkSessionState<TRequest, TLine>>(options: {
    readonly action: WorktreeStackKit_InkSessionAction<TLine>;
    readonly state: TState;
}): WorktreeStackKit_InkSessionStateActionResult<TState, TRequest, TLine>;
/** Generic blocked result shape created when an action has no runnable request. */
export type WorktreeStackKit_InkBlockedResult<TLine, THandoff> = {
    createHandoff: THandoff | null;
    endedAt: null;
    exitCode: null;
    lines: TLine[];
    message: string;
    refreshRequested: false;
    signal: null;
    startedAt: null;
    status: "blocked";
};
/** Builds the stable blocked result used when a selected action cannot run. */
export declare function WorktreeStackKit_createBlockedInkResult<TLine, THandoff>(options: {
    readonly createHandoff: THandoff | null;
    readonly message: string;
}): WorktreeStackKit_InkBlockedResult<TLine, THandoff>;
/** Minimal plan contract needed to mount a queued or blocked Ink session. */
export type WorktreeStackKit_InkStartSessionPlan<TRequest extends WorktreeStackKit_InkCommandRequestShape> = {
    readonly actionLabel: string;
    readonly request: TRequest | null;
};
/** Minimal state updated by package-owned start-session transitions. */
export type WorktreeStackKit_InkStartSessionState<TPlan, TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine, TResult> = {
    readonly activePlan: TPlan | null;
    readonly resultModel: TResult | null;
    readonly reviewConfirmationInput: string;
    readonly screen: WorktreeStackKit_InkScreen;
    readonly sessionModel: WorktreeStackKit_InkSessionModel<TRequest, TLine> | null;
    readonly sessionRunId: number;
};
type WorktreeStackKit_InkStartSessionActionStateResult<TState, TPlan, TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine, TResult, THandoff> = Omit<TState, keyof WorktreeStackKit_InkStartSessionState<TPlan, TRequest, TLine, TResult>> & WorktreeStackKit_InkStartSessionState<TPlan, TRequest, TLine, TResult | WorktreeStackKit_InkBlockedResult<TLine, THandoff>>;
/** Applies the reducer transition that starts a runnable session or emits a blocked result. */
export declare function WorktreeStackKit_applyInkStartSessionAction<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine, THandoff, TPlan extends WorktreeStackKit_InkStartSessionPlan<TRequest>, TResult, TState extends WorktreeStackKit_InkStartSessionState<TPlan, TRequest, TLine, TResult>>(options: {
    readonly blockedCreateHandoff: THandoff | null;
    readonly blockedMessage: string;
    readonly plan: TPlan;
    readonly state: TState;
}): WorktreeStackKit_InkStartSessionActionStateResult<TState, TPlan, TRequest, TLine, TResult, THandoff>;
export declare function WorktreeStackKit_applyInkStartSessionAction<TRequest extends WorktreeStackKit_InkCommandRequestShape, TLine, THandoff, TPlan extends WorktreeStackKit_InkStartSessionPlan<TRequest>, TResult>(options: {
    readonly blockedCreateHandoff: THandoff | null;
    readonly blockedMessage: string;
    readonly plan: TPlan;
    readonly state: WorktreeStackKit_InkStartSessionState<TPlan, TRequest, TLine, TResult>;
}): WorktreeStackKit_InkStartSessionState<TPlan, TRequest, TLine, TResult | WorktreeStackKit_InkBlockedResult<TLine, THandoff>>;
export {};
