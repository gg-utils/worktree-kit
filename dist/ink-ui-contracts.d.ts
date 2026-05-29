/**
 * @fileoverview Package-owned type contracts for reusable worktree Ink UI shells.
 *
 * The contracts are product-neutral data shapes for inventory, action planning, session state,
 * reducer events, and create/switch drafts. Root script adapters keep compatibility aliases for the
 * historical `WorktreeInk*` names while reusable code imports this package-owned namespace.
 *
 * @example
 * ```typescript
 * import type { WorktreeStackKit_InkUiAction } from "@gg-utils/worktree-kit/ink-ui-contracts";
 *
 * const action: WorktreeStackKit_InkUiAction = { type: "load-start" };
 * ```
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/ink-reducer.unit.test.ts
 * @testing CLI: npm run worktree-kit:type-check
 *
 * @see packages/worktree-kit/src/ink-reducer.ts - Reducer that interprets the discriminated action union and `WorktreeStackKit_InkUiState` contract defined here when advancing the Ink UI snapshot.
 * @see packages/worktree-kit/src/ink-inventory-discovery.ts - Inventory builder that fills `WorktreeStackKit_InkUiRecord` rows, issues, and summaries from git and local-edge artifacts using these field shapes.
 * @see scripts/worktree-stack/ui/cli-ink/types.ts - Root CLI compatibility layer that imports this module and keeps historical `WorktreeInk*` aliases for legacy script imports.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Workspace classification used by reusable worktree Ink inventory records. */
