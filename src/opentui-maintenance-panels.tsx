/**
 * @fileoverview Package-owned OpenTUI maintenance panels for repair, sync-local-files, and platform
 * bootstrap flows.
 *
 * Project adapters inject direct TSX script paths, bootstrap copy, and quit side effects while this
 * module owns reusable OpenTUI rendering for repair, sync-local-files, bootstrap, and direct TSX
 * preview/run navigation.
 *
 * @testing Node native test runner: cd packages/worktree-kit && npm run test -- src/opentui-maintenance-panels.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-maintenance-plans.ts - Option catalogs, visibility gates, and selection planners this module calls when wiring repair toggles, sync/bootstrap forms, and TSX preview actions.
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Focusable tab-style select control reused here for boolean repair fields, form navigation, and preview/run choices.
 * @see packages/worktree-kit/src/opentui-action-scroll.tsx - Action-scroll orchestrator that imports these panels and stacks them with other non-menu OpenTUI flows.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview contract governing the header block on this module.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** @jsxImportSource @opentui/react */

import type { Dispatch, SetStateAction } from "react";

import {
  WorktreeStackKit_buildOpenTuiBootstrapFormOptions,
  WorktreeStackKit_buildOpenTuiRepairDryRunOptions,
  WorktreeStackKit_buildOpenTuiRepairFormOptions,
  WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions,
  WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions,
  WorktreeStackKit_buildOpenTuiSyncFormOptions,
  WorktreeStackKit_buildOpenTuiTsxPreviewOptions,
  WorktreeStackKit_formatOpenTuiBootstrapFormText,
  WorktreeStackKit_planOpenTuiMaintenanceFormSelection,
  WorktreeStackKit_planOpenTuiRepairBooleanSelection,
  WorktreeStackKit_planOpenTuiTsxPreviewSelection,
  WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel,
  WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel,
  WorktreeStackKit_shouldShowOpenTuiRepairFormPanel,
  WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel,
  WorktreeStackKit_shouldShowOpenTuiSyncFormPanel,
  WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel,
  type WorktreeStackKit_OpenTuiBootstrapSeedFacts,
  type WorktreeStackKit_OpenTuiRepairBooleanField,
} from "./opentui-action-scroll-maintenance-plans.js";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
import type {
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiPhase,
} from "./opentui-shell-contracts.js";

/** Direct TSX script paths supplied by project OpenTUI adapters. */
export interface WorktreeStackKit_OpenTuiMaintenanceScriptPaths {
  readonly bootstrapInstall: string;
  readonly repair: string;
  readonly syncLocalFiles: string;
}

/** Common side-effect callbacks injected by project OpenTUI adapters. */
export interface WorktreeStackKit_OpenTuiMaintenanceSideEffects {
  readonly requestQuit: () => void;
  readonly runSpawn: (scriptUnderRepo: string, argv: string[]) => Promise<void>;
}

/** Props for the worktrees:repair form controls and direct TSX preview/run navigation. */
export interface WorktreeStackKit_OpenTuiActionScrollRepairPanelProps
  extends WorktreeStackKit_OpenTuiMaintenanceSideEffects {
  readonly commandPreview: string;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly formError: string;
  readonly goMenu: () => void;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly repairArgv: string[];
  readonly repairGoPreview: () => void;
  readonly repairWorktrees: string;
  readonly scriptPaths: Pick<
    WorktreeStackKit_OpenTuiMaintenanceScriptPaths,
    "repair"
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setRepairDryRun: Dispatch<SetStateAction<boolean>>;
  readonly setRepairIncludePkg: Dispatch<SetStateAction<boolean>>;
  readonly setRepairLegacyMissingOnly: Dispatch<SetStateAction<boolean>>;
  readonly setRepairWorktrees: Dispatch<SetStateAction<string>>;
}

