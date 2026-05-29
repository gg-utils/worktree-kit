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

import { WORKTREE_STACK_KIT_INK_ACTIONS } from "./ink-action-catalog.js";
import type { WorktreeStackKit_InkActionId } from "./ink-launch-options.js";
import {
  WORKTREE_STACK_KIT_INK_CREATE_SECTIONS,
  WorktreeStackKit_getInkCreateField,
  WorktreeStackKit_getInkCreateFieldIndex,
  WorktreeStackKit_getInkCreateFieldsForSection,
  WorktreeStackKit_getInkCreateSection,
  type WorktreeStackKit_InkCreateFieldId,
} from "./ink-create-model.js";
import type { WorktreeStackKit_InkCreateDraft } from "./ink-launch-options.js";

/** Execution mode for worktree Ink plan/push operations. */
export type WorktreeStackKit_InkExecutionMode = "plan" | "push";

/** Refresh mode for update-from-main operations. */
export type WorktreeStackKit_InkUpdateFromMainMode =
  | "live-worktree"
  | "pushed-only";

/** Region IDs for the create form layout. */
export type WorktreeStackKit_InkCreateRegion =
  | "sections"
  | "fields"
  | "editor"
  | "preview";

/** Interaction mode for the create form. */
export type WorktreeStackKit_InkCreateInteractionMode = "browse" | "edit";

/** Focused column in the worktree Ink main shell layout. */
export type WorktreeStackKit_InkFocusedColumn =
  | "records"
  | "actions"
  | "editor";

/** Screen ids for the worktree Ink reducer shell. */
export type WorktreeStackKit_InkScreen =
  | "shell"
  | "action-editor"
  | "review"
  | "session"
  | "result";

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

const WORKTREE_STACK_KIT_CREATE_REGION_ORDER: readonly WorktreeStackKit_InkCreateRegion[] =
  ["sections", "fields", "editor", "preview"];

/** Builds the default persisted action-option state for a new Ink reducer session. */
export function WorktreeStackKit_createDefaultInkActionOptions(): WorktreeStackKit_InkActionOptionState {
  return {
    openWindsurfOnStart: false,
    pruneAfterDestroy: false,
    updateFromMainMode: "live-worktree",
    updateFromMainExecutionMode: "plan",
    mergeExecutionMode: "plan",
    repairDryRun: false,
    repairIncludePackageEnv: false,
    repairLegacyPackageEnvAlias: false,
    repairScope: "all-prepared",
    syncScope: "all-discovered",
    poolNextStackName: "",
    stateCheckFetch: false,
  };
}

/** Supported reducer events for the async Ink inventory-load lifecycle. */
export type WorktreeStackKit_InkLoadAction<TInventory> =
  | { readonly type: "load-start" }
  | {
      readonly type: "load-success";
      readonly inventory: TInventory;
      readonly recordCount: number;
    }
  | { readonly type: "load-error"; readonly errorMessage: string };

/** Minimal load lifecycle state updated by package-owned inventory transitions. */
export type WorktreeStackKit_InkLoadState<
  TInventory,
  TPlan,
  TSession,
  TResult,