export type WorktreeStackKit_InkUiCheckoutKind = "canonical-root-workspace" | "prepared-worktree";
/** Severity level for an Ink UI issue. */
export type WorktreeStackKit_InkUiIssueSeverity = "info" | "warning" | "error";
/** A single issue (validation, health, or lifecycle) attached to a worktree record. */
export interface WorktreeStackKit_InkUiIssue {
    code: string;
    severity: WorktreeStackKit_InkUiIssueSeverity;
    message: string;
}
/** Metadata loaded from the worktree metadata JSON file. */
export interface WorktreeStackKit_InkUiMetadata {
    stackName: string | null;
    realmSlug: string | null;
    rootBranch: string | null;
    submoduleBranch: string | null;
    baseBranch: string | null;
    workspaceType: string | null;
    slot: number | null;
    createdAt: string | null;
    ports: Record<string, number>;
    raw: Record<string, unknown>;
}
/** Handbook info loaded from the worktree-info JSON file. */
export interface WorktreeStackKit_InkUiHandbookInfo {
    stackName: string | null;
    realmSlug: string | null;
    authHost: string | null;
    generatedAt: string | null;
    commands: Record<string, string>;
    hosts: Record<string, string>;
    raw: Record<string, unknown>;
}
/** Realm assignment record for a worktree. */
export interface WorktreeStackKit_InkUiRealmRecord {
    realmSlug: string;
    status: string;
    workspacePath: string;
    primaryMethod: string;
    rootBranch: string | null;
    submoduleBranch: string | null;
}
/** Health probe summary for a worktree. */
export interface WorktreeStackKit_InkUiHealthSummary {
    runAt: string | null;
    method: string | null;
    healthyProbeCount: number;
    failingProbeCount: number;
    totalProbeCount: number;
    sampleFailure: string | null;
}
/** A single worktree record with all attached metadata, handbook, realm, and health info. */
export interface WorktreeStackKit_InkUiRecord {
    worktreePath: string;
    label: string;
    head: string | null;
    branchRef: string | null;
    detached: boolean;
    temporaryMerge: boolean;
    currentCheckout: boolean;
    checkoutKind: WorktreeStackKit_InkUiCheckoutKind | "unmanaged-checkout";
    handbookMarkdownPath: string;
    handbookMarkdownExists: boolean;
    onboardingMarkdownPath: string;
    onboardingMarkdownExists: boolean;
    metadata: WorktreeStackKit_InkUiMetadata | null;
    handbook: WorktreeStackKit_InkUiHandbookInfo | null;
    realmRecord: WorktreeStackKit_InkUiRealmRecord | null;
    healthSummary: WorktreeStackKit_InkUiHealthSummary | null;
    issues: WorktreeStackKit_InkUiIssue[];
}
/** Aggregated summary counts across all worktree records. */
export interface WorktreeStackKit_InkUiSummary {
    totalRecords: number;
    managedRecords: number;
    brokenRecords: number;
    detachedRecords: number;
    activeRealms: number;
    inactiveRealms: number;
    staleRealms: number;
    healthyRealms: number;
    unhealthyRealms: number;
    healthRunAt: string | null;
}
/** The full loaded inventory of worktree records with global issues. */
export interface WorktreeStackKit_InkUiInventory {
    projectRoot: string;
    loadedAt: string;
    records: WorktreeStackKit_InkUiRecord[];
    summary: WorktreeStackKit_InkUiSummary;
    globalIssues: WorktreeStackKit_InkUiIssue[];
}
/** Ink UI screen names. */
export type WorktreeStackKit_InkUiScreen = "shell" | "action-editor" | "review" | "session" | "result";
/** Execution mode for align and merge operations. */
export type WorktreeStackKit_InkUiExecutionMode = "plan" | "push";
/** Refresh mode for update-from-main operations. */
export type WorktreeStackKit_InkUiUpdateFromMainMode = "live-worktree" | "pushed-only";
/** Supported Ink UI action IDs. */
export type WorktreeStackKit_InkUiActionId = "create" | "switch" | "repair" | "sync-local-files" | "platform-bootstrap" | "start" | "destroy" | "update-from-main" | "merge" | "list-active-realms" | "router-status" | "healthcheck" | "realm-pool-list" | "realm-pool-guide" | "realm-pool-prepare" | "realm-pool-next" | "realm-prune-stale" | "checkout-state-check";
/** Field IDs for the create form. */
export type WorktreeStackKit_InkUiCreateFieldId = "branchPrefix" | "stackName" | "slotInput" | "baseBranch" | "rootBranch" | "submoduleBranch" | "worktreesBase" | "realmSlug" | "worktreePathOverride" | "metadataSource" | "copyEnvFromMain" | "runInstall" | "installSkipExisting" | "installPreferOnline" | "openWindsurf" | "followUpStart" | "followUpStartOpenWindsurf";
/** Section IDs for the create form. */
export type WorktreeStackKit_InkUiCreateSectionId = "identity" | "branches" | "provisioning" | "launch";
/** Region IDs for the create form layout. */
export type WorktreeStackKit_InkUiCreateRegion = "sections" | "fields" | "editor" | "preview";
/** Focused column in the Ink main layout. */
export type WorktreeStackKit_InkUiFocusedColumn = "records" | "actions" | "editor";
/** Interaction mode for the create form. */
export type WorktreeStackKit_InkUiCreateInteractionMode = "browse" | "edit";
/** The full draft state of the create form. */
export interface WorktreeStackKit_InkUiCreateDraft {
    branchPrefix: string;
    stackName: string;
    slotInput: string;
    baseBranch: string;
    rootBranch: string;
    submoduleBranch: string;
    worktreesBase: string;
    realmSlug: string;
    worktreePathOverride: string;
    metadataSource: string;
    copyEnvFromMain: boolean;
    runInstall: boolean;
    installSkipExisting: boolean;
    installPreferOnline: boolean;
    openWindsurf: boolean;
    followUpStart: boolean;
    followUpStartOpenWindsurf: boolean;
}
/** Resolved request context passed to the create command builder. */
export interface WorktreeStackKit_InkUiCreateRequestContext {
    branchPrefix: string;
    stackName: string;
    slot: number;
    baseBranch: string;
    rootBranch: string;
    submoduleBranch: string;
    worktreesBase: string;
    predictedWorktreePath: string;
    realmSlug: string;
    worktreePathOverride: string;
    metadataSource: string;
    followUpStart: boolean;
    followUpStartOpenWindsurf: boolean;
}
/** Field IDs for the switch form. */
export type WorktreeStackKit_InkUiSwitchFieldId = "branchPrefix" | "stackName" | "environmentFilter";
/** Section IDs for the switch form. */
export type WorktreeStackKit_InkUiSwitchSectionId = "identity" | "filter";
/** Mutable switch form values mirrored in the Ink UI before argv is built. */
export interface WorktreeStackKit_InkUiSwitchDraft {
    branchPrefix: string;
    stackName: string;
    environmentFilter: string;
}
/** Resolved request context passed to the switch command builder. */
export interface WorktreeStackKit_InkUiSwitchRequestContext {
    branchPrefix: string;
    stackName: string;
    environmentFilter: string;
    worktreePath: string | null;
    editorOverride: string | null;
}
/** A command request to be executed in a session. */
export interface WorktreeStackKit_InkUiCommandRequest {
    label: string;
    sessionKind: "task" | "runtime";
    command: string;
    args: string[];
}
/** Persisted option state across Ink UI actions. */
export interface WorktreeStackKit_InkUiActionOptionState {
    openWindsurfOnStart: boolean;
    pruneAfterDestroy: boolean;
    updateFromMainMode: WorktreeStackKit_InkUiUpdateFromMainMode;
    updateFromMainExecutionMode: WorktreeStackKit_InkUiExecutionMode;
    mergeExecutionMode: WorktreeStackKit_InkUiExecutionMode;
    repairDryRun: boolean;
    repairIncludePackageEnv: boolean;
    repairLegacyPackageEnvAlias: boolean;
    repairScope: "all-prepared" | "selected-record";
    syncScope: "all-discovered" | "selected-record";
    poolNextStackName: string;
    stateCheckFetch: boolean;
}
/** Static definition of an action shown in the Ink UI actions list. */
export interface WorktreeStackKit_InkUiActionDefinition {
    id: WorktreeStackKit_InkUiActionId;
    label: string;
    description: string;
    scope: "record" | "global";
}
/** A retained artifact (e.g., temp merge worktree) that must be cleaned up after an action. */
export interface WorktreeStackKit_InkUiRetainedArtifact {
    id: string;
    label: string;
    path: string;
}
/** A fully resolved action request ready for execution, including confirmation and refresh metadata. */
export interface WorktreeStackKit_InkUiActionRequestPlan {
    actionId: WorktreeStackKit_InkUiActionId;
    actionLabel: string;
    targetPath: string | null;
    executionMode: WorktreeStackKit_InkUiExecutionMode | null;
    refreshOnSuccess: boolean;
    createContext: WorktreeStackKit_InkUiCreateRequestContext | null;
    switchContext: WorktreeStackKit_InkUiSwitchRequestContext | null;
    summaryLines: string[];
    issues: WorktreeStackKit_InkUiIssue[];
    request: WorktreeStackKit_InkUiCommandRequest | null;
    destructiveConfirmationText: string | null;
    requiredConfirmationToken: string | null;
    retainedArtifacts: WorktreeStackKit_InkUiRetainedArtifact[];
}
/** Result of resolving a create handoff by stack name and slot. */
export interface WorktreeStackKit_InkUiCreateHandoff {
    status: "resolved" | "ambiguous" | "not-found";
    requestedStackName: string;
    requestedSlot: number;
    requestedRootBranch: string;
    requestedSubmoduleBranch: string;
    predictedWorktreePath: string;
    matchedWorktreePath: string | null;
    candidatePaths: string[];
    followUpStartPlan: WorktreeStackKit_InkUiActionRequestPlan | null;
}
/** Source classification for a session output line. */
export type WorktreeStackKit_InkUiSessionLineSource = "stdout" | "stderr" | "bridge" | "sidecar-preflight" | "sidecar-register" | "sidecar-render" | "sidecar-ensure-running" | "runtime-run-log";
/** A single output line from a session. */
export interface WorktreeStackKit_InkUiSessionLine {
    source: WorktreeStackKit_InkUiSessionLineSource;
    text: string;
}
/** The active session model during command execution. */
export interface WorktreeStackKit_InkUiSessionModel {
    actionLabel: string;
    request: WorktreeStackKit_InkUiCommandRequest;
    commandLine: string;
    status: "queued" | "starting" | "watching-sidecars" | "running" | "cancelling";
    lines: WorktreeStackKit_InkUiSessionLine[];
    startedAt: string | null;
}
/** The result model after a session completes. */
export interface WorktreeStackKit_InkUiResultModel {
    status: "succeeded" | "failed" | "blocked" | "cancelled";
    message: string;
    exitCode: number | null;
    signal: string | null;
    lines: WorktreeStackKit_InkUiSessionLine[];
    startedAt: string | null;
    endedAt: string | null;
    refreshRequested: boolean;
    createHandoff: WorktreeStackKit_InkUiCreateHandoff | null;
}
/** The complete Ink UI state shape. */
export interface WorktreeStackKit_InkUiState {
    status: "loading" | "ready" | "error";
    inventory: WorktreeStackKit_InkUiInventory | null;
    errorMessage: string | null;
    noticeMessage: string | null;
    activePlan: WorktreeStackKit_InkUiActionRequestPlan | null;
    sessionModel: WorktreeStackKit_InkUiSessionModel | null;
    resultModel: WorktreeStackKit_InkUiResultModel | null;
    reviewConfirmationInput: string;
    sessionRunId: number;
    screen: WorktreeStackKit_InkUiScreen;
    focusedColumn: WorktreeStackKit_InkUiFocusedColumn;
    selectedIndex: number;
    selectedActionIndex: number;
    selectedCreateSectionIndex: number;
    selectedCreateFieldIndex: number;
    createRegion: WorktreeStackKit_InkUiCreateRegion;
    createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
    refreshToken: number;
    actionOptions: WorktreeStackKit_InkUiActionOptionState;
    createDraft: WorktreeStackKit_InkUiCreateDraft;
    poolNextStackEditMode: boolean;
}
/** Discriminated union of all Ink UI actions (used by the reducer). */
export type WorktreeStackKit_InkUiAction = {
    type: "load-start";
} | {
    type: "load-success";
    inventory: WorktreeStackKit_InkUiInventory;
} | {
    type: "load-error";
    errorMessage: string;
} | {
    type: "apply-launch-target";
    selectedIndex: number;
    selectedActionIndex: number;
    screen: WorktreeStackKit_InkUiScreen;
    createDraft: WorktreeStackKit_InkUiCreateDraft;
    noticeMessage: string | null;
    actionOptionsPatch: Partial<WorktreeStackKit_InkUiActionOptionState> | null;
} | {
    type: "toggle-pool-next-stack-edit";
} | {
    type: "append-pool-next-stack-input";
    value: string;
} | {
    type: "backspace-pool-next-stack-input";
} | {
    type: "select-next";
} | {
    type: "select-previous";
} | {
    type: "select-next-action";
} | {
    type: "select-previous-action";
} | {
    type: "navigate-up";
} | {
    type: "navigate-down";
} | {
    type: "open-action-editor";
} | {
    type: "open-review";
    plan: WorktreeStackKit_InkUiActionRequestPlan;
} | {
    type: "start-session";
    plan: WorktreeStackKit_InkUiActionRequestPlan;
} | {
    type: "session-started";
    startedAt: string;
} | {
    type: "session-status";
    status: WorktreeStackKit_InkUiSessionModel["status"];
} | {
    type: "session-line";
    line: WorktreeStackKit_InkUiSessionLine;
} | {
    type: "show-result";
    result: WorktreeStackKit_InkUiResultModel;
} | {
    type: "append-review-confirmation";
    value: string;
} | {
    type: "backspace-review-confirmation";
} | {
    type: "close-overlay";
} | {
    type: "toggle-primary-action-option";
} | {
    type: "toggle-secondary-action-option";
} | {
    type: "toggle-repair-legacy-package-alias";
} | {
    type: "cycle-repair-target-scope";
} | {
    type: "cycle-sync-target-scope";
} | {
    type: "select-next-create-section";
} | {
    type: "select-previous-create-section";
} | {
    type: "select-next-create-field";
} | {
    type: "select-previous-create-field";
} | {
    type: "focus-next-create-region";
} | {
    type: "focus-previous-create-region";
} | {
    type: "start-create-field-edit";
} | {
    type: "stop-create-field-edit";
} | {
    type: "append-create-field-input";
    value: string;
} | {
    type: "backspace-create-field-input";
} | {
    type: "toggle-create-field";
} | {
    type: "focus-column-left";
} | {
    type: "focus-column-right";
} | {
    type: "refresh-requested";
};
//# sourceMappingURL=ink-ui-contracts.d.ts.map