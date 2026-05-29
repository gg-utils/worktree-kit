/**
 * @fileoverview High-level configured runner for prepared-worktree creation commands.
 *
 * Flow: argv + project config -> generic create context -> package-owned preflight, Git/env,
 * artifact, install, integration, summary, and optional startup steps. Project adapters supply only
 * explicit config: service roots, derived port labels, environment renderers, and best-effort hooks.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/configured-create-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/create-command.ts - Generic prepared-worktree create runner that owns step sequencing and receives the operations map this module implements from explicit project config.
 * @see packages/worktree-kit/src/create-cli-context.ts - Parses argv and builds the base create context merged here with derived ports, integration statuses, and runtime machine root before delegation.
 * @see canonical-skills/worktrees/SKILL.md - Canonical consumer worktree lifecycle guidance that situates prepared-worktree creation relative to align, update, merge, and local-edge workflows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_CreateBaseContext, type WorktreeStackKit_CreateCliContextConfig } from "./create-cli-context.js";
import { type WorktreeStackKit_CreateCommandContext, type WorktreeStackKit_CreateCommandServiceRoot } from "./create-command.js";
import { type WorktreeStackKit_CreateEnvOrchestrationConfig } from "./create-env-orchestration.js";
import { type WorktreeStackKit_CreateBestEffortHook, type WorktreeStackKit_CreatePostProvisionConfig, type WorktreeStackKit_CreatePostProvisionContext } from "./create-post-provision.js";
import { type WorktreeStackKit_CreatePreflightConfig } from "./create-preflight-validation.js";
import { type WorktreeStackKit_CreateRealmAndGitConfig } from "./create-realm-and-git.js";
export type WorktreeStackKit_ConfiguredCreateContext = Omit<WorktreeStackKit_CreateBaseContext, "antigravityRegistrationStatus" | "codexRegistrationStatus" | "machineRoot"> & WorktreeStackKit_CreateCommandContext & {
    derivedPorts: ReadonlyMap<string, number>;
    integrationStatuses: Map<string, string>;
    runtimeMachineRoot: string;
};
export type WorktreeStackKit_ConfiguredCreateFallbackEnvOptions = {
    context: WorktreeStackKit_ConfiguredCreateContext;
    envFilePath: string;
    service: string;
    serviceRoot: string;
};
export type WorktreeStackKit_ConfiguredCreateServiceDefinition = {
    configureFallbackEnvFile?: (options: WorktreeStackKit_ConfiguredCreateFallbackEnvOptions) => void;
    relativePath: string;
    service: string;
};
export type WorktreeStackKit_ConfiguredCreateResolvedServiceRoot = WorktreeStackKit_CreateCommandServiceRoot & WorktreeStackKit_ConfiguredCreateServiceDefinition;
export type WorktreeStackKit_ConfiguredCreateIntegrationStatus = {
    key: string;
    status: string;
};
export type WorktreeStackKit_ConfiguredCreateDerivedPortDebugField = {
    key: string;
    label: string;
};
export type WorktreeStackKit_ConfiguredCreatePostHook = {
    buildHook: (context: WorktreeStackKit_CreatePostProvisionContext) => WorktreeStackKit_CreateBestEffortHook;
    failureStatus?: string;
    statusKey?: string;
    successStatus?: string;
};
export type WorktreeStackKit_ConfiguredCreateCommandConfig = {
    aliasRefreshHook?: WorktreeStackKit_ConfiguredCreatePostHook;
    buildEnvOrchestrationConfig: (context: WorktreeStackKit_ConfiguredCreateContext) => WorktreeStackKit_CreateEnvOrchestrationConfig;
    cliContext: WorktreeStackKit_CreateCliContextConfig;
    derivedPortDebugFields: readonly WorktreeStackKit_ConfiguredCreateDerivedPortDebugField[];
    derivePorts: (slot: number) => ReadonlyMap<string, number>;
    initialIntegrationStatuses: readonly WorktreeStackKit_ConfiguredCreateIntegrationStatus[];
    postProvision: WorktreeStackKit_CreatePostProvisionConfig;
    preflight: WorktreeStackKit_CreatePreflightConfig;
    preflightPorts: (context: WorktreeStackKit_ConfiguredCreateContext) => readonly number[];
    realmAndGit: WorktreeStackKit_CreateRealmAndGitConfig;
    registrationHooks: readonly WorktreeStackKit_ConfiguredCreatePostHook[];
    serviceRoots: readonly WorktreeStackKit_ConfiguredCreateServiceDefinition[];
};
export type WorktreeStackKit_RunConfiguredCreateCommandOptions = {
    argv: readonly string[];
    config: WorktreeStackKit_ConfiguredCreateCommandConfig;
    exitProcess: (status: number) => never;
};
/** Runs a prepared-worktree create command from explicit reusable config and project hooks. */
export declare function WorktreeStackKit_runConfiguredCreateCommand(options: WorktreeStackKit_RunConfiguredCreateCommandOptions): void;
//# sourceMappingURL=configured-create-command.d.ts.map