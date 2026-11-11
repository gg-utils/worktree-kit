/**
 * @fileoverview Verifies Ink keyboard routing helpers for quit, shell navigation, editor input,
 * review confirmations, and result-screen follow-up plans in the worktree-kit interactive stack.
 *
 * This file owns Node test regression coverage for the pure dispatch functions that translate raw
 * terminal input into typed `WorktreeStackKit_InkKeyboardAction` events without rendering Ink UI.
 * Flow: seed dispatch collector -> invoke routing helper -> assert consumed flag and dispatched actions.
 *
 * @testing Node.js test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/ink-keyboard-routing.ts - Pure keyboard routing module under test whose quit, shell, editor, review, and result key handlers are exercised by these assertions.
 * @see packages/worktree-kit/src/ink-create-model.ts - Create-stack draft factory used to build realistic text-field state for editor-column routing tests.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { WorktreeStackKit_createInitialInkCreateDraft } from "./ink-create-model.js";
import {
  WorktreeStackKit_dispatchInkEditorColumnInput,
  WorktreeStackKit_dispatchInkReviewScreenKeys,
  WorktreeStackKit_isInkKeyboardActionId,
  WorktreeStackKit_tryConsumeInkQuitEscapeRefreshKeys,
  WorktreeStackKit_tryConsumeInkResultScreenKeys,
  WorktreeStackKit_tryConsumeInkShellListNavigationKeys,
  type WorktreeStackKit_InkKeyboardAction,
} from "./ink-keyboard-routing.js";

type DemoPlan = {
  readonly request: { readonly command: string } | null;
  readonly requiredConfirmationToken: string | null;
};

function createActionCollector(): {
  readonly actions: WorktreeStackKit_InkKeyboardAction<DemoPlan>[];
  readonly dispatch: (action: WorktreeStackKit_InkKeyboardAction<DemoPlan>) => void;
} {
  const actions: WorktreeStackKit_InkKeyboardAction<DemoPlan>[] = [];
  return {
    actions,
    dispatch(action) {
      actions.push(action);
    },
  };
}

void test("quit routing cancels an active session before exiting", () => {
  const collector = createActionCollector();
  let cancelCount = 0;
  let exitCount = 0;

  const consumed = WorktreeStackKit_tryConsumeInkQuitEscapeRefreshKeys({
    activeRunCancelRef: {
      current() {
        cancelCount += 1;
      },
    },
    auxiliaryTextEditActive: false,
    createTextFieldActive: false,
    dispatch: collector.dispatch,
    exit() {
      exitCount += 1;
    },
    input: "q",
    key: {},
    poolNextTextActive: false,
    screen: "session",
    sessionModel: { id: "session" },
  });

  assert.equal(consumed, true);
  assert.equal(cancelCount, 1);
  assert.equal(exitCount, 0);
  assert.deepEqual(collector.actions, [
    { type: "session-status", status: "cancelling" },
  ]);
});

void test("shell navigation dispatches list and action-column movement", () => {
  const collector = createActionCollector();

  assert.equal(
    WorktreeStackKit_tryConsumeInkShellListNavigationKeys({
      dispatch: collector.dispatch,
      focusedColumn: "records",
      input: "j",
      key: {},
      screen: "shell",
      selectedActionIndex: -1,
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_tryConsumeInkShellListNavigationKeys({
      dispatch: collector.dispatch,
      focusedColumn: "actions",
      input: "",
      key: { return: true },
      screen: "shell",
      selectedActionIndex: 2,
    }),
    true,
  );

  assert.deepEqual(collector.actions, [
    { type: "navigate-down" },
    { type: "open-action-editor" },
  ]);
});

void test("editor routing handles create text edits and boolean toggles", () => {
  const collector = createActionCollector();
  const textField = WorktreeStackKit_createInitialInkCreateDraft().stackName;

  WorktreeStackKit_dispatchInkEditorColumnInput({
    createTextFieldActive: true,
    dispatch: collector.dispatch,
    input: "x",
    key: {},
    poolNextTextActive: false,
    selectedAction: {
      id: "create",
    },
    selectedActionPlan: null,
    selectedCreateField: {
      id: "stackName",
      sectionId: "identity",
      label: "Stack Name",
      kind: "text",
      description: textField,
    },
    state: {
      createInteractionMode: "edit",
      createRegion: "fields",
      poolNextStackEditMode: false,
      selectedActionIndex: 4,
    },
  });
  WorktreeStackKit_dispatchInkEditorColumnInput({
    createTextFieldActive: false,
    dispatch: collector.dispatch,
    input: " ",
    key: {},
    poolNextTextActive: false,
    selectedAction: {
      id: "create",
    },
    selectedActionPlan: null,
    selectedCreateField: {
      id: "runInstall",
      sectionId: "provisioning",
      label: "Install Dependencies",
      kind: "boolean",
      description: "Install packages",
    },
    state: {
      createInteractionMode: "browse",
      createRegion: "fields",
      poolNextStackEditMode: false,
      selectedActionIndex: 4,
    },
  });

  assert.deepEqual(collector.actions, [
    { type: "append-create-field-input", value: "x" },
    { type: "toggle-create-field" },
  ]);
});

void test("review routing sanitizes destructive confirmation and starts after exact token", () => {
  const collector = createActionCollector();
  const activePlan: DemoPlan = {
    request: { command: "npm" },
    requiredConfirmationToken: "DELETE",
  };

  WorktreeStackKit_dispatchInkReviewScreenKeys({
    dispatch: collector.dispatch,
    input: "de\n",
    key: {},
    state: {
      activePlan,
      reviewConfirmationInput: "",
      screen: "review",
    },
  });
  WorktreeStackKit_dispatchInkReviewScreenKeys({
    dispatch: collector.dispatch,
    input: "",
    key: { return: true },
    state: {
      activePlan,
      reviewConfirmationInput: "DELETE",
      screen: "review",
    },
  });

  assert.deepEqual(collector.actions, [
    { type: "append-review-confirmation", value: "DE" },
    { type: "start-session", plan: activePlan },
  ]);
});

void test("result routing starts follow-up plans and action id guard follows the catalog", () => {
  const collector = createActionCollector();
  const followUpPlan: DemoPlan = {
    request: { command: "npm" },
    requiredConfirmationToken: null,
  };

  assert.equal(
    WorktreeStackKit_tryConsumeInkResultScreenKeys({
      dispatch: collector.dispatch,
      followUpStartPlan: followUpPlan,
      input: "s",
      screen: "result",
    }),
    true,
  );

  assert.deepEqual(collector.actions, [
    { type: "start-session", plan: followUpPlan },
  ]);
  assert.equal(WorktreeStackKit_isInkKeyboardActionId("repair"), true);
  assert.equal(WorktreeStackKit_isInkKeyboardActionId("unknown-action"), false);
});
