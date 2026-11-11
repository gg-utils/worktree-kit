import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Package-owned Ink app controller and renderer for worktree-stack UIs.
 *
 * Project adapters inject inventory discovery, action-plan construction, create-resolution config,
 * and project roots. This component owns reusable reducer wiring, launch-target application,
 * keyboard routing, session/run lifecycle effects, create handoff refresh, and shell/fullscreen
 * routing so root scripts can stay focused on configuration and side-effect adapters.
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/ink-app.unit.test.ts
 * @testing Jest unit: npm run worktree-kit:test (runs the full @gg-utils/worktree-kit Jest suite including this module)
 *
 * @see packages/worktree-kit/src/ink-app.unit.test.ts - Jest coverage for `WorktreeStackKit_InkApp` reducer wiring, keyboard routing, and lifecycle effects owned by this renderer.
 * @see packages/worktree-kit/src/ink-reducer.ts - Consolidated Ink UI reducer and initial-state factory this component dispatches through session, shell, and fullscreen flows.
 * @see packages/worktree-kit/src/ink-bridge.ts - Child-process launch helpers invoked when this UI starts Ink runtime or task workflows from the action catalog.
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports this module so project adapters can import `@gg-utils/worktree-kit/ink-app` without reaching into `src/` paths.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React, { startTransition, useEffect, useReducer, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { WORKTREE_STACK_KIT_INK_ACTIONS, } from "./ink-action-catalog.js";
import { WorktreeStackKit_startInkRuntimeProcess, WorktreeStackKit_startInkTaskProcess, } from "./ink-bridge.js";
import { WorktreeStackKit_createInitialInkCreateDraft, WorktreeStackKit_getInkCreateField, } from "./ink-create-model.js";
import { WorktreeStackKit_resolveCreatedInkRecord, } from "./ink-create-resolution.js";
import { WorktreeStackKit_InkResultScreen, WorktreeStackKit_InkReviewScreen, WorktreeStackKit_InkSessionScreen, } from "./ink-fullscreen-screens.js";
import { WorktreeStackKit_resolveInkLaunchTarget, } from "./ink-launch-resolution.js";
import { WorktreeStackKit_dispatchInkEditorColumnInput, WorktreeStackKit_dispatchInkReviewScreenKeys, WorktreeStackKit_tryConsumeInkQuitEscapeRefreshKeys, WorktreeStackKit_tryConsumeInkResultScreenKeys, WorktreeStackKit_tryConsumeInkShellListNavigationKeys, } from "./ink-keyboard-routing.js";
import { WorktreeStackKit_buildInkResultModel } from "./ink-result-model.js";
import { WorktreeStackKit_createInitialInkState, WorktreeStackKit_inkReducer, } from "./ink-reducer.js";
import { WorktreeStackKit_getInkShellSelectedRecordFromInventory, WorktreeStackKit_InkShell, } from "./ink-shell.js";
function WorktreeStackKit_isNonBlankStackNameCandidate(value) {
    return value !== null && value !== undefined && value.trim().length > 0;
}
function WorktreeStackKit_toInkLaunchInventory(inventory) {
    return {
        projectRoot: inventory.projectRoot,
        records: inventory.records.map((record) => ({
            stackNameCandidates: [
                record.metadata?.stackName,
                record.handbook?.stackName,
            ].filter(WorktreeStackKit_isNonBlankStackNameCandidate),
            worktreePath: record.worktreePath,
        })),
    };
}
/** Renders the reusable worktree Ink app around project-injected plans and inventory loading. */
export function WorktreeStackKit_InkApp({ actionDefinitions: actionDefinitionsProp, buildActionPlan, createResolutionConfig, launchTarget, loadInventory, projectRoot, }) {
    const actionDefinitions = actionDefinitionsProp ?? WORKTREE_STACK_KIT_INK_ACTIONS;
    const { exit } = useApp();
    const [state, dispatch] = useReducer(WorktreeStackKit_inkReducer, WorktreeStackKit_createInitialInkState());
    const activeRunCancelRef = useRef(null);
    const launchTargetAppliedRef = useRef(false);
    const inventory = state.inventory;
    const selectedRecord = inventory
        ? WorktreeStackKit_getInkShellSelectedRecordFromInventory(inventory, state.selectedIndex)
        : null;
    const actionPlans = inventory
        ? actionDefinitions.map((actionDefinition) => buildActionPlan({
            actionId: actionDefinition.id,
            inventory,
            selectedRecord,
            actionOptions: state.actionOptions,
            createDraft: state.createDraft,
        }))
        : [];
    const selectedAction = actionDefinitions[state.selectedActionIndex] ?? actionDefinitions[0];
    const selectedActionPlan = actionPlans[state.selectedActionIndex] ??
        (inventory && selectedAction
            ? buildActionPlan({
                actionId: selectedAction.id,
                inventory,
                selectedRecord,
                actionOptions: state.actionOptions,
                createDraft: state.createDraft,
            })
            : null);
    useEffect(() => {
        if (state.screen !== "session" ||
            !state.sessionModel ||
            !state.activePlan) {
            return;
        }
        const activePlan = state.activePlan;
        const request = activePlan.request;
        if (state.sessionModel.status !== "queued" || request === null) {
            return;
        }
        const run = request.sessionKind === "runtime"
            ? WorktreeStackKit_startInkRuntimeProcess({
                projectRoot,
                request,
                retainedArtifacts: activePlan.retainedArtifacts,
                onStarted(startedAt) {
                    startTransition(() => {
                        dispatch({ type: "session-started", startedAt });
                    });
                },
                onStatus(status) {
                    startTransition(() => {
                        dispatch({ type: "session-status", status });
                    });
                },
                onLine(line) {
                    startTransition(() => {
                        dispatch({ type: "session-line", line });
                    });
                },
            })
            : WorktreeStackKit_startInkTaskProcess({
                projectRoot,
                request,
                onStarted(startedAt) {
                    startTransition(() => {
                        dispatch({ type: "session-started", startedAt });
                    });
                },
                onLine(line) {
                    startTransition(() => {
                        dispatch({ type: "session-line", line });
                    });
                },
            });
        let disposed = false;
        activeRunCancelRef.current = run.cancel;
        const createDraftForSession = state.createDraft;
        const actionOptionsForSession = state.actionOptions;
        run.promise
            .then(async (executionResult) => {
            if (disposed) {
                return;
            }
            activeRunCancelRef.current = null;
            const createContext = activePlan.createContext;
            if (executionResult.status === "succeeded" &&
                activePlan.actionId === "create" &&
                createContext !== null) {
                const refreshedInventory = await loadInventory({
                    projectRoot,
                });
                if (disposed) {
                    return;
                }
                const createResolution = WorktreeStackKit_resolveCreatedInkRecord({
                    inventory: refreshedInventory,
                    createContext,
                });
                const followUpStartPlan = createResolution.status === "resolved" &&
                    createResolution.matchedRecord &&
                    createContext.followUpStart
                    ? buildActionPlan({
                        actionId: "start",
                        inventory: refreshedInventory,
                        selectedRecord: createResolution.matchedRecord,
                        actionOptions: {
                            ...actionOptionsForSession,
                            openWindsurfOnStart: createContext.followUpStartOpenWindsurf,
                        },
                        createDraft: createDraftForSession,
                    })
                    : null;
                const candidatePaths = createResolution.candidateRecords.map((record) => record.worktreePath);
                startTransition(() => {
                    dispatch({ type: "load-success", inventory: refreshedInventory });
                    dispatch({
                        type: "show-result",
                        result: {
                            ...WorktreeStackKit_buildInkResultModel({
                                executionResult,
                                plan: activePlan,
                            }),
                            createHandoff: {
                                status: createResolution.status,
                                requestedStackName: createContext.stackName,
                                requestedSlot: createContext.slot,
                                requestedRootBranch: createContext.rootBranch,
                                requestedSubmoduleBranch: createContext.submoduleBranch,
                                predictedWorktreePath: createContext.predictedWorktreePath,
                                matchedWorktreePath: createResolution.matchedRecord?.worktreePath ?? null,
                                candidatePaths,
                                followUpStartPlan,
                            },
                        },
                    });
                });
                return;
            }
            startTransition(() => {
                dispatch({
                    type: "show-result",
                    result: WorktreeStackKit_buildInkResultModel({
                        executionResult,
                        plan: activePlan,
                    }),
                });
            });
        })
            .catch((error) => {
            if (disposed) {
                return;
            }
            activeRunCancelRef.current = null;
            const message = error instanceof Error ? error.message : String(error);
            startTransition(() => {
                dispatch({
                    type: "show-result",
                    result: {
                        status: "failed",
                        message: `Command failed to start: ${message}`,
                        exitCode: null,
                        signal: null,
                        lines: [],
                        startedAt: null,
                        endedAt: new Date().toISOString(),
                        refreshRequested: false,
                        createHandoff: null,
                    },
                });
            });
        });
        return () => {
            disposed = true;
            if (activeRunCancelRef.current === run.cancel) {
                activeRunCancelRef.current = null;
            }
            run.cancel();
        };
    }, [
        buildActionPlan,
        loadInventory,
        projectRoot,
        state.screen,
        state.sessionRunId,
    ]);
    useEffect(() => {
        let cancelled = false;
        async function runLoad() {
            dispatch({ type: "load-start" });
            try {
                const loadedInventory = await loadInventory({
                    projectRoot,
                });
                if (cancelled) {
                    return;
                }
                startTransition(() => {
                    dispatch({ type: "load-success", inventory: loadedInventory });
                });
            }
            catch (error) {
                if (cancelled) {
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                startTransition(() => {
                    dispatch({ type: "load-error", errorMessage: message });
                });
            }
        }
        void runLoad();
        return () => {
            cancelled = true;
        };
    }, [loadInventory, projectRoot, state.refreshToken]);
    useEffect(() => {
        if (launchTargetAppliedRef.current ||
            state.status !== "ready" ||
            !inventory) {
            return;
        }
        launchTargetAppliedRef.current = true;
        const resolvedLaunchTarget = WorktreeStackKit_resolveInkLaunchTarget({
            actionDefinitions,
            initialCreateDraft: WorktreeStackKit_createInitialInkCreateDraft(),
            inventory: WorktreeStackKit_toInkLaunchInventory(inventory),
            target: launchTarget,
        });
        startTransition(() => {
            dispatch({
                type: "apply-launch-target",
                selectedIndex: resolvedLaunchTarget.selectedIndex,
                selectedActionIndex: resolvedLaunchTarget.selectedActionIndex,
                screen: resolvedLaunchTarget.screen,
                createDraft: resolvedLaunchTarget.createDraft,
                noticeMessage: resolvedLaunchTarget.noticeMessage,
                actionOptionsPatch: resolvedLaunchTarget.actionOptionsPatch,
            });
        });
    }, [actionDefinitions, inventory, launchTarget, state.status]);
    useInput((input, key) => {
        const createScreenActive = state.focusedColumn === "editor" && selectedAction?.id === "create";
        const selectedCreateField = createScreenActive
            ? WorktreeStackKit_getInkCreateField(state.selectedCreateFieldIndex)
            : null;
        const createTextFieldActive = createScreenActive && state.createInteractionMode === "edit";
        const poolNextTextActive = state.focusedColumn === "editor" &&
            selectedAction?.id === "realm-pool-next" &&
            state.poolNextStackEditMode;
        const auxiliaryTextEditActive = createTextFieldActive || poolNextTextActive;
        if (WorktreeStackKit_tryConsumeInkQuitEscapeRefreshKeys({
            input,
            key,
            auxiliaryTextEditActive,
            poolNextTextActive,
            createTextFieldActive,
            screen: state.screen,
            sessionModel: state.sessionModel,
            activeRunCancelRef,
            exit,
            dispatch,
        })) {
            return;
        }
        if (state.status !== "ready") {
            return;
        }
        if (WorktreeStackKit_tryConsumeInkShellListNavigationKeys({
            screen: state.screen,
            focusedColumn: state.focusedColumn,
            input,
            key,
            selectedActionIndex: state.selectedActionIndex,
            dispatch,
        })) {
            return;
        }
        if (state.focusedColumn === "editor") {
            WorktreeStackKit_dispatchInkEditorColumnInput({
                input,
                key,
                state,
                selectedAction,
                selectedActionPlan,
                createTextFieldActive,
                poolNextTextActive,
                selectedCreateField,
                dispatch,
            });
            return;
        }
        if (WorktreeStackKit_tryConsumeInkResultScreenKeys({
            screen: state.screen,
            input,
            followUpStartPlan: state.resultModel?.createHandoff?.followUpStartPlan,
            dispatch,
        })) {
            return;
        }
        WorktreeStackKit_dispatchInkReviewScreenKeys({
            input,
            key,
            state,
            dispatch,
        });
    });
    if (state.status === "loading" && !state.inventory) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "green", children: "Worktree Ink" }), _jsx(Text, { children: "Loading worktree discovery..." })] }));
    }
    if (state.status === "error") {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "red", children: "Worktree Ink failed to load" }), _jsx(Text, { children: state.errorMessage ?? "Unknown error" }), _jsx(Text, { color: "gray", children: "Press r to retry or q to quit." })] }));
    }
    if (!inventory) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "yellow", children: "Worktree Ink has no discovery inventory" }), _jsx(Text, { color: "gray", children: "Press r to retry or q to quit." })] }));
    }
    if (state.screen === "review" && state.activePlan) {
        return (_jsx(WorktreeStackKit_InkReviewScreen, { actionPlan: state.activePlan, reviewConfirmationInput: state.reviewConfirmationInput }));
    }
    if (state.screen === "session" && state.activePlan && state.sessionModel) {
        return (_jsx(WorktreeStackKit_InkSessionScreen, { actionPlan: state.activePlan, lines: state.sessionModel.lines, sessionStatus: state.sessionModel.status, startedAt: state.sessionModel.startedAt }));
    }
    if (state.screen === "result" && state.activePlan && state.resultModel) {
        return (_jsx(WorktreeStackKit_InkResultScreen, { actionPlan: state.activePlan, result: state.resultModel }));
    }
    return (_jsx(WorktreeStackKit_InkShell, { actionDefinitions: actionDefinitions, actionOptions: state.actionOptions, actionPlans: actionPlans, createDraft: state.createDraft, createInteractionMode: state.createInteractionMode, createRegion: state.createRegion, focusedColumn: state.focusedColumn, inventory: inventory, noticeMessage: state.noticeMessage ?? null, poolNextStackEditMode: state.poolNextStackEditMode, resolutionConfig: createResolutionConfig, selectedActionIndex: state.selectedActionIndex, selectedCreateFieldIndex: state.selectedCreateFieldIndex, selectedCreateSectionIndex: state.selectedCreateSectionIndex, selectedIndex: state.selectedIndex }));
}
