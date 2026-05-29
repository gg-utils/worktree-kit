/**
 * @fileoverview Package-owned OpenTUI panels for global maintenance and run/result flows.
 *
 * Project adapters inject configured npm script names plus host quit behavior while this module
 * owns package-safe OpenTUI rendering for checkout-state, stale-realm pruning, streaming output,
 * and post-run result navigation.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-global-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-global-plans.ts - Visibility gates, option catalogs, and selection planners this module invokes when advancing checkout-state, prune-stale, and post-run navigation.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that composes these global panels with other stacked maintenance and npm panels for non-menu flows.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Focusable tab-style select control reused here for fetch toggles, form choices, and post-run result actions.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WorktreeStackKit_buildOpenTuiPruneStaleFormOptions,
  WorktreeStackKit_buildOpenTuiRunResultOptions,
  WorktreeStackKit_buildOpenTuiStateCheckFetchOptions,
  WorktreeStackKit_buildOpenTuiStateCheckFormOptions,
  WorktreeStackKit_formatOpenTuiRunExitStatus,
  WorktreeStackKit_formatOpenTuiRunResultText,
  WorktreeStackKit_formatOpenTuiRunningOutput,
  type WorktreeStackKit_OpenTuiGlobalNpmScripts,
  WorktreeStackKit_planOpenTuiPruneStaleFormSelection,
  WorktreeStackKit_planOpenTuiRunResultSelection,
  WorktreeStackKit_planOpenTuiStateCheckFetchSelection,
  WorktreeStackKit_planOpenTuiStateCheckFormSelection,
  WorktreeStackKit_shouldShowOpenTuiPruneStalePanel,
  WorktreeStackKit_shouldShowOpenTuiResultPanel,
  WorktreeStackKit_shouldShowOpenTuiRunPanel,
  WorktreeStackKit_shouldShowOpenTuiStateCheckPanel,
} from "./opentui-action-scroll-global-plans.js";
import type {
  WorktreeStackKit_OpenTuiNpmRunPreviewPlan,
} from "./opentui-action-scroll-npm-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
} from "./opentui-shell-contracts.js";

/** Pending npm-run request handed from global panels to the shared npm preview panel. */
export interface WorktreeStackKit_OpenTuiGlobalPendingNpmRun {
  readonly forwarded: string[];
  readonly script: string;
}

interface WorktreeStackKit_OpenTuiGlobalPreviewStateProps {
  readonly setCommandPreview: Dispatch<SetStateAction<string>>;
  readonly setPendingNpmRun: Dispatch<
    SetStateAction<WorktreeStackKit_OpenTuiGlobalPendingNpmRun | null>
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}

/** Props for the checkout-state global form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollStateCheckPanelProps
  extends WorktreeStackKit_OpenTuiGlobalPreviewStateProps {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly goMenu: () => void;
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly requestQuit: () => void;
  readonly setStateCheckFetch: Dispatch<SetStateAction<boolean>>;
  readonly stateCheckFetch: boolean;
}

/** Props for the stale-realm prune global form panel. */
export interface WorktreeStackKit_OpenTuiActionScrollPruneStalePanelProps
  extends WorktreeStackKit_OpenTuiGlobalPreviewStateProps {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly goMenu: () => void;
  readonly npmScripts: WorktreeStackKit_OpenTuiGlobalNpmScripts;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly requestQuit: () => void;
}

/** Props for shared running-output and result panels. */
export interface WorktreeStackKit_OpenTuiActionScrollRunAndResultPanelsProps {
  readonly goMenu: () => void;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly runScript: string;
  readonly runStatus: number | null;
  readonly runStderr: string;
  readonly runStdout: string;
}

/** Renders the worktrees:state:check form and preview transition. */
export function WorktreeStackKit_OpenTuiActionScrollStateCheckPanel(
  props: WorktreeStackKit_OpenTuiActionScrollStateCheckPanelProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiStateCheckPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  return (
    <>
      <text>{props.npmScripts.stateCheck}</text>
      <text>Pass --fetch to refresh origin refs first</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const selectionPlan = WorktreeStackKit_planOpenTuiStateCheckFetchSelection({
            optionValue: option?.value,
          });
          if (selectionPlan.type === "set-fetch") {
            props.setStateCheckFetch(selectionPlan.stateCheckFetch);
          }
        }}
        options={WorktreeStackKit_buildOpenTuiStateCheckFetchOptions()}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiStateCheckFormSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiStateCheckFormOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Renders the stale-realm prune form and confirmation-token preview transition. */
