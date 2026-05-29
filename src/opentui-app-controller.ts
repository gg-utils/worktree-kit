/**
 * @fileoverview Package-owned OpenTUI app controller for worktree-stack launch surfaces.
 *
 * Root scripts inject repository configuration, inventory loading, clipboard I/O, preview adapters,
 * and subprocess spawners. This package hook owns the reusable React state machine around the
 * worktree OpenTUI shell: menu flow, action-scroll props, copy flash, keyboard focus routing,
 * preview construction, run lifecycle state, and cleanup.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see scripts/worktree-stack/ui/cli-opentui/app.tsx - OpenTUI CLI host that injects repo inventory, clipboard, preview, and spawn adapters into WorktreeStackKit_useOpenTuiAppController before mounting the kit shell.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - Render-only shell that receives shellProps and actionScrollProps assembled here for menu flow, previews, and run output chrome.
 * @see packages/worktree-kit/src/opentui-app-run-lifecycle.ts - Shared stdout/stderr append and phase transitions used when this controller spawns npm or TSX maintenance commands.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import type { TabSelectRenderable } from "@opentui/core";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";
import type {
  WorktreeStackKit_OpenTuiActionScrollConfig,
  WorktreeStackKit_OpenTuiActionScrollProps,
} from "./opentui-action-scroll.js";
import type { WorktreeStackKit_OpenTuiAppShellProps } from "./opentui-app-shell.js";
import {
  WorktreeStackKit_formatOpenTuiNpmRunLabel,
  WorktreeStackKit_runOpenTuiCommandWithLifecycle,
  type WorktreeStackKit_OpenTuiRunOutputHandlers,
  type WorktreeStackKit_OpenTuiRunStartResult,
} from "./opentui-app-run-lifecycle.js";
import {
  WorktreeStackKit_formatOpenTuiRecordSummary,
  WorktreeStackKit_resolveOpenTuiSelectedWorktreePath,
} from "./opentui-app-shell-view-model.js";
import {
  WorktreeStackKit_formatOpenTuiBootstrapPreviewText,
  type WorktreeStackKit_OpenTuiBootstrapSeedFacts,
} from "./opentui-action-scroll-maintenance-plans.js";
import { WorktreeStackKit_planOpenTuiSwitchPreview } from "./opentui-action-scroll-switch-plans.js";
import {
  WorktreeStackKit_createOpenTuiCreateFormModel,
  type WorktreeStackKit_OpenTuiCreateFormDefaults,
} from "./opentui-create-wizard-form-plans.js";
import {
  WorktreeStackKit_formatOpenTuiCreatePreviewText,
  type WorktreeStackKit_OpenTuiCreatePreview,
  type WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem,
} from "./opentui-create-preview.js";
import type { WorktreeStackKit_OpenTuiPendingNpmRun } from "./opentui-npm-panels.js";
import {
  WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation,
  type WorktreeStackKit_OpenTuiKeyEventLike,
} from "./opentui-shell-keyboard.js";
import type {
  WorktreeStackKit_OpenTuiCopyFlash,
  WorktreeStackKit_OpenTuiFlow,
  WorktreeStackKit_OpenTuiMenuColumn,
  WorktreeStackKit_OpenTuiPhase,
  WorktreeStackKit_OpenTuiPoolKind,
} from "./opentui-shell-contracts.js";
import {
  WorktreeStackKit_buildOpenTuiCreateArgv,
  WorktreeStackKit_buildOpenTuiRepairArgv,
  WorktreeStackKit_buildOpenTuiSyncArgv,
  WorktreeStackKit_formatUiTsxCommand,
  type WorktreeStackKit_UiCreateFormModel,
  type WorktreeStackKit_UiExecutionMode,
  type WorktreeStackKit_UiSwitchFormModel,
  type WorktreeStackKit_UiUpdateMode,
} from "./ui-command-catalog.js";

type OpenTuiAppControllerPortSummaryItem<
  TPorts extends Readonly<Record<string, number>>,
> = WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem<TPorts>;

/** Input contract for host-owned inventory discovery. */
export type WorktreeStackKit_OpenTuiAppControllerLoadInventory = (options: {
  readonly projectRoot: string;
}) => Promise<WorktreeStackKit_InkUiInventory>;