/** Renders worktrees:repair form controls and direct TSX preview/run navigation. */
export function WorktreeStackKit_OpenTuiActionScrollRepairPanel(
  props: WorktreeStackKit_OpenTuiActionScrollRepairPanelProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiRepairFormPanel({
      flow: props.flow,
      phase: props.phase,
    }) &&
    !WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  if (
    WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return (
      <>
        <scrollbox style={{ flexGrow: 1 }}>
          <text>{props.commandPreview}</text>
        </scrollbox>
        <WorktreeStackKit_OpenTuiAutoFocusTabSelect
          onSelect={(_i, option) => {
            const selectionPlan =
              WorktreeStackKit_planOpenTuiTsxPreviewSelection({
                optionValue: option?.value,
              });
            if (selectionPlan.type === "run") {
              void props.runSpawn(props.scriptPaths.repair, props.repairArgv);
            }
            if (selectionPlan.type === "back") {
              props.setPhase(selectionPlan.nextPhase);
            }
          }}
          options={WorktreeStackKit_buildOpenTuiTsxPreviewOptions()}
          showDescription={true}
        />
      </>
    );
  }

  return (
    <>
      <text>worktrees:repair</text>
      {props.formError.length > 0 ? <text>{props.formError}</text> : null}
      <text>Worktree paths (comma-separated, optional = all discovered)</text>
      <input
        onChange={(value) => props.setRepairWorktrees(value)}
        value={props.repairWorktrees}
      />
      <text>Include package .env backfill (--include-package-env)</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_applyOpenTuiRepairBooleanSelection({
            field: "includePackageEnv",
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions()}
      />
      <text>
        Deprecated alias: pass --package-env-mode missing-only (maps to
        missing-or-blank)
      </text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_applyOpenTuiRepairBooleanSelection({
            field: "legacyMissingOnly",
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions()}
      />
      <text>Dry run (--dry-run)</text>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          WorktreeStackKit_applyOpenTuiRepairBooleanSelection({
            field: "dryRun",
            optionValue: option?.value,
            props,
          });
        }}
        options={WorktreeStackKit_buildOpenTuiRepairDryRunOptions()}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const selectionPlan =
            WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
              optionValue: option?.value,
            });
          if (selectionPlan.type === "preview") {
            props.repairGoPreview();
          }
          if (selectionPlan.type === "menu") {
            props.goMenu();
          }
          if (selectionPlan.type === "quit") {
            props.requestQuit();
          }
        }}
        options={WorktreeStackKit_buildOpenTuiRepairFormOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Props for worktrees:sync-local-files form controls and direct TSX preview/run navigation. */
export interface WorktreeStackKit_OpenTuiActionScrollSyncPanelProps
  extends WorktreeStackKit_OpenTuiMaintenanceSideEffects {
  readonly commandPreview: string;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly formError: string;
  readonly goMenu: () => void;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly scriptPaths: Pick<
    WorktreeStackKit_OpenTuiMaintenanceScriptPaths,
    "syncLocalFiles"
  >;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
  readonly setSyncSource: Dispatch<SetStateAction<string>>;
  readonly setSyncWorktrees: Dispatch<SetStateAction<string>>;
  readonly syncArgv: string[];
  readonly syncGoPreview: () => void;
  readonly syncSource: string;
  readonly syncWorktrees: string;
}

/** Renders worktrees:sync-local-files form controls and direct TSX preview/run navigation. */
export function WorktreeStackKit_OpenTuiActionScrollSyncPanel(
  props: WorktreeStackKit_OpenTuiActionScrollSyncPanelProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiSyncFormPanel({
      flow: props.flow,
      phase: props.phase,
    }) &&
    !WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  if (
    WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return (
      <>
        <scrollbox style={{ flexGrow: 1 }}>
          <text>{props.commandPreview}</text>
        </scrollbox>
        <WorktreeStackKit_OpenTuiAutoFocusTabSelect
          onSelect={(_i, option) => {
            const selectionPlan =
              WorktreeStackKit_planOpenTuiTsxPreviewSelection({
                optionValue: option?.value,
              });
            if (selectionPlan.type === "run") {
              void props.runSpawn(
                props.scriptPaths.syncLocalFiles,
                props.syncArgv,
              );
            }
            if (selectionPlan.type === "back") {
              props.setPhase(selectionPlan.nextPhase);
            }
          }}
          options={WorktreeStackKit_buildOpenTuiTsxPreviewOptions()}
          showDescription={true}
        />
      </>
    );
  }

  return (
    <>
      <text>worktrees:sync-local-files</text>
      {props.formError.length > 0 ? <text>{props.formError}</text> : null}
      <text>Source workspace (--source-workspace)</text>
      <input
        onChange={(value) => props.setSyncSource(value)}
        value={props.syncSource}
      />
      <text>Target worktrees (comma-separated, optional = all defaults)</text>
      <input
        onChange={(value) => props.setSyncWorktrees(value)}
        value={props.syncWorktrees}
      />
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const selectionPlan =
            WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
              optionValue: option?.value,
            });
          if (selectionPlan.type === "preview") {
            props.syncGoPreview();
          }
          if (selectionPlan.type === "menu") {
            props.goMenu();
          }
          if (selectionPlan.type === "quit") {
            props.requestQuit();
          }
        }}
        options={WorktreeStackKit_buildOpenTuiSyncFormOptions()}
        showDescription={true}
      />
    </>
  );
}

