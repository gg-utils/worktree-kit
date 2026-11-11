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
import { WORKTREE_STACK_KIT_INK_CREATE_SECTIONS, WorktreeStackKit_getInkCreateField, WorktreeStackKit_getInkCreateFieldIndex, WorktreeStackKit_getInkCreateFieldsForSection, WorktreeStackKit_getInkCreateSection, } from "./ink-create-model.js";
const WORKTREE_STACK_KIT_CREATE_REGION_ORDER = ["sections", "fields", "editor", "preview"];
/** Builds the default persisted action-option state for a new Ink reducer session. */
export function WorktreeStackKit_createDefaultInkActionOptions() {
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
/** Applies one async inventory-load lifecycle transition. */
export function WorktreeStackKit_applyInkLoadAction(options) {
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
                selectedActionIndex: WorktreeStackKit_clampInkActionIndex(options.state.selectedActionIndex),
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
/** Applies a package-owned startup launch-target transition. */
export function WorktreeStackKit_applyInkLaunchTargetAction(options) {
    const actionOptionsPatch = options.action.actionOptionsPatch ?? {};
    return {
        ...options.state,
        selectedIndex: WorktreeStackKit_clampInkRecordIndex({
            index: options.action.selectedIndex,
            recordCount: options.recordCount,
        }),
        selectedActionIndex: WorktreeStackKit_clampInkActionIndex(options.action.selectedActionIndex),
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
export function WorktreeStackKit_clampInkRecordIndex(options) {
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
export function WorktreeStackKit_clampInkActionIndex(index) {
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
export function WorktreeStackKit_clampInkCreateSectionIndex(index) {
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
export function WorktreeStackKit_getFirstInkCreateFieldIndexForSection(sectionIndex) {
    const section = WorktreeStackKit_getInkCreateSection(WorktreeStackKit_clampInkCreateSectionIndex(sectionIndex));
    if (!section) {
        return 0;
    }
    const firstField = WorktreeStackKit_getInkCreateFieldsForSection(section.id)[0];
    if (!firstField) {
        return 0;
    }
    const fieldIndex = WorktreeStackKit_getInkCreateFieldIndex(firstField.id);
    return fieldIndex >= 0 ? fieldIndex : 0;
}
/** Lists global field indices for every field rendered in a create section. */
export function WorktreeStackKit_getInkCreateFieldIndicesForSection(sectionIndex) {
    const section = WorktreeStackKit_getInkCreateSection(WorktreeStackKit_clampInkCreateSectionIndex(sectionIndex));
    if (!section) {
        return [];
    }
    return WorktreeStackKit_getInkCreateFieldsForSection(section.id)
        .map((field) => WorktreeStackKit_getInkCreateFieldIndex(field.id))
        .filter((fieldIndex) => fieldIndex >= 0);
}
/** Steps create-field focus within the current section along ordered field ids. */
export function WorktreeStackKit_stepInkCreateFieldIndexWithinSection(options) {
    const fieldIndices = WorktreeStackKit_getInkCreateFieldIndicesForSection(options.sectionIndex);
    if (fieldIndices.length <= 0) {
        return 0;
    }
    const currentPosition = fieldIndices.indexOf(options.currentFieldIndex);
    const clampedCurrentPosition = currentPosition < 0 ? 0 : currentPosition;
    const nextPosition = Math.min(Math.max(clampedCurrentPosition + options.direction, 0), fieldIndices.length - 1);
    return fieldIndices[nextPosition] ?? fieldIndices[0] ?? 0;
}
/** Rotates create UI focus across the fixed create-region ring. */
export function WorktreeStackKit_stepInkCreateRegion(options) {
    const currentIndex = WORKTREE_STACK_KIT_CREATE_REGION_ORDER.indexOf(options.region);
    const nextIndex = (currentIndex +
        options.direction +
        WORKTREE_STACK_KIT_CREATE_REGION_ORDER.length) %
        WORKTREE_STACK_KIT_CREATE_REGION_ORDER.length;
    return WORKTREE_STACK_KIT_CREATE_REGION_ORDER[nextIndex] ?? "fields";
}
export function WorktreeStackKit_applyInkCreateNavigationAction(options) {
    switch (options.action.type) {
        case "select-next-create-field":
            return {
                ...options.state,
                selectedCreateFieldIndex: WorktreeStackKit_stepInkCreateFieldIndexWithinSection({
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
                selectedCreateFieldIndex: WorktreeStackKit_stepInkCreateFieldIndexWithinSection({
                    sectionIndex: options.state.selectedCreateSectionIndex,
                    currentFieldIndex: options.state.selectedCreateFieldIndex,
                    direction: -1,
                }),
                createRegion: "fields",
                createInteractionMode: "browse",
            };
        case "select-next-create-section": {
            const nextSectionIndex = WorktreeStackKit_clampInkCreateSectionIndex(options.state.selectedCreateSectionIndex + 1);
            return {
                ...options.state,
                selectedCreateSectionIndex: nextSectionIndex,
                selectedCreateFieldIndex: WorktreeStackKit_getFirstInkCreateFieldIndexForSection(nextSectionIndex),
                createRegion: "sections",
                createInteractionMode: "browse",
            };
        }
        case "select-previous-create-section": {
            const nextSectionIndex = WorktreeStackKit_clampInkCreateSectionIndex(options.state.selectedCreateSectionIndex - 1);
            return {
                ...options.state,
                selectedCreateSectionIndex: nextSectionIndex,
                selectedCreateFieldIndex: WorktreeStackKit_getFirstInkCreateFieldIndexForSection(nextSectionIndex),
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
function WorktreeStackKit_resetInkActionSelectionSideEffects(state) {
    return {
        ...state,
        createInteractionMode: "browse",
        poolNextStackEditMode: false,
    };
}
export function WorktreeStackKit_applyInkShellNavigationAction(options) {
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
                selectedActionIndex: WorktreeStackKit_clampInkActionIndex(options.state.selectedActionIndex + 1),
            });
        case "select-previous-action":
            return WorktreeStackKit_resetInkActionSelectionSideEffects({
                ...options.state,
                selectedActionIndex: WorktreeStackKit_clampInkActionIndex(options.state.selectedActionIndex - 1),
            });
        case "focus-column-left":
            return {
                ...options.state,
                focusedColumn: options.state.focusedColumn === "editor" ? "actions" : "records",
            };
        case "focus-column-right":
            return {
                ...options.state,
                focusedColumn: options.state.focusedColumn === "records"
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
                selectedActionIndex: WorktreeStackKit_clampInkActionIndex(options.state.selectedActionIndex - 1),
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
                selectedActionIndex: WorktreeStackKit_clampInkActionIndex(options.state.selectedActionIndex + 1),
            });
        case "open-action-editor":
            return WorktreeStackKit_resetInkActionSelectionSideEffects({
                ...options.state,
                focusedColumn: "editor",
            });
    }
}
export function WorktreeStackKit_applyInkOverlayAction(options) {
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
                reviewConfirmationInput: options.state.reviewConfirmationInput + options.action.value,
            };
        case "backspace-review-confirmation":
            return {
                ...options.state,
                reviewConfirmationInput: options.state.reviewConfirmationInput.slice(0, -1),
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
function WorktreeStackKit_getInkCreateDraftTextValue(options) {
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
function WorktreeStackKit_setInkCreateDraftTextValue(options) {
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
function WorktreeStackKit_toggleInkCreateDraftBooleanValue(options) {
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
                followUpStartOpenWindsurf: !options.createDraft.followUpStartOpenWindsurf,
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
export function WorktreeStackKit_applyInkCreateFieldAction(options) {
    const currentResult = {
        createDraft: options.createDraft,
        createInteractionMode: options.createInteractionMode,
        createRegion: options.createRegion,
    };
    const selectedField = WorktreeStackKit_getInkCreateField(options.selectedCreateFieldIndex);
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
            if (options.createInteractionMode !== "edit" ||
                !selectedField ||
                selectedField.kind !== "text") {
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
            if (options.createInteractionMode !== "edit" ||
                !selectedField ||
                selectedField.kind !== "text") {
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
            if (options.createInteractionMode === "edit" ||
                !selectedField ||
                selectedField.kind !== "boolean") {
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
export function WorktreeStackKit_applyInkCreateFieldStateAction(options) {
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
/** Returns action-option state after applying the focused action's primary option toggle. */
export function WorktreeStackKit_applyPrimaryInkActionOption(options) {
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
            updateFromMainExecutionMode: options.actionOptions.updateFromMainExecutionMode === "plan"
                ? "push"
                : "plan",
        };
    }
    if (options.actionId === "merge") {
        return {
            ...options.actionOptions,
            mergeExecutionMode: options.actionOptions.mergeExecutionMode === "plan" ? "push" : "plan",
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
export function WorktreeStackKit_applySecondaryInkActionOption(options) {
    if (options.actionId === "repair") {
        return {
            ...options.actionOptions,
            repairIncludePackageEnv: !options.actionOptions.repairIncludePackageEnv,
        };
    }
    if (options.actionId === "update-from-main") {
        return {
            ...options.actionOptions,
            updateFromMainMode: options.actionOptions.updateFromMainMode === "live-worktree"
                ? "pushed-only"
                : "live-worktree",
        };
    }
    return options.actionOptions;
}
/** Applies one action-option reducer event for the selected action id. */
export function WorktreeStackKit_applyInkActionOptionAction(options) {
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
                repairLegacyPackageEnvAlias: !options.actionOptions.repairLegacyPackageEnvAlias,
            };
        case "cycle-repair-target-scope":
            if (options.actionId !== "repair") {
                return options.actionOptions;
            }
            return {
                ...options.actionOptions,
                repairScope: options.actionOptions.repairScope === "all-prepared"
                    ? "selected-record"
                    : "all-prepared",
            };
        case "cycle-sync-target-scope":
            if (options.actionId !== "sync-local-files") {
                return options.actionOptions;
            }
            return {
                ...options.actionOptions,
                syncScope: options.actionOptions.syncScope === "all-discovered"
                    ? "selected-record"
                    : "all-discovered",
            };
    }
}
function WorktreeStackKit_getInkActionIdAtIndex(selectedActionIndex) {
    return WORKTREE_STACK_KIT_INK_ACTIONS[selectedActionIndex]?.id ?? null;
}
/** Applies an action-option reducer event to the action focused by the selected action index. */
export function WorktreeStackKit_applyFocusedInkActionOptionAction(options) {
    const actionId = WorktreeStackKit_getInkActionIdAtIndex(options.state.selectedActionIndex);
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
/** Applies one realm-pool next stack-name edit reducer event. */
export function WorktreeStackKit_applyInkPoolNextStackAction(options) {
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
                    poolNextStackName: options.actionOptions.poolNextStackName + options.action.value,
                },
                poolNextStackEditMode: options.poolNextStackEditMode,
            };
        case "backspace-pool-next-stack-input":
            return {
                actionOptions: {
                    ...options.actionOptions,
                    poolNextStackName: options.actionOptions.poolNextStackName.slice(0, -1),
                },
                poolNextStackEditMode: options.poolNextStackEditMode,
            };
    }
}
/** Applies a realm-pool next stack-name event to the currently focused action row. */
export function WorktreeStackKit_applyFocusedInkPoolNextStackAction(options) {
    const actionId = WorktreeStackKit_getInkActionIdAtIndex(options.state.selectedActionIndex);
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
/** Builds the queued session snapshot for a runnable action request. */
export function WorktreeStackKit_buildInkSessionModel(options) {
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
export function WorktreeStackKit_applyInkSessionAction(options) {
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
/** Applies one session telemetry reducer event to a full Ink reducer state. */
export function WorktreeStackKit_applyInkSessionStateAction(options) {
    return {
        ...options.state,
        sessionModel: WorktreeStackKit_applyInkSessionAction({
            action: options.action,
            sessionModel: options.state.sessionModel,
        }),
    };
}
/** Builds the stable blocked result used when a selected action cannot run. */
export function WorktreeStackKit_createBlockedInkResult(options) {
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
export function WorktreeStackKit_applyInkStartSessionAction(options) {
    if (!options.plan.request) {
        return {
            ...options.state,
            activePlan: options.plan,
            sessionModel: null,
            resultModel: WorktreeStackKit_createBlockedInkResult({
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
        sessionModel: WorktreeStackKit_buildInkSessionModel({
            actionLabel: options.plan.actionLabel,
            request: options.plan.request,
        }),
        sessionRunId: options.state.sessionRunId + 1,
        screen: "session",
    };
}
