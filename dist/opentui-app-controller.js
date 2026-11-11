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
import { useCallback, useEffect, useRef, useState } from "react";
import { WorktreeStackKit_formatOpenTuiNpmRunLabel, WorktreeStackKit_runOpenTuiCommandWithLifecycle, } from "./opentui-app-run-lifecycle.js";
import { WorktreeStackKit_formatOpenTuiRecordSummary, WorktreeStackKit_resolveOpenTuiSelectedWorktreePath, } from "./opentui-app-shell-view-model.js";
import { WorktreeStackKit_formatOpenTuiBootstrapPreviewText, } from "./opentui-action-scroll-maintenance-plans.js";
import { WorktreeStackKit_planOpenTuiSwitchPreview } from "./opentui-action-scroll-switch-plans.js";
import { WorktreeStackKit_createOpenTuiCreateFormModel, } from "./opentui-create-wizard-form-plans.js";
import { WorktreeStackKit_formatOpenTuiCreatePreviewText, } from "./opentui-create-preview.js";
import { WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation, } from "./opentui-shell-keyboard.js";
import { WorktreeStackKit_buildOpenTuiCreateArgv, WorktreeStackKit_buildOpenTuiRepairArgv, WorktreeStackKit_buildOpenTuiSyncArgv, WorktreeStackKit_formatUiTsxCommand, } from "./ui-command-catalog.js";
/** Creates the reusable OpenTUI shell controller while keeping project I/O injected by scripts. */
export function WorktreeStackKit_useOpenTuiAppController(options) {
    const [flow, setFlow] = useState("menu");
    const [phase, setPhase] = useState("form");
    const [copyFlash, setCopyFlash] = useState(null);
    const copyTimerRef = useRef(null);
    const [createModel, setCreateModel] = useState(() => WorktreeStackKit_createOpenTuiCreateFormModel(options.createFormDefaults));
    const [createArgv, setCreateArgv] = useState([]);
    const [createPreviewText, setCreatePreviewText] = useState("");
    const [createPreviewError, setCreatePreviewError] = useState("");
    const [switchModel, setSwitchModel] = useState({
        prefix: "",
        stackName: "",
        worktreesBase: "default",
    });
    const [switchArgv, setSwitchArgv] = useState([]);
    const [switchPreviewText, setSwitchPreviewText] = useState("");
    const [switchPreviewError, setSwitchPreviewError] = useState("");
    const [repairWorktrees, setRepairWorktrees] = useState("");
    const [repairIncludePkg, setRepairIncludePkg] = useState(false);
    const [repairLegacyMissingOnly, setRepairLegacyMissingOnly] = useState(false);
    const [repairDryRun, setRepairDryRun] = useState(false);
    const [repairArgv, setRepairArgv] = useState([]);
    const [syncSource, setSyncSource] = useState(options.defaultSyncSource);
    const [syncWorktrees, setSyncWorktrees] = useState("");
    const [syncArgv, setSyncArgv] = useState([]);
    const [commandPreview, setCommandPreview] = useState("");
    const [runStdout, setRunStdout] = useState("");
    const [runStderr, setRunStderr] = useState("");
    const [runStatus, setRunStatus] = useState(null);
    const [runScript, setRunScript] = useState("");
    const [formError, setFormError] = useState("");
    const cancelRunRef = useRef(null);
    const [inventory, setInventory] = useState(null);
    const [inventoryLoadError, setInventoryLoadError] = useState(null);
    const [recordPickIndex, setRecordPickIndex] = useState(0);
    const [focusedColumn, setFocusedColumn] = useState("worktrees");
    const worktreesTabRef = useRef(null);
    const actionsTabRef = useRef(null);
    const [manualWorktreePath, setManualWorktreePath] = useState("");
    const [startOpenWindsurf, setStartOpenWindsurf] = useState(false);
    const [destroyPrune, setDestroyPrune] = useState(false);
    const [updateMode, setUpdateMode] = useState("live-worktree");
    const [updateExec, setUpdateExec] = useState("plan");
    const [mergeExec, setMergeExec] = useState("plan");
    const [confirmTokenInput, setConfirmTokenInput] = useState("");
    const [pendingNpmRun, setPendingNpmRun] = useState(null);
    const [requiredConfirmToken, setRequiredConfirmToken] = useState(null);
    const [poolKind, setPoolKind] = useState("list");
    const [poolNextStackName, setPoolNextStackName] = useState("");
    const [stateCheckFetch, setStateCheckFetch] = useState(false);
    const resetRunArtifacts = useCallback(() => {
        setRunStdout("");
        setRunStderr("");
        setRunStatus(null);
        setFormError("");
    }, []);
    const goMenu = useCallback(() => {
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
    const handleCopy = useCallback((panel, text) => {
        const ok = options.copyToClipboard(text);
        if (ok) {
            setCopyFlash(panel);
            if (copyTimerRef.current)
                clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopyFlash(null), 1500);
        }
    }, [options.copyToClipboard]);
    const handleKeyboardKey = useCallback((key) => {
        WorktreeStackKit_applyOpenTuiMenuColumnKeyboardNavigation({
            actionsTabRef,
            flow,
            focusedColumn,
            goMenu,
            key,
            setFocusedColumn,
            worktreesTabRef,
        });
    }, [flow, focusedColumn, goMenu]);
    useEffect(() => {
        return () => {
            cancelRunRef.current?.();
            if (copyTimerRef.current)
                clearTimeout(copyTimerRef.current);
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
            .catch((error) => {
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
    function getSelectedWorktreePath() {
        return WorktreeStackKit_resolveOpenTuiSelectedWorktreePath({
            manualWorktreePath,
            recordPickIndex,
            records: inventory?.records,
        });
    }
    function recordSummary(record) {
        return WorktreeStackKit_formatOpenTuiRecordSummary(record);
    }
    function runLifecycleCallbacks() {
        return {
            appendRunStderr: (chunk) => {
                setRunStderr((previous) => previous + chunk);
            },
            appendRunStdout: (chunk) => {
                setRunStdout((previous) => previous + chunk);
            },
            cancelCurrentRun: () => {
                cancelRunRef.current?.();
            },
            resetRunArtifacts,
            setCancelRun: (cancel) => {
                cancelRunRef.current = cancel;
            },
            setPhase,
            setRunScript,
            setRunStatus,
            setRunStderr,
        };
    }
    async function runNpmScript(npmScript, forwarded) {
        await WorktreeStackKit_runOpenTuiCommandWithLifecycle({
            callbacks: runLifecycleCallbacks(),
            commandLabel: WorktreeStackKit_formatOpenTuiNpmRunLabel(npmScript),
            startRun: (handlers) => options.startNpmRun({
                argv: forwarded,
                handlers,
                repoRoot: options.repoRoot,
                script: npmScript,
            }),
        });
    }
    async function runSpawn(scriptUnderRepo, argv) {
        await WorktreeStackKit_runOpenTuiCommandWithLifecycle({
            callbacks: runLifecycleCallbacks(),
            commandLabel: scriptUnderRepo,
            startRun: (handlers) => options.startTsxRun({
                argv,
                handlers,
                repoRoot: options.repoRoot,
                script: scriptUnderRepo,
            }),
        });
    }
    function switchGoPreview() {
        setFormError("");
        setSwitchPreviewError("");
        const previewPlan = WorktreeStackKit_planOpenTuiSwitchPreview({
            model: switchModel,
        });
        setSwitchArgv(previewPlan.argv);
        setSwitchPreviewText(previewPlan.previewText);
        setPhase("preview");
    }
    function createGoPreview() {
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
                worktreesBase: createModel.worktreesBase.trim() ||
                    options.resolveDefaultWorktreesBase(options.repoRoot),
            });
            if (!preview.ok) {
                setCreatePreviewError(preview.errorMessage);
                setCreatePreviewText(commandPreviewText);
            }
            else {
                setCreatePreviewText(WorktreeStackKit_formatOpenTuiCreatePreviewText({
                    commandPreview: commandPreviewText,
                    portSummaryItems: options.createPreviewPortSummaryItems,
                    preview,
                }));
            }
            setPhase("preview");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setFormError(message);
        }
    }
    function repairGoPreview() {
        setFormError("");
        try {
            const argv = WorktreeStackKit_buildOpenTuiRepairArgv({
                dryRun: repairDryRun,
                includePackageEnv: repairIncludePkg,
                legacyMissingOnlyAlias: repairLegacyMissingOnly,
                worktreeLines: repairWorktrees,
            });
            setRepairArgv(argv);
            setCommandPreview(WorktreeStackKit_formatUiTsxCommand({
                args: argv,
                repoRoot: options.repoRoot,
                scriptPath: options.actionScrollConfig.maintenanceScriptPaths.repair,
            }));
            setPhase("preview");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setFormError(message);
        }
    }
    function syncGoPreview() {
        setFormError("");
        try {
            const argv = WorktreeStackKit_buildOpenTuiSyncArgv({
                sourceWorkspace: syncSource,
                worktreeLines: syncWorktrees,
            });
            setSyncArgv(argv);
            setCommandPreview(WorktreeStackKit_formatUiTsxCommand({
                args: argv,
                repoRoot: options.repoRoot,
                scriptPath: options.actionScrollConfig.maintenanceScriptPaths.syncLocalFiles,
            }));
            setPhase("preview");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setFormError(message);
        }
    }
    function bootstrapGoPreview() {
        setFormError("");
        setCommandPreview(WorktreeStackKit_formatOpenTuiBootstrapPreviewText({
            npmInstallCommand: WorktreeStackKit_formatOpenTuiNpmRunLabel(options.bootstrapNpmScript),
            seedFacts: options.bootstrapSeedFacts,
            tsxInstallCommand: WorktreeStackKit_formatUiTsxCommand({
                args: [],
                repoRoot: options.repoRoot,
                scriptPath: options.actionScrollConfig.maintenanceScriptPaths.bootstrapInstall,
            }),
        }));
        setPhase("preview");
    }
    const actionScrollProps = {
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
