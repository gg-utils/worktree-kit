/**
 * @fileoverview Config-driven prepared-worktree repair command runner.
 *
 * Flow: argv + project repair config -> target discovery -> managed env materialization ->
 * optional package env key backfill -> project-supplied artifact regeneration and validation.
 * Product package names, external script paths, env keys, and generated artifact requirements stay
 * in the root config that consumes this package.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see scripts/worktree-stack/commands/repair.ts - Root `worktrees:repair` adapter that resolves the repository root, builds `WorktreeStackKit_RepairCommandConfig` from `worktrees.config.ts`, and delegates argv plus that config into `WorktreeStackKit_runRepairCli`.
 * @see worktrees.config.ts - consumer workspace repair factory that supplies env-materialization hooks, package `.env` paths, machine-root keys, and generated-artifact requirements read by this runner.
 * @see packages/worktree-kit/src/repair-command.unit.test.ts - Jest unit coverage for repair argv parsing, canonical package-env backfill, and orchestration helpers owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { SpawnOptions } from "node:child_process";
/** Whether repair backfills package `.env` keys from a canonical workspace. */
export type WorktreeStackKit_RepairPackageEnvMode = "disabled" | "missing-or-blank";
/** External command descriptor supplied by project config. */
export type WorktreeStackKit_RepairConfiguredCommand = {
    allowFailure?: boolean;
    args: readonly string[];
    command: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: SpawnOptions["stdio"];
};
/** Package env file participating in optional canonical-root key backfill. */
export type WorktreeStackKit_RepairPackageConfig = {
    displayName: string;
    envRelativePath: string;
    missingRootKeysField: string;
};
/** Required artifact that should exist after project-specific regeneration. */
export type WorktreeStackKit_RepairGeneratedArtifactRequirement = {
    description: string;
    relativePath: string;
};
/** Context passed to project-supplied repair command builders. */
export type WorktreeStackKit_RepairCommandContext = {
    canonicalRootWorkspacePath: string;
    envFilePath: string;
    machineRootPath: string;
    packageEnvMode: WorktreeStackKit_RepairPackageEnvMode;
    rootWorkspaceEnvFilePath: string;
    worktreePath: string;
};
/** Config consumed by the package-owned repair CLI runner. */
export type WorktreeStackKit_RepairCommandConfig = {
    buildMaterializeEnvCommand?: (context: WorktreeStackKit_RepairCommandContext) => WorktreeStackKit_RepairConfiguredCommand;
    buildRegenerateArtifactsCommand?: (context: WorktreeStackKit_RepairCommandContext) => WorktreeStackKit_RepairConfiguredCommand;
    materializeEnvFiles?: (context: WorktreeStackKit_RepairCommandContext) => void;
    regenerateArtifacts?: (context: WorktreeStackKit_RepairCommandContext) => void;
    envFileName: string;
    generatedArtifactPreviewRelativePath: string;
    generatedArtifactRequirements: readonly WorktreeStackKit_RepairGeneratedArtifactRequirement[];
    generatedDirLeafName: string;
    machineRootEnvKey: string;
    machineRootFallbackRelativePath: string;
    packageConfigs: readonly WorktreeStackKit_RepairPackageConfig[];
    projectRoot: string;
    realmSlugEnvKey: string;
    realmSlugMetadataField: string;
    stackNameMetadataField: string;
    usage: WorktreeStackKit_RepairUsageConfig;
};
/** Project-supplied CLI usage copy. */
export type WorktreeStackKit_RepairUsageConfig = {
    commandLines: readonly string[];
    defaultBehaviorLines: readonly string[];
    examples: readonly string[];
    notes: readonly string[];
    packageEnvBehaviorLines: readonly string[];
};
/** Parsed `worktrees:repair` CLI flags and target selection. */
export type WorktreeStackKit_RepairOptions = {
    dryRun: boolean;
    packageEnvMode: WorktreeStackKit_RepairPackageEnvMode;
    targetWorktrees: string[];
};
export type WorktreeStackKit_RunRepairCliOptions = {
    argv: readonly string[];
    config: WorktreeStackKit_RepairCommandConfig;
};
/** Renders repair CLI usage from project-supplied command lines and examples. */
export declare function WorktreeStackKit_renderRepairUsage(config: WorktreeStackKit_RepairCommandConfig): string;
/** Parses repair argv without consulting global process argv. */
export declare function WorktreeStackKit_parseRepairArgs(options: {
    argv: readonly string[];
    config: WorktreeStackKit_RepairCommandConfig;
}): WorktreeStackKit_RepairOptions | null;
/** Normalizes supported package env mode values plus the legacy missing-only alias. */
export declare function WorktreeStackKit_normalizeRepairPackageEnvMode(value: string): WorktreeStackKit_RepairPackageEnvMode;
/** Runs the config-driven repair CLI and returns the intended process exit code. */
export declare function WorktreeStackKit_runRepairCli(options: WorktreeStackKit_RunRepairCliOptions): number;
/** Orchestrates repair for every resolved worktree under the canonical root workspace. */
export declare function WorktreeStackKit_runRepair(options: {
    config: WorktreeStackKit_RepairCommandConfig;
    repairOptions: WorktreeStackKit_RepairOptions;
}): void;
/**
 * Resolves explicit repair paths or discovers registered prepared worktrees for the canonical root.
 */
export declare function WorktreeStackKit_resolveRepairTargets(options: {
    canonicalRootWorkspacePath: string;
    explicitTargets: readonly string[];
}): string[];
/** Reads a single env assignment value from a file, returning an empty string when missing. */
export declare function WorktreeStackKit_readRepairEnvValue(options: {
    envFilePath: string;
    key: string;
}): string;
/** Resolves a machine-root directory from a configured env key plus explicit fallback policy. */
export declare function WorktreeStackKit_resolveRepairMachineRoot(options: {
    config: WorktreeStackKit_RepairCommandConfig;
    envFilePath: string;
    workspaceFallbackPath: string;
}): string;
/** Returns package env keys missing or blank in a worktree compared with a canonical env file. */
export declare function WorktreeStackKit_collectRepairPackageEnvMissingKeys(options: {
    canonicalEnvPath: string;
    envFilePath: string;
}): string[];
/** Backfills canonical-root package keys without overwriting worktree-specific nonblank values. */
export declare function WorktreeStackKit_syncRepairPackageEnvFromCanonical(options: {
    canonicalEnvPath: string;
    envFilePath: string;
}): string[];
//# sourceMappingURL=repair-command.d.ts.map