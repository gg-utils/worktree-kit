/**
 * @fileoverview Package-owned Ink record workflow action-plan builders.
 *
 * Start, destroy, update-from-main, and merge previews are reusable command-planning behavior. This
 * module validates the selected worktree record, constructs task/runtime requests, records retained
 * artifact hints, and leaves project-specific npm script names, target branch labels, editor labels,
 * and log/temp artifact paths behind an explicit config object supplied by script adapters.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Ink inventory, record, action-option, and action-request-plan contracts this module fills when building validated npm task and runtime requests.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-builders-record-workflow-plans.ts - consumer script adapter that supplies command names, copy labels, branch targets, and artifact path templates to the bound builders re-exported from here.
 * @see packages/worktree-kit/src/ink-record-workflow-plans.unit.test.ts - node:test regression file exercising merge, update-from-main, start, and destroy plan shapes owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import path from "node:path";

import type {
  WorktreeStackKit_InkUiActionOptionState,
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiIssue,
  WorktreeStackKit_InkUiRecord,
  WorktreeStackKit_InkUiRetainedArtifact,
} from "./ink-ui-contracts.js";

/** Template for retained artifacts associated with a start-runtime plan. */
export type WorktreeStackKit_InkRecordWorkflowRetainedArtifactTemplate = {
  readonly id: string;
  readonly label: string;
  readonly relativePathTemplate: string;
};

/** Explicit project-owned command and copy config for reusable record workflow plans. */
export type WorktreeStackKit_InkRecordWorkflowPlanConfig = {
  readonly commandName: string;
  readonly copy: {
    readonly canonicalRootContextSuggestionText: string;
    readonly canonicalRootStartCommandText: string;
    readonly editorOpenSummaryLabel: string;
    readonly rootWorkspaceLabel: string;
    readonly targetBranchDisplayName: string;
  };
  readonly scripts: {
    readonly destroy: string;
    readonly merge: string;
    readonly openEditorOnStartFlag: string | null;
    readonly start: string;
    readonly updateFromMain: string;
  };
  readonly startRetainedArtifacts: readonly WorktreeStackKit_InkRecordWorkflowRetainedArtifactTemplate[];
  readonly targetBranchName: string;
  readonly temporaryArtifactRootRelativePaths: {
    readonly merge: string;
    readonly updateFromMain: string;
  };
};

/** Bound builder set used by root adapters that only inject project command/copy config. */
export type WorktreeStackKit_InkRecordWorkflowPlanBuilders = {
  readonly buildDestroyPlan: (
    record: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildMergePlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    record: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildStartPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    record: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
  readonly buildUpdateFromMainPlan: (
    inventory: WorktreeStackKit_InkUiInventory,
    record: WorktreeStackKit_InkUiRecord | null,
    actionOptions: WorktreeStackKit_InkUiActionOptionState,
  ) => WorktreeStackKit_InkUiActionRequestPlan;
};

/** Builds a typed UI issue struct for preview panels and command gating. */
export function WorktreeStackKit_createInkRecordWorkflowIssue(
  code: string,
  severity: WorktreeStackKit_InkUiIssue["severity"],
  message: string,
): WorktreeStackKit_InkUiIssue {
  return {
    code,
    severity,
    message,
  };
}

/** Human-readable git branch label from a worktree record. */
export function WorktreeStackKit_getInkRecordWorkflowBranchLabel(
  record: WorktreeStackKit_InkUiRecord | null,
): string {
  if (!record?.branchRef) {
    return "detached";
  }

  return record.branchRef.replace("refs/heads/", "");
}

/** Resolves the stack display label for summaries and issue copy. */
export function WorktreeStackKit_getInkRecordWorkflowStackLabel(
  record: WorktreeStackKit_InkUiRecord | null,
): string {
  return (
    record?.metadata?.stackName ?? record?.handbook?.stackName ?? "(unknown)"
  );
}

/** Resolves realm slug label for summaries and issue copy. */
export function WorktreeStackKit_getInkRecordWorkflowRealmLabel(
  record: WorktreeStackKit_InkUiRecord | null,
): string {
  return record?.metadata?.realmSlug ?? record?.handbook?.realmSlug ?? "(none)";
}

/** True when the inventory row is the canonical root checkout. */
export function WorktreeStackKit_isCanonicalRootWorkspaceRecord(
  record: WorktreeStackKit_InkUiRecord,
): boolean {
  return record.checkoutKind === "canonical-root-workspace";
}

/** Lists retained artifacts related to start-environment flows. */
export function WorktreeStackKit_buildInkStartRetainedArtifacts(options: {
  readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
  readonly inventory: WorktreeStackKit_InkUiInventory;
  readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiRetainedArtifact[] {
  const realmSlug =
    options.record?.metadata?.realmSlug ?? options.record?.handbook?.realmSlug;
  if (!realmSlug) {
    return [];
  }

  return options.config.startRetainedArtifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.label,
    path: path.join(
      options.inventory.projectRoot,
      artifact.relativePathTemplate.replaceAll("{realmSlug}", realmSlug),
    ),
  }));
}

