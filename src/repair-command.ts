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
import fs from "node:fs";
import path from "node:path";

import {
  EnvMaterialize_normalizeRenderedContent,
  EnvMaterialize_parseEnvDocument,
  EnvMaterialize_renderDocument,
} from "@gg-utils/env-materialize-core/env-document";
import {
  worktreeStackError,
  worktreeStackInfo,
  worktreeStackPrintKv,
  worktreeStackRequireFile,
  worktreeStackRunCommand,
  worktreeStackWarn,
  type WorktreeStack_RunCommandOptions,
} from "@gg-utils/worktree-core/foundation";
import {
  worktreeStackIsTransientHelperWorktreePath,
  worktreeStackListRepairablePreparedWorktrees,
  worktreeStackMetadataPathForWorktree,
  worktreeStackReadPreparedStateField,
  worktreeStackResolveCanonicalRootWorkspacePath,
  worktreeStackResolvePreparedCanonicalRootWorkspacePath,
} from "@gg-utils/worktree-core/worktree-discovery";

/** Indicates argv for repair is missing, contradictory, or references an unsupported flag. */
class WorktreeStackKit_RepairCliUsageError extends Error {}

/** Whether repair backfills package `.env` keys from a canonical workspace. */
export type WorktreeStackKit_RepairPackageEnvMode =
  | "disabled"
  | "missing-or-blank";

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
  buildMaterializeEnvCommand?: (
    context: WorktreeStackKit_RepairCommandContext,
  ) => WorktreeStackKit_RepairConfiguredCommand;
  buildRegenerateArtifactsCommand?: (
    context: WorktreeStackKit_RepairCommandContext,
  ) => WorktreeStackKit_RepairConfiguredCommand;
  materializeEnvFiles?: (
    context: WorktreeStackKit_RepairCommandContext,
  ) => void;
  regenerateArtifacts?: (
    context: WorktreeStackKit_RepairCommandContext,
  ) => void;
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
export function WorktreeStackKit_renderRepairUsage(
  config: WorktreeStackKit_RepairCommandConfig,
): string {
  return [
    "Usage:",
    ...config.usage.commandLines.map((line) => `  ${line}`),
    "",
    "Options:",
    "  --worktree <path>             Repair only this prepared worktree path (repeatable)",
    "  --include-package-env         Also backfill package .env files using blank-or-missing sync",
    "  --package-env-mode <mode>     Package env sync mode " +
      "(supported: missing-or-blank; legacy alias: missing-only)",
    "  --dry-run                     Print the intended actions without mutating files",
    "  --help, -h                    Show this help",
    "",
    "Default behavior:",
    ...config.usage.defaultBehaviorLines.map((line) => `  - ${line}`),
    "",
    "Package env behavior:",
    ...config.usage.packageEnvBehaviorLines.map((line) => `  - ${line}`),
    "",
    "Examples:",
    ...config.usage.examples.map((line) => `  ${line}`),
    "",
    "Notes:",
    ...config.usage.notes.map((line) => `  - ${line}`),
  ].join("\n");
}

/** Parses repair argv without consulting global process argv. */
export function WorktreeStackKit_parseRepairArgs(options: {
  argv: readonly string[];
  config: WorktreeStackKit_RepairCommandConfig;
}): WorktreeStackKit_RepairOptions | null {
  const { argv, config } = options;
  const parsedOptions: WorktreeStackKit_RepairOptions = {
    dryRun: false,
    packageEnvMode: "disabled",
    targetWorktrees: [],
  };

  for (let index = 0; index < argv.length; ) {
    const argument = argv[index];
    switch (argument) {
      case "--worktree": {
        const value = argv[index + 1];
        if (!value) {
          throw new WorktreeStackKit_RepairCliUsageError("Missing value for --worktree");
        }
        parsedOptions.targetWorktrees.push(value);
        index += 2;
        break;
      }
      case "--include-package-env":
        parsedOptions.packageEnvMode = "missing-or-blank";
        index += 1;
        break;
      case "--package-env-mode": {
        const value = argv[index + 1];
        if (!value) {
          throw new WorktreeStackKit_RepairCliUsageError(
            "Missing value for --package-env-mode",
          );
        }
        parsedOptions.packageEnvMode = WorktreeStackKit_normalizeRepairPackageEnvMode(value);
        index += 2;
        break;
      }
      case "--dry-run":
        parsedOptions.dryRun = true;
        index += 1;
        break;
      case "--help":
      case "-h":
        console.log(WorktreeStackKit_renderRepairUsage(config));
        return null;
      default:
        throw new WorktreeStackKit_RepairCliUsageError(
          `Unknown argument: ${String(argument)}`,
        );
    }
  }

  return parsedOptions;
}

