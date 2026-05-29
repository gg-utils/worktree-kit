/**
 * @fileoverview Owns OpenTUI JSX for diagnostics npm submenu, realm-pool navigation, and pool-next
 * stack name capture inside the worktree-kit action-scroll shell.
 *
 * Adapters inject command catalogs and quit side effects while this module renders `<tab-select>`
 * flows and maps selections to phase transitions plus pending npm preview payloads via the
 * diagnostics/pool planners.
 *
 * @example
 * ```typescript
 * import {
 *   WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel,
 *   type WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanelProps,
 * } from "./opentui-diagnostics-pool-panel.js";
 *
 * export function Example(props: WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanelProps) {
 *   return <WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel {...props} />;
 * }
 * ```
 *
 * @testing CLI: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/opentui-diagnostics-pool-panel.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll shell that embeds this panel when diagnostics or realm-pool phases are active and forwards phase plus npm preview state.
 * @see packages/worktree-kit/src/opentui-action-scroll-diagnostics-pool-plans.ts - Planner and option builders consumed here to translate TabSelect choices into phase transitions and pending npm run payloads.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview standard governing this header block structure and verification tags.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WorktreeStackKit_buildOpenTuiDiagnosticsOptions,
  WorktreeStackKit_buildOpenTuiPoolNextFormOptions,
  WorktreeStackKit_buildOpenTuiPoolSubmenuOptions,
  WorktreeStackKit_planOpenTuiDiagnosticsSelection,
  WorktreeStackKit_planOpenTuiPoolNextFormSelection,
  WorktreeStackKit_planOpenTuiPoolSubmenuSelection,
  WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu,
  WorktreeStackKit_shouldShowOpenTuiPoolNextForm,
  WorktreeStackKit_shouldShowOpenTuiPoolSubmenu,
  type WorktreeStackKit_OpenTuiDiagnosticsPoolCommands,
} from "./opentui-action-scroll-diagnostics-pool-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
  WorktreeStackKit_OpenTuiPoolKind,
} from "./opentui-shell-contracts.js";

/** Props for diagnostics submenu, realm-pool navigation, and pool-next stack capture. */
export interface WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanelProps {
  readonly commands: WorktreeStackKit_OpenTuiDiagnosticsPoolCommands;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly formError: string;
  readonly goMenu: () => void;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly poolKind: WorktreeStackKit_OpenTuiPoolKind;
  readonly poolNextStackName: string;
  readonly requestQuit: () => void;
  readonly setCommandPreview: Dispatch<SetStateAction<string>>;
  readonly setFormError: Dispatch<SetStateAction<string>>;
  readonly setPendingNpmRun: Dispatch<
    SetStateAction<{ forwarded: string[]; script: string } | null>
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setPoolKind: Dispatch<
    SetStateAction<WorktreeStackKit_OpenTuiPoolKind>
  >;
  readonly setPoolNextStackName: Dispatch<SetStateAction<string>>;
  readonly setRequiredConfirmToken: Dispatch<SetStateAction<string | null>>;
}