/** Root directory for transient merge or update-from-main artifacts. */
export function WorktreeStackKit_buildInkRecordWorkflowTempArtifactRoot(options: {
  readonly category: "merge" | "update-from-main";
  readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
  readonly inventory: WorktreeStackKit_InkUiInventory;
}): string {
  return path.join(
    options.inventory.projectRoot,
    options.category === "merge"
      ? options.config.temporaryArtifactRootRelativePaths.merge
      : options.config.temporaryArtifactRootRelativePaths.updateFromMain,
  );
}

/** Builds start-environment request for a selected prepared worktree. */
export function WorktreeStackKit_buildInkStartPlan(options: {
  readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
  readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
  readonly inventory: WorktreeStackKit_InkUiInventory;
  readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan {
  const { actionOptions, config, inventory, record } = options;
  if (!record) {
    return WorktreeStackKit_missingRecordPlan("start", "Start Environment");
  }

  const issues: WorktreeStackKit_InkUiIssue[] = [];
  const summaryLines = [
    `Worktree: ${record.worktreePath}`,
    WorktreeStackKit_buildInkRecordWorkflowIdentitySummary(record),
    `${config.copy.editorOpenSummaryLabel}: ${actionOptions.openWindsurfOnStart ? "Yes" : "No"}`,
  ];

  if (record.temporaryMerge) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "temporary-merge-worktree",
        "error",
        "Merge worktrees can't be started. Select a regular worktree",
      ),
    );
  } else if (record.detached) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "detached-worktree",
        "error",
        "Standalone worktrees can't be started. Select a regular worktree",
      ),
    );
  }

  if (WorktreeStackKit_isCanonicalRootWorkspaceRecord(record)) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "canonical-root-workspace",
        "error",
        `Use '${config.copy.canonicalRootStartCommandText}' for the ${config.copy.rootWorkspaceLabel}`,
      ),
    );
  } else if (!record.metadata) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "missing-metadata",
        "error",
        "Missing metadata—run repair first",
      ),
    );
  }

  if (
    WorktreeStackKit_isCanonicalRootWorkspaceRecord(record) &&
    (!record.handbookMarkdownExists || !record.onboardingMarkdownExists)
  ) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "root-context-missing",
        "warning",
        config.copy.canonicalRootContextSuggestionText,
      ),
    );
  } else if (!record.handbookMarkdownExists) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "missing-handbook-markdown",
        "warning",
        "Handbook missing—start will work but show a warning",
      ),
    );
  }

  if (!record.realmRecord && record.metadata?.realmSlug) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "realm-not-registered",
        "info",
        "Realm will be registered on start",
      ),
    );
  }

  const hasBlockingIssue = WorktreeStackKit_hasBlockingIssue(issues);

  return {
    actionId: "start",
    actionLabel: "Start Environment",
    targetPath: record.worktreePath,
    executionMode: null,
    refreshOnSuccess: false,
    createContext: null,
    summaryLines,
    issues,
    request: hasBlockingIssue
      ? null
      : {
          label: "Start environment",
          sessionKind: "runtime",
          command: config.commandName,
          args: [
            "run",
            config.scripts.start,
            "--",
            "--worktree",
            record.worktreePath,
            ...(actionOptions.openWindsurfOnStart &&
            config.scripts.openEditorOnStartFlag
              ? [config.scripts.openEditorOnStartFlag]
              : []),
          ],
        },
    destructiveConfirmationText: null,
    requiredConfirmationToken: null,
    retainedArtifacts: WorktreeStackKit_buildInkStartRetainedArtifacts({
      config,
      inventory,
      record,
    }),
    switchContext: null,
  };
}

