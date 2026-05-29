/**
 * @fileoverview Config-driven env materialization and runtime env helpers for worktree creation.
 *
 * Flow: create context + project config -> local state sync, package env seeding, external
 * materialization hooks, and runtime env-file rendering without project-specific key names in the
 * reusable package.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-env-orchestration.unit.test.ts
 *
 * @see packages/worktree-kit/src/env-file.ts - Env map read, reference seed resolution, merge, and duplicate-key normalization helpers invoked while preparing missing package env files.
 * @see packages/worktree-kit/src/local-state-sync.ts - Local file and directory sync primitives used when copying configured agent or operator state into a new worktree path.
 * @see packages/worktree-kit/src/configured-create-command.ts - Prepared-worktree create runner that wires these orchestration entrypoints into the full create-command step map from project config.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  worktreeStackError,
  worktreeStackRunCommand,
} from "@gg-utils/worktree-core/foundation";

import {
  WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference,
  WorktreeStackKit_normalizeEnvFileDuplicateKeys,
  WorktreeStackKit_readEnvMap,
  WorktreeStackKit_resolveReferenceEnvSeedFile,
} from "./env-file.js";
import {
  WorktreeStackKit_syncLocalDirectoriesIntoTarget,
  WorktreeStackKit_syncLocalFilesIntoTarget,
  type WorktreeStackKit_LocalStateSyncConfig,
} from "./local-state-sync.js";

export type WorktreeStackKit_CreateEnvContext = {
  localLogicalEnvironmentFile: string;
  localStateSourceWorkspacePath: string;
  options: {
    copyEnvFromMain: boolean;
  };
  primaryWorkspaceEnvFile: string;
  primaryWorkspacePath: string;
  realmSlug: string;
  rootDir: string;
  runtimeMachineRoot: string;
  worktreePath: string;
};

export type WorktreeStackKit_RenderCreateRuntimeEnvOptions = {
  context: WorktreeStackKit_CreateEnvContext;
  environment: NodeJS.ProcessEnv;
  fallbackUserName: string;
  logicalEnv: ReadonlyMap<string, string>;
  primaryEnv: ReadonlyMap<string, string>;
};

export type WorktreeStackKit_CreateEnvOrchestrationConfig = {
  buildMaterializeArgs: (
    context: WorktreeStackKit_CreateEnvContext,
  ) => readonly string[];
  envMaterializeFailureMessage: string;
  environment: NodeJS.ProcessEnv;
  localStateSync: WorktreeStackKit_LocalStateSyncConfig;
  materializeEnvFiles?: (
    context: WorktreeStackKit_CreateEnvContext,
  ) => boolean | void;
  materializeCommand: string;
  packageEnvFileName: string;
  renderRuntimeEnvFile: (
    options: WorktreeStackKit_RenderCreateRuntimeEnvOptions,
  ) => string;
  runtimeEnvFileName: string;
  syncSharedRuntimeEnvKeys: (options: {
    sourceWorkspacePath: string;
    targetWorkspacePath: string;
  }) => void;
};

/** Runs configured env materialization, with legacy copy-from-source fallback when requested. */
export function WorktreeStackKit_materializeCreateEnvFiles(options: {
  config: WorktreeStackKit_CreateEnvOrchestrationConfig;
  context: WorktreeStackKit_CreateEnvContext;
}): boolean {
  const { config, context } = options;
  if (config.materializeEnvFiles) {
    const materialized = config.materializeEnvFiles(context);
    if (materialized !== false) {
      return true;
    }
    if (context.options.copyEnvFromMain) {
      return false;
    }
    worktreeStackError(config.envMaterializeFailureMessage);
  }

  const result = worktreeStackRunCommand(
    config.materializeCommand,
    [...config.buildMaterializeArgs(context)],
    {
      allowFailure: true,
      cwd: context.rootDir,
      stdio: "ignore",
    },
  );
  if (result.status === 0) {
    return true;
  }

  if (context.options.copyEnvFromMain) {
    return false;
  }

  worktreeStackError(config.envMaterializeFailureMessage);
}

/** Copies configured local agent/operator files and directories into the target worktree. */
export function WorktreeStackKit_syncCreateLocalAgentFiles(options: {
  config: WorktreeStackKit_CreateEnvOrchestrationConfig;
  context: WorktreeStackKit_CreateEnvContext;
}): void {
  const { config, context } = options;
  WorktreeStackKit_syncLocalFilesIntoTarget({
    config: config.localStateSync,
    sourceWorkspacePath: context.localStateSourceWorkspacePath,
    targetWorkspacePath: context.worktreePath,
  });
  WorktreeStackKit_syncLocalDirectoriesIntoTarget({
    config: config.localStateSync,
    sourceWorkspacePath: context.localStateSourceWorkspacePath,
    targetWorkspacePath: context.worktreePath,
  });
}

/** Seeds a missing package env file from source workspace env, templates, or examples. */
export function WorktreeStackKit_prepareCreatePackageEnvFile(options: {
  config: WorktreeStackKit_CreateEnvOrchestrationConfig;
  context: WorktreeStackKit_CreateEnvContext;
  serviceRoot: string;
}): void {
  const { config, context, serviceRoot } = options;
  const targetEnv = path.join(serviceRoot, config.packageEnvFileName);
  if (fs.existsSync(targetEnv)) {
    return;
  }

  const serviceRelative = path.relative(context.worktreePath, serviceRoot);
  const mainProjectEnv = path.join(
    context.localStateSourceWorkspacePath,
    serviceRelative,
    config.packageEnvFileName,
  );
  const referenceEnv = WorktreeStackKit_resolveReferenceEnvSeedFile(serviceRoot);

  if (context.options.copyEnvFromMain && fs.existsSync(mainProjectEnv)) {
    fs.copyFileSync(mainProjectEnv, targetEnv);
    if (referenceEnv) {
      WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference(
        targetEnv,
        referenceEnv,
      );
    }
    WorktreeStackKit_normalizeEnvFileDuplicateKeys(targetEnv);
    return;
  }

  if (referenceEnv) {
    fs.copyFileSync(referenceEnv, targetEnv);
    if (fs.existsSync(mainProjectEnv)) {
      WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference(
        targetEnv,
        mainProjectEnv,
      );
    }
    WorktreeStackKit_normalizeEnvFileDuplicateKeys(targetEnv);
    return;
  }

  worktreeStackError(
    `No env template or example found in ${serviceRoot}`,
  );
}

/** Writes the configured runtime env file and syncs shared runtime env keys from the source. */
export function WorktreeStackKit_writeCreateRuntimeEnvFile(options: {
  config: WorktreeStackKit_CreateEnvOrchestrationConfig;
  context: WorktreeStackKit_CreateEnvContext;
}): void {
  const { config, context } = options;
  const envFile = path.join(context.worktreePath, config.runtimeEnvFileName);
  const document = config.renderRuntimeEnvFile({
    context,
    environment: config.environment,
    fallbackUserName: os.userInfo().username,
    logicalEnv: WorktreeStackKit_readEnvMap(context.localLogicalEnvironmentFile),
    primaryEnv: WorktreeStackKit_readEnvMap(context.primaryWorkspaceEnvFile),
  });

  fs.writeFileSync(
    envFile,
    document.endsWith("\n") ? document : `${document}\n`,
    "utf8",
  );

  config.syncSharedRuntimeEnvKeys({
    sourceWorkspacePath: context.localStateSourceWorkspacePath,
    targetWorkspacePath: context.worktreePath,
  });
}
