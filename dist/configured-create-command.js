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
import path from "node:path";
import { worktreeStackPrintKv } from "@gg-utils/worktree-core/foundation";
import { WorktreeStackKit_buildCreateBaseContext, WorktreeStackKit_parseCreateArgs, WorktreeStackKit_printCreateBaseDebugContext, } from "./create-cli-context.js";
import { WorktreeStackKit_runCreateCommand, } from "./create-command.js";
import { WorktreeStackKit_materializeCreateEnvFiles, WorktreeStackKit_prepareCreatePackageEnvFile, WorktreeStackKit_syncCreateLocalAgentFiles, WorktreeStackKit_writeCreateRuntimeEnvFile, } from "./create-env-orchestration.js";
import { WorktreeStackKit_generateCreateArtifacts, WorktreeStackKit_openCreateEditor, WorktreeStackKit_printCreateSummary, WorktreeStackKit_runCreateBestEffortHook, WorktreeStackKit_runCreateInstallIfRequested, WorktreeStackKit_startCreateInCurrentTerminal, WorktreeStackKit_startCreateInWindow, } from "./create-post-provision.js";
import { WorktreeStackKit_requireCreatePrerequisites, WorktreeStackKit_validateCreateBaseBranchExists, WorktreeStackKit_validateCreateTargetLocation, WorktreeStackKit_validateGeneratedCreateArtifacts, WorktreeStackKit_validateUniqueCreateWorktreeIdentity, WorktreeStackKit_warnIfCreatePortsAreBusy, } from "./create-preflight-validation.js";
import { WorktreeStackKit_checkoutCreateSubmoduleBranch, WorktreeStackKit_configureCreateWorktreeGitSafety, WorktreeStackKit_ensureCreateRootBranchUpstream, WorktreeStackKit_ensureCreateSubmoduleBranchUpstream, WorktreeStackKit_ensureCreateWorktree, WorktreeStackKit_initializeCreateSubmodules, WorktreeStackKit_resolveCreateRealmAssignment, WorktreeStackKit_resolveCreateWorktreePath, } from "./create-realm-and-git.js";
function WorktreeStackKit_buildConfiguredCreateContext(options) {
    const baseContext = WorktreeStackKit_buildCreateBaseContext({
        config: options.config.cliContext,
        createOptions: options.createOptions,
    });
    const { antigravityRegistrationStatus: _antigravityRegistrationStatus, codexRegistrationStatus: _codexRegistrationStatus, machineRoot, ...contextWithoutLegacyFields } = baseContext;
    const integrationStatuses = new Map();
    for (const status of options.config.initialIntegrationStatuses) {
        integrationStatuses.set(status.key, status.status);
    }
    return {
        ...contextWithoutLegacyFields,
        derivedPorts: options.config.derivePorts(baseContext.options.slot),
        integrationStatuses,
        runtimeMachineRoot: machineRoot,
    };
}
function WorktreeStackKit_createPostProvisionContext(context) {
    return {
        currentStep: context.currentStep,
        derivedPorts: context.derivedPorts,
        installCleanlinessStatus: context.installCleanlinessStatus,
        integrationStatuses: context.integrationStatuses,
        options: context.options,
        primaryWorkspacePath: context.primaryWorkspacePath,
        realmAssignmentSource: context.realmAssignmentSource,
        realmSlug: context.realmSlug,
        rootDir: context.rootDir,
        runtimeMachineRoot: context.runtimeMachineRoot,
        worktreePath: context.worktreePath,
    };
}
function WorktreeStackKit_syncStepFromPostProvisionContext(options) {
    options.context.currentStep = options.postContext.currentStep;
}
function WorktreeStackKit_runConfiguredCreatePostHook(options) {
    if (options.hookConfig === undefined) {
        return;
    }
    const postContext = WorktreeStackKit_createPostProvisionContext(options.context);
    const succeeded = WorktreeStackKit_runCreateBestEffortHook({
        context: postContext,
        hook: options.hookConfig.buildHook(postContext),
    });
    if (options.hookConfig.statusKey) {
        options.context.integrationStatuses.set(options.hookConfig.statusKey, succeeded
            ? (options.hookConfig.successStatus ?? "succeeded")
            : (options.hookConfig.failureStatus ?? "failed"));
    }
    WorktreeStackKit_syncStepFromPostProvisionContext({
        context: options.context,
        postContext,
    });
}
function WorktreeStackKit_resolveConfiguredCreateServiceRoots(options) {
    return options.config.serviceRoots.map((serviceRoot) => ({
        ...serviceRoot,
        root: path.join(options.context.worktreePath, serviceRoot.relativePath),
    }));
}
function WorktreeStackKit_prepareConfiguredCreateFallbackEnvFiles(options) {
    const envConfig = options.config.buildEnvOrchestrationConfig(options.context);
    for (const serviceRoot of options.serviceRoots) {
        WorktreeStackKit_prepareCreatePackageEnvFile({
            config: envConfig,
            context: options.context,
            serviceRoot: serviceRoot.root,
        });
        serviceRoot.configureFallbackEnvFile?.({
            context: options.context,
            envFilePath: path.join(serviceRoot.root, envConfig.packageEnvFileName),
            service: serviceRoot.service,
            serviceRoot: serviceRoot.root,
        });
    }
}
function WorktreeStackKit_printConfiguredCreateDebugContext(options) {
    WorktreeStackKit_printCreateBaseDebugContext({
        ...options.context,
        machineRoot: options.context.runtimeMachineRoot,
    });
    for (const field of options.config.derivedPortDebugFields) {
        const value = options.context.derivedPorts.get(field.key);
        if (value !== undefined) {
            worktreeStackPrintKv(field.label, String(value));
        }
    }
}
/** Runs a prepared-worktree create command from explicit reusable config and project hooks. */
export function WorktreeStackKit_runConfiguredCreateCommand(options) {
    const parsedOptions = WorktreeStackKit_parseCreateArgs(options.argv, options.config.cliContext);
    if (parsedOptions === null) {
        options.exitProcess(0);
    }
    const context = WorktreeStackKit_buildConfiguredCreateContext({
        config: options.config,
        createOptions: parsedOptions,
    });
    WorktreeStackKit_runCreateCommand({
        context,
        operations: {
            checkoutSubmoduleBranch: (operationContext, submoduleRoot, branchName) => {
                WorktreeStackKit_checkoutCreateSubmoduleBranch({
                    branchName,
                    config: options.config.realmAndGit,
                    context: operationContext,
                    submoduleRoot,
                });
            },
            configureWorktreeGitSafety: (operationContext) => {
                WorktreeStackKit_configureCreateWorktreeGitSafety(operationContext);
            },
            ensureRootBranchUpstream: (operationContext) => {
                WorktreeStackKit_ensureCreateRootBranchUpstream({
                    config: options.config.realmAndGit,
                    context: operationContext,
                });
            },
            ensureSubmoduleBranchUpstream: (operationContext, submoduleRoot, branchName) => {
                operationContext.currentStep = `configure-${path.basename(submoduleRoot)}-upstream`;
                WorktreeStackKit_ensureCreateSubmoduleBranchUpstream({
                    branchName,
                    config: options.config.realmAndGit,
                    submoduleRoot,
                });
            },
            ensureWorktree: (operationContext) => {
                WorktreeStackKit_ensureCreateWorktree(operationContext);
            },
            exitProcess: options.exitProcess,
            generateWorktreeArtifacts: (operationContext) => {
                WorktreeStackKit_generateCreateArtifacts({
                    config: options.config.postProvision,
                    context: WorktreeStackKit_createPostProvisionContext(operationContext),
                });
            },
            initializeSubmodules: (operationContext) => {
                WorktreeStackKit_initializeCreateSubmodules({
                    config: options.config.realmAndGit,
                    context: operationContext,
                });
            },
            materializeWorktreeEnvFiles: (operationContext) => WorktreeStackKit_materializeCreateEnvFiles({
                config: options.config.buildEnvOrchestrationConfig(operationContext),
                context: operationContext,
            }),
            openWorktreeInEditor: (operationContext) => {
                const postContext = WorktreeStackKit_createPostProvisionContext(operationContext);
                WorktreeStackKit_openCreateEditor({
                    config: options.config.postProvision,
                    context: postContext,
                });
                WorktreeStackKit_syncStepFromPostProvisionContext({
                    context: operationContext,
                    postContext,
                });
            },
            prepareFallbackEnvFiles: (operationContext, serviceRoots) => {
                WorktreeStackKit_prepareConfiguredCreateFallbackEnvFiles({
                    config: options.config,
                    context: operationContext,
                    serviceRoots,
                });
            },
            printDebugContext: (operationContext) => {
                WorktreeStackKit_printConfiguredCreateDebugContext({
                    config: options.config,
                    context: operationContext,
                });
            },
            printSummary: (operationContext) => {
                WorktreeStackKit_printCreateSummary({
                    config: options.config.postProvision,
                    context: WorktreeStackKit_createPostProvisionContext(operationContext),
                });
            },
            refreshWorktreeAliases: (operationContext) => {
                WorktreeStackKit_runConfiguredCreatePostHook({
                    context: operationContext,
                    hookConfig: options.config.aliasRefreshHook,
                });
            },
            registerWorktreeInFirstEditor: (operationContext) => {
                WorktreeStackKit_runConfiguredCreatePostHook({
                    context: operationContext,
                    hookConfig: options.config.registrationHooks[0],
                });
            },
            registerWorktreeInSecondEditor: (operationContext) => {
                WorktreeStackKit_runConfiguredCreatePostHook({
                    context: operationContext,
                    hookConfig: options.config.registrationHooks[1],
                });
            },
            requirePrerequisites: (operationContext) => {
                WorktreeStackKit_requireCreatePrerequisites({
                    config: options.config.preflight,
                    context: operationContext,
                });
            },
            resolveRealmAssignment: (operationContext) => {
                WorktreeStackKit_resolveCreateRealmAssignment({
                    config: options.config.realmAndGit,
                    context: operationContext,
                });
            },
            resolveServiceRoots: (operationContext) => WorktreeStackKit_resolveConfiguredCreateServiceRoots({
                config: options.config,
                context: operationContext,
            }),
            resolveWorktreePath: (operationContext) => {
                WorktreeStackKit_resolveCreateWorktreePath(operationContext);
            },
            runInstallIfRequested: (operationContext) => {
                operationContext.installCleanlinessStatus =
                    WorktreeStackKit_runCreateInstallIfRequested({
                        config: options.config.postProvision,
                        context: WorktreeStackKit_createPostProvisionContext(operationContext),
                    });
            },
            startWorktreeInCurrentTerminal: (operationContext) => {
                const postContext = WorktreeStackKit_createPostProvisionContext(operationContext);
                const status = WorktreeStackKit_startCreateInCurrentTerminal({
                    config: options.config.postProvision,
                    context: postContext,
                });
                WorktreeStackKit_syncStepFromPostProvisionContext({
                    context: operationContext,
                    postContext,
                });
                if (status !== null) {
                    options.exitProcess(status);
                }
            },
            startWorktreeInWindow: (operationContext) => {
                const postContext = WorktreeStackKit_createPostProvisionContext(operationContext);
                WorktreeStackKit_startCreateInWindow({
                    config: options.config.postProvision,
                    context: postContext,
                });
                WorktreeStackKit_syncStepFromPostProvisionContext({
                    context: operationContext,
                    postContext,
                });
            },
            syncLocalAgentFiles: (operationContext) => {
                operationContext.currentStep = "sync-local-agent-files";
                WorktreeStackKit_syncCreateLocalAgentFiles({
                    config: options.config.buildEnvOrchestrationConfig(operationContext),
                    context: operationContext,
                });
            },
            validateBaseBranchExists: (operationContext) => {
                WorktreeStackKit_validateCreateBaseBranchExists(operationContext);
            },
            validateGeneratedArtifacts: (operationContext) => {
                WorktreeStackKit_validateGeneratedCreateArtifacts({
                    config: options.config.preflight,
                    context: operationContext,
                });
            },
            validateTargetLocation: (operationContext) => {
                WorktreeStackKit_validateCreateTargetLocation(operationContext);
            },
            validateUniqueWorktreeIdentity: (operationContext) => {
                WorktreeStackKit_validateUniqueCreateWorktreeIdentity({
                    config: options.config.preflight,
                    context: operationContext,
                });
            },
            warnIfPortsAreBusy: (operationContext) => {
                WorktreeStackKit_warnIfCreatePortsAreBusy({
                    context: operationContext,
                    ports: options.config.preflightPorts(operationContext),
                });
            },
            writeRuntimeEnvFile: (operationContext) => {
                WorktreeStackKit_writeCreateRuntimeEnvFile({
                    config: options.config.buildEnvOrchestrationConfig(operationContext),
                    context: operationContext,
                });
            },
        },
    });
}
//# sourceMappingURL=configured-create-command.js.map