/** Binds project command/copy config once and returns record workflow plan builders. */
export function WorktreeStackKit_createInkRecordWorkflowPlanBuilders(
  config: WorktreeStackKit_InkRecordWorkflowPlanConfig,
): WorktreeStackKit_InkRecordWorkflowPlanBuilders {
  return {
    buildDestroyPlan: (record, actionOptions) =>
      WorktreeStackKit_buildInkDestroyPlan({
        actionOptions,
        config,
        record,
      }),
    buildMergePlan: (inventory, record, actionOptions) =>
      WorktreeStackKit_buildInkMergePlan({
        actionOptions,
        config,
        inventory,
        record,
      }),
    buildStartPlan: (inventory, record, actionOptions) =>
      WorktreeStackKit_buildInkStartPlan({
        actionOptions,
        config,
        inventory,
        record,
      }),
    buildUpdateFromMainPlan: (inventory, record, actionOptions) =>
      WorktreeStackKit_buildInkUpdateFromMainPlan({
        actionOptions,
        config,
        inventory,
        record,
      }),
  };
}

/** Builds destructive worktree delete plan with optional git prune. */
export function WorktreeStackKit_buildInkDestroyPlan(options: {
  readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
  readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
  readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan {
  const { actionOptions, config, record } = options;
  if (!record) {
    return WorktreeStackKit_missingRecordPlan("destroy", "Delete Worktree");
  }

  const issues: WorktreeStackKit_InkUiIssue[] = [];
  const summaryLines = [
    `Worktree: ${record.worktreePath}`,
    WorktreeStackKit_buildInkRecordWorkflowIdentitySummary(record),
    `Run git prune: ${actionOptions.pruneAfterDestroy ? "Yes" : "No"}`,
  ];

  if (record.currentCheckout) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "destroy-current-checkout",
        "error",
        "Cannot delete the current worktree",
      ),
    );
  }

  if (WorktreeStackKit_isCanonicalRootWorkspaceRecord(record)) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "canonical-root-workspace",
        "error",
        `Cannot delete the ${config.copy.rootWorkspaceLabel}`,
      ),
    );
  } else if (!record.metadata) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "missing-metadata",
        "warning",
        "No metadata—cleanup may be incomplete",
      ),
    );
  }

  if (record.temporaryMerge) {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "temporary-merge-worktree",
        "warning",
        "Merge worktree will be deleted directly",
      ),
    );
  }

  const hasBlockingIssue = WorktreeStackKit_hasBlockingIssue(issues);

  return {
    actionId: "destroy",
    actionLabel: "Delete Worktree",
    targetPath: record.worktreePath,
    executionMode: null,
    refreshOnSuccess: true,
    createContext: null,
    summaryLines,
    issues,
    request: hasBlockingIssue
      ? null
      : {
          label: "Delete worktree",
          sessionKind: "task",
          command: config.commandName,
          args: [
            "run",
            config.scripts.destroy,
            "--",
            "--worktree",
            record.worktreePath,
            ...(actionOptions.pruneAfterDestroy ? ["--prune"] : []),
          ],
        },
    destructiveConfirmationText:
      "Removes the worktree and unregisters its realm",
    requiredConfirmationToken: "DESTROY",
    retainedArtifacts: [],
    switchContext: null,
  };
}

