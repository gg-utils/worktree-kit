/**
 * @fileoverview Package-owned reducer and initial state factory for reusable worktree Ink UI shells.
 *
 * The reducer wires package-owned full-state helper transitions into the complete Ink UI contract.
 * Script adapters keep historical export names only; command planning, inventory loading, and process
 * side effects remain outside this pure state machine.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-reducer.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute every packages/worktree-kit src/*.unit.test.ts file via tsx --test, including ink-reducer.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-reducer-helpers.ts - Pure transition helpers and default action-option factories that implement each branch this reducer's switch delegates to.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Canonical Ink UI state, action union, and inventory contracts that define reducer inputs and returned snapshots.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink shell component that dispatches bridge and keyboard events through this reducer during interactive worktree flows.
 * @see packages/worktree-kit/src/ink-reducer.unit.test.ts - Node test runner regression coverage for default initial state, load-error transitions, and focused action-option toggles owned by this reducer.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { WorktreeStackKit_createInitialInkCreateDraft } from "./ink-create-model.js";
import { WorktreeStackKit_applyFocusedInkActionOptionAction, WorktreeStackKit_applyFocusedInkPoolNextStackAction, WorktreeStackKit_applyInkCreateFieldStateAction, WorktreeStackKit_applyInkCreateNavigationAction, WorktreeStackKit_applyInkLaunchTargetAction, WorktreeStackKit_applyInkLoadAction, WorktreeStackKit_applyInkOverlayAction, WorktreeStackKit_applyInkSessionStateAction, WorktreeStackKit_applyInkShellNavigationAction, WorktreeStackKit_applyInkStartSessionAction, WorktreeStackKit_createDefaultInkActionOptions, } from "./ink-reducer-helpers.js";
/** Returns the current record count for reducer index clamping. */
function WorktreeStackKit_getInkInventoryRecordCount(inventory) {
    return inventory?.records.length ?? 0;
}
/** Factory for the default Ink UI state prior to inventory load or user input. */
export function WorktreeStackKit_createInitialInkState() {
    const createDraft = WorktreeStackKit_createInitialInkCreateDraft();
    return {
        status: "loading",
        inventory: null,
        errorMessage: null,
        noticeMessage: null,
        activePlan: null,
        sessionModel: null,
        resultModel: null,
        reviewConfirmationInput: "",
        sessionRunId: 0,
        screen: "shell",
        selectedIndex: 0,
        selectedActionIndex: -1,
        focusedColumn: "actions",
        selectedCreateSectionIndex: 0,
        selectedCreateFieldIndex: 0,
        createRegion: "fields",
        createInteractionMode: "browse",
        refreshToken: 0,
        actionOptions: WorktreeStackKit_createDefaultInkActionOptions(),
        createDraft,
        poolNextStackEditMode: false,
    };
}
/** Pure reducer translating bridge/user events into the next Ink session snapshot. */
export function WorktreeStackKit_inkReducer(state, action) {
    switch (action.type) {
        case "load-start":
            return WorktreeStackKit_applyInkLoadAction({
                action,
                state,
            });
        case "load-success":
            return WorktreeStackKit_applyInkLoadAction({
                action: {
                    type: action.type,
                    inventory: action.inventory,
                    recordCount: WorktreeStackKit_getInkInventoryRecordCount(action.inventory),
                },
                state,
            });
        case "load-error":
            return WorktreeStackKit_applyInkLoadAction({
                action,
                state,
            });
        case "apply-launch-target":
            return WorktreeStackKit_applyInkLaunchTargetAction({
                action,
                recordCount: WorktreeStackKit_getInkInventoryRecordCount(state.inventory),
                state,
            });
        case "select-next":
        case "select-previous":
        case "select-next-action":
        case "select-previous-action":
        case "focus-column-left":
        case "focus-column-right":
        case "navigate-up":
        case "navigate-down":
        case "open-action-editor":
            return WorktreeStackKit_applyInkShellNavigationAction({
                action,
                recordCount: WorktreeStackKit_getInkInventoryRecordCount(state.inventory),
                state,
            });
        case "open-review":
            return WorktreeStackKit_applyInkOverlayAction({
                action,
                state,
            });
        case "start-session":
            return WorktreeStackKit_applyInkStartSessionAction({
                blockedCreateHandoff: null,
                blockedMessage: "This action is currently blocked by the selected worktree state.",
                plan: action.plan,
                state,
            });
        case "session-started":
        case "session-status":
        case "session-line":
            return WorktreeStackKit_applyInkSessionStateAction({
                action,
                state,
            });
        case "show-result":
        case "append-review-confirmation":
        case "backspace-review-confirmation":
        case "close-overlay":
            return WorktreeStackKit_applyInkOverlayAction({
                action,
                state,
            });
        case "toggle-primary-action-option":
        case "toggle-secondary-action-option":
        case "toggle-repair-legacy-package-alias":
        case "cycle-repair-target-scope":
        case "cycle-sync-target-scope":
            return WorktreeStackKit_applyFocusedInkActionOptionAction({
                actionType: action.type,
                state,
            });
        case "select-next-create-field":
        case "select-previous-create-field":
        case "select-next-create-section":
        case "select-previous-create-section":
        case "focus-next-create-region":
        case "focus-previous-create-region":
            return WorktreeStackKit_applyInkCreateNavigationAction({
                action,
                state,
            });
        case "start-create-field-edit":
        case "stop-create-field-edit":
        case "append-create-field-input":
        case "backspace-create-field-input":
        case "toggle-create-field":
            return WorktreeStackKit_applyInkCreateFieldStateAction({
                action,
                state,
            });
        case "toggle-pool-next-stack-edit":
        case "append-pool-next-stack-input":
        case "backspace-pool-next-stack-input":
            return WorktreeStackKit_applyFocusedInkPoolNextStackAction({
                action,
                state,
            });
        case "refresh-requested":
            return WorktreeStackKit_applyInkOverlayAction({
                action,
                state,
            });
    }
}