/** Normalizes supported package env mode values plus the legacy missing-only alias. */
export function WorktreeStackKit_normalizeRepairPackageEnvMode(
  value: string,
): WorktreeStackKit_RepairPackageEnvMode {
  if (value === "missing-only" || value === "missing-or-blank") {
    return "missing-or-blank";
  }
  if (value === "disabled") {
    return "disabled";
  }

  throw new WorktreeStackKit_RepairCliUsageError(
    `Unsupported package env sync mode: ${value}`,
  );
}

/** Runs the config-driven repair CLI and returns the intended process exit code. */
export function WorktreeStackKit_runRepairCli(
  options: WorktreeStackKit_RunRepairCliOptions,
): number {
  const { argv, config } = options;
  try {
    const repairOptions = WorktreeStackKit_parseRepairArgs({ argv, config });
    if (repairOptions === null) {
      return 0;
    }

    WorktreeStackKit_runRepair({ config, repairOptions });
    return 0;
  } catch (error: unknown) {
    console.error(WorktreeStackKit_formatRepairCliErrorMessage(error));
    if (error instanceof WorktreeStackKit_RepairCliUsageError) {
      console.log(WorktreeStackKit_renderRepairUsage(config));
    }
    return 1;
  }
}

/** Orchestrates repair for every resolved worktree under the canonical root workspace. */
export function WorktreeStackKit_runRepair(options: {
  config: WorktreeStackKit_RepairCommandConfig;
  repairOptions: WorktreeStackKit_RepairOptions;
}): void {
  const { config, repairOptions } = options;
  const canonicalRootWorkspacePath = worktreeStackResolveCanonicalRootWorkspacePath(
    config.projectRoot,
  );
  const rootWorkspaceEnvFilePath = path.join(
    canonicalRootWorkspacePath,
    config.envFileName,
  );
  const targetPaths = WorktreeStackKit_resolveRepairTargets({
    canonicalRootWorkspacePath,
    explicitTargets: repairOptions.targetWorktrees,
  });

  for (const targetPath of targetPaths) {
    WorktreeStackKit_repairTargetWorkspace({
      canonicalRootWorkspacePath,
      config,
      repairOptions,
      rootWorkspaceEnvFilePath,
      worktreePath: targetPath,
    });
  }
}

/**
 * Resolves explicit repair paths or discovers registered prepared worktrees for the canonical root.
 */
export function WorktreeStackKit_resolveRepairTargets(options: {
  canonicalRootWorkspacePath: string;
  explicitTargets: readonly string[];
}): string[] {
  if (options.explicitTargets.length > 0) {
    return options.explicitTargets.map((target) => path.resolve(target));
  }

  return worktreeStackListRepairablePreparedWorktrees(options.canonicalRootWorkspacePath);
}

/** Reads a single env assignment value from a file, returning an empty string when missing. */
export function WorktreeStackKit_readRepairEnvValue(options: {
  envFilePath: string;
  key: string;
}): string {
  if (!fs.existsSync(options.envFilePath)) {
    return "";
  }

  const document = EnvMaterialize_parseEnvDocument(
    fs.readFileSync(options.envFilePath, "utf8"),
  );
  return document.valuesByKey.get(options.key) ?? "";
}