/** Builds update-from-main plan with live vs temp modes and plan vs push execution. */
export function WorktreeStackKit_buildInkUpdateFromMainPlan(options: {
  readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
  readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
  readonly inventory: WorktreeStackKit_InkUiInventory;
  readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan {
  const { actionOptions, config, inventory, record } = options;
  if (!record) {
    return {
      ...WorktreeStackKit_missingRecordPlan(
        "update-from-main",
        `Update From ${config.copy.targetBranchDisplayName}`,
      ),
      executionMode: actionOptions.updateFromMainExecutionMode,
      refreshOnSuccess: actionOptions.updateFromMainExecutionMode === "push",
    };
  }

  const issues: WorktreeStackKit_InkUiIssue[] = [];
  const summaryLines = [
    `Worktree: ${record.worktreePath}`,
    WorktreeStackKit_buildInkRecordWorkflowIdentitySummary(record),
    `Mode: ${actionOptions.updateFromMainMode === "live-worktree" ? "Live worktree" : "New temp worktree"}`,
    `Action: ${actionOptions.updateFromMainExecutionMode === "push" ? "Push changes" : "Plan only"}`,
  ];

  WorktreeStackKit_addRegularWorktreeIssues({
    issues,
    record,
    rootWorkspaceLabel: config.copy.rootWorkspaceLabel,
    verb: "updated",
  });

  const hasBlockingIssue = WorktreeStackKit_hasBlockingIssue(issues);

  return {
    actionId: "update-from-main",
    actionLabel: `Update From ${config.copy.targetBranchDisplayName}`,
    targetPath: record.worktreePath,
    executionMode: actionOptions.updateFromMainExecutionMode,
    refreshOnSuccess: actionOptions.updateFromMainExecutionMode === "push",
    createContext: null,
    summaryLines,
    issues,
    request: hasBlockingIssue
      ? null
      : {
          label: `Update from ${config.targetBranchName}`,
          sessionKind: "task",
          command: config.commandName,
          args: [
            "run",
            config.scripts.updateFromMain,
            "--",
            "--worktree",
            record.worktreePath,
            "--mode",
            actionOptions.updateFromMainMode,
            "--target-branch",
            config.targetBranchName,
            actionOptions.updateFromMainExecutionMode === "push"
              ? "--push"
              : "--plan",
          ],
        },
    destructiveConfirmationText:
      actionOptions.updateFromMainExecutionMode === "push"
        ? `Updates the worktree from ${config.targetBranchName} without rebasing`
        : null,
    requiredConfirmationToken: null,
    retainedArtifacts:
      actionOptions.updateFromMainMode === "pushed-only"
        ? [
            {
              id: "update-from-main-temp-root",
              label: "Temp worktree root",
              path: WorktreeStackKit_buildInkRecordWorkflowTempArtifactRoot({
                category: "update-from-main",
                config,
                inventory,
              }),
            },
          ]
        : [],
    switchContext: null,
  };
}

/** Builds merge-to-target plan with plan-only vs push and root-checkout drift warnings. */
export function WorktreeStackKit_buildInkMergePlan(options: {
  readonly actionOptions: WorktreeStackKit_InkUiActionOptionState;
  readonly config: WorktreeStackKit_InkRecordWorkflowPlanConfig;
  readonly inventory: WorktreeStackKit_InkUiInventory;
  readonly record: WorktreeStackKit_InkUiRecord | null;
}): WorktreeStackKit_InkUiActionRequestPlan {
  const { actionOptions, config, inventory, record } = options;
  if (!record) {
    return {
      ...WorktreeStackKit_missingRecordPlan(
        "merge",
        `Merge to ${config.copy.targetBranchDisplayName}`,
      ),
      executionMode: actionOptions.mergeExecutionMode,
      refreshOnSuccess: actionOptions.mergeExecutionMode === "push",
    };
  }

  const issues: WorktreeStackKit_InkUiIssue[] = [];
  const summaryLines = [
    `Worktree: ${record.worktreePath}`,
    WorktreeStackKit_buildInkRecordWorkflowIdentitySummary(record),
    `Mode: ${actionOptions.mergeExecutionMode === "push" ? "Push changes" : "Plan only"}`,
  ];

  WorktreeStackKit_addRegularWorktreeIssues({
    issues,
    record,
    rootWorkspaceLabel: config.copy.rootWorkspaceLabel,
    verb: "merged",
  });

  if (actionOptions.mergeExecutionMode === "push") {
    issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "repo-root-sync-contract",
        "warning",
        `${actionOptions.mergeExecutionMode === "push" ? "Push" : "Plan"} may succeed but leave ${config.copy.targetBranchDisplayName.toLowerCase()} checkout out of sync`,
      ),
    );
  }

  const hasBlockingIssue = WorktreeStackKit_hasBlockingIssue(issues);

  return {
    actionId: "merge",
    actionLabel: `Merge to ${config.copy.targetBranchDisplayName}`,
    targetPath: record.worktreePath,
    executionMode: actionOptions.mergeExecutionMode,
    refreshOnSuccess: actionOptions.mergeExecutionMode === "push",
    createContext: null,
    summaryLines,
    issues,
    request: hasBlockingIssue
      ? null
      : {
          label: `Merge into ${config.targetBranchName}`,
          sessionKind: "task",
          command: config.commandName,
          args: [
            "run",
            config.scripts.merge,
            "--",
            "--worktree",
            record.worktreePath,
            "--target-branch",
            config.targetBranchName,
            actionOptions.mergeExecutionMode === "push" ? "--push" : "--plan",
          ],
        },
    destructiveConfirmationText:
      actionOptions.mergeExecutionMode === "push"
        ? `Pushes to ${config.targetBranchName} and may leave local ${config.targetBranchName} out of sync`
        : null,
    requiredConfirmationToken:
      actionOptions.mergeExecutionMode === "push" ? "MERGE" : null,
    retainedArtifacts: [
      {
        id: "merge-temp-root",
        label: "Temp worktree root",
        path: WorktreeStackKit_buildInkRecordWorkflowTempArtifactRoot({
          category: "merge",
          config,
          inventory,
        }),
      },
    ],
    switchContext: null,
  };
}

