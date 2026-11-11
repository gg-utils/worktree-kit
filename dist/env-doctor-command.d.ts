/**
 * @fileoverview Config-driven prepared-worktree environment diagnostics command.
 *
 * Flow: argv + project command config -> workspace resolution -> repair dry-run telemetry -> overlay
 * validation artifact inspection -> repair/manual-review suggestions. Product package names,
 * command paths, env vars, issue heuristics, and operator-facing command strings stay in root config.
 *
 * @testing Node.js test runner: cd packages/worktree-kit && npm test -- src/env-doctor-command.unit.test.ts
 * @testing CLI: npm run worktrees:env:doctor -- --help
 *
 * @see scripts/worktree-stack/commands/env-doctor.ts - Repository CLI shim that wires worktrees.config.ts factories into WorktreeStackKit_runEnvDoctorCommand for npm run worktrees:env:doctor.
 * @see worktrees.config.ts - Project-owned WorktreeStackKit_EnvDoctorCommandConfig builders whose overlay render/validate and repair dry-run commands this module executes via spawnSync.
 * @see packages/worktree-kit/src/env-doctor-command.unit.test.ts - Node test coverage for argv parsing, workspace resolution, telemetry parsing, and overlay artifact validation owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export type WorktreeStackKit_EnvDoctorCommand = {
    args: readonly string[];
    command: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
};
export type WorktreeStackKit_EnvDoctorPackageConfig = {
    displayName: string;
    envRelativePath: string;
    missingRootKeysField: string;
};
export type WorktreeStackKit_EnvDoctorOverlayCommandOptions = {
    canonicalRootWorkspacePath: string | null;
    envFilePath: string;
    generatedRootDir: string;
    workspacePath: string;
};
export type WorktreeStackKit_EnvDoctorManualReviewIssueMapping = {
    issuePrefix: string;
    workspaceRelativePath: string;
};
export type WorktreeStackKit_EnvDoctorCommandConfig = {
    buildOverlayRenderCommand: (options: WorktreeStackKit_EnvDoctorOverlayCommandOptions) => WorktreeStackKit_EnvDoctorCommand;
    buildOverlayValidateCommand: (options: WorktreeStackKit_EnvDoctorOverlayCommandOptions) => WorktreeStackKit_EnvDoctorCommand;
    buildRepairDryRunCommand: (options: {
        workspacePath: string;
    }) => WorktreeStackKit_EnvDoctorCommand;
    canonicalRootWorkspacePathField: string;
    envFileName: string;
    manualReviewIssueMappings: readonly WorktreeStackKit_EnvDoctorManualReviewIssueMapping[];
    overlayArtifactPath: (workspacePath: string) => string;
    overlayStartSuggestionIssueFragments: readonly string[];
    overlayTempDirectoryPrefix: string;
    packageConfigs: readonly WorktreeStackKit_EnvDoctorPackageConfig[];
    preparedMetadataRelativePath: string;
    repairSuggestionCommand: (workspacePath: string) => string;
    startSuggestionCommand: (workspacePath: string) => string;
    usageExamples: readonly string[];
    usageCommandLines: readonly string[];
};
export type WorktreeStackKit_RunEnvDoctorCommandOptions = {
    argv: readonly string[];
    config: WorktreeStackKit_EnvDoctorCommandConfig;
    defaultRequestedPath: string;
};
export type WorktreeStackKit_EnvDoctorRepairDryRun = {
    exitCode: number | null;
    missingRootKeysByPackage: Record<string, string[]>;
    ok: boolean;
    parsedFields: Record<string, string>;
    stderr: string;
    stdout: string;
};
export type WorktreeStackKit_EnvDoctorOverlayArtifact = {
    issues: string[];
    listenPort: number;
    primaryMethod: string;
    runAt: string;
    success: boolean;
    validatedFiles: Record<string, string>;
};
export type WorktreeStackKit_EnvDoctorOverlayValidation = {
    artifact: WorktreeStackKit_EnvDoctorOverlayArtifact | null;
    artifactPath: string;
    artifactRefreshed: boolean;
    exitCode: number | null;
    ok: boolean;
    renderExitCode: number | null;
    renderStderr: string;
    renderStdout: string;
    stderr: string;
    stdout: string;
};
export type WorktreeStackKit_EnvDoctorReport = {
    canonicalRootWorkspacePath: string | null;
    envFilePath: string;
    fixSuggestions: string[];
    jsonMode: boolean;
    manualReviewPaths: string[];
    ok: boolean;
    overlayValidation: WorktreeStackKit_EnvDoctorOverlayValidation;
    preparedWorktree: boolean;
    repairDryRun: WorktreeStackKit_EnvDoctorRepairDryRun;
    requestedPath: string;
    workspacePath: string;
};
type WorktreeStackKit_EnvDoctorParsedOptions = {
    jsonMode: boolean;
    requestedPath: string;
};
/** Renders CLI usage and project-supplied examples for env doctor. */
export declare function WorktreeStackKit_renderEnvDoctorUsage(config: WorktreeStackKit_EnvDoctorCommandConfig): string;
/** Parses env-doctor argv without consulting global process argv. */
export declare function WorktreeStackKit_parseEnvDoctorArgs(options: {
    argv: readonly string[];
    config: WorktreeStackKit_EnvDoctorCommandConfig;
    defaultRequestedPath: string;
}): WorktreeStackKit_EnvDoctorParsedOptions | null;
/** Runs the config-driven env-doctor command and returns the intended process exit code. */
export declare function WorktreeStackKit_runEnvDoctorCommand(options: WorktreeStackKit_RunEnvDoctorCommandOptions): number;
/** Parses `[worktree] key: value` telemetry lines emitted by repair scripts. */
export declare function WorktreeStackKit_parseEnvDoctorRepairFields(output: string): Record<string, string>;
/** Splits comma-separated missing-key summaries from repair output into trimmed tokens. */
export declare function WorktreeStackKit_parseEnvDoctorCommaSeparatedKeys(value: string | undefined): string[];
/** Shell-safe single-quote wrapping for interpolating filesystem paths into suggested commands. */
export declare function WorktreeStackKit_envDoctorShellQuote(value: string): string;
/** Walks parents until the configured env file denotes the workspace root. */
export declare function WorktreeStackKit_resolveEnvDoctorWorkspacePath(options: {
    candidatePath: string;
    envFileName: string;
}): string;
/** Reads and narrowly validates an overlay validation artifact on disk. */
export declare function WorktreeStackKit_parseEnvDoctorOverlayArtifact(artifactPath: string): WorktreeStackKit_EnvDoctorOverlayArtifact | null;
export {};