export function WorktreeStackKit_OpenTuiActionScrollPruneStalePanel(
  props: WorktreeStackKit_OpenTuiActionScrollPruneStalePanelProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiPruneStalePanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  return (
    <>
      <text>{props.npmScripts.pruneStale}</text>
      <text>
        Removes stale realm registry rows for missing workspaces. Requires confirmation.
      </text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_handleOpenTuiPruneStaleFormSelection({
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiPruneStaleFormOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Renders streaming output and post-run result navigation for non-menu flows. */
export function WorktreeStackKit_OpenTuiActionScrollRunAndResultPanels(
  props: WorktreeStackKit_OpenTuiActionScrollRunAndResultPanelsProps,
) {
  return (
    <>
      {WorktreeStackKit_shouldShowOpenTuiRunPanel({ phase: props.phase }) ? (
        <>
          <text>Running {props.runScript}…</text>
          <scrollbox style={{ flexGrow: 1 }}>
            <text>
              {WorktreeStackKit_formatOpenTuiRunningOutput({
                runStderr: props.runStderr,
                runStdout: props.runStdout,
              })}
            </text>
          </scrollbox>
        </>
      ) : null}

      {WorktreeStackKit_shouldShowOpenTuiResultPanel({ phase: props.phase }) ? (
        <>
          <text>
            Exit status: {WorktreeStackKit_formatOpenTuiRunExitStatus(props)}
          </text>
          <text>Stdout</text>
          <scrollbox style={{ flexGrow: 1 }}>
            <text>
              {WorktreeStackKit_formatOpenTuiRunResultText({
                text: props.runStdout,
              })}
            </text>
          </scrollbox>
          <text>Stderr</text>
          <scrollbox style={{ maxHeight: 8 }}>
            <text>
              {WorktreeStackKit_formatOpenTuiRunResultText({
                text: props.runStderr,
              })}
            </text>
          </scrollbox>
          <WorktreeStackKit_OpenTuiAutoFocusTabSelect
            onSelect={(_i, option) => {
              const selectionPlan = WorktreeStackKit_planOpenTuiRunResultSelection({
                optionValue: option?.value,
              });
              if (selectionPlan.type === "menu") {
                props.goMenu();
              }
            }}
            options={WorktreeStackKit_buildOpenTuiRunResultOptions()}
            showDescription={true}
          />
        </>
      ) : null}
    </>
  );
}

function WorktreeStackKit_applyOpenTuiGlobalPreviewPlan(options: {
  readonly plan: WorktreeStackKit_OpenTuiNpmRunPreviewPlan;
  readonly props: WorktreeStackKit_OpenTuiGlobalPreviewStateProps;
}): void {
  options.props.setCommandPreview(options.plan.commandPreview);
  options.props.setPendingNpmRun({
    forwarded: options.plan.forwarded,
    script: options.plan.script,
  });
  options.props.setRequiredConfirmToken(options.plan.requiredConfirmToken);
}

function WorktreeStackKit_handleOpenTuiStateCheckFormSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollStateCheckPanelProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiStateCheckFormSelection({
    npmScripts: options.props.npmScripts,
    optionValue: options.optionValue,
    stateCheckFetch: options.props.stateCheckFetch,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "menu") {
    options.props.goMenu();
    return;
  }
  if (selectionPlan.type === "quit") {
    options.props.requestQuit();
    return;
  }
  WorktreeStackKit_applyOpenTuiGlobalPreviewPlan({
    plan: selectionPlan.previewPlan,
    props: options.props,
  });
  options.props.setPhase(selectionPlan.nextPhase);
}

function WorktreeStackKit_handleOpenTuiPruneStaleFormSelection(options: {
  readonly optionValue: string | undefined;
  readonly props: WorktreeStackKit_OpenTuiActionScrollPruneStalePanelProps;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiPruneStaleFormSelection({
    npmScripts: options.props.npmScripts,
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") return;
  if (selectionPlan.type === "menu") {
    options.props.goMenu();
    return;
  }
  if (selectionPlan.type === "quit") {
    options.props.requestQuit();
    return;
  }
  WorktreeStackKit_applyOpenTuiGlobalPreviewPlan({
    plan: selectionPlan.previewPlan,
    props: options.props,
  });
  options.props.setPhase(selectionPlan.nextPhase);
}
