/**
 * @fileoverview Product-neutral orchestration order for prepared-worktree creation commands.
 *
 * Flow: validated create context + project adapter operations -> preflight, Git setup, env
 * materialization, generated artifacts, installs, integrations, summary, and optional startup.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_runCreateCommand } from "@gg-utils/worktree-kit";
 *
 * WorktreeStackKit_runCreateCommand({ context, operations });
 * ```
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured prepared-worktree runner that builds the concrete `WorktreeStackKit_CreateCommandOperations` map and delegates sequencing to `WorktreeStackKit_runCreateCommand` in this module.
 * @see packages/worktree-kit/src/create-command.unit.test.ts - Node:test harness that stubs every adapter hook to assert step ordering, env-materialization branching, and failure-path debug plus `exitProcess` wiring.
 * @see scripts/worktree-stack/commands/create.ts - Root worktree-stack CLI entrypoint that invokes configured creation, exercising this sequencing contract end-to-end through the configured runner.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Runs the package-owned create command sequence using project-supplied adapter operations. */
export function WorktreeStackKit_runCreateCommand(options) {
    const { context, operations } = options;
    try {
        operations.requirePrerequisites(context);
        operations.validateBaseBranchExists(context);
        operations.resolveRealmAssignment(context);
        operations.resolveWorktreePath(context);
        operations.validateTargetLocation(context);
        operations.validateUniqueWorktreeIdentity(context);
        operations.warnIfPortsAreBusy(context);
        context.currentStep = "ensure-worktree";
        operations.ensureWorktree(context);
        operations.configureWorktreeGitSafety(context);
        operations.ensureRootBranchUpstream(context);
        context.currentStep = "initialize-submodules";
        operations.initializeSubmodules(context);
        const serviceRoots = operations.resolveServiceRoots(context);
        context.currentStep = "checkout-submodule-branches";
        console.log("[info] Checking out submodule branches...");
        for (const serviceRoot of serviceRoots) {
            operations.checkoutSubmoduleBranch(context, serviceRoot.root, context.options.submoduleBranch);
            operations.ensureSubmoduleBranchUpstream(context, serviceRoot.root, context.options.submoduleBranch);
        }
        operations.syncLocalAgentFiles(context);
        context.currentStep = "prepare-env-files";
        console.log("[info] Preparing env files...");
        if (!operations.materializeWorktreeEnvFiles(context)) {
            operations.prepareFallbackEnvFiles(context, serviceRoots);
            context.currentStep = "write-runtime-env";
            operations.writeRuntimeEnvFile(context);
        }
        context.currentStep = "generate-worktree-artifacts";
        operations.generateWorktreeArtifacts(context);
        operations.validateGeneratedArtifacts(context);
        context.currentStep = "install-dependencies";
        operations.runInstallIfRequested(context);
        operations.registerWorktreeInFirstEditor(context);
        operations.registerWorktreeInSecondEditor(context);
        operations.openWorktreeInEditor(context);
        operations.startWorktreeInWindow(context);
        operations.refreshWorktreeAliases(context);
        operations.printSummary(context);
        operations.startWorktreeInCurrentTerminal(context);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        operations.printDebugContext(context);
        operations.exitProcess(1);
    }
}