/** Renders diagnostics npm submenu, realm-pool submenu, and pool-next stack name form. */
export function WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanel(
  props: WorktreeStackKit_OpenTuiDiagnosticsAndPoolPanelProps,
) {
  const {
    commands,
    flow,
    formError,
    goMenu,
    phase,
    poolKind,
    poolNextStackName,
    requestQuit,
    setCommandPreview,
    setFormError,
    setPendingNpmRun,
    setPhase,
    setPoolKind,
    setPoolNextStackName,
    setRequiredConfirmToken,
  } = props;

  return (
    <>
      {WorktreeStackKit_shouldShowOpenTuiDiagnosticsSubmenu({
        flow,
        phase,
      }) ? (
        <>
          <text>Diagnostics (npm run)</text>
          <WorktreeStackKit_OpenTuiAutoFocusTabSelect
            onSelect={(_i, option) => {
              const selectionPlan =
                WorktreeStackKit_planOpenTuiDiagnosticsSelection({
                  commands,
                  optionValue: option?.value,
                });
              if (selectionPlan.type === "ignore") return;
              if (selectionPlan.type === "menu") {
                goMenu();
                return;
              }
              if (selectionPlan.type === "quit") {
                requestQuit();
                return;
              }
              if (selectionPlan.type === "preview") {
                const { previewPlan } = selectionPlan;
                setPhase(selectionPlan.nextPhase);
                setCommandPreview(previewPlan.commandPreview);
                setPendingNpmRun({
                  forwarded: previewPlan.forwarded,
                  script: previewPlan.script,
                });
                setRequiredConfirmToken(previewPlan.requiredConfirmToken);
              }
            }}
            options={WorktreeStackKit_buildOpenTuiDiagnosticsOptions({
              commands,
            })}
            showDescription={true}
          />
        </>
      ) : null}

      {WorktreeStackKit_shouldShowOpenTuiPoolSubmenu({ flow, phase }) ? (
        <>
          <text>Realm pool</text>
          <WorktreeStackKit_OpenTuiAutoFocusTabSelect
            onSelect={(_i, option) => {
              const selectionPlan =
                WorktreeStackKit_planOpenTuiPoolSubmenuSelection({
                  commands,
                  optionValue: option?.value,
                });
              if (selectionPlan.type === "ignore") return;
              if (selectionPlan.type === "menu") {
                goMenu();
                return;
              }
              if (selectionPlan.type === "quit") {
                requestQuit();
                return;
              }
              if (selectionPlan.type === "form") {
                setPoolKind(selectionPlan.poolKind);
                setPhase(selectionPlan.nextPhase);
                return;
              }
              if (selectionPlan.type === "preview") {
                const { previewPlan } = selectionPlan;
                setPoolKind(selectionPlan.poolKind);
                setPhase(selectionPlan.nextPhase);
                setCommandPreview(previewPlan.commandPreview);
                setPendingNpmRun({
                  forwarded: previewPlan.forwarded,
                  script: previewPlan.script,
                });
                setRequiredConfirmToken(previewPlan.requiredConfirmToken);
              }
            }}
            options={WorktreeStackKit_buildOpenTuiPoolSubmenuOptions({
              commands,
            })}
            showDescription={true}
          />
        </>
      ) : null}

      {WorktreeStackKit_shouldShowOpenTuiPoolNextForm({
        flow,
        phase,
        poolKind,
      }) ? (
        <>
          <text>Realm pool next — stack name (--stack-name)</text>
          {formError.length > 0 ? <text>{formError}</text> : null}
          <input
            onChange={(value) => setPoolNextStackName(value)}
            value={poolNextStackName}
          />
          <WorktreeStackKit_OpenTuiAutoFocusTabSelect
            onSelect={(_i, option) => {
              const selectionPlan =
                WorktreeStackKit_planOpenTuiPoolNextFormSelection({
                  commands,
                  optionValue: option?.value,
                  poolNextStackName,
                });
              if (selectionPlan.type === "ignore") return;
              if (selectionPlan.type === "validation-error") {
                setFormError(selectionPlan.message);
                return;
              }
              if (selectionPlan.type === "preview") {
                const { previewPlan } = selectionPlan;
                if (selectionPlan.clearFormError) {
                  setFormError("");
                }
                setPhase(selectionPlan.nextPhase);
                setCommandPreview(previewPlan.commandPreview);
                setPendingNpmRun({
                  forwarded: previewPlan.forwarded,
                  script: previewPlan.script,
                });
                setRequiredConfirmToken(previewPlan.requiredConfirmToken);
                return;
              }
              if (selectionPlan.type === "back") {
                setPhase(selectionPlan.nextPhase);
                return;
              }
              if (selectionPlan.type === "quit") {
                requestQuit();
              }
            }}
            options={WorktreeStackKit_buildOpenTuiPoolNextFormOptions()}
            showDescription={true}
          />
        </>
      ) : null}
    </>
  );
}