/** Resolves a machine-root directory from a configured env key plus explicit fallback policy. */
export function WorktreeStackKit_resolveRepairMachineRoot(options: {
  config: WorktreeStackKit_RepairCommandConfig;
  envFilePath: string;
  workspaceFallbackPath: string;
}): string {
  const generatedDirectory = WorktreeStackKit_readRepairEnvValue({
    envFilePath: options.envFilePath,
    key: options.config.machineRootEnvKey,
  });
  if (generatedDirectory.length === 0) {
    return path.join(
      options.workspaceFallbackPath,
      options.config.machineRootFallbackRelativePath,
    );
  }

  if (path.basename(generatedDirectory) === options.config.generatedDirLeafName) {
    return path.dirname(generatedDirectory);
  }

  return generatedDirectory;
}

/** Returns package env keys missing or blank in a worktree compared with a canonical env file. */
export function WorktreeStackKit_collectRepairPackageEnvMissingKeys(options: {
  canonicalEnvPath: string;
  envFilePath: string;
}): string[] {
  if (!fs.existsSync(options.envFilePath) || !fs.existsSync(options.canonicalEnvPath)) {
    return [];
  }

  const targetDocument = EnvMaterialize_parseEnvDocument(
    fs.readFileSync(options.envFilePath, "utf8"),
  );
  const canonicalDocument = EnvMaterialize_parseEnvDocument(
    fs.readFileSync(options.canonicalEnvPath, "utf8"),
  );
  const missingKeys: string[] = [];

  for (const line of canonicalDocument.lines) {
    if (line.kind !== "assignment" || line.normalizedValue.trim().length === 0) {
      continue;
    }

    const targetValue = targetDocument.valuesByKey.get(line.key);
    if (typeof targetValue !== "string" || targetValue.trim().length === 0) {
      missingKeys.push(line.key);
    }
  }

  return Array.from(new Set(missingKeys)).sort();
}

/** Backfills canonical-root package keys without overwriting worktree-specific nonblank values. */
export function WorktreeStackKit_syncRepairPackageEnvFromCanonical(options: {
  canonicalEnvPath: string;
  envFilePath: string;
}): string[] {
  if (!fs.existsSync(options.envFilePath) || !fs.existsSync(options.canonicalEnvPath)) {
    return [];
  }

  const canonicalDocument = EnvMaterialize_parseEnvDocument(
    fs.readFileSync(options.canonicalEnvPath, "utf8"),
  );
  const currentContent = fs.readFileSync(options.envFilePath, "utf8");
  const currentDocument = EnvMaterialize_parseEnvDocument(currentContent);
  const valuesToBackfill = new Map<string, string>();

  for (const line of canonicalDocument.lines) {
    if (line.kind !== "assignment" || line.normalizedValue.trim().length === 0) {
      continue;
    }

    const currentValue = currentDocument.valuesByKey.get(line.key);
    if (typeof currentValue !== "string" || currentValue.trim().length === 0) {
      valuesToBackfill.set(line.key, line.rawValue);
    }
  }

  if (valuesToBackfill.size === 0) {
    return [];
  }

  const nextContent = EnvMaterialize_renderDocument({
    document: currentDocument,
    valuesByKey: valuesToBackfill,
  });
  const normalizedCurrentContent = EnvMaterialize_normalizeRenderedContent(currentContent);
  const normalizedNextContent = EnvMaterialize_normalizeRenderedContent(nextContent);

  if (normalizedCurrentContent !== normalizedNextContent) {
    fs.writeFileSync(options.envFilePath, normalizedNextContent, "utf8");
  }

  return Array.from(valuesToBackfill.keys()).sort();
}

/** Formats unknown CLI errors consistently with the worktree prefix. */
function WorktreeStackKit_formatRepairCliErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith("[worktree] ")
    ? message
    : `[worktree] ERROR: ${message}`;
}

/** Runs project-supplied env materialization through an action hook or legacy command spec. */
function WorktreeStackKit_materializeRepairEnvFiles(options: {
  config: WorktreeStackKit_RepairCommandConfig;
  context: WorktreeStackKit_RepairCommandContext;
}): void {
  if (options.config.materializeEnvFiles) {
    options.config.materializeEnvFiles(options.context);
    return;
  }
  if (!options.config.buildMaterializeEnvCommand) {
    worktreeStackError("Repair env materialization hook is not configured.");
  }
  WorktreeStackKit_runConfiguredRepairCommand(
    options.config.buildMaterializeEnvCommand(options.context),
  );
}