/** Props for platform bootstrap seed diagnostics and direct TSX preview/run navigation. */
export interface WorktreeStackKit_OpenTuiActionScrollBootstrapPanelProps
  extends WorktreeStackKit_OpenTuiMaintenanceSideEffects {
  readonly bootstrapGoPreview: () => void;
  readonly commandPreview: string;
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly goMenu: () => void;
  readonly installDescription: string;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
  readonly scriptPaths: Pick<
    WorktreeStackKit_OpenTuiMaintenanceScriptPaths,
    "bootstrapInstall"
  >;
  readonly seedReport: WorktreeStackKit_OpenTuiBootstrapSeedFacts;
  readonly setPhase: Dispatch<SetStateAction<WorktreeStackKit_OpenTuiPhase>>;
}

/** Renders platform bootstrap seed diagnostics and direct TSX preview/run navigation. */
export function WorktreeStackKit_OpenTuiActionScrollBootstrapPanel(
  props: WorktreeStackKit_OpenTuiActionScrollBootstrapPanelProps,
) {
  if (
    !WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel({
      flow: props.flow,
      phase: props.phase,
    }) &&
    !WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return null;
  }

  if (
    WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel({
      flow: props.flow,
      phase: props.phase,
    })
  ) {
    return (
      <>
        <scrollbox style={{ flexGrow: 1 }}>
          <text>{props.commandPreview}</text>
        </scrollbox>
        <WorktreeStackKit_OpenTuiAutoFocusTabSelect
          onSelect={(_i, option) => {
            const selectionPlan =
              WorktreeStackKit_planOpenTuiTsxPreviewSelection({
                optionValue: option?.value,
              });
            if (selectionPlan.type === "run") {
              void props.runSpawn(props.scriptPaths.bootstrapInstall, []);
            }
            if (selectionPlan.type === "back") {
              props.setPhase(selectionPlan.nextPhase);
            }
          }}
          options={WorktreeStackKit_buildOpenTuiTsxPreviewOptions()}
          showDescription={true}
        />
      </>
    );
  }

  return (
    <>
      <text>platform bootstrap (platform/commands/install-all.ts)</text>
      <scrollbox style={{ flexGrow: 1 }}>
        <text>
          {WorktreeStackKit_formatOpenTuiBootstrapFormText({
            installDescription: props.installDescription,
            seedFacts: props.seedReport,
          })}
        </text>
      </scrollbox>
      <WorktreeStackKit_OpenTuiAutoFocusTabSelect
        onSelect={(_i, option) => {
          const selectionPlan =
            WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
              optionValue: option?.value,
            });
          if (selectionPlan.type === "preview") {
            props.bootstrapGoPreview();
          }
          if (selectionPlan.type === "menu") {
            props.goMenu();
          }
          if (selectionPlan.type === "quit") {
            props.requestQuit();
          }
        }}
        options={WorktreeStackKit_buildOpenTuiBootstrapFormOptions()}
        showDescription={true}
      />
    </>
  );
}

function WorktreeStackKit_applyOpenTuiRepairBooleanSelection(options: {
  readonly field: WorktreeStackKit_OpenTuiRepairBooleanField;
  readonly optionValue: string | undefined;
  readonly props: Pick<
    Parameters<typeof WorktreeStackKit_OpenTuiActionScrollRepairPanel>[0],
    "setRepairDryRun" | "setRepairIncludePkg" | "setRepairLegacyMissingOnly"
  >;
}): void {
  const selectionPlan = WorktreeStackKit_planOpenTuiRepairBooleanSelection({
    field: options.field,
    optionValue: options.optionValue,
  });
  if (selectionPlan.type === "ignore") {
    return;
  }
  if (selectionPlan.field === "dryRun") {
    options.props.setRepairDryRun(selectionPlan.value);
  }
  if (selectionPlan.field === "includePackageEnv") {
    options.props.setRepairIncludePkg(selectionPlan.value);
  }
  if (selectionPlan.field === "legacyMissingOnly") {
    options.props.setRepairLegacyMissingOnly(selectionPlan.value);
  }
}
