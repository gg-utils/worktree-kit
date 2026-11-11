/**
 * @fileoverview Package-owned Ink admin/global task action-plan builders.
 *
 * Repair, local-state sync, platform bootstrap, realm-pool, checkout-state, router status, and
 * healthcheck actions are reusable command-planning behavior. This module owns validation and
 * request assembly while project config supplies command names, root-workspace copy, router copy,
 * and other repository-specific labels.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI inventory, action IDs, option state, and action-request plan types this module fills when assembling npm-run task plans.
 * @see packages/worktree-kit/src/ink-record-workflow-plans.ts - Record-workflow helpers reused here to emit structured Ink issues during repair and sync-local-files validation against the canonical root workspace.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-builders-admin-task-plans.ts - Root-owned adapter that injects `worktrees.config.ts` command names and copy labels into `WorktreeStackKit_createInkAdminTaskPlanBuilders` for the Ink CLI shell.
 * @see packages/worktree-kit/src/ink-admin-task-plans.unit.test.ts - Node test runner regression coverage for repair, sync-local-files, realm pool, checkout-state, and global admin plan assembly.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { WorktreeStackKit_createInkRecordWorkflowIssue, WorktreeStackKit_isCanonicalRootWorkspaceRecord, } from "./ink-record-workflow-plans.js";
/** Builds the repair request plan with scope and dry-run options. */
export function WorktreeStackKit_buildInkRepairPlan(options) {
    const { actionOptions, config, record } = options;
    const issues = [];
    const summaryLines = [
        `Dry run: ${actionOptions.repairDryRun ? "Yes" : "No"}`,
        `Include package .env: ${actionOptions.repairIncludePackageEnv ? "Yes" : "No"}`,
        `Legacy .env mode: ${actionOptions.repairLegacyPackageEnvAlias ? "Yes" : "No"}`,
        `Scope: ${actionOptions.repairScope === "selected-record" ? "Selected only" : "All worktrees"}`,
    ];
    if (actionOptions.repairScope === "selected-record" && !record) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("missing-record", "error", "Select a worktree first"));
    }
    if (actionOptions.repairScope === "selected-record" &&
        record &&
        WorktreeStackKit_isCanonicalRootWorkspaceRecord(record)) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("canonical-root-workspace", "error", `Can only repair worktrees, not the ${config.copy.rootWorkspaceLabel}. Use '${config.copy.rootWorkspaceStartCommandText}' instead`));
    }
    const args = ["run", config.scripts.repair, "--"];
    if (actionOptions.repairDryRun) {
        args.push("--dry-run");
    }
    if (actionOptions.repairIncludePackageEnv) {
        args.push("--include-package-env");
    }
    if (actionOptions.repairLegacyPackageEnvAlias &&
        actionOptions.repairIncludePackageEnv) {
        args.push("--package-env-mode", "missing-only");
    }
    if (actionOptions.repairScope === "selected-record" && record) {
        args.push("--worktree", record.worktreePath);
    }
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: "repair",
        actionLabel: "Repair prepared worktrees",
        issues,
        refreshOnSuccess: true,
        request: WorktreeStackKit_hasAdminBlockingIssue(issues)
            ? null
            : {
                args,
                command: config.commandName,
                label: `Run ${config.scripts.repair}`,
                sessionKind: "task",
            },
        summaryLines,
        targetPath: record?.worktreePath ?? null,
    });
}
/** Binds project command/copy config once and returns reusable admin/global plan builders. */
export function WorktreeStackKit_createInkAdminTaskPlanBuilders(config) {
    return {
        buildCheckoutStateCheckPlan: (inventory, actionOptions) => WorktreeStackKit_buildInkCheckoutStateCheckPlan({
            actionOptions,
            config,
            inventory,
        }),
        buildPlatformBootstrapPlan: (inventory) => WorktreeStackKit_buildInkPlatformBootstrapPlan({ config, inventory }),
        buildRealmPoolNextPlan: (inventory, actionOptions) => WorktreeStackKit_buildInkRealmPoolNextPlan({
            actionOptions,
            config,
            inventory,
        }),
        buildRealmPoolUtilityPlan: (actionId) => WorktreeStackKit_buildInkRealmPoolUtilityPlan({ actionId, config }),
        buildRealmPruneStalePlan: (inventory) => WorktreeStackKit_buildInkRealmPruneStalePlan({ config, inventory }),
        buildRepairPlan: (inventory, record, actionOptions) => {
            void inventory;
            return WorktreeStackKit_buildInkRepairPlan({
                actionOptions,
                config,
                record,
            });
        },
        buildSyncLocalFilesPlan: (inventory, record, actionOptions) => WorktreeStackKit_buildInkSyncLocalFilesPlan({
            actionOptions,
            config,
            inventory,
            record,
        }),
        createGlobalPlan: (actionId, inventory) => WorktreeStackKit_createInkGlobalPlan({ actionId, config, inventory }),
    };
}
/** Builds sync-local-files plan copying shared defaults into worktrees. */
export function WorktreeStackKit_buildInkSyncLocalFilesPlan(options) {
    const { actionOptions, config, inventory, record } = options;
    const issues = [];
    const summaryLines = [
        `Source: ${inventory.projectRoot}`,
        `Scope: ${actionOptions.syncScope === "selected-record" ? "Selected + root defaults" : "All worktrees"}`,
    ];
    if (actionOptions.syncScope === "selected-record" && !record) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("missing-record", "error", "Select a worktree first"));
    }
    if (actionOptions.syncScope === "selected-record" &&
        record &&
        WorktreeStackKit_isCanonicalRootWorkspaceRecord(record)) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("canonical-root-workspace", "error", `Select a worktree, not the ${config.copy.rootWorkspaceLabel}`));
    }
    const args = [
        "run",
        config.scripts.syncLocalFiles,
        "--",
        "--source-workspace",
        inventory.projectRoot,
    ];
    if (actionOptions.syncScope === "selected-record" && record) {
        args.push("--worktree", record.worktreePath);
    }
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: "sync-local-files",
        actionLabel: "Sync local shared files",
        issues,
        refreshOnSuccess: true,
        request: WorktreeStackKit_hasAdminBlockingIssue(issues)
            ? null
            : {
                args,
                command: config.commandName,
                label: `Run ${config.scripts.syncLocalFiles}`,
                sessionKind: "task",
            },
        summaryLines,
        targetPath: record?.worktreePath ?? null,
    });
}
/** Builds platform install/bootstrap plan for submodules and dependencies. */
export function WorktreeStackKit_buildInkPlatformBootstrapPlan(options) {
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: "platform-bootstrap",
        actionLabel: "Bootstrap Platform",
        issues: [],
        refreshOnSuccess: false,
        request: {
            args: ["run", options.config.scripts.platformBootstrap],
            command: options.config.commandName,
            label: `Run ${options.config.scripts.platformBootstrap}`,
            sessionKind: "task",
        },
        summaryLines: [
            "Install submodules and dependencies",
            `Project: ${options.inventory.projectRoot}`,
            "Takes several minutes",
        ],
        targetPath: null,
    });
}
/** Builds preview plan for the next pooled realm slot on a named stack. */
export function WorktreeStackKit_buildInkRealmPoolNextPlan(options) {
    const stackName = options.actionOptions.poolNextStackName.trim();
    const issues = [];
    if (stackName.length === 0) {
        issues.push(WorktreeStackKit_createInkRecordWorkflowIssue("missing-stack-name", "error", "Enter a stack name (press E to edit)"));
    }
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: "realm-pool-next",
        actionLabel: "Preview Next Realm",
        issues,
        refreshOnSuccess: false,
        request: WorktreeStackKit_hasAdminBlockingIssue(issues)
            ? null
            : {
                args: [
                    "run",
                    options.config.scripts.realmPoolNext,
                    "--",
                    "--stack-name",
                    stackName,
                ],
                command: options.config.commandName,
                label: "Preview next pooled realm for stack",
                sessionKind: "task",
            },
        summaryLines: [
            `Stack: ${stackName.length > 0 ? stackName : "(empty)"}`,
            `Project: ${options.inventory.projectRoot}`,
        ],
        targetPath: null,
    });
}
/** Builds destructive prune plan for stale realm registry entries. */
export function WorktreeStackKit_buildInkRealmPruneStalePlan(options) {
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: "realm-prune-stale",
        actionLabel: "Clean Up Realms",
        destructiveConfirmationText: "Removes stale entries from the realm registry",
        issues: [],
        refreshOnSuccess: true,
        request: {
            args: ["run", options.config.scripts.realmPruneStale],
            command: options.config.commandName,
            label: "Clean up stale realms",
            sessionKind: "task",
        },
        requiredConfirmationToken: "PRUNE",
        summaryLines: [
            "Remove stale realm registry entries",
            `${options.inventory.summary.staleRealms} stale realm(s) found`,
        ],
        targetPath: null,
    });
}
/** Builds git checkout-state inspection plan with optional fetch-first refresh. */
export function WorktreeStackKit_buildInkCheckoutStateCheckPlan(options) {
    const fetchNote = options.actionOptions.stateCheckFetch
        ? "Refresh origin refs first"
        : "Use cached refs";
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: "checkout-state-check",
        actionLabel: "Check Git Status",
        issues: [],
        refreshOnSuccess: false,
        request: {
            args: options.actionOptions.stateCheckFetch
                ? ["run", options.config.scripts.checkoutStateCheck, "--", "--fetch"]
                : ["run", options.config.scripts.checkoutStateCheck],
            command: options.config.commandName,
            label: `Run ${options.config.scripts.checkoutStateCheck}`,
            sessionKind: "task",
        },
        summaryLines: [fetchNote, `Project: ${options.inventory.projectRoot}`],
        targetPath: null,
    });
}
/** Builds realm pool utility plans without additional validation. */
export function WorktreeStackKit_buildInkRealmPoolUtilityPlan(options) {
    if (options.actionId === "realm-pool-list") {
        return WorktreeStackKit_createInkAdminTaskPlan({
            actionId: options.actionId,
            actionLabel: "Realm pool: list status",
            issues: [],
            refreshOnSuccess: false,
            request: {
                args: ["run", options.config.scripts.realmPoolList],
                command: options.config.commandName,
                label: "List realm pool status",
                sessionKind: "task",
            },
            summaryLines: ["Lists configured pool realms and assignment state."],
            targetPath: null,
        });
    }
    if (options.actionId === "realm-pool-guide") {
        return WorktreeStackKit_createInkAdminTaskPlan({
            actionId: options.actionId,
            actionLabel: "Realm pool: setup guide",
            issues: [],
            refreshOnSuccess: false,
            request: {
                args: ["run", options.config.scripts.realmPoolGuide],
                command: options.config.commandName,
                label: "Show realm pool guide",
                sessionKind: "task",
            },
            summaryLines: ["Prints the pooled-realm setup guide."],
            targetPath: null,
        });
    }
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId: options.actionId,
        actionLabel: "Realm pool: prepare",
        issues: [],
        refreshOnSuccess: false,
        request: {
            args: ["run", options.config.scripts.realmPoolPrepare],
            command: options.config.commandName,
            label: "Prepare realm pool TLS coverage",
            sessionKind: "task",
        },
        summaryLines: [
            "Runs pool prepare (guide + TLS coverage render). Can take a moment.",
        ],
        targetPath: null,
    });
}
/** Central factory for realm list, router status, and healthcheck action plans. */
export function WorktreeStackKit_createInkGlobalPlan(options) {
    const { actionId, config, inventory } = options;
    if (actionId === "list-active-realms") {
        return WorktreeStackKit_createInkAdminTaskPlan({
            actionId,
            actionLabel: "List Active Realms",
            issues: inventory.summary.activeRealms > 0
                ? []
                : [
                    WorktreeStackKit_createInkRecordWorkflowIssue("no-active-realms", "info", "No active realms registered"),
                ],
            refreshOnSuccess: false,
            request: {
                args: ["run", config.scripts.realmList],
                command: config.commandName,
                label: "List active realms",
                sessionKind: "task",
            },
            summaryLines: [
                `${inventory.summary.totalRecords} worktree(s)`,
                `${inventory.summary.activeRealms} active, ${inventory.summary.staleRealms} stale`,
            ],
            targetPath: null,
        });
    }
    if (actionId === "router-status") {
        return WorktreeStackKit_createInkAdminTaskPlan({
            actionId,
            actionLabel: "Router Status",
            issues: [],
            refreshOnSuccess: false,
            request: {
                args: ["run", config.scripts.routerStatus],
                command: config.commandName,
                label: "Check router status",
                sessionKind: "task",
            },
            summaryLines: [
                config.copy.routerStatusSummaryLine,
                `${inventory.summary.activeRealms} active realm(s)`,
            ],
            targetPath: null,
        });
    }
    return WorktreeStackKit_createInkAdminTaskPlan({
        actionId,
        actionLabel: "Health Check",
        issues: inventory.summary.unhealthyRealms > 0
            ? [
                WorktreeStackKit_createInkRecordWorkflowIssue("unhealthy-realms-present", "warning", "Some realms are unhealthy—health check will surface details"),
            ]
            : [],
        refreshOnSuccess: true,
        request: {
            args: ["run", config.scripts.healthcheck],
            command: config.commandName,
            label: "Run health check",
            sessionKind: "task",
        },
        summaryLines: [
            `Last check: ${inventory.summary.healthRunAt ?? "never"}`,
            `${inventory.summary.healthyRealms} healthy, ${inventory.summary.unhealthyRealms} unhealthy`,
        ],
        targetPath: null,
    });
}
function WorktreeStackKit_createInkAdminTaskPlan(options) {
    return {
        actionId: options.actionId,
        actionLabel: options.actionLabel,
        createContext: null,
        destructiveConfirmationText: options.destructiveConfirmationText ?? null,
        executionMode: null,
        issues: options.issues,
        refreshOnSuccess: options.refreshOnSuccess,
        request: options.request,
        requiredConfirmationToken: options.requiredConfirmationToken ?? null,
        retainedArtifacts: [],
        summaryLines: options.summaryLines,
        switchContext: null,
        targetPath: options.targetPath,
    };
}
function WorktreeStackKit_hasAdminBlockingIssue(issues) {
    return issues.some((issue) => issue.severity === "error");
}
