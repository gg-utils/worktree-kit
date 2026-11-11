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
import { type WorktreeStackKit_LocalStateSyncConfig } from "./local-state-sync.js";
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
    buildMaterializeArgs: (context: WorktreeStackKit_CreateEnvContext) => readonly string[];
    envMaterializeFailureMessage: string;
    environment: NodeJS.ProcessEnv;
    localStateSync: WorktreeStackKit_LocalStateSyncConfig;
    materializeEnvFiles?: (context: WorktreeStackKit_CreateEnvContext) => boolean | void;
    materializeCommand: string;
    packageEnvFileName: string;
    renderRuntimeEnvFile: (options: WorktreeStackKit_RenderCreateRuntimeEnvOptions) => string;
    runtimeEnvFileName: string;
    syncSharedRuntimeEnvKeys: (options: {
        sourceWorkspacePath: string;
        targetWorkspacePath: string;
    }) => void;
};
/** Runs configured env materialization, with legacy copy-from-source fallback when requested. */
export declare function WorktreeStackKit_materializeCreateEnvFiles(options: {
    config: WorktreeStackKit_CreateEnvOrchestrationConfig;
    context: WorktreeStackKit_CreateEnvContext;
}): boolean;
/** Copies configured local agent/operator files and directories into the target worktree. */
export declare function WorktreeStackKit_syncCreateLocalAgentFiles(options: {
    config: WorktreeStackKit_CreateEnvOrchestrationConfig;
    context: WorktreeStackKit_CreateEnvContext;
}): void;
/** Seeds a missing package env file from source workspace env, templates, or examples. */
export declare function WorktreeStackKit_prepareCreatePackageEnvFile(options: {
    config: WorktreeStackKit_CreateEnvOrchestrationConfig;
    context: WorktreeStackKit_CreateEnvContext;
    serviceRoot: string;
}): void;
/** Writes the configured runtime env file and syncs shared runtime env keys from the source. */
export declare function WorktreeStackKit_writeCreateRuntimeEnvFile(options: {
    config: WorktreeStackKit_CreateEnvOrchestrationConfig;
    context: WorktreeStackKit_CreateEnvContext;
}): void;
