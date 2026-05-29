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

export type WorktreeStackKit_CreateCommandContext = {
  currentStep: string;
  options: {
    submoduleBranch: string;
  };
  worktreePath: string;
};

export type WorktreeStackKit_CreateCommandServiceRoot = {
  root: string;
};

export type WorktreeStackKit_CreateCommandOperations<
  Context extends WorktreeStackKit_CreateCommandContext,
  ServiceRoot extends WorktreeStackKit_CreateCommandServiceRoot,
> = {
  checkoutSubmoduleBranch: (
    context: Context,
    submoduleRoot: string,
    branchName: string,
  ) => void;
  configureWorktreeGitSafety: (context: Context) => void;
  ensureRootBranchUpstream: (context: Context) => void;
  ensureSubmoduleBranchUpstream: (
    context: Context,
    submoduleRoot: string,
    branchName: string,
  ) => void;
  ensureWorktree: (context: Context) => void;
  exitProcess: (status: number) => never;
  generateWorktreeArtifacts: (context: Context) => void;
  initializeSubmodules: (context: Context) => void;
  materializeWorktreeEnvFiles: (context: Context) => boolean;
  openWorktreeInEditor: (context: Context) => void;
  prepareFallbackEnvFiles: (
    context: Context,
    serviceRoots: readonly ServiceRoot[],
  ) => void;
  printDebugContext: (context: Context) => void;
  printSummary: (context: Context) => void;
  refreshWorktreeAliases: (context: Context) => void;
  registerWorktreeInFirstEditor: (context: Context) => void;
  registerWorktreeInSecondEditor: (context: Context) => void;
  requirePrerequisites: (context: Context) => void;
  resolveRealmAssignment: (context: Context) => void;
  resolveServiceRoots: (context: Context) => readonly ServiceRoot[];
  resolveWorktreePath: (context: Context) => void;
  runInstallIfRequested: (context: Context) => void;
  startWorktreeInCurrentTerminal: (context: Context) => void;
  startWorktreeInWindow: (context: Context) => void;
  syncLocalAgentFiles: (context: Context) => void;
  validateBaseBranchExists: (context: Context) => void;
  validateGeneratedArtifacts: (context: Context) => void;
  validateTargetLocation: (context: Context) => void;
  validateUniqueWorktreeIdentity: (context: Context) => void;
  warnIfPortsAreBusy: (context: Context) => void;
  writeRuntimeEnvFile: (context: Context) => void;
};

export type WorktreeStackKit_RunCreateCommandOptions<
  Context extends WorktreeStackKit_CreateCommandContext,
  ServiceRoot extends WorktreeStackKit_CreateCommandServiceRoot,
> = {
  context: Context;
  operations: WorktreeStackKit_CreateCommandOperations<Context, ServiceRoot>;
};

/** Runs the package-owned create command sequence using project-supplied adapter operations. */
export function WorktreeStackKit_runCreateCommand<
  Context extends WorktreeStackKit_CreateCommandContext,
  ServiceRoot extends WorktreeStackKit_CreateCommandServiceRoot,
>(options: WorktreeStackKit_RunCreateCommandOptions<Context, ServiceRoot>): void {
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
      operations.checkoutSubmoduleBranch(
        context,
        serviceRoot.root,
        context.options.submoduleBranch,
      );
      operations.ensureSubmoduleBranchUpstream(
        context,
        serviceRoot.root,
        context.options.submoduleBranch,
      );
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
    operations.printDebugContext(context);
    operations.exitProcess(1);
  }
}
