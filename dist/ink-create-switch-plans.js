/**
 * @fileoverview Package-owned Ink create/switch action-plan builders.
 *
 * This module owns reusable create-worktree and switch action validation, summary construction,
 * command argv assembly, and interactive switch preview planning. Project adapters supply resolved
 * create drafts, command names, branch-prefix defaults, editor flags, and slot-port preview labels
 * through explicit config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI contracts for drafts, inventory, issues, and action request plans that this module assembles into argv-backed create and switch previews.
 * @see packages/worktree-kit/src/ink-record-workflow-plans.ts - Workflow issue factory used when validation surfaces blocking errors and warnings attached to the returned action plans.
 * @see packages/worktree-kit/src/ink-create-resolution.ts - Resolved create-draft shape adapters combine with config here to derive create argv, summaries, and slot-derived port preview lines.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { WorktreeStackKit_createInkRecordWorkflowIssue } from "./ink-record-workflow-plans.js";
/** Builds forwarded argv for create from a validated context plus resolved draft flags. */
export function WorktreeStackKit_buildInkCreateCommandArgs(options) {
    const { config, createContext, resolvedDraft } = options;
    return [
        "run",
        config.scripts.create,
        "--",
        config.flags.createName,
        createContext.stackName,
        config.flags.createSlot,
        String(createContext.slot),
        ...(createContext.branchPrefix !== config.defaultBranchPrefix
            ? [config.flags.createPrefix, createContext.branchPrefix]
            : []),
        config.flags.createBaseBranch,
        createContext.baseBranch,
        config.flags.createRootBranch,
        createContext.rootBranch,
        config.flags.createSubmoduleBranch,
        createContext.submoduleBranch,
        config.flags.createWorktreesBase,
        createContext.worktreesBase,
        ...(createContext.realmSlug.length > 0
            ? [config.flags.createRealm, createContext.realmSlug]
            : []),
        ...(createContext.worktreePathOverride.length > 0
            ? [config.flags.createWorktreePath, createContext.worktreePathOverride]
            : []),
        ...(createContext.metadataSource.length > 0
            ? [config.flags.createMetadataSource, createContext.metadataSource]
            : []),
        ...(resolvedDraft.copyEnvFromMain ? [config.flags.copyEnvFromMain] : []),
        ...(resolvedDraft.runInstall
            ? [
                config.flags.createInstall,
                ...(resolvedDraft.installSkipExisting
                    ? [config.flags.createInstallSkipExisting]
                    : []),
                ...(resolvedDraft.installPreferOnline
                    ? [config.flags.createInstallPreferOnline]
                    : []),
            ]
            : [config.flags.createNoInstall]),
        ...(resolvedDraft.openWindsurf && config.flags.createOpenEditor
            ? [config.flags.createOpenEditor]
            : []),
    ];
}
/** Builds create-worktree plan from resolved draft plus derived slot port preview. */
export function WorktreeStackKit_buildInkCreatePlan(options) {
    const { config, createContext, resolvedDraft } = options;
    const issues = [];
    const summaryLines = [
        `Path: ${resolvedDraft.predictedWorktreePath}`,
        `Slot: ${resolvedDraft.slotInput} | Base: ${resolvedDraft.baseBranch}`,
        `Root branch: ${resolvedDraft.rootBranch || "(auto)"}`,
        `Submodule: ${resolvedDraft.submoduleBranch || "(auto)"}`,
        `Install: ${resolvedDraft.runInstall ? "Yes" : "No"} | ${config.copy.envCopySummaryLabel}: ${resolvedDraft.copyEnvFromMain ? "Yes" : "No"}`,
        `${config.copy.editorOpenSummaryLabel}: ${resolvedDraft.openWindsurf ? "Yes" : "No"} | ${config.copy.startEnvironmentSummaryLabel}: ${resolvedDraft.followUpStart ? "Yes" : "No"}`,
    ];
    if (resolvedDraft.realmSlug.length > 0) {
        summaryLines.push(`Realm: ${resolvedDraft.realmSlug}`);
    }
    if (resolvedDraft.worktreePathOverride.length > 0) {
        summaryLines.push(`Custom path: ${resolvedDraft.worktreePathOverride}`);
    }
    if (resolvedDraft.metadataSource.length > 0) {
        summaryLines.push(`Source: ${resolvedDraft.metadataSource}`);
    }
    if (resolvedDraft.slot !== null) {
        const portPreview = config.deriveSlotPortPreview(resolvedDraft.slot);
        if (portPreview.length > 0) {
            summaryLines.push(`Ports: ${portPreview
                .map((port) => `${port.label} ${String(port.value)}`)
                .join(", ")}`);
        }
    }
    if (resolvedDraft.stackName.length === 0) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("missing-stack-name", "error", "Enter a stack name"));
    }
    if (resolvedDraft.slot === null) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("invalid-slot", "error", "Slot must be a positive integer so the port bundle can be derived."));
    }
    if (resolvedDraft.stackName.length > 0 &&
        !/^[a-z0-9-]+$/u.test(resolvedDraft.stackName)) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("stack-name-normalization-warning", "warning", "Stack name should stay lowercase-hyphenated so branch, folder, and realm derivations remain predictable."));
    }
    const hasBlockingIssue = WorktreeStackKit_hasCreateSwitchBlockingIssue(issues);
    return {
        actionId: "create",
        actionLabel: "Create worktree",
        createContext,
        destructiveConfirmationText: null,
        executionMode: null,
        issues,
        refreshOnSuccess: true,
        request: hasBlockingIssue || createContext === null
            ? null
            : {
                args: WorktreeStackKit_buildInkCreateCommandArgs({
                    config,
                    createContext,
                    resolvedDraft,
                }),
                command: config.commandName,
                label: "Create a new prepared worktree",
                sessionKind: "task",
            },
        requiredConfirmationToken: null,
        retainedArtifacts: [],
        summaryLines,
        switchContext: null,
        targetPath: null,
    };
}
/** Binds project config/draft resolution once and returns create/switch plan builders. */
export function WorktreeStackKit_createInkCreateSwitchPlanBuilders(builderConfig) {
    const { buildCreateContext, config, resolveCreateDraft } = builderConfig;
    return {
        buildCreatePlan: (inventory, createDraft) => {
            const resolvedDraft = resolveCreateDraft({
                draft: createDraft,
                inventory,
            });
            return WorktreeStackKit_buildInkCreatePlan({
                config,
                createContext: buildCreateContext(resolvedDraft),
                resolvedDraft,
            });
        },
        buildSwitchInteractivePlan: (inventory, selectedRecord, switchDraft) => WorktreeStackKit_buildInkSwitchInteractivePlan({
            config,
            inventory,
            selectedRecord,
            switchDraft,
        }),
        buildSwitchPlan: (createDraft) => WorktreeStackKit_buildInkSwitchPlan({ config, createDraft }),
    };
}
/** Builds branch-prefix plus stack-name switch plan from create-draft form fields. */
export function WorktreeStackKit_buildInkSwitchPlan(options) {
    const { config, createDraft } = options;
    const branchPrefix = createDraft.branchPrefix.trim() || config.defaultBranchPrefix;
    const stackName = createDraft.stackName.trim();
    const slotInput = createDraft.slotInput.trim();
    const parsedSlot = slotInput.length > 0 ? Number.parseInt(slotInput, 10) : Number.NaN;
    const issues = [];
    const branchTarget = stackName.length > 0
        ? `${branchPrefix}/${stackName}`
        : "(needs stack name)";
    const summaryLines = [
        `Prefix: ${branchPrefix} | Stack: ${stackName || "(empty)"}`,
        `Branch target: ${branchTarget}`,
        slotInput.length > 0
            ? `Slot for creation: ${slotInput}`
            : "Slot: auto (only needed if creating)",
    ];
    if (stackName.length === 0) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("missing-stack-name", "error", "Stack name is required for switch."));
    }
    const hasBlockingIssue = WorktreeStackKit_hasCreateSwitchBlockingIssue(issues);
    return {
        actionId: "switch",
        actionLabel: "Switch (prefix × stack)",
        createContext: null,
        destructiveConfirmationText: null,
        executionMode: null,
        issues,
        refreshOnSuccess: true,
        request: hasBlockingIssue
            ? null
            : {
                args: [
                    "run",
                    config.scripts.switch,
                    "--",
                    config.flags.switchPrefix,
                    branchPrefix,
                    config.flags.switchName,
                    stackName,
                    ...(Number.isInteger(parsedSlot) && parsedSlot > 0
                        ? [config.flags.switchSlot, String(parsedSlot)]
                        : []),
                ],
                command: config.commandName,
                label: `Switch to ${branchPrefix}/${stackName}`,
                sessionKind: "task",
            },
        requiredConfirmationToken: null,
        retainedArtifacts: [],
        summaryLines,
        switchContext: null,
        targetPath: null,
    };
}
/** Builds interactive switch preview using selected record plus switch draft overrides. */
export function WorktreeStackKit_buildInkSwitchInteractivePlan(options) {
    const { config, selectedRecord, switchDraft } = options;
    void options.inventory;
    const branchPrefix = switchDraft.branchPrefix.trim() || config.defaultBranchPrefix;
    const stackName = switchDraft.stackName.trim();
    const environmentFilter = switchDraft.environmentFilter.trim();
    const issues = [];
    if (!selectedRecord) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("missing-record", "error", "Select a worktree first"));
    }
    const resolvedStackName = stackName.length > 0
        ? stackName
        : (selectedRecord?.metadata?.stackName ?? "");
    const resolvedBranchPrefix = branchPrefix.length > 0 ? branchPrefix : config.defaultBranchPrefix;
    const summaryLines = [];
    if (selectedRecord) {
        summaryLines.push(`Selected: ${selectedRecord.worktreePath}`);
        summaryLines.push(`Stack: ${selectedRecord.metadata?.stackName ?? "(unknown)"} | Realm: ${selectedRecord.metadata?.realmSlug ?? "(none)"}`);
    }
    else {
        summaryLines.push(`Prefix: ${resolvedBranchPrefix} | Stack: ${resolvedStackName || "(select a worktree)"}`);
    }
    if (environmentFilter.length > 0) {
        summaryLines.push(`Filter: realm=${environmentFilter}`);
    }
    const hasBlockingIssue = WorktreeStackKit_hasCreateSwitchBlockingIssue(issues);
    const switchContext = selectedRecord
        ? {
            branchPrefix: resolvedBranchPrefix,
            editorOverride: null,
            environmentFilter,
            stackName: resolvedStackName || (selectedRecord.metadata?.stackName ?? ""),
            worktreePath: selectedRecord.worktreePath,
        }
        : null;
    return {
        actionId: "switch",
        actionLabel: "Switch to worktree",
        createContext: null,
        destructiveConfirmationText: null,
        executionMode: null,
        issues,
        refreshOnSuccess: true,
        request: hasBlockingIssue || !selectedRecord
            ? null
            : {
                args: [
                    "run",
                    config.scripts.switch,
                    "--",
                    config.flags.switchPrefix,
                    resolvedBranchPrefix,
                    config.flags.switchName,
                    resolvedStackName || (selectedRecord.metadata?.stackName ?? ""),
                ],
                command: config.commandName,
                label: `Switch to ${selectedRecord.worktreePath}`,
                sessionKind: "task",
            },
        requiredConfirmationToken: null,
        retainedArtifacts: [],
        summaryLines,
        switchContext,
        targetPath: selectedRecord?.worktreePath ?? null,
    };
}
function WorktreeStackKit_hasCreateSwitchBlockingIssue(issues) {
    return issues.some((issue) => issue.severity === "error");
}