/** Input contract for host-owned OpenTUI command spawners. */
export type WorktreeStackKit_OpenTuiAppControllerStartRun = (options: {
  readonly argv: string[];
  readonly handlers: WorktreeStackKit_OpenTuiRunOutputHandlers;
  readonly repoRoot: string;
  readonly script: string;
}) => WorktreeStackKit_OpenTuiRunStartResult;

/** Input contract for project-owned create-preview derivation. */
export type WorktreeStackKit_OpenTuiAppControllerPreviewCreate<
  TPorts extends Readonly<Record<string, number>>,
> = (options: {
  readonly dateToken: string;
  readonly repoRoot: string;
  readonly requestedRealmSlug: string;
  readonly slot: number;
  readonly stackName: string;
  readonly worktreePathOverride: string;
  readonly worktreesBase: string;
}) => WorktreeStackKit_OpenTuiCreatePreview<TPorts>;

/** Project configuration and side-effect adapters consumed by the package-owned controller. */
export interface WorktreeStackKit_OpenTuiAppControllerOptions<
  TPorts extends Readonly<Record<string, number>>,
> {
  readonly actionScrollConfig: WorktreeStackKit_OpenTuiActionScrollConfig;
  readonly bootstrapNpmScript: string;
  readonly bootstrapSeedFacts: WorktreeStackKit_OpenTuiBootstrapSeedFacts;
  readonly copyToClipboard: (text: string) => boolean;
  readonly createFormDefaults: WorktreeStackKit_OpenTuiCreateFormDefaults;
  readonly createPreviewPortSummaryItems: readonly OpenTuiAppControllerPortSummaryItem<TPorts>[];
  readonly defaultSyncSource: string;
  readonly loadInventory: WorktreeStackKit_OpenTuiAppControllerLoadInventory;
  readonly previewCreate: WorktreeStackKit_OpenTuiAppControllerPreviewCreate<TPorts>;
  readonly repoRoot: string;
  readonly requestQuit: () => void;
  readonly resolveDefaultWorktreesBase: (repoRoot: string) => string;
  readonly startNpmRun: WorktreeStackKit_OpenTuiAppControllerStartRun;
  readonly startTsxRun: WorktreeStackKit_OpenTuiAppControllerStartRun;
}

/** Return bundle passed directly into the package-owned OpenTUI app shell. */
export interface WorktreeStackKit_OpenTuiAppControllerResult {
  readonly handleKeyboardKey: (key: WorktreeStackKit_OpenTuiKeyEventLike) => void;
  readonly shellProps: WorktreeStackKit_OpenTuiAppShellProps;
}

/** Creates the reusable OpenTUI shell controller while keeping project I/O injected by scripts. */
export function WorktreeStackKit_useOpenTuiAppController<
  TPorts extends Readonly<Record<string, number>>,
