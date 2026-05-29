/**
 * @fileoverview Verifies pure Ink reducer helper transitions for load, launch, navigation, overlays,
 * sessions, action options, and create-field editing in the worktree-stack kit.
 *
 * This file owns Node `node:test` regression coverage for the stateless transition helpers imported by
 * the Ink reducer adapter.
 * Flow: build typed demo state -> dispatch helper with action payloads -> assert clamping, screen
 * transitions, and preserved marker fields on full-state merges.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-reducer-helpers.unit.test.ts
 * @testing Node test runner unit: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including this file).
 *
 * @see packages/worktree-kit/src/ink-reducer-helpers.ts - Pure transition helpers and default option factories whose load, shell, overlay, and session behavior is asserted here.
 * @see packages/worktree-kit/src/ink-reducer.ts - Ink reducer adapter that composes these helpers when applying keyboard and plan actions in interactive shells.
 * @see packages/worktree-kit/src/ink-create-model.ts - Create-draft factory used to build realistic launch-target and field-edit fixtures referenced by several cases in this suite.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_applyInkActionOptionAction,
  WorktreeStackKit_applyInkCreateFieldAction,
  WorktreeStackKit_applyInkCreateFieldStateAction,
  WorktreeStackKit_applyInkCreateNavigationAction,
  WorktreeStackKit_applyInkLaunchTargetAction,
  WorktreeStackKit_applyInkLoadAction,
  WorktreeStackKit_applyInkOverlayAction,
  WorktreeStackKit_applyFocusedInkActionOptionAction,
  WorktreeStackKit_applyFocusedInkPoolNextStackAction,
  WorktreeStackKit_applyInkPoolNextStackAction,
  WorktreeStackKit_applyInkSessionAction,
  WorktreeStackKit_applyInkSessionStateAction,
  WorktreeStackKit_applyInkShellNavigationAction,
  WorktreeStackKit_applyInkStartSessionAction,
  WorktreeStackKit_buildInkSessionModel,
  WorktreeStackKit_clampInkActionIndex,
  WorktreeStackKit_clampInkCreateSectionIndex,
  WorktreeStackKit_clampInkRecordIndex,
  WorktreeStackKit_createBlockedInkResult,
  WorktreeStackKit_createDefaultInkActionOptions,
  WorktreeStackKit_getFirstInkCreateFieldIndexForSection,
  WorktreeStackKit_getInkCreateFieldIndicesForSection,
  WorktreeStackKit_stepInkCreateFieldIndexWithinSection,
  WorktreeStackKit_stepInkCreateRegion,
  type WorktreeStackKit_InkCreateFieldState,
  type WorktreeStackKit_InkCreateNavigationState,
  type WorktreeStackKit_InkFocusedActionOptionState,
  type WorktreeStackKit_InkFocusedPoolNextStackState,
  type WorktreeStackKit_InkLaunchTargetState,
  type WorktreeStackKit_InkLoadState,
  type WorktreeStackKit_InkOverlayState,
  type WorktreeStackKit_InkSessionState,
  type WorktreeStackKit_InkShellNavigationState,
  type WorktreeStackKit_InkStartSessionState,
} from "./ink-reducer-helpers.js";
import { WorktreeStackKit_createInitialInkCreateDraft } from "./ink-create-model.js";

test("WorktreeStackKit_createDefaultInkActionOptions returns stable defaults", () => {
  assert.deepEqual(WorktreeStackKit_createDefaultInkActionOptions(), {
    mergeExecutionMode: "plan",
    openWindsurfOnStart: false,
    poolNextStackName: "",
    pruneAfterDestroy: false,
    repairDryRun: false,
    repairIncludePackageEnv: false,
    repairLegacyPackageEnvAlias: false,
    repairScope: "all-prepared",
    stateCheckFetch: false,
    syncScope: "all-discovered",
    updateFromMainExecutionMode: "plan",
    updateFromMainMode: "live-worktree",
  });
});

test("load helper applies inventory lifecycle transitions", () => {
  type DemoInventory = { readonly id: string };
  type DemoPlan = { readonly id: string };
  type DemoSession = { readonly id: string };
  type DemoResult = { readonly id: string };

  const baseState: WorktreeStackKit_InkLoadState<
    DemoInventory,
    DemoPlan,
    DemoSession,
    DemoResult
  > = {
    activePlan: { id: "plan-1" },
    errorMessage: "old error",
    inventory: null,
    resultModel: { id: "result-1" },
    screen: "session",
    selectedActionIndex: 99,
    selectedIndex: 10,
    sessionModel: { id: "session-1" },
    status: "error",
  };

  const loading = WorktreeStackKit_applyInkLoadAction({
    action: { type: "load-start" },
    state: baseState,
  });
  assert.equal(loading.status, "loading");
  assert.equal(loading.errorMessage, null);

  const ready = WorktreeStackKit_applyInkLoadAction({
    action: {
      type: "load-success",
      inventory: { id: "inventory-1" },
      recordCount: 3,
    },
    state: loading,
  });
  assert.deepEqual(ready.inventory, { id: "inventory-1" });
  assert.equal(ready.status, "ready");
  assert.equal(ready.selectedIndex, 2);
  assert.equal(ready.selectedActionIndex, -1);

  const failed = WorktreeStackKit_applyInkLoadAction({
    action: { type: "load-error", errorMessage: "load failed" },
    state: ready,
  });
  assert.equal(failed.status, "error");
  assert.equal(failed.errorMessage, "load failed");
  assert.equal(failed.screen, "shell");
  assert.equal(failed.activePlan, null);
  assert.equal(failed.sessionModel, null);
  assert.equal(failed.resultModel, null);
});

test("launch target helper resets transient state and merges action options", () => {
  type DemoPlan = { readonly id: string };
  type DemoSession = { readonly id: string };
  type DemoResult = { readonly id: string };

  const baseState: WorktreeStackKit_InkLaunchTargetState<
    ReturnType<typeof WorktreeStackKit_createInitialInkCreateDraft>,
    ReturnType<typeof WorktreeStackKit_createDefaultInkActionOptions>,
    DemoPlan,
    DemoSession,
    DemoResult
  > = {
    actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
    activePlan: { id: "plan-1" },
    createDraft: WorktreeStackKit_createInitialInkCreateDraft(),
    createInteractionMode: "edit",
    createRegion: "editor",
    noticeMessage: "old notice",
    poolNextStackEditMode: true,
    resultModel: { id: "result-1" },
    reviewConfirmationInput: "confirm",
    screen: "review",
    selectedActionIndex: 0,
    selectedCreateFieldIndex: 6,
    selectedCreateSectionIndex: 2,
    selectedIndex: 0,
    sessionModel: { id: "session-1" },
  };

  const nextDraft = {
    ...baseState.createDraft,
    stackName: "new-stack",
  };
  const launched = WorktreeStackKit_applyInkLaunchTargetAction({
    action: {
      type: "apply-launch-target",
      selectedIndex: 9,
      selectedActionIndex: -2,
      screen: "action-editor",
      createDraft: nextDraft,
      noticeMessage: "launch notice",
      actionOptionsPatch: {
        repairDryRun: true,
        syncScope: "selected-record",
      },
    },
    recordCount: 4,
    state: baseState,
  });

  assert.equal(launched.selectedIndex, 3);
  assert.equal(launched.selectedActionIndex, 17);
  assert.equal(launched.selectedCreateSectionIndex, 0);
  assert.equal(launched.selectedCreateFieldIndex, 0);
  assert.equal(launched.createRegion, "fields");
  assert.equal(launched.createInteractionMode, "browse");
  assert.equal(launched.screen, "action-editor");
  assert.equal(launched.createDraft.stackName, "new-stack");
  assert.equal(launched.noticeMessage, "launch notice");
  assert.equal(launched.activePlan, null);
  assert.equal(launched.sessionModel, null);
  assert.equal(launched.resultModel, null);
  assert.equal(launched.reviewConfirmationInput, "");
  assert.equal(launched.poolNextStackEditMode, false);
  assert.equal(launched.actionOptions.repairDryRun, true);
  assert.equal(launched.actionOptions.syncScope, "selected-record");
});

test("WorktreeStackKit_clampInkRecordIndex clamps to record bounds", () => {
  assert.equal(
    WorktreeStackKit_clampInkRecordIndex({ index: 4, recordCount: 3 }),
    2,
  );
  assert.equal(
    WorktreeStackKit_clampInkRecordIndex({ index: -1, recordCount: 3 }),
    0,
  );
  assert.equal(
    WorktreeStackKit_clampInkRecordIndex({ index: 1, recordCount: 0 }),
    0,
  );
});

test("WorktreeStackKit_clampInkActionIndex preserves the no-selection sentinel", () => {
  assert.equal(WorktreeStackKit_clampInkActionIndex(-1), -1);
  assert.equal(WorktreeStackKit_clampInkActionIndex(-2), 17);
  assert.equal(WorktreeStackKit_clampInkActionIndex(18), -1);
});

test("create section and field navigation follows catalog order", () => {
  assert.equal(WorktreeStackKit_clampInkCreateSectionIndex(-1), 0);
  assert.equal(WorktreeStackKit_clampInkCreateSectionIndex(99), 3);
  assert.deepEqual(
    WorktreeStackKit_getInkCreateFieldIndicesForSection(0),
    [0, 1, 2, 3, 4, 5, 6],
  );
  assert.equal(WorktreeStackKit_getFirstInkCreateFieldIndexForSection(1), 7);
  assert.equal(
    WorktreeStackKit_stepInkCreateFieldIndexWithinSection({
      sectionIndex: 0,
      currentFieldIndex: 0,
      direction: 1,
    }),
    1,
  );
});

test("WorktreeStackKit_stepInkCreateRegion rotates through the region ring", () => {
  assert.equal(
    WorktreeStackKit_stepInkCreateRegion({ region: "fields", direction: 1 }),
    "editor",
  );
  assert.equal(
    WorktreeStackKit_stepInkCreateRegion({ region: "sections", direction: -1 }),
    "preview",
  );
});

test("create navigation helper moves fields, sections, and regions", () => {
  const baseState: WorktreeStackKit_InkCreateNavigationState & {
    readonly marker: string;
  } = {
    createInteractionMode: "edit",
    createRegion: "editor",
    marker: "full-state",
    selectedCreateFieldIndex: 0,
    selectedCreateSectionIndex: 0,
  };

  const nextField = WorktreeStackKit_applyInkCreateNavigationAction({
    action: { type: "select-next-create-field" },
    state: baseState,
  });
  assert.equal(nextField.selectedCreateFieldIndex, 1);
  assert.equal(nextField.createRegion, "fields");
  assert.equal(nextField.createInteractionMode, "browse");
  assert.equal(nextField.marker, "full-state");

  const nextSection = WorktreeStackKit_applyInkCreateNavigationAction({
    action: { type: "select-next-create-section" },
    state: nextField,
  });
  assert.equal(nextSection.selectedCreateSectionIndex, 1);
  assert.equal(nextSection.selectedCreateFieldIndex, 7);
  assert.equal(nextSection.createRegion, "sections");

  const previousSection = WorktreeStackKit_applyInkCreateNavigationAction({
    action: { type: "select-previous-create-section" },
    state: nextSection,
  });
  assert.equal(previousSection.selectedCreateSectionIndex, 0);
  assert.equal(previousSection.selectedCreateFieldIndex, 0);

  const nextRegion = WorktreeStackKit_applyInkCreateNavigationAction({
    action: { type: "focus-next-create-region" },
    state: previousSection,
  });
  assert.equal(nextRegion.createRegion, "fields");
});

test("shell navigation helper moves records, actions, and columns", () => {
  const baseState: WorktreeStackKit_InkShellNavigationState & {
    readonly marker: string;
  } = {
    createInteractionMode: "edit",
    focusedColumn: "records",
    marker: "full-state",
    poolNextStackEditMode: true,
    selectedActionIndex: -1,
    selectedIndex: 1,
  };

  assert.equal(
    WorktreeStackKit_applyInkShellNavigationAction({
      action: { type: "select-next" },
      recordCount: 3,
      state: baseState,
    }).selectedIndex,
    2,
  );

  assert.equal(
    WorktreeStackKit_applyInkShellNavigationAction({
      action: { type: "select-previous" },
      recordCount: 3,
      state: baseState,
    }).selectedIndex,
    0,
  );

  const actionSelected = WorktreeStackKit_applyInkShellNavigationAction({
    action: { type: "select-next-action" },
    recordCount: 3,
    state: baseState,
  });
  assert.equal(actionSelected.selectedActionIndex, 0);
  assert.equal(actionSelected.createInteractionMode, "browse");
  assert.equal(actionSelected.poolNextStackEditMode, false);
  assert.equal(actionSelected.marker, "full-state");

  const rightFromRecords = WorktreeStackKit_applyInkShellNavigationAction({
    action: { type: "focus-column-right" },
    recordCount: 3,
    state: actionSelected,
  });
  assert.equal(rightFromRecords.focusedColumn, "actions");

  const rightFromActions = WorktreeStackKit_applyInkShellNavigationAction({
    action: { type: "focus-column-right" },
    recordCount: 3,
    state: rightFromRecords,
  });
  assert.equal(rightFromActions.focusedColumn, "editor");

  const leftFromEditor = WorktreeStackKit_applyInkShellNavigationAction({
    action: { type: "focus-column-left" },
    recordCount: 3,
    state: rightFromActions,
  });
  assert.equal(leftFromEditor.focusedColumn, "actions");
});

test("shell navigation helper routes arrows by focused column", () => {
  const recordFocused: WorktreeStackKit_InkShellNavigationState = {
    createInteractionMode: "browse",
    focusedColumn: "records",
    poolNextStackEditMode: false,
    selectedActionIndex: 0,
    selectedIndex: 1,
  };
  const actionFocused: WorktreeStackKit_InkShellNavigationState = {
    ...recordFocused,
    createInteractionMode: "edit",
    focusedColumn: "actions",
    poolNextStackEditMode: true,
  };

  assert.equal(
    WorktreeStackKit_applyInkShellNavigationAction({
      action: { type: "navigate-up" },
      recordCount: 3,
      state: recordFocused,
    }).selectedIndex,
    0,
  );

  const nextAction = WorktreeStackKit_applyInkShellNavigationAction({
    action: { type: "navigate-down" },
    recordCount: 3,
    state: actionFocused,
  });
  assert.equal(nextAction.selectedActionIndex, 1);
  assert.equal(nextAction.createInteractionMode, "browse");
  assert.equal(nextAction.poolNextStackEditMode, false);
});

test("overlay helper opens review, records confirmation, and closes overlays", () => {
  type DemoPlan = { readonly id: string };
  type DemoSession = { readonly id: string };
  type DemoResult = { readonly id: string; readonly refreshRequested: boolean };

  const baseState: WorktreeStackKit_InkOverlayState<
    DemoPlan,
    DemoSession,
    DemoResult
  > & { readonly marker: string } = {
    activePlan: null,
    createInteractionMode: "edit",
    focusedColumn: "actions",
    marker: "full-state",
    noticeMessage: "notice",
    poolNextStackEditMode: true,
    refreshToken: 0,
    resultModel: null,
    reviewConfirmationInput: "old",
    screen: "shell",
    selectedActionIndex: 2,
    sessionModel: { id: "session-1" },
  };

  const review = WorktreeStackKit_applyInkOverlayAction({
    action: { type: "open-review", plan: { id: "plan-1" } },
    state: baseState,
  });
  assert.deepEqual(review.activePlan, { id: "plan-1" });
  assert.equal(review.marker, "full-state");
  assert.equal(review.screen, "review");
  assert.equal(review.reviewConfirmationInput, "");
  assert.equal(review.createInteractionMode, "browse");
  assert.equal(review.poolNextStackEditMode, false);

  const appended = WorktreeStackKit_applyInkOverlayAction({
    action: { type: "append-review-confirmation", value: "OK" },
    state: review,
  });
  assert.equal(appended.reviewConfirmationInput, "OK");

  const backspaced = WorktreeStackKit_applyInkOverlayAction({
    action: { type: "backspace-review-confirmation" },
    state: appended,
  });
  assert.equal(backspaced.reviewConfirmationInput, "O");

  const closedReview = WorktreeStackKit_applyInkOverlayAction({
    action: { type: "close-overlay" },
    state: backspaced,
  });
  assert.equal(closedReview.screen, "shell");
  assert.equal(closedReview.focusedColumn, "editor");
  assert.equal(closedReview.sessionModel, null);
  assert.equal(closedReview.resultModel, null);
  assert.equal(closedReview.reviewConfirmationInput, "");
});

test("overlay helper shows results, protects sessions, and handles refresh requests", () => {
  type DemoPlan = { readonly id: string };
  type DemoSession = { readonly id: string };
  type DemoResult = { readonly id: string; readonly refreshRequested: boolean };

  const baseState: WorktreeStackKit_InkOverlayState<
    DemoPlan,
    DemoSession,
    DemoResult
  > = {
    activePlan: { id: "plan-1" },
    createInteractionMode: "edit",
    focusedColumn: "editor",
    noticeMessage: "notice",
    poolNextStackEditMode: true,
    refreshToken: 3,
    resultModel: null,
    reviewConfirmationInput: "token",
    screen: "session",
    selectedActionIndex: 4,
    sessionModel: { id: "session-1" },
  };

  assert.equal(
    WorktreeStackKit_applyInkOverlayAction({
      action: { type: "close-overlay" },
      state: baseState,
    }),
    baseState,
  );

  const result = WorktreeStackKit_applyInkOverlayAction({
    action: {
      type: "show-result",
      result: { id: "result-1", refreshRequested: true },
    },
    state: baseState,
  });
  assert.equal(result.screen, "result");
  assert.deepEqual(result.resultModel, {
    id: "result-1",
    refreshRequested: true,
  });
  assert.equal(result.sessionModel, null);
  assert.equal(result.refreshToken, 4);

  const editorClosed = WorktreeStackKit_applyInkOverlayAction({
    action: { type: "close-overlay" },
    state: result,
  });
  assert.equal(editorClosed.focusedColumn, "actions");
  assert.equal(editorClosed.selectedActionIndex, -1);
  assert.equal(editorClosed.createInteractionMode, "browse");
  assert.equal(editorClosed.poolNextStackEditMode, false);

  const refreshed = WorktreeStackKit_applyInkOverlayAction({
    action: { type: "refresh-requested" },
    state: editorClosed,
  });
  assert.equal(refreshed.refreshToken, 5);
  assert.equal(refreshed.noticeMessage, null);
});

test("create field helper edits text fields and toggles booleans", () => {
  const defaults = WorktreeStackKit_createInitialInkCreateDraft();
  const editing = WorktreeStackKit_applyInkCreateFieldAction({
    action: { type: "start-create-field-edit" },
    createDraft: defaults,
    createInteractionMode: "browse",
    createRegion: "fields",
    selectedCreateFieldIndex: 1,
  });
  assert.equal(editing.createInteractionMode, "edit");
  assert.equal(editing.createRegion, "editor");

  const appended = WorktreeStackKit_applyInkCreateFieldAction({
    action: { type: "append-create-field-input", value: "demo" },
    createDraft: editing.createDraft,
    createInteractionMode: editing.createInteractionMode,
    createRegion: editing.createRegion,
    selectedCreateFieldIndex: 1,
  });
  assert.equal(appended.createDraft.stackName, "demo");

  const backspaced = WorktreeStackKit_applyInkCreateFieldAction({
    action: { type: "backspace-create-field-input" },
    createDraft: appended.createDraft,
    createInteractionMode: appended.createInteractionMode,
    createRegion: appended.createRegion,
    selectedCreateFieldIndex: 1,
  });
  assert.equal(backspaced.createDraft.stackName, "dem");

  const toggleIgnoredWhileEditing = WorktreeStackKit_applyInkCreateFieldAction({
    action: { type: "toggle-create-field" },
    createDraft: backspaced.createDraft,
    createInteractionMode: backspaced.createInteractionMode,
    createRegion: backspaced.createRegion,
    selectedCreateFieldIndex: 11,
  });
  assert.equal(toggleIgnoredWhileEditing.createDraft.runInstall, true);

  const stopped = WorktreeStackKit_applyInkCreateFieldAction({
    action: { type: "stop-create-field-edit" },
    createDraft: toggleIgnoredWhileEditing.createDraft,
    createInteractionMode: toggleIgnoredWhileEditing.createInteractionMode,
    createRegion: toggleIgnoredWhileEditing.createRegion,
    selectedCreateFieldIndex: 1,
  });
  const toggled = WorktreeStackKit_applyInkCreateFieldAction({
    action: { type: "toggle-create-field" },
    createDraft: stopped.createDraft,
    createInteractionMode: stopped.createInteractionMode,
    createRegion: stopped.createRegion,
    selectedCreateFieldIndex: 11,
  });
  assert.equal(toggled.createDraft.runInstall, false);
  assert.equal(toggled.createRegion, "editor");

  const fullState: WorktreeStackKit_InkCreateFieldState & {
    readonly marker: string;
  } = {
    createDraft: defaults,
    createInteractionMode: "browse",
    createRegion: "fields",
    marker: "full-state",
    selectedCreateFieldIndex: 1,
  };
  const fullStateEditing = WorktreeStackKit_applyInkCreateFieldStateAction({
    action: { type: "start-create-field-edit" },
    state: fullState,
  });
  assert.equal(fullStateEditing.createInteractionMode, "edit");
  assert.equal(fullStateEditing.createRegion, "editor");
  assert.equal(fullStateEditing.marker, "full-state");
});

test("action option helpers toggle only the selected action's fields", () => {
  const defaults = WorktreeStackKit_createDefaultInkActionOptions();

  assert.equal(
    WorktreeStackKit_applyInkActionOptionAction({
      actionId: "start",
      actionOptions: defaults,
      actionType: "toggle-primary-action-option",
    }).openWindsurfOnStart,
    true,
  );
  assert.equal(
    WorktreeStackKit_applyInkActionOptionAction({
      actionId: "update-from-main",
      actionOptions: defaults,
      actionType: "toggle-secondary-action-option",
    }).updateFromMainMode,
    "pushed-only",
  );
  assert.equal(
    WorktreeStackKit_applyInkActionOptionAction({
      actionId: "repair",
      actionOptions: defaults,
      actionType: "cycle-repair-target-scope",
    }).repairScope,
    "selected-record",
  );
  assert.equal(
    WorktreeStackKit_applyInkActionOptionAction({
      actionId: "start",
      actionOptions: defaults,
      actionType: "cycle-repair-target-scope",
    }),
    defaults,
  );

  const focusedStart: WorktreeStackKit_InkFocusedActionOptionState & {
    readonly marker: string;
  } = {
    actionOptions: defaults,
    marker: "full-state",
    selectedActionIndex: 0,
  };
  const fullStateToggled = WorktreeStackKit_applyFocusedInkActionOptionAction({
    actionType: "toggle-primary-action-option",
    state: focusedStart,
  });
  assert.equal(fullStateToggled.actionOptions.openWindsurfOnStart, true);
  assert.equal(fullStateToggled.marker, "full-state");

  const missingAction = WorktreeStackKit_applyFocusedInkActionOptionAction({
    actionType: "toggle-primary-action-option",
    state: {
      ...focusedStart,
      selectedActionIndex: 999,
    },
  });
  assert.equal(missingAction.actionOptions, defaults);
});

test("pool next stack helper edits only while realm-pool-next is selected", () => {
  const defaults = WorktreeStackKit_createDefaultInkActionOptions();
  const ignored = WorktreeStackKit_applyInkPoolNextStackAction({
    actionId: "repair",
    actionOptions: defaults,
    action: { type: "append-pool-next-stack-input", value: "abc" },
    poolNextStackEditMode: false,
  });
  assert.equal(ignored.actionOptions, defaults);
  assert.equal(ignored.poolNextStackEditMode, false);

  const toggled = WorktreeStackKit_applyInkPoolNextStackAction({
    actionId: "realm-pool-next",
    actionOptions: defaults,
    action: { type: "toggle-pool-next-stack-edit" },
    poolNextStackEditMode: false,
  });
  assert.equal(toggled.poolNextStackEditMode, true);

  const appended = WorktreeStackKit_applyInkPoolNextStackAction({
    actionId: "realm-pool-next",
    actionOptions: defaults,
    action: { type: "append-pool-next-stack-input", value: "abc" },
    poolNextStackEditMode: true,
  });
  assert.equal(appended.actionOptions.poolNextStackName, "abc");

  const backspaced = WorktreeStackKit_applyInkPoolNextStackAction({
    actionId: "realm-pool-next",
    actionOptions: appended.actionOptions,
    action: { type: "backspace-pool-next-stack-input" },
    poolNextStackEditMode: true,
  });
  assert.equal(backspaced.actionOptions.poolNextStackName, "ab");

  const focusedRealmPoolNext: WorktreeStackKit_InkFocusedPoolNextStackState & {
    readonly marker: string;
  } = {
    actionOptions: defaults,
    marker: "full-state",
    poolNextStackEditMode: false,
    selectedActionIndex: 15,
  };
  const fullStateEdited = WorktreeStackKit_applyFocusedInkPoolNextStackAction({
    action: { type: "append-pool-next-stack-input", value: "stack-a" },
    state: focusedRealmPoolNext,
  });
  assert.equal(fullStateEdited.actionOptions.poolNextStackName, "stack-a");
  assert.equal(fullStateEdited.marker, "full-state");
});

test("session helpers build queued sessions and apply telemetry", () => {
  const request = {
    command: "npm",
    args: ["run", "demo"],
  };
  const queued = WorktreeStackKit_buildInkSessionModel<
    typeof request,
    { source: string; text: string }
  >({
    actionLabel: "Demo",
    request,
  });

  assert.equal(queued.commandLine, "npm run demo");
  assert.equal(queued.status, "queued");

  const running = WorktreeStackKit_applyInkSessionAction({
    sessionModel: queued,
    action: { type: "session-started", startedAt: "2026-05-21T00:00:00.000Z" },
  });
  assert.equal(running?.status, "running");
  assert.equal(running?.startedAt, "2026-05-21T00:00:00.000Z");

  const withLine = WorktreeStackKit_applyInkSessionAction({
    sessionModel: running,
    action: { type: "session-line", line: { source: "stdout", text: "ok" } },
  });
  assert.deepEqual(withLine?.lines, [{ source: "stdout", text: "ok" }]);

  const cancelling = WorktreeStackKit_applyInkSessionAction({
    sessionModel: withLine,
    action: { type: "session-status", status: "cancelling" },
  });
  assert.equal(cancelling?.status, "cancelling");

  const fullState: WorktreeStackKit_InkSessionState<
    typeof request,
    { source: string; text: string }
  > & { readonly marker: string } = {
    marker: "full-state",
    sessionModel: queued,
  };
  const fullStateRunning = WorktreeStackKit_applyInkSessionStateAction({
    action: {
      type: "session-started",
      startedAt: "2026-05-21T00:00:00.000Z",
    },
    state: fullState,
  });
  assert.equal(fullStateRunning.sessionModel?.status, "running");
  assert.equal(fullStateRunning.marker, "full-state");
});

test("blocked result helper returns stable blocked result defaults", () => {
  assert.deepEqual(
    WorktreeStackKit_createBlockedInkResult<{ text: string }, { id: string }>({
      message: "blocked",
      createHandoff: null,
    }),
    {
      createHandoff: null,
      endedAt: null,
      exitCode: null,
      lines: [],
      message: "blocked",
      refreshRequested: false,
      signal: null,
      startedAt: null,
      status: "blocked",
    },
  );
});

test("start session helper creates blocked results or queued sessions", () => {
  type DemoRequest = {
    readonly args: readonly string[];
    readonly command: string;
  };
  type DemoLine = { readonly text: string };
  type DemoPlan = {
    readonly actionLabel: string;
    readonly id: string;
    readonly request: DemoRequest | null;
  };
  type DemoResult = {
    readonly refreshRequested: boolean;
    readonly status: "succeeded";
  };
  type DemoState = WorktreeStackKit_InkStartSessionState<
    DemoPlan,
    DemoRequest,
    DemoLine,
    DemoResult
  > & { readonly marker: string };

  const baseState: DemoState = {
    activePlan: null,
    marker: "full-state",
    resultModel: null,
    reviewConfirmationInput: "old",
    screen: "review",
    sessionModel: null,
    sessionRunId: 7,
  };

  const blockedPlan: DemoPlan = {
    actionLabel: "Blocked",
    id: "plan-blocked",
    request: null,
  };
  const blocked = WorktreeStackKit_applyInkStartSessionAction<
    DemoRequest,
    DemoLine,
    null,
    DemoPlan,
    DemoResult,
    DemoState
  >({
    blockedCreateHandoff: null,
    blockedMessage: "blocked",
    plan: blockedPlan,
    state: baseState,
  });
  assert.equal(blocked.screen, "result");
  assert.equal(blocked.sessionModel, null);
  assert.equal(blocked.sessionRunId, 7);
  assert.equal(blocked.resultModel?.status, "blocked");
  assert.equal(blocked.reviewConfirmationInput, "");
  assert.equal(blocked.marker, "full-state");

  const queuedPlan: DemoPlan = {
    actionLabel: "Demo",
    id: "plan-demo",
    request: { command: "npm", args: ["run", "demo"] },
  };
  const queued = WorktreeStackKit_applyInkStartSessionAction<
    DemoRequest,
    DemoLine,
    null,
    DemoPlan,
    DemoResult,
    DemoState
  >({
    blockedCreateHandoff: null,
    blockedMessage: "blocked",
    plan: queuedPlan,
    state: baseState,
  });
  assert.equal(queued.screen, "session");
  assert.equal(queued.resultModel, null);
  assert.equal(queued.sessionRunId, 8);
  assert.equal(queued.sessionModel?.actionLabel, "Demo");
  assert.equal(queued.sessionModel?.commandLine, "npm run demo");
  assert.equal(queued.marker, "full-state");
});