/** Runs project-supplied artifact regeneration through an action hook or legacy command spec. */
function WorktreeStackKit_regenerateRepairArtifacts(options: {
  config: WorktreeStackKit_RepairCommandConfig;
  context: WorktreeStackKit_RepairCommandContext;
}): void {
  if (options.config.regenerateArtifacts) {
    options.config.regenerateArtifacts(options.context);
    return;
  }
  if (!options.config.buildRegenerateArtifactsCommand) {
    worktreeStackError("Repair artifact regeneration hook is not configured.");
  }
  WorktreeStackKit_runConfiguredRepairCommand(
    options.config.buildRegenerateArtifactsCommand(options.context),
  );
}

/** Runs the full repair pipeline for one prepared worktree path. */
function WorktreeStackKit_repairTargetWorkspace(options: {
  canonicalRootWorkspacePath: string;
  config: WorktreeStackKit_RepairCommandConfig;
  repairOptions: WorktreeStackKit_RepairOptions;
  rootWorkspaceEnvFilePath: string;
  worktreePath: string;
}): void {
  const {
    canonicalRootWorkspacePath,
    config,
    repairOptions,
    rootWorkspaceEnvFilePath,
    worktreePath,
  } = options;

  if (!fs.existsSync(worktreePath) || !fs.statSync(worktreePath).isDirectory()) {
    worktreeStackWarn(`Skipping missing worktree path: ${worktreePath}`);
    return;
  }
  if (worktreeStackIsTransientHelperWorktreePath(worktreePath)) {
    worktreeStackWarn(`Skipping transient helper worktree: ${worktreePath}`);
    return;
  }

  const envFilePath = path.join(worktreePath, config.envFileName);
  const metadataPath = worktreeStackMetadataPathForWorktree(worktreePath);
  const stackName =
    worktreeStackReadPreparedStateField(worktreePath, config.stackNameMetadataField) ?? "";
  const realmSlug =
    WorktreeStackKit_readRepairEnvValue({
      envFilePath,
      key: config.realmSlugEnvKey,
    }) ||
    worktreeStackReadPreparedStateField(worktreePath, config.realmSlugMetadataField) ||
    "";
  const resolvedCanonicalRootWorkspacePath =
    worktreeStackResolvePreparedCanonicalRootWorkspacePath(
      worktreePath,
      canonicalRootWorkspacePath,
    );

  worktreeStackInfo(`Repairing prepared worktree: ${worktreePath}`);
  worktreeStackPrintKv("stack-name", stackName || "<unknown>");
  worktreeStackPrintKv("realm-slug", realmSlug || "<unknown>");
  worktreeStackPrintKv("metadata-path", metadataPath);
  worktreeStackPrintKv(
    "canonical-root-workspace-path",
    resolvedCanonicalRootWorkspacePath,
  );
  worktreeStackPrintKv("package-env-mode", repairOptions.packageEnvMode);

  const machineRootPath = WorktreeStackKit_resolveRepairMachineRoot({
    config,
    envFilePath,
    workspaceFallbackPath: worktreePath,
  });

  if (repairOptions.dryRun) {
    WorktreeStackKit_printRepairDryRun({
      config,
      machineRootPath,
      packageEnvMode: repairOptions.packageEnvMode,
      resolvedCanonicalRootWorkspacePath,
      worktreePath,
    });
    return;
  }

  const context: WorktreeStackKit_RepairCommandContext = {
    canonicalRootWorkspacePath: resolvedCanonicalRootWorkspacePath,
    envFilePath,
    machineRootPath,
    packageEnvMode: repairOptions.packageEnvMode,
    rootWorkspaceEnvFilePath,
    worktreePath,
  };

  WorktreeStackKit_materializeRepairEnvFiles({ config, context });
  if (repairOptions.packageEnvMode === "missing-or-blank") {
    WorktreeStackKit_syncRepairPackageEnvsFromCanonicalRoot({
      canonicalRootWorkspacePath: resolvedCanonicalRootWorkspacePath,
      config,
      worktreePath,
    });
  }
  WorktreeStackKit_regenerateRepairArtifacts({ config, context });
  WorktreeStackKit_validateRepairGeneratedArtifacts({ config, worktreePath });
}

