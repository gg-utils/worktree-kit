/**
 * @fileoverview Config-driven artifact generation, dependency install, integration hooks, summary,
 * and startup delegation for worktree creation.
 *
 * Flow: create context + project config -> artifact command -> optional installs -> best-effort
 * integration hooks -> summary rendering -> optional same-terminal startup command.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-post-provision.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create runner that wires project post-provision callbacks into these helpers once earlier create steps finish.
 * @see worktrees.config.ts - Platform adapter importing these contracts to type consumer-specific artifact, install, hook, and startup wiring for prepared-worktree creation.
 * @see packages/worktree-kit/src/create-cli-context.ts - CLI context builder whose option subset is embedded in WorktreeStackKit_CreatePostProvisionContext for downstream callback decisions.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStack_RunCommandOptions } from "@gg-utils/worktree-core/foundation";
import type { WorktreeStackKit_CreateOptions } from "./create-cli-context.js";
export type WorktreeStackKit_CreatePostProvisionContext = {
    currentStep: string;
    derivedPorts: ReadonlyMap<string, number>;
    installCleanlinessStatus: string;
    integrationStatuses: ReadonlyMap<string, string>;
    options: Pick<WorktreeStackKit_CreateOptions, "baseBranch" | "branchPrefix" | "installPreferOffline" | "installSkipExisting" | "metadataSource" | "openWindsurf" | "rootBranch" | "runInstall" | "slot" | "stackName" | "startMode" | "submoduleBranch" | "worktreesBase">;
    primaryWorkspacePath: string;
    realmAssignmentSource: string;
    realmSlug: string;
    rootDir: string;
    runtimeMachineRoot: string;
    worktreePath: string;
};
export type WorktreeStackKit_CreateCommandSpec = {
    args: readonly string[];
    command: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: WorktreeStack_RunCommandOptions["stdio"];
};
export type WorktreeStackKit_CreateInstallTarget = {
    label: string;
    root: string;
};
export type WorktreeStackKit_CreateGeneratedSyncTarget = {
    args: readonly string[];
    command: string;
    cwd: string;
    errorLabel: string;
    logLabel: string;
};
export type WorktreeStackKit_CreateBestEffortHook = {
    failureWarning: string;
    spec: WorktreeStackKit_CreateCommandSpec;
    step: string;
};
export type WorktreeStackKit_CreatePostProvisionConfig = {
    buildArtifactCommand?: (context: WorktreeStackKit_CreatePostProvisionContext) => WorktreeStackKit_CreateCommandSpec;
    generateArtifacts?: (context: WorktreeStackKit_CreatePostProvisionContext) => void;
    buildGeneratedSyncTargets: (context: WorktreeStackKit_CreatePostProvisionContext) => readonly WorktreeStackKit_CreateGeneratedSyncTarget[];
    buildInstallArgs: (context: WorktreeStackKit_CreatePostProvisionContext) => readonly string[];
    buildStartTerminalCommand: (context: WorktreeStackKit_CreatePostProvisionContext) => WorktreeStackKit_CreateCommandSpec;
    installCommand: string;
    installSkippedStatus: string;
    installVerifiedStatus: string;
    launchEditor: (context: WorktreeStackKit_CreatePostProvisionContext) => void;
    launchEditorDisabledMessage: string;
    launchEditorStartModeMessage: (startMode: string) => string;
    renderSummary: (context: WorktreeStackKit_CreatePostProvisionContext) => string;
    resolveCleanlinessTargets: (options: {
        context: WorktreeStackKit_CreatePostProvisionContext;
        installTargets: readonly WorktreeStackKit_CreateInstallTarget[];
    }) => readonly WorktreeStackKit_CreateInstallTarget[];
    resolveInstallTargets: (context: WorktreeStackKit_CreatePostProvisionContext) => readonly WorktreeStackKit_CreateInstallTarget[];
    startInWindow: (context: WorktreeStackKit_CreatePostProvisionContext) => void;
    terminalStartMode: WorktreeStackKit_CreateOptions["startMode"];
    windowStartMode: WorktreeStackKit_CreateOptions["startMode"];
};
/** Invokes the configured artifact command for generated metadata/handbooks. */
export declare function WorktreeStackKit_generateCreateArtifacts(options: {
    config: WorktreeStackKit_CreatePostProvisionConfig;
    context: WorktreeStackKit_CreatePostProvisionContext;
}): void;
/**
 * Optionally installs dependencies, syncs generated targets, and returns the cleanliness status.
 */
export declare function WorktreeStackKit_runCreateInstallIfRequested(options: {
    config: WorktreeStackKit_CreatePostProvisionConfig;
    context: WorktreeStackKit_CreatePostProvisionContext;
}): string;
/** Runs a configured non-fatal post-provision hook and returns whether it succeeded. */
export declare function WorktreeStackKit_runCreateBestEffortHook(options: {
    context: WorktreeStackKit_CreatePostProvisionContext;
    hook: WorktreeStackKit_CreateBestEffortHook;
}): boolean;
/** Opens the configured editor when create is not delegating to a runtime start flow. */
export declare function WorktreeStackKit_openCreateEditor(options: {
    config: WorktreeStackKit_CreatePostProvisionConfig;
    context: WorktreeStackKit_CreatePostProvisionContext;
}): void;
/** Delegates to the configured window-start hook when the selected start mode matches. */
export declare function WorktreeStackKit_startCreateInWindow(options: {
    config: WorktreeStackKit_CreatePostProvisionConfig;
    context: WorktreeStackKit_CreatePostProvisionContext;
}): void;
/** Prints the configured create summary. */
export declare function WorktreeStackKit_printCreateSummary(options: {
    config: WorktreeStackKit_CreatePostProvisionConfig;
    context: WorktreeStackKit_CreatePostProvisionContext;
}): void;
/** Runs the configured same-terminal startup command and returns its status when selected. */
export declare function WorktreeStackKit_startCreateInCurrentTerminal(options: {
    config: WorktreeStackKit_CreatePostProvisionConfig;
    context: WorktreeStackKit_CreatePostProvisionContext;
}): number | null;
