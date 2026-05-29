/**
 * @fileoverview Config-driven preflight and generated-artifact validation for worktree creation.
 *
 * Flow: create context + project validation config -> host/repo checks, branch validation, identity
 * collision checks, port listener warnings, and generated artifact assertions.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-preflight-validation.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create flow that sequences these preflight checks before provisioning a prepared worktree path.
 * @see packages/worktree-kit/src/create-preflight-validation.unit.test.ts - Node test runner module that asserts target-location and generated-artifact validation behavior owned here.
 * @see packages/worktree-core/src/worktree-discovery.ts - Core discovery helpers that list registered worktrees and read JSON metadata fields this module uses for slot and realm collision checks.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export type WorktreeStackKit_CreatePreflightContext = {
    currentStep: string;
    options: {
        baseBranch: string;
        slot: number;
        worktreesBase: string;
    };
    primaryWorkspaceEnvFile: string;
    realmSlug: string;
    rootDir: string;
    worktreePath: string;
};
export type WorktreeStackKit_CreatePreflightFileRequirement = {
    description: string;
    filePath: string;
};
export type WorktreeStackKit_CreatePreflightDirectoryRequirement = {
    description: string;
    directoryPath: string;
};
export type WorktreeStackKit_CreateGeneratedArtifactRequirement = {
    description: string;
    relativePath: string;
};
export type WorktreeStackKit_CreatePreflightConfig = {
    generatedArtifactRequirements: readonly WorktreeStackKit_CreateGeneratedArtifactRequirement[];
    metadataRelativePath: string;
    primaryEnvMissingExpectedFileLabel: string;
    primaryEnvMissingWarning: string;
    realmMetadataField: string;
    requiredCommandNames: readonly string[];
    requiredDirectories: readonly WorktreeStackKit_CreatePreflightDirectoryRequirement[];
    requiredFiles: readonly WorktreeStackKit_CreatePreflightFileRequirement[];
    slotMetadataField: string;
};
/** Returns the lsof output for a given TCP port if a process is listening. */
export declare function WorktreeStackKit_createPortListenerSummary(port: number): string;
/** Checks host commands, required files/directories, and primary env presence. */
export declare function WorktreeStackKit_requireCreatePrerequisites(options: {
    config: WorktreeStackKit_CreatePreflightConfig;
    context: WorktreeStackKit_CreatePreflightContext;
}): void;
/** Verifies the configured base branch exists locally or as an origin remote ref. */
export declare function WorktreeStackKit_validateCreateBaseBranchExists(context: WorktreeStackKit_CreatePreflightContext): void;
/** Ensures the worktrees base exists and target path is either absent or a Git worktree. */
export declare function WorktreeStackKit_validateCreateTargetLocation(context: WorktreeStackKit_CreatePreflightContext): void;
/** Rejects slot or realm collisions with other registered prepared worktrees. */
export declare function WorktreeStackKit_validateUniqueCreateWorktreeIdentity(options: {
    config: WorktreeStackKit_CreatePreflightConfig;
    context: WorktreeStackKit_CreatePreflightContext;
}): void;
/** Emits best-effort lsof warnings when derived slot ports already have listeners. */
export declare function WorktreeStackKit_warnIfCreatePortsAreBusy(options: {
    context: WorktreeStackKit_CreatePreflightContext;
    ports: readonly number[];
}): void;
/** Asserts that configured generated artifacts exist under the target worktree. */
export declare function WorktreeStackKit_validateGeneratedCreateArtifacts(options: {
    config: WorktreeStackKit_CreatePreflightConfig;
    context: WorktreeStackKit_CreatePreflightContext;
}): void;
//# sourceMappingURL=create-preflight-validation.d.ts.map