> = {
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
export function WorktreeStackKit_applyInkLoadAction<
  TInventory,
  TPlan,
  TSession,
  TResult,
  TState extends WorktreeStackKit_InkLoadState<
    TInventory,
    TPlan,
    TSession,
    TResult
  >,
>(options: {
  readonly action: WorktreeStackKit_InkLoadAction<TInventory>;
  readonly state: TState;
}) {
  switch (options.action.type) {
    case "load-start":
      return {
        ...options.state,
        status: "loading",
        errorMessage: null,
      };
    case "load-success":
      return {
        ...options.state,
        status: "ready",
        inventory: options.action.inventory,
        errorMessage: null,
        selectedIndex: WorktreeStackKit_clampInkRecordIndex({
          index: options.state.selectedIndex,
          recordCount: options.action.recordCount,
        }),
        selectedActionIndex: WorktreeStackKit_clampInkActionIndex(
          options.state.selectedActionIndex,
        ),
      };
    case "load-error":
      return {
        ...options.state,
        status: "error",
        errorMessage: options.action.errorMessage,
        screen: "shell",
        activePlan: null,
        sessionModel: null,
        resultModel: null,
      };
  }
}

/** Supported reducer event for applying a resolved launch target at startup. */
export type WorktreeStackKit_InkLaunchTargetAction<
  TCreateDraft,
  TActionOptions extends object,
> = {
  readonly type: "apply-launch-target";
  readonly actionOptionsPatch: Partial<TActionOptions> | null;
  readonly createDraft: TCreateDraft;
  readonly noticeMessage: string | null;
  readonly screen: WorktreeStackKit_InkScreen;
  readonly selectedActionIndex: number;
  readonly selectedIndex: number;
};

/** Minimal launch-target state reset by package-owned startup target resolution. */
export type WorktreeStackKit_InkLaunchTargetState<
  TCreateDraft,
  TActionOptions extends object,
  TPlan,
  TSession,
  TResult,
> = {
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
export function WorktreeStackKit_applyInkLaunchTargetAction<
  TCreateDraft,
  TActionOptions extends object,
  TPlan,
  TSession,
  TResult,
  TState extends WorktreeStackKit_InkLaunchTargetState<
    TCreateDraft,
    TActionOptions,
    TPlan,
    TSession,
    TResult
  >,
>(options: {
  readonly action: WorktreeStackKit_InkLaunchTargetAction<
    TCreateDraft,
    TActionOptions
  >;
  readonly recordCount: number;
  readonly state: TState;
}) {
  const actionOptionsPatch = options.action.actionOptionsPatch ?? {};

  return {
    ...options.state,
    selectedIndex: WorktreeStackKit_clampInkRecordIndex({
      index: options.action.selectedIndex,
      recordCount: options.recordCount,
    }),
    selectedActionIndex: WorktreeStackKit_clampInkActionIndex(
      options.action.selectedActionIndex,
    ),
    selectedCreateSectionIndex: 0,
    selectedCreateFieldIndex: 0,
    createRegion: "fields",
    createInteractionMode: "browse",
    screen: options.action.screen,
    createDraft: options.action.createDraft,
    noticeMessage: options.action.noticeMessage,
    activePlan: null,
    sessionModel: null,
    resultModel: null,
    reviewConfirmationInput: "",
    poolNextStackEditMode: false,
    actionOptions: {
      ...options.state.actionOptions,
      ...actionOptionsPatch,
    },
  };
}

/** Clamps a record-list selection index to the current inventory bounds. */
export function WorktreeStackKit_clampInkRecordIndex(options: {
  readonly index: number;
  readonly recordCount: number;
}): number {
  if (options.recordCount <= 0) {
    return 0;
  }
  if (options.index < 0) {
    return 0;
  }
  if (options.index >= options.recordCount) {
    return options.recordCount - 1;
  }
  return options.index;
}

/** Clamps the action-rail index, preserving `-1` as the no-selection sentinel. */
export function WorktreeStackKit_clampInkActionIndex(index: number): number {
  const actionCount = WORKTREE_STACK_KIT_INK_ACTIONS.length;
  if (actionCount <= 0) {
    return -1;
  }
  if (index < -1) {
    return actionCount - 1;
  }
  if (index >= actionCount) {
    return -1;
  }
  return index;
}

/** Clamps the create-flow section index to configured wizard sections. */
export function WorktreeStackKit_clampInkCreateSectionIndex(
  index: number,
): number {
  const sectionCount = WORKTREE_STACK_KIT_INK_CREATE_SECTIONS.length;
  if (sectionCount <= 0) {
    return 0;
  }
  if (index < 0) {
    return 0;
  }
  if (index >= sectionCount) {
    return sectionCount - 1;
  }
  return index;
}

/** Resolves the first navigable field index for a create wizard section. */
export function WorktreeStackKit_getFirstInkCreateFieldIndexForSection(
  sectionIndex: number,
): number {
  const section = WorktreeStackKit_getInkCreateSection(
    WorktreeStackKit_clampInkCreateSectionIndex(sectionIndex),
  );
  if (!section) {
    return 0;
  }

  const firstField = WorktreeStackKit_getInkCreateFieldsForSection(
    section.id,
  )[0];
  if (!firstField) {
    return 0;
  }

  const fieldIndex = WorktreeStackKit_getInkCreateFieldIndex(firstField.id);
  return fieldIndex >= 0 ? fieldIndex : 0;
}

/** Lists global field indices for every field rendered in a create section. */
export function WorktreeStackKit_getInkCreateFieldIndicesForSection(
  sectionIndex: number,
): number[] {
  const section = WorktreeStackKit_getInkCreateSection(
    WorktreeStackKit_clampInkCreateSectionIndex(sectionIndex),
  );
  if (!section) {
    return [];
  }

  return WorktreeStackKit_getInkCreateFieldsForSection(section.id)
    .map((field) => WorktreeStackKit_getInkCreateFieldIndex(field.id))
    .filter((fieldIndex) => fieldIndex >= 0);
}

/** Steps create-field focus within the current section along ordered field ids. */
export function WorktreeStackKit_stepInkCreateFieldIndexWithinSection(options: {
  readonly currentFieldIndex: number;
  readonly direction: 1 | -1;
  readonly sectionIndex: number;
}): number {
  const fieldIndices = WorktreeStackKit_getInkCreateFieldIndicesForSection(
    options.sectionIndex,
  );
  if (fieldIndices.length <= 0) {
    return 0;
  }

  const currentPosition = fieldIndices.indexOf(options.currentFieldIndex);
  const clampedCurrentPosition = currentPosition < 0 ? 0 : currentPosition;
  const nextPosition = Math.min(
    Math.max(clampedCurrentPosition + options.direction, 0),
    fieldIndices.length - 1,
  );

  return fieldIndices[nextPosition] ?? fieldIndices[0] ?? 0;
}

/** Rotates create UI focus across the fixed create-region ring. */
export function WorktreeStackKit_stepInkCreateRegion(options: {
  readonly direction: 1 | -1;
  readonly region: WorktreeStackKit_InkCreateRegion;
}): WorktreeStackKit_InkCreateRegion {
  const currentIndex = WORKTREE_STACK_KIT_CREATE_REGION_ORDER.indexOf(
    options.region,
  );
  const nextIndex =
    (currentIndex +
      options.direction +
      WORKTREE_STACK_KIT_CREATE_REGION_ORDER.length) %
    WORKTREE_STACK_KIT_CREATE_REGION_ORDER.length;

  return WORKTREE_STACK_KIT_CREATE_REGION_ORDER[nextIndex] ?? "fields";
}

/** Supported reducer events for navigating create-form sections, fields, and regions. */
export type WorktreeStackKit_InkCreateNavigationAction =
  | { readonly type: "select-next-create-field" }
  | { readonly type: "select-previous-create-field" }
  | { readonly type: "select-next-create-section" }
  | { readonly type: "select-previous-create-section" }
  | { readonly type: "focus-next-create-region" }
  | { readonly type: "focus-previous-create-region" };

/** Minimal create-navigation state updated by package-owned create-form transitions. */
export type WorktreeStackKit_InkCreateNavigationState = {
  readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
  readonly createRegion: WorktreeStackKit_InkCreateRegion;
  readonly selectedCreateFieldIndex: number;
  readonly selectedCreateSectionIndex: number;
};

/** Applies one create-form section/field/region navigation transition. */
export function WorktreeStackKit_applyInkCreateNavigationAction<
  TState extends WorktreeStackKit_InkCreateNavigationState,
>(options: {
  readonly action: WorktreeStackKit_InkCreateNavigationAction;
  readonly state: TState;
}): TState;
export function WorktreeStackKit_applyInkCreateNavigationAction(options: {
  readonly action: WorktreeStackKit_InkCreateNavigationAction;
  readonly state: WorktreeStackKit_InkCreateNavigationState;
}): WorktreeStackKit_InkCreateNavigationState;
export function WorktreeStackKit_applyInkCreateNavigationAction<
  TState extends WorktreeStackKit_InkCreateNavigationState,
>(options: {
  readonly action: WorktreeStackKit_InkCreateNavigationAction;
  readonly state: TState;
}) {
  switch (options.action.type) {
    case "select-next-create-field":
      return {
        ...options.state,
        selectedCreateFieldIndex:
          WorktreeStackKit_stepInkCreateFieldIndexWithinSection({
            sectionIndex: options.state.selectedCreateSectionIndex,
            currentFieldIndex: options.state.selectedCreateFieldIndex,
            direction: 1,
          }),
        createRegion: "fields",
        createInteractionMode: "browse",
      };
    case "select-previous-create-field":
      return {
        ...options.state,
        selectedCreateFieldIndex:
          WorktreeStackKit_stepInkCreateFieldIndexWithinSection({
            sectionIndex: options.state.selectedCreateSectionIndex,
            currentFieldIndex: options.state.selectedCreateFieldIndex,
            direction: -1,
          }),
        createRegion: "fields",
        createInteractionMode: "browse",
      };
    case "select-next-create-section": {
      const nextSectionIndex = WorktreeStackKit_clampInkCreateSectionIndex(
        options.state.selectedCreateSectionIndex + 1,
      );

      return {
        ...options.state,
        selectedCreateSectionIndex: nextSectionIndex,
        selectedCreateFieldIndex:
          WorktreeStackKit_getFirstInkCreateFieldIndexForSection(
            nextSectionIndex,
          ),
        createRegion: "sections",
        createInteractionMode: "browse",
      };
    }
    case "select-previous-create-section": {
      const nextSectionIndex = WorktreeStackKit_clampInkCreateSectionIndex(
        options.state.selectedCreateSectionIndex - 1,
      );

      return {
        ...options.state,
        selectedCreateSectionIndex: nextSectionIndex,
        selectedCreateFieldIndex:
          WorktreeStackKit_getFirstInkCreateFieldIndexForSection(
            nextSectionIndex,
          ),
        createRegion: "sections",
        createInteractionMode: "browse",
      };
    }
    case "focus-next-create-region":
      return {
        ...options.state,
        createRegion: WorktreeStackKit_stepInkCreateRegion({
          region: options.state.createRegion,
          direction: 1,
        }),
        createInteractionMode: "browse",
      };
    case "focus-previous-create-region":
      return {
        ...options.state,
        createRegion: WorktreeStackKit_stepInkCreateRegion({
          region: options.state.createRegion,
          direction: -1,
        }),
        createInteractionMode: "browse",
      };
  }
}

/** Supported reducer events for navigating the main Ink shell. */
export type WorktreeStackKit_InkShellNavigationAction =
  | { readonly type: "select-next" }
  | { readonly type: "select-previous" }
  | { readonly type: "select-next-action" }
  | { readonly type: "select-previous-action" }
  | { readonly type: "focus-column-left" }
  | { readonly type: "focus-column-right" }
  | { readonly type: "navigate-up" }
  | { readonly type: "navigate-down" }
  | { readonly type: "open-action-editor" };

/** Minimal shell state needed for package-owned navigation transitions. */
export type WorktreeStackKit_InkShellNavigationState = {
  readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
  readonly focusedColumn: WorktreeStackKit_InkFocusedColumn;
  readonly poolNextStackEditMode: boolean;
  readonly selectedActionIndex: number;
  readonly selectedIndex: number;
};

function WorktreeStackKit_resetInkActionSelectionSideEffects(
  state: WorktreeStackKit_InkShellNavigationState,
): WorktreeStackKit_InkShellNavigationState {
  return {
    ...state,
    createInteractionMode: "browse",
    poolNextStackEditMode: false,
  };
}

/** Applies one main-shell keyboard/navigation reducer event. */
export function WorktreeStackKit_applyInkShellNavigationAction<
  TState extends WorktreeStackKit_InkShellNavigationState,
>(options: {
  readonly action: WorktreeStackKit_InkShellNavigationAction;
  readonly recordCount: number;
  readonly state: TState;
}): TState;
export function WorktreeStackKit_applyInkShellNavigationAction(options: {
  readonly action: WorktreeStackKit_InkShellNavigationAction;
  readonly recordCount: number;
  readonly state: WorktreeStackKit_InkShellNavigationState;
}): WorktreeStackKit_InkShellNavigationState;
export function WorktreeStackKit_applyInkShellNavigationAction<
  TState extends WorktreeStackKit_InkShellNavigationState,
>(options: {
  readonly action: WorktreeStackKit_InkShellNavigationAction;
  readonly recordCount: number;
  readonly state: TState;
}) {
  switch (options.action.type) {
    case "select-next":
      return {
        ...options.state,
        selectedIndex: WorktreeStackKit_clampInkRecordIndex({
          index: options.state.selectedIndex + 1,
          recordCount: options.recordCount,
        }),
      };
    case "select-previous":
      return {
        ...options.state,
        selectedIndex: WorktreeStackKit_clampInkRecordIndex({
          index: options.state.selectedIndex - 1,
          recordCount: options.recordCount,
        }),
      };
    case "select-next-action":
      return WorktreeStackKit_resetInkActionSelectionSideEffects({
        ...options.state,
        selectedActionIndex: WorktreeStackKit_clampInkActionIndex(
          options.state.selectedActionIndex + 1,
        ),
      });
    case "select-previous-action":
      return WorktreeStackKit_resetInkActionSelectionSideEffects({
        ...options.state,
        selectedActionIndex: WorktreeStackKit_clampInkActionIndex(
          options.state.selectedActionIndex - 1,
        ),
      });
    case "focus-column-left":
      return {
        ...options.state,
        focusedColumn:
          options.state.focusedColumn === "editor" ? "actions" : "records",
      };
    case "focus-column-right":
      return {
        ...options.state,
        focusedColumn:
          options.state.focusedColumn === "records"
            ? "actions"
            : options.state.focusedColumn === "actions" &&
                options.state.selectedActionIndex >= 0
              ? "editor"
              : "actions",
      };
    case "navigate-up":
      if (options.state.focusedColumn === "records") {
        return {
          ...options.state,
          selectedIndex: WorktreeStackKit_clampInkRecordIndex({
            index: options.state.selectedIndex - 1,
            recordCount: options.recordCount,
          }),
        };
      }

      return WorktreeStackKit_resetInkActionSelectionSideEffects({
        ...options.state,
        selectedActionIndex: WorktreeStackKit_clampInkActionIndex(
          options.state.selectedActionIndex - 1,
        ),
      });
    case "navigate-down":
      if (options.state.focusedColumn === "records") {
        return {
          ...options.state,
          selectedIndex: WorktreeStackKit_clampInkRecordIndex({
            index: options.state.selectedIndex + 1,
            recordCount: options.recordCount,
          }),
        };
      }

      return WorktreeStackKit_resetInkActionSelectionSideEffects({
        ...options.state,
        selectedActionIndex: WorktreeStackKit_clampInkActionIndex(
          options.state.selectedActionIndex + 1,
        ),
      });
    case "open-action-editor":
      return WorktreeStackKit_resetInkActionSelectionSideEffects({
        ...options.state,
        focusedColumn: "editor",
      });
  }
}

/** Minimal completed-result contract needed for reducer refresh decisions. */
export type WorktreeStackKit_InkResultShape = {
  readonly refreshRequested: boolean;
};

/** Supported reducer events for review/result overlays and refresh notices. */
export type WorktreeStackKit_InkOverlayAction<TPlan, TResult> =
  | { readonly type: "open-review"; readonly plan: TPlan }
  | { readonly type: "show-result"; readonly result: TResult }
  | { readonly type: "append-review-confirmation"; readonly value: string }
  | { readonly type: "backspace-review-confirmation" }
  | { readonly type: "close-overlay" }
  | { readonly type: "refresh-requested" };

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
export function WorktreeStackKit_applyInkOverlayAction<
  TPlan,
  TSession,
  TResult extends WorktreeStackKit_InkResultShape,
  TState extends WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>,
>(options: {
  readonly action: WorktreeStackKit_InkOverlayAction<TPlan, TResult>;
  readonly state: TState;
}): TState;
export function WorktreeStackKit_applyInkOverlayAction<
  TPlan,
  TSession,
  TResult extends WorktreeStackKit_InkResultShape,
>(options: {
  readonly action: WorktreeStackKit_InkOverlayAction<TPlan, TResult>;
  readonly state: WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>;
}): WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>;
export function WorktreeStackKit_applyInkOverlayAction<
  TPlan,
  TSession,
  TResult extends WorktreeStackKit_InkResultShape,
  TState extends WorktreeStackKit_InkOverlayState<TPlan, TSession, TResult>,
>(options: {
  readonly action: WorktreeStackKit_InkOverlayAction<TPlan, TResult>;
  readonly state: TState;
}) {
  switch (options.action.type) {
    case "open-review":
      return {
        ...options.state,
        activePlan: options.action.plan,
        reviewConfirmationInput: "",
        screen: "review",
        createInteractionMode: "browse",
        poolNextStackEditMode: false,
      };
    case "show-result":
      return {
        ...options.state,
        sessionModel: null,
        resultModel: options.action.result,
        reviewConfirmationInput: "",
        screen: "result",
        refreshToken: options.action.result.refreshRequested
          ? options.state.refreshToken + 1
          : options.state.refreshToken,
      };
    case "append-review-confirmation":
      return {
        ...options.state,
        reviewConfirmationInput:
          options.state.reviewConfirmationInput + options.action.value,
      };
    case "backspace-review-confirmation":
      return {
        ...options.state,
        reviewConfirmationInput: options.state.reviewConfirmationInput.slice(
          0,
          -1,
        ),
      };
    case "close-overlay":
      if (options.state.screen === "session") {
        return options.state;
      }

      if (options.state.screen === "review") {
        return {
          ...options.state,
          resultModel: null,
          sessionModel: null,
          reviewConfirmationInput: "",
          screen: "shell",
          focusedColumn: "editor",
        };
      }

      if (options.state.focusedColumn === "editor") {
        return {
          ...options.state,
          focusedColumn: "actions",
          selectedActionIndex: -1,
          createInteractionMode: "browse",
          poolNextStackEditMode: false,
        };
      }

      return {
        ...options.state,
        activePlan: null,
        sessionModel: null,
        resultModel: null,
        reviewConfirmationInput: "",
        screen: "shell",
      };
    case "refresh-requested":
      return {
        ...options.state,
        refreshToken: options.state.refreshToken + 1,
        noticeMessage: null,
      };
  }
}

/** Supported reducer events for editing the create-form field currently in focus. */
export type WorktreeStackKit_InkCreateFieldAction =
  | { readonly type: "start-create-field-edit" }
  | { readonly type: "stop-create-field-edit" }
  | { readonly type: "append-create-field-input"; readonly value: string }
  | { readonly type: "backspace-create-field-input" }
  | { readonly type: "toggle-create-field" };

/** Result of applying one create-field reducer event. */
export type WorktreeStackKit_InkCreateFieldActionResult = {
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
  readonly createRegion: WorktreeStackKit_InkCreateRegion;
};

/** Minimal full-state shape updated by package-owned create-field reducer events. */
export type WorktreeStackKit_InkCreateFieldState =
  WorktreeStackKit_InkCreateFieldActionResult & {
    readonly selectedCreateFieldIndex: number;
  };

type WorktreeStackKit_InkCreateFieldStateActionResult<TState> = Omit<
  TState,
  keyof WorktreeStackKit_InkCreateFieldActionResult
> &
  WorktreeStackKit_InkCreateFieldActionResult;

function WorktreeStackKit_getInkCreateDraftTextValue(options: {
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly fieldId: WorktreeStackKit_InkCreateFieldId;
}): string | null {
  switch (options.fieldId) {
    case "branchPrefix":
      return options.createDraft.branchPrefix;
    case "stackName":
      return options.createDraft.stackName;
    case "slotInput":
      return options.createDraft.slotInput;
    case "baseBranch":
      return options.createDraft.baseBranch;
    case "rootBranch":
      return options.createDraft.rootBranch;
    case "submoduleBranch":
      return options.createDraft.submoduleBranch;
    case "worktreesBase":
      return options.createDraft.worktreesBase;
    case "realmSlug":
      return options.createDraft.realmSlug;
    case "worktreePathOverride":
      return options.createDraft.worktreePathOverride;
    case "metadataSource":
      return options.createDraft.metadataSource;
    case "copyEnvFromMain":
    case "runInstall":
    case "installSkipExisting":
    case "installPreferOnline":
    case "openWindsurf":
    case "followUpStart":
    case "followUpStartOpenWindsurf":
      return null;
  }

  return null;
}

function WorktreeStackKit_setInkCreateDraftTextValue(options: {
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly fieldId: WorktreeStackKit_InkCreateFieldId;
  readonly value: string;
}): WorktreeStackKit_InkCreateDraft {
  switch (options.fieldId) {
    case "branchPrefix":
      return { ...options.createDraft, branchPrefix: options.value };
    case "stackName":
      return { ...options.createDraft, stackName: options.value };
    case "slotInput":
      return { ...options.createDraft, slotInput: options.value };
    case "baseBranch":
      return { ...options.createDraft, baseBranch: options.value };
    case "rootBranch":
      return { ...options.createDraft, rootBranch: options.value };
    case "submoduleBranch":
      return { ...options.createDraft, submoduleBranch: options.value };
    case "worktreesBase":
      return { ...options.createDraft, worktreesBase: options.value };
    case "realmSlug":
      return { ...options.createDraft, realmSlug: options.value };
    case "worktreePathOverride":
      return { ...options.createDraft, worktreePathOverride: options.value };
    case "metadataSource":
      return { ...options.createDraft, metadataSource: options.value };
    case "copyEnvFromMain":
    case "runInstall":
    case "installSkipExisting":
    case "installPreferOnline":
    case "openWindsurf":
    case "followUpStart":
    case "followUpStartOpenWindsurf":
      return options.createDraft;
  }

  return options.createDraft;
}

function WorktreeStackKit_toggleInkCreateDraftBooleanValue(options: {
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly fieldId: WorktreeStackKit_InkCreateFieldId;
}): WorktreeStackKit_InkCreateDraft {
  switch (options.fieldId) {
    case "copyEnvFromMain":
      return {
        ...options.createDraft,
        copyEnvFromMain: !options.createDraft.copyEnvFromMain,
      };
    case "runInstall":
      return {
        ...options.createDraft,
        runInstall: !options.createDraft.runInstall,
      };
    case "installSkipExisting":
      return {
        ...options.createDraft,
        installSkipExisting: !options.createDraft.installSkipExisting,
      };
    case "installPreferOnline":
      return {
        ...options.createDraft,
        installPreferOnline: !options.createDraft.installPreferOnline,
      };
    case "openWindsurf":
      return {
        ...options.createDraft,
        openWindsurf: !options.createDraft.openWindsurf,
      };
    case "followUpStart":
      return {
        ...options.createDraft,
        followUpStart: !options.createDraft.followUpStart,
      };
    case "followUpStartOpenWindsurf":
      return {
        ...options.createDraft,
        followUpStartOpenWindsurf:
          !options.createDraft.followUpStartOpenWindsurf,
      };
    case "branchPrefix":
    case "stackName":
    case "slotInput":
    case "baseBranch":
    case "rootBranch":
    case "submoduleBranch":
    case "worktreesBase":
    case "realmSlug":
    case "worktreePathOverride":
    case "metadataSource":
      return options.createDraft;
  }

  return options.createDraft;
}

/** Applies one create-field edit/toggle reducer event to the current create-form state. */
export function WorktreeStackKit_applyInkCreateFieldAction(options: {
  readonly action: WorktreeStackKit_InkCreateFieldAction;
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly createInteractionMode: WorktreeStackKit_InkCreateInteractionMode;
  readonly createRegion: WorktreeStackKit_InkCreateRegion;
  readonly selectedCreateFieldIndex: number;
}): WorktreeStackKit_InkCreateFieldActionResult {
  const currentResult = {
    createDraft: options.createDraft,
    createInteractionMode: options.createInteractionMode,
    createRegion: options.createRegion,
  };
  const selectedField = WorktreeStackKit_getInkCreateField(
    options.selectedCreateFieldIndex,
  );

  switch (options.action.type) {
    case "start-create-field-edit":
      if (!selectedField || selectedField.kind !== "text") {
        return currentResult;
      }

      return {
        ...currentResult,
        createRegion: "editor",
        createInteractionMode: "edit",
      };
    case "stop-create-field-edit":
      return {
        ...currentResult,
        createInteractionMode: "browse",
      };
    case "append-create-field-input": {
      if (
        options.createInteractionMode !== "edit" ||
        !selectedField ||
        selectedField.kind !== "text"
      ) {
        return currentResult;
      }

      const currentValue = WorktreeStackKit_getInkCreateDraftTextValue({
        createDraft: options.createDraft,
        fieldId: selectedField.id,
      });
      if (currentValue === null) {
        return currentResult;
      }

      return {
        ...currentResult,
        createDraft: WorktreeStackKit_setInkCreateDraftTextValue({
          createDraft: options.createDraft,
          fieldId: selectedField.id,
          value: currentValue + options.action.value,
        }),
      };
    }
    case "backspace-create-field-input": {
      if (
        options.createInteractionMode !== "edit" ||
        !selectedField ||
        selectedField.kind !== "text"
      ) {
        return currentResult;
      }

      const currentValue = WorktreeStackKit_getInkCreateDraftTextValue({
        createDraft: options.createDraft,
        fieldId: selectedField.id,
      });
      if (currentValue === null) {
        return currentResult;
      }

      return {
        ...currentResult,
        createDraft: WorktreeStackKit_setInkCreateDraftTextValue({
          createDraft: options.createDraft,
          fieldId: selectedField.id,
          value: currentValue.slice(0, -1),
        }),
      };
    }
    case "toggle-create-field":
      if (
        options.createInteractionMode === "edit" ||
        !selectedField ||
        selectedField.kind !== "boolean"
      ) {
        return currentResult;
      }

      return {
        ...currentResult,
        createDraft: WorktreeStackKit_toggleInkCreateDraftBooleanValue({
          createDraft: options.createDraft,
          fieldId: selectedField.id,
        }),
        createRegion: "editor",
      };
  }
}

/** Applies one create-field reducer event to a full Ink reducer state. */
export function WorktreeStackKit_applyInkCreateFieldStateAction<
  TState extends WorktreeStackKit_InkCreateFieldState,
>(options: {
  readonly action: WorktreeStackKit_InkCreateFieldAction;
  readonly state: TState;
}): WorktreeStackKit_InkCreateFieldStateActionResult<TState> {
  const result = WorktreeStackKit_applyInkCreateFieldAction({
    action: options.action,
    createDraft: options.state.createDraft,
    createInteractionMode: options.state.createInteractionMode,
    createRegion: options.state.createRegion,
    selectedCreateFieldIndex: options.state.selectedCreateFieldIndex,
  });

  return {
    ...options.state,
    createDraft: result.createDraft,
    createInteractionMode: result.createInteractionMode,
    createRegion: result.createRegion,
  };
}

/** Supported reducer action-option event names. */
export type WorktreeStackKit_InkActionOptionActionType =
  | "toggle-primary-action-option"
  | "toggle-secondary-action-option"
  | "toggle-repair-legacy-package-alias"
  | "cycle-repair-target-scope"
  | "cycle-sync-target-scope";

/** Supported reducer text/edit events for the realm-pool next stack-name option. */
export type WorktreeStackKit_InkPoolNextStackAction =
  | { readonly type: "toggle-pool-next-stack-edit" }
  | { readonly type: "append-pool-next-stack-input"; readonly value: string }
  | { readonly type: "backspace-pool-next-stack-input" };

/** Returns action-option state after applying the focused action's primary option toggle. */
export function WorktreeStackKit_applyPrimaryInkActionOption(options: {
  readonly actionId: WorktreeStackKit_InkActionId;
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
}): WorktreeStackKit_InkActionOptionState {
  if (options.actionId === "repair") {
    return {
      ...options.actionOptions,
      repairDryRun: !options.actionOptions.repairDryRun,
    };
  }

  if (options.actionId === "start") {
    return {
      ...options.actionOptions,
      openWindsurfOnStart: !options.actionOptions.openWindsurfOnStart,
    };
  }

  if (options.actionId === "destroy") {
    return {
      ...options.actionOptions,
      pruneAfterDestroy: !options.actionOptions.pruneAfterDestroy,
    };
  }

  if (options.actionId === "update-from-main") {
    return {
      ...options.actionOptions,
      updateFromMainExecutionMode:
        options.actionOptions.updateFromMainExecutionMode === "plan"
          ? "push"
          : "plan",
    };
  }

  if (options.actionId === "merge") {
    return {
      ...options.actionOptions,
      mergeExecutionMode:
        options.actionOptions.mergeExecutionMode === "plan" ? "push" : "plan",
    };
  }

  if (options.actionId === "checkout-state-check") {
    return {
      ...options.actionOptions,
      stateCheckFetch: !options.actionOptions.stateCheckFetch,
    };
  }

  return options.actionOptions;
}

/** Returns action-option state after applying the focused action's secondary option toggle. */
export function WorktreeStackKit_applySecondaryInkActionOption(options: {
  readonly actionId: WorktreeStackKit_InkActionId;
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
}): WorktreeStackKit_InkActionOptionState {
  if (options.actionId === "repair") {
    return {
      ...options.actionOptions,
      repairIncludePackageEnv: !options.actionOptions.repairIncludePackageEnv,
    };
  }

  if (options.actionId === "update-from-main") {
    return {
      ...options.actionOptions,
      updateFromMainMode:
        options.actionOptions.updateFromMainMode === "live-worktree"
          ? "pushed-only"
          : "live-worktree",
    };
  }

  return options.actionOptions;
}

/** Applies one action-option reducer event for the selected action id. */
export function WorktreeStackKit_applyInkActionOptionAction(options: {
  readonly actionId: WorktreeStackKit_InkActionId;
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
  readonly actionType: WorktreeStackKit_InkActionOptionActionType;
}): WorktreeStackKit_InkActionOptionState {
  switch (options.actionType) {
    case "toggle-primary-action-option":
      return WorktreeStackKit_applyPrimaryInkActionOption(options);
    case "toggle-secondary-action-option":
      return WorktreeStackKit_applySecondaryInkActionOption(options);
    case "toggle-repair-legacy-package-alias":
      if (options.actionId !== "repair") {
        return options.actionOptions;
      }
      return {
        ...options.actionOptions,
        repairLegacyPackageEnvAlias:
          !options.actionOptions.repairLegacyPackageEnvAlias,
      };
    case "cycle-repair-target-scope":
      if (options.actionId !== "repair") {
        return options.actionOptions;
      }
      return {
        ...options.actionOptions,
        repairScope:
          options.actionOptions.repairScope === "all-prepared"
            ? "selected-record"
            : "all-prepared",
      };
    case "cycle-sync-target-scope":
      if (options.actionId !== "sync-local-files") {
        return options.actionOptions;
      }
      return {
        ...options.actionOptions,
        syncScope:
          options.actionOptions.syncScope === "all-discovered"
            ? "selected-record"
            : "all-discovered",
      };
  }
}

function WorktreeStackKit_getInkActionIdAtIndex(
  selectedActionIndex: number,
): WorktreeStackKit_InkActionId | null {
  return WORKTREE_STACK_KIT_INK_ACTIONS[selectedActionIndex]?.id ?? null;
}

/** Minimal full-state shape for focused action-option reducer transitions. */
export type WorktreeStackKit_InkFocusedActionOptionState = {
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
  readonly selectedActionIndex: number;
};

type WorktreeStackKit_InkFocusedActionOptionStateResult<TState> = Omit<
  TState,
  "actionOptions"
> & {
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
};

/** Applies an action-option reducer event to the action focused by the selected action index. */
export function WorktreeStackKit_applyFocusedInkActionOptionAction<
  TState extends WorktreeStackKit_InkFocusedActionOptionState,
>(options: {
  readonly actionType: WorktreeStackKit_InkActionOptionActionType;
  readonly state: TState;
}): WorktreeStackKit_InkFocusedActionOptionStateResult<TState> {
  const actionId = WorktreeStackKit_getInkActionIdAtIndex(
    options.state.selectedActionIndex,
  );
  if (!actionId) {
    return options.state;
  }

  return {
    ...options.state,
    actionOptions: WorktreeStackKit_applyInkActionOptionAction({
      actionId,
      actionOptions: options.state.actionOptions,
      actionType: options.actionType,
    }),
  };
}

/** Result of applying a realm-pool next stack-name edit event. */
export type WorktreeStackKit_InkPoolNextStackActionResult = {
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
  readonly poolNextStackEditMode: boolean;
};

/** Applies one realm-pool next stack-name edit reducer event. */
export function WorktreeStackKit_applyInkPoolNextStackAction(options: {
  readonly actionId: WorktreeStackKit_InkActionId;
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
  readonly action: WorktreeStackKit_InkPoolNextStackAction;
  readonly poolNextStackEditMode: boolean;
}): WorktreeStackKit_InkPoolNextStackActionResult {
  if (options.actionId !== "realm-pool-next") {
    return {
      actionOptions: options.actionOptions,
      poolNextStackEditMode: options.poolNextStackEditMode,
    };
  }

  switch (options.action.type) {
    case "toggle-pool-next-stack-edit":
      return {
        actionOptions: options.actionOptions,
        poolNextStackEditMode: !options.poolNextStackEditMode,
      };
    case "append-pool-next-stack-input":
      return {
        actionOptions: {
          ...options.actionOptions,
          poolNextStackName:
            options.actionOptions.poolNextStackName + options.action.value,
        },
        poolNextStackEditMode: options.poolNextStackEditMode,
      };
    case "backspace-pool-next-stack-input":
      return {
        actionOptions: {
          ...options.actionOptions,
          poolNextStackName: options.actionOptions.poolNextStackName.slice(
            0,
            -1,
          ),
        },
        poolNextStackEditMode: options.poolNextStackEditMode,
      };
  }
}

/** Minimal full-state shape for focused realm-pool next stack-name transitions. */
export type WorktreeStackKit_InkFocusedPoolNextStackState =
  WorktreeStackKit_InkFocusedActionOptionState & {
    readonly poolNextStackEditMode: boolean;
  };

type WorktreeStackKit_InkFocusedPoolNextStackStateResult<TState> = Omit<
  TState,
  "actionOptions" | "poolNextStackEditMode"
> & {
  readonly actionOptions: WorktreeStackKit_InkActionOptionState;
  readonly poolNextStackEditMode: boolean;
};

/** Applies a realm-pool next stack-name event to the currently focused action row. */
export function WorktreeStackKit_applyFocusedInkPoolNextStackAction<
  TState extends WorktreeStackKit_InkFocusedPoolNextStackState,
>(options: {
  readonly action: WorktreeStackKit_InkPoolNextStackAction;
  readonly state: TState;
}): WorktreeStackKit_InkFocusedPoolNextStackStateResult<TState> {
  const actionId = WorktreeStackKit_getInkActionIdAtIndex(
    options.state.selectedActionIndex,
  );
  if (!actionId) {
    return options.state;
  }

  const result = WorktreeStackKit_applyInkPoolNextStackAction({
    action: options.action,
    actionId,
    actionOptions: options.state.actionOptions,
    poolNextStackEditMode: options.state.poolNextStackEditMode,
  });

  return {
    ...options.state,
    actionOptions: result.actionOptions,
    poolNextStackEditMode: result.poolNextStackEditMode,
  };
}

/** Session status values used by package-owned Ink session helpers. */
export type WorktreeStackKit_InkSessionStatus =
  | "queued"
  | "starting"
  | "watching-sidecars"
  | "running"
  | "cancelling";

/** Minimal command request contract needed to build a display command line. */
export type WorktreeStackKit_InkCommandRequestShape = {
  command: string;
  args: readonly string[];
};

/** Generic active session model built by the Ink reducer helpers. */
export type WorktreeStackKit_InkSessionModel<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
> = {
  actionLabel: string;
  commandLine: string;
  lines: TLine[];
  request: TRequest;
  startedAt: string | null;
  status: WorktreeStackKit_InkSessionStatus;
};

/** Session telemetry events that mutate an active session model. */
export type WorktreeStackKit_InkSessionAction<TLine> =
  | { readonly type: "session-started"; readonly startedAt: string }
  | {
      readonly type: "session-status";
      readonly status: WorktreeStackKit_InkSessionStatus;
    }
  | { readonly type: "session-line"; readonly line: TLine };

/** Builds the queued session snapshot for a runnable action request. */
export function WorktreeStackKit_buildInkSessionModel<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
>(options: {
  readonly actionLabel: string;
  readonly request: TRequest;
}): WorktreeStackKit_InkSessionModel<TRequest, TLine> {
  return {
    actionLabel: options.actionLabel,
    request: options.request,
    commandLine: [options.request.command, ...options.request.args].join(" "),
    status: "queued",
    lines: [],
    startedAt: null,
  };
}

/** Applies one session telemetry event when a session model is mounted. */
export function WorktreeStackKit_applyInkSessionAction<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
>(options: {
  readonly action: WorktreeStackKit_InkSessionAction<TLine>;
  readonly sessionModel: WorktreeStackKit_InkSessionModel<
    TRequest,
    TLine
  > | null;
}): WorktreeStackKit_InkSessionModel<TRequest, TLine> | null {
  if (!options.sessionModel) {
    return null;
  }

  switch (options.action.type) {
    case "session-started":
      return {
        ...options.sessionModel,
        status: "running",
        startedAt: options.action.startedAt,
      };
    case "session-status":
      return {
        ...options.sessionModel,
        status: options.action.status,
      };
    case "session-line":
      return {
        ...options.sessionModel,
        lines: [...options.sessionModel.lines, options.action.line],
      };
  }
}

/** Minimal full-state shape updated by package-owned session telemetry events. */
export type WorktreeStackKit_InkSessionState<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
> = {
  readonly sessionModel: WorktreeStackKit_InkSessionModel<
    TRequest,
    TLine
  > | null;
};

type WorktreeStackKit_InkSessionStateActionResult<
  TState,
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
> = Omit<TState, "sessionModel"> &
  WorktreeStackKit_InkSessionState<TRequest, TLine>;

/** Applies one session telemetry reducer event to a full Ink reducer state. */
export function WorktreeStackKit_applyInkSessionStateAction<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
  TState extends WorktreeStackKit_InkSessionState<TRequest, TLine>,
>(options: {
  readonly action: WorktreeStackKit_InkSessionAction<TLine>;
  readonly state: TState;
}): WorktreeStackKit_InkSessionStateActionResult<TState, TRequest, TLine> {
  return {
    ...options.state,
    sessionModel: WorktreeStackKit_applyInkSessionAction({
      action: options.action,
      sessionModel: options.state.sessionModel,
    }),
  };
}

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
export function WorktreeStackKit_createBlockedInkResult<
  TLine,
  THandoff,
>(options: {
  readonly createHandoff: THandoff | null;
  readonly message: string;
}): WorktreeStackKit_InkBlockedResult<TLine, THandoff> {
  return {
    status: "blocked",
    message: options.message,
    exitCode: null,
    signal: null,
    lines: [],
    startedAt: null,
    endedAt: null,
    refreshRequested: false,
    createHandoff: options.createHandoff,
  };
}

/** Minimal plan contract needed to mount a queued or blocked Ink session. */
export type WorktreeStackKit_InkStartSessionPlan<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
> = {
  readonly actionLabel: string;
  readonly request: TRequest | null;
};

/** Minimal state updated by package-owned start-session transitions. */
export type WorktreeStackKit_InkStartSessionState<
  TPlan,
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
  TResult,
> = {
  readonly activePlan: TPlan | null;
  readonly resultModel: TResult | null;
  readonly reviewConfirmationInput: string;
  readonly screen: WorktreeStackKit_InkScreen;
  readonly sessionModel: WorktreeStackKit_InkSessionModel<
    TRequest,
    TLine
  > | null;
  readonly sessionRunId: number;
};

type WorktreeStackKit_InkStartSessionActionStateResult<
  TState,
  TPlan,
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
  TResult,
  THandoff,
> = Omit<
  TState,
  keyof WorktreeStackKit_InkStartSessionState<TPlan, TRequest, TLine, TResult>
> &
  WorktreeStackKit_InkStartSessionState<
    TPlan,
    TRequest,
    TLine,
    TResult | WorktreeStackKit_InkBlockedResult<TLine, THandoff>
  >;

/** Applies the reducer transition that starts a runnable session or emits a blocked result. */
export function WorktreeStackKit_applyInkStartSessionAction<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
  THandoff,
  TPlan extends WorktreeStackKit_InkStartSessionPlan<TRequest>,
  TResult,
  TState extends WorktreeStackKit_InkStartSessionState<
    TPlan,
    TRequest,
    TLine,
    TResult
  >,
>(options: {
  readonly blockedCreateHandoff: THandoff | null;
  readonly blockedMessage: string;
  readonly plan: TPlan;
  readonly state: TState;
}): WorktreeStackKit_InkStartSessionActionStateResult<
  TState,
  TPlan,
  TRequest,
  TLine,
  TResult,
  THandoff
>;
export function WorktreeStackKit_applyInkStartSessionAction<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
  THandoff,
  TPlan extends WorktreeStackKit_InkStartSessionPlan<TRequest>,
  TResult,
>(options: {
  readonly blockedCreateHandoff: THandoff | null;
  readonly blockedMessage: string;
  readonly plan: TPlan;
  readonly state: WorktreeStackKit_InkStartSessionState<
    TPlan,
    TRequest,
    TLine,
    TResult
  >;
}): WorktreeStackKit_InkStartSessionState<
  TPlan,
  TRequest,
  TLine,
  TResult | WorktreeStackKit_InkBlockedResult<TLine, THandoff>
>;
export function WorktreeStackKit_applyInkStartSessionAction<
  TRequest extends WorktreeStackKit_InkCommandRequestShape,
  TLine,
  THandoff,
  TPlan extends WorktreeStackKit_InkStartSessionPlan<TRequest>,
  TResult,
  TState extends WorktreeStackKit_InkStartSessionState<
    TPlan,
    TRequest,
    TLine,
    TResult
  >,
>(options: {
  readonly blockedCreateHandoff: THandoff | null;
  readonly blockedMessage: string;
  readonly plan: TPlan;
  readonly state: TState;
}) {
  if (!options.plan.request) {
    return {
      ...options.state,
      activePlan: options.plan,
      sessionModel: null,
      resultModel: WorktreeStackKit_createBlockedInkResult<TLine, THandoff>({
        message: options.blockedMessage,
        createHandoff: options.blockedCreateHandoff,
      }),
      reviewConfirmationInput: "",
      screen: "result",
    };
  }

  return {
    ...options.state,
    activePlan: options.plan,
    resultModel: null,
    reviewConfirmationInput: "",
    sessionModel: WorktreeStackKit_buildInkSessionModel<TRequest, TLine>({
      actionLabel: options.plan.actionLabel,
      request: options.plan.request,
    }),
    sessionRunId: options.state.sessionRunId + 1,
    screen: "session",
  };
}