function WorktreeStackKit_missingRecordPlan(
  actionId: WorktreeStackKit_InkUiActionRequestPlan["actionId"],
  actionLabel: string,
): WorktreeStackKit_InkUiActionRequestPlan {
  return {
    actionId,
    actionLabel,
    targetPath: null,
    executionMode: null,
    refreshOnSuccess: false,
    createContext: null,
    summaryLines: ["Select a worktree first"],
    issues: [
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "missing-record",
        "error",
        "Select a worktree first",
      ),
    ],
    request: null,
    destructiveConfirmationText: null,
    requiredConfirmationToken: null,
    retainedArtifacts: [],
    switchContext: null,
  };
}

function WorktreeStackKit_buildInkRecordWorkflowIdentitySummary(
  record: WorktreeStackKit_InkUiRecord,
): string {
  return (
    `Branch: ${WorktreeStackKit_getInkRecordWorkflowBranchLabel(record)} | ` +
    `Stack: ${WorktreeStackKit_getInkRecordWorkflowStackLabel(record)} | ` +
    `Realm: ${WorktreeStackKit_getInkRecordWorkflowRealmLabel(record)}`
  );
}

function WorktreeStackKit_addRegularWorktreeIssues(options: {
  readonly issues: WorktreeStackKit_InkUiIssue[];
  readonly record: WorktreeStackKit_InkUiRecord;
  readonly rootWorkspaceLabel: string;
  readonly verb: "merged" | "updated";
}): void {
  if (options.record.temporaryMerge) {
    options.issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "temporary-merge-worktree",
        "error",
        `Merge worktrees can't be ${options.verb}. Select a regular worktree`,
      ),
    );
  } else if (options.record.detached) {
    options.issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "detached-worktree",
        "error",
        `Standalone worktrees can't be ${options.verb}. Select a regular worktree`,
      ),
    );
  }

  if (WorktreeStackKit_isCanonicalRootWorkspaceRecord(options.record)) {
    options.issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "canonical-root-workspace",
        "error",
        `Use on worktrees only, not the ${options.rootWorkspaceLabel}`,
      ),
    );
  } else if (!options.record.metadata) {
    options.issues.push(
      WorktreeStackKit_createInkRecordWorkflowIssue(
        "missing-metadata",
        "error",
        "Missing metadata—run repair first",
      ),
    );
  }
}

function WorktreeStackKit_hasBlockingIssue(
  issues: readonly WorktreeStackKit_InkUiIssue[],
): boolean {
  return issues.some((issue) => issue.severity === "error");
}