/** Prints dry-run-only repair details and optional package env key gaps. */
function WorktreeStackKit_printRepairDryRun(options: {
  config: WorktreeStackKit_RepairCommandConfig;
  machineRootPath: string;
  packageEnvMode: WorktreeStackKit_RepairPackageEnvMode;
  resolvedCanonicalRootWorkspacePath: string;
  worktreePath: string;
}): void {
  const {
    config,
    machineRootPath,
    packageEnvMode,
    resolvedCanonicalRootWorkspacePath,
    worktreePath,
  } = options;
  worktreeStackPrintKv("machine-root", machineRootPath);
  worktreeStackPrintKv("would-materialize-env-targets", packageEnvMode);
  if (packageEnvMode === "missing-or-blank") {
    WorktreeStackKit_dryRunRepairPackageEnvs({
      canonicalRootWorkspacePath: resolvedCanonicalRootWorkspacePath,
      config,
      worktreePath,
    });
  }
  worktreeStackPrintKv(
    "would-regenerate-artifacts",
    path.join(worktreePath, config.generatedArtifactPreviewRelativePath),
  );
}

/** Summarizes per-package env gaps against the canonical workspace during dry-run. */
function WorktreeStackKit_dryRunRepairPackageEnvs(options: {
  canonicalRootWorkspacePath: string;
  config: WorktreeStackKit_RepairCommandConfig;
  worktreePath: string;
}): void {
  const { canonicalRootWorkspacePath, config, worktreePath } = options;
  for (const packageConfig of config.packageConfigs) {
    const missingKeys = WorktreeStackKit_collectRepairPackageEnvMissingKeys({
      canonicalEnvPath: path.join(
        canonicalRootWorkspacePath,
        packageConfig.envRelativePath,
      ),
      envFilePath: path.join(worktreePath, packageConfig.envRelativePath),
    });
    worktreeStackPrintKv(
      packageConfig.missingRootKeysField,
      missingKeys.length > 0 ? missingKeys.join(",") : "<none>",
    );
  }
}

/** Backfills each configured package `.env` from the canonical root when keys are missing/blank. */
function WorktreeStackKit_syncRepairPackageEnvsFromCanonicalRoot(options: {
  canonicalRootWorkspacePath: string;
  config: WorktreeStackKit_RepairCommandConfig;
  worktreePath: string;
}): void {
  const { canonicalRootWorkspacePath, config, worktreePath } = options;
  for (const packageConfig of config.packageConfigs) {
    const backfilledKeys = WorktreeStackKit_syncRepairPackageEnvFromCanonical({
      canonicalEnvPath: path.join(
        canonicalRootWorkspacePath,
        packageConfig.envRelativePath,
      ),
      envFilePath: path.join(worktreePath, packageConfig.envRelativePath),
    });

    if (backfilledKeys.length > 0) {
      worktreeStackPrintKv(
        `${packageConfig.displayName}-backfilled-root-keys`,
        backfilledKeys.join(","),
      );
    }
  }
}

/** Runs one configured repair command through the shared worktree command primitive. */
function WorktreeStackKit_runConfiguredRepairCommand(
  command: WorktreeStackKit_RepairConfiguredCommand,
): void {
  const runOptions: WorktreeStack_RunCommandOptions = {
    allowFailure: command.allowFailure,
    cwd: command.cwd,
    env: command.env,
    stdio: command.stdio,
  };
  worktreeStackRunCommand(command.command, command.args, runOptions);
}

/** Verifies required generated artifacts exist after project-specific regeneration. */
function WorktreeStackKit_validateRepairGeneratedArtifacts(options: {
  config: WorktreeStackKit_RepairCommandConfig;
  worktreePath: string;
}): void {
  for (const requirement of options.config.generatedArtifactRequirements) {
    worktreeStackRequireFile(
      path.join(options.worktreePath, requirement.relativePath),
      requirement.description,
    );
  }
}