>(
  options: WorktreeStackKit_OpenTuiAppControllerOptions<TPorts>,
): WorktreeStackKit_OpenTuiAppControllerResult {
  const [flow, setFlow] = useState<WorktreeStackKit_OpenTuiFlow>("menu");
  const [phase, setPhase] = useState<WorktreeStackKit_OpenTuiPhase>("form");
  const [copyFlash, setCopyFlash] =
    useState<WorktreeStackKit_OpenTuiCopyFlash>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createModel, setCreateModel] =
    useState<WorktreeStackKit_UiCreateFormModel>(() =>
      WorktreeStackKit_createOpenTuiCreateFormModel(
        options.createFormDefaults,
      ),
    );
  const [createArgv, setCreateArgv] = useState<string[]>([]);
  const [createPreviewText, setCreatePreviewText] = useState<string>("");
  const [createPreviewError, setCreatePreviewError] = useState<string>("");

  const [switchModel, setSwitchModel] =
    useState<WorktreeStackKit_UiSwitchFormModel>({
      prefix: "",
      stackName: "",
      worktreesBase: "default",
    });
  const [switchArgv, setSwitchArgv] = useState<string[]>([]);
  const [switchPreviewText, setSwitchPreviewText] = useState<string>("");
  const [switchPreviewError, setSwitchPreviewError] = useState<string>("");

  const [repairWorktrees, setRepairWorktrees] = useState<string>("");
  const [repairIncludePkg, setRepairIncludePkg] = useState<boolean>(false);
  const [repairLegacyMissingOnly, setRepairLegacyMissingOnly] =
    useState<boolean>(false);
  const [repairDryRun, setRepairDryRun] = useState<boolean>(false);
  const [repairArgv, setRepairArgv] = useState<string[]>([]);

  const [syncSource, setSyncSource] = useState<string>(
    options.defaultSyncSource,
  );
  const [syncWorktrees, setSyncWorktrees] = useState<string>("");
  const [syncArgv, setSyncArgv] = useState<string[]>([]);

  const [commandPreview, setCommandPreview] = useState<string>("");
  const [runStdout, setRunStdout] = useState<string>("");
  const [runStderr, setRunStderr] = useState<string>("");
  const [runStatus, setRunStatus] = useState<number | null>(null);
  const [runScript, setRunScript] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const cancelRunRef = useRef<(() => void) | null>(null);
  const [inventory, setInventory] =
    useState<WorktreeStackKit_InkUiInventory | null>(null);
  const [inventoryLoadError, setInventoryLoadError] = useState<string | null>(
    null,
  );

  const [recordPickIndex, setRecordPickIndex] = useState(0);
  const [focusedColumn, setFocusedColumn] =
    useState<WorktreeStackKit_OpenTuiMenuColumn>("worktrees");

  const worktreesTabRef = useRef<TabSelectRenderable | null>(null);
  const actionsTabRef = useRef<TabSelectRenderable | null>(null);

  const [manualWorktreePath, setManualWorktreePath] = useState("");
  const [startOpenWindsurf, setStartOpenWindsurf] = useState(false);
  const [destroyPrune, setDestroyPrune] = useState(false);
  const [updateMode, setUpdateMode] =
    useState<WorktreeStackKit_UiUpdateMode>("live-worktree");
  const [updateExec, setUpdateExec] =
    useState<WorktreeStackKit_UiExecutionMode>("plan");
  const [mergeExec, setMergeExec] =
    useState<WorktreeStackKit_UiExecutionMode>("plan");
  const [confirmTokenInput, setConfirmTokenInput] = useState("");
  const [pendingNpmRun, setPendingNpmRun] =
    useState<WorktreeStackKit_OpenTuiPendingNpmRun | null>(null);
  const [requiredConfirmToken, setRequiredConfirmToken] = useState<
    string | null
  >(null);

  const [poolKind, setPoolKind] =
    useState<WorktreeStackKit_OpenTuiPoolKind>("list");
  const [poolNextStackName, setPoolNextStackName] = useState("");
  const [stateCheckFetch, setStateCheckFetch] = useState(false);

  const resetRunArtifacts = useCallback((): void => {
    setRunStdout("");
    setRunStderr("");
    setRunStatus(null);
    setFormError("");
  }, []);

  const goMenu = useCallback((): void => {
    setFlow("menu");
    setPhase("form");
    setFocusedColumn("actions");
    worktreesTabRef.current?.blur();
    actionsTabRef.current?.focus();
    resetRunArtifacts();
    setConfirmTokenInput("");
    setPendingNpmRun(null);
    setRequiredConfirmToken(null);
    setManualWorktreePath("");
  }, [resetRunArtifacts]);

  const handleCopy = useCallback(
    (panel: NonNullable<WorktreeStackKit_OpenTuiCopyFlash>, text: string) => {
      const ok = options.copyToClipboard(text);
      if (ok) {
        setCopyFlash(panel);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopyFlash(null), 1500);
      }
    },
    [options.copyToClipboard],
  );

  const handleKeyboardKey = useCallback(
    (key: WorktreeStackKit_OpenTuiKeyEventLike): void => {
      WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation({
        actionsTabRef,
        flow,
        focusedColumn,
        goMenu,
        key,
        setFocusedColumn,
        worktreesTabRef,
      });
    },
    [flow, focusedColumn, goMenu],
  );

  useEffect(() => {
    return () => {
      cancelRunRef.current?.();
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    options.loadInventory({ projectRoot: options.repoRoot })
      .then((loadedInventory) => {
        if (!cancelled) {
          setInventory(loadedInventory);
          setInventoryLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setInventoryLoadError(message);
          setInventory(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [options.loadInventory, options.repoRoot]);

  useEffect(() => {
    if (worktreesTabRef.current && !worktreesTabRef.current.focused) {
      worktreesTabRef.current.focus();
    }
  }, []);

  function getSelectedWorktreePath(): string | null {
    return WorktreeStackKit_resolveOpenTuiSelectedWorktreePath({
      manualWorktreePath,
      recordPickIndex,
      records: inventory?.records,
    });
  }

  function recordSummary(record: WorktreeStackKit_InkUiRecord): string {
    return WorktreeStackKit_formatOpenTuiRecordSummary(record);
  }

  function runLifecycleCallbacks() {
    return {
      appendRunStderr: (chunk: string) => {
        setRunStderr((previous) => previous + chunk);
      },
      appendRunStdout: (chunk: string) => {
        setRunStdout((previous) => previous + chunk);
      },
      cancelCurrentRun: () => {
        cancelRunRef.current?.();
      },
      resetRunArtifacts,
      setCancelRun: (cancel: (() => void) | null) => {
        cancelRunRef.current = cancel;
      },
      setPhase,
      setRunScript,
      setRunStatus,
      setRunStderr,
    };
  }

  async function runNpmScript(
    npmScript: string,
    forwarded: string[],
  ): Promise<void> {
    await WorktreeStackKit_runOpenTuiCommandWithLifecycle({
      callbacks: runLifecycleCallbacks(),
      commandLabel: WorktreeStackKit_formatOpenTuiNpmRunLabel(npmScript),
      startRun: (handlers) =>
        options.startNpmRun({
          argv: forwarded,
          handlers,
          repoRoot: options.repoRoot,
          script: npmScript,
        }),
    });
  }

  async function runSpawn(
    scriptUnderRepo: string,
    argv: string[],
  ): Promise<void> {
    await WorktreeStackKit_runOpenTuiCommandWithLifecycle({
      callbacks: runLifecycleCallbacks(),
      commandLabel: scriptUnderRepo,
      startRun: (handlers) =>
        options.startTsxRun({
          argv,
          handlers,
          repoRoot: options.repoRoot,
          script: scriptUnderRepo,
        }),
    });
  }

  function switchGoPreview(): void {
    setFormError("");
    setSwitchPreviewError("");
    const previewPlan = WorktreeStackKit_planOpenTuiSwitchPreview({
      model: switchModel,
    });
    setSwitchArgv(previewPlan.argv);
    setSwitchPreviewText(previewPlan.previewText);
    setPhase("preview");
  }

  function createGoPreview(): void {
    setFormError("");
    setCreatePreviewError("");
    try {
      const argv = WorktreeStackKit_buildOpenTuiCreateArgv(createModel);
      setCreateArgv(argv);
      const commandPreviewText = WorktreeStackKit_formatUiTsxCommand({
        args: argv,
        repoRoot: options.repoRoot,
        scriptPath: options.actionScrollConfig.createScriptPaths.create,
      });
      const preview = options.previewCreate({
        dateToken: "",
        repoRoot: options.repoRoot,
        requestedRealmSlug: createModel.realm,
        slot: Number.parseInt(createModel.slot.trim(), 10),
        stackName: createModel.stackName.trim(),
        worktreePathOverride: createModel.worktreePathOverride,
        worktreesBase:
          createModel.worktreesBase.trim() ||
          options.resolveDefaultWorktreesBase(options.repoRoot),
      });
      if (!preview.ok) {
        setCreatePreviewError(preview.errorMessage);
        setCreatePreviewText(commandPreviewText);
      } else {
        setCreatePreviewText(
          WorktreeStackKit_formatOpenTuiCreatePreviewText({
            commandPreview: commandPreviewText,
            portSummaryItems: options.createPreviewPortSummaryItems,
            preview,
          }),
        );
      }
      setPhase("preview");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    }
  }

  function repairGoPreview(): void {
    setFormError("");
    try {
      const argv = WorktreeStackKit_buildOpenTuiRepairArgv({
        dryRun: repairDryRun,
        includePackageEnv: repairIncludePkg,
        legacyMissingOnlyAlias: repairLegacyMissingOnly,
        worktreeLines: repairWorktrees,
      });
      setRepairArgv(argv);
      setCommandPreview(
        WorktreeStackKit_formatUiTsxCommand({
          args: argv,
          repoRoot: options.repoRoot,
          scriptPath: options.actionScrollConfig.maintenanceScriptPaths.repair,
        }),
      );
      setPhase("preview");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    }
  }

  function syncGoPreview(): void {
    setFormError("");
    try {
      const argv = WorktreeStackKit_buildOpenTuiSyncArgv({
        sourceWorkspace: syncSource,
        worktreeLines: syncWorktrees,
      });
      setSyncArgv(argv);
      setCommandPreview(
        WorktreeStackKit_formatUiTsxCommand({
          args: argv,
          repoRoot: options.repoRoot,
          scriptPath:
            options.actionScrollConfig.maintenanceScriptPaths.syncLocalFiles,
        }),
      );
      setPhase("preview");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFormError(message);
    }
  }

  function bootstrapGoPreview(): void {
    setFormError("");
    setCommandPreview(
      WorktreeStackKit_formatOpenTuiBootstrapPreviewText({
        npmInstallCommand: WorktreeStackKit_formatOpenTuiNpmRunLabel(
          options.bootstrapNpmScript,
        ),
        seedFacts: options.bootstrapSeedFacts,
        tsxInstallCommand: WorktreeStackKit_formatUiTsxCommand({
          args: [],
          repoRoot: options.repoRoot,
          scriptPath:
            options.actionScrollConfig.maintenanceScriptPaths.bootstrapInstall,
        }),
      }),
    );
    setPhase("preview");
  }

  const actionScrollProps: WorktreeStackKit_OpenTuiActionScrollProps = {
    ...options.actionScrollConfig,
    bootstrapGoPreview,
    commandPreview,
    confirmTokenInput,
    createArgv,
    createGoPreview,
    createModel,
    createPreviewError,
    createPreviewText,
    destroyPrune,
    flow,
    formError,
    getSelectedWorktreePath,
    goMenu,
    inventory,
    manualWorktreePath,
    mergeExec,
    pendingNpmRun,
    phase,
    poolKind,
    poolNextStackName,
    recordPickIndex,
    recordSummary,
    repairArgv,
    repairGoPreview,
    repairWorktrees,
    requestQuit: options.requestQuit,
    requiredConfirmToken,
    runNpmScript,
    runScript,
    runSpawn,
    runStatus,
    runStderr,
    runStdout,
    seedReport: options.bootstrapSeedFacts,
    setCommandPreview,
    setConfirmTokenInput,
    setCreateModel,
    setDestroyPrune,
    setFormError,
    setManualWorktreePath,
    setMergeExec,
    setPendingNpmRun,
    setPhase,
    setPoolKind,
    setPoolNextStackName,
    setRecordPickIndex,
    setRepairDryRun,
    setRepairIncludePkg,
    setRepairLegacyMissingOnly,
    setRepairWorktrees,
    setRequiredConfirmToken,
    setStartOpenWindsurf,
    setStateCheckFetch,
    setSwitchModel,
    setSyncSource,
    setSyncWorktrees,
    setUpdateExec,
    setUpdateMode,
    startOpenWindsurf,
    stateCheckFetch,
    switchArgv,
    switchGoPreview,
    switchModel,
    switchPreviewError,
    switchPreviewText,
    syncArgv,
    syncGoPreview,
    syncSource,
    syncWorktrees,
    updateExec,
    updateMode,
  };

  return {
    handleKeyboardKey,
    shellProps: {
      actionScrollProps,
      actionsTabRef,
      copyFlash,
      focusedColumn,
      handleCopy,
      inventoryLoadError,
      resetRunArtifacts,
      setFlow,
      setFocusedColumn,
      setRecordPickIndex,
      worktreesTabRef,
    },
  };
}
