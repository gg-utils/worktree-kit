/**
 * @fileoverview Config-driven artifact generation, dependency install, integration hooks, summary,
 * and startup delegation for worktree creation.
 *
 * Flow: create context + project config -> artifact command -> optional installs -> best-effort
 * integration hooks -> summary rendering -> optional same-terminal startup command.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-post-provision.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create runner that wires project post-provision callbacks into these helpers once earlier create steps finish.
 * @see worktrees.config.ts - Platform adapter importing these contracts to type consumer-specific artifact, install, hook, and startup wiring for prepared-worktree creation.
 * @see packages/worktree-kit/src/create-cli-context.ts - CLI context builder whose option subset is embedded in WorktreeStackKit_CreatePostProvisionContext for downstream callback decisions.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackError, worktreeStackInfo, worktreeStackRunCommand, worktreeStackRunGit, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
function WorktreeStackKit_runCreateCommandSpec(spec, options = {}) {
    return worktreeStackRunCommand(spec.command, spec.args, {
        ...options,
        cwd: spec.cwd,
        env: spec.env,
        stdio: spec.stdio,
    });
}
/** Invokes the configured artifact command for generated metadata/handbooks. */
export function WorktreeStackKit_generateCreateArtifacts(options) {
    if (options.config.generateArtifacts) {
        options.config.generateArtifacts(options.context);
        return;
    }
    if (!options.config.buildArtifactCommand) {
        worktreeStackError("Create artifact generation hook is not configured.");
    }
    WorktreeStackKit_runCreateCommandSpec(options.config.buildArtifactCommand(options.context));
}
function WorktreeStackKit_installCreateTargetIfNeeded(options) {
    const { config, context, target } = options;
    if (context.options.installSkipExisting &&
        fs.existsSync(path.join(target.root, "node_modules"))) {
        console.log(`[info] Skipping install for ${target.label} (node_modules already exists).`);
        return;
    }
    const installArgs = config.buildInstallArgs(context);
    console.log(`[info] Installing dependencies in ${target.label} with ` +
        `${config.installCommand} ${installArgs.join(" ")}...`);
    const result = worktreeStackRunCommand(config.installCommand, installArgs, {
        allowFailure: true,
        cwd: target.root,
        stdio: "inherit",
    });
    if (result.status !== 0) {
        worktreeStackError(`Dependency install failed in ${target.label}.`);
    }
}
function WorktreeStackKit_syncGeneratedCreateTargets(options) {
    for (const target of options.config.buildGeneratedSyncTargets(options.context)) {
        console.log(`[info] Syncing ${target.logLabel}...`);
        const result = worktreeStackRunCommand(target.command, target.args, {
            allowFailure: true,
            cwd: target.cwd,
            stdio: "inherit",
        });
        if (result.status !== 0) {
            worktreeStackError(`${target.errorLabel} failed in prepared worktree.`);
        }
    }
}
function WorktreeStackKit_ensureCreateInstallLeftRepoClean(target) {
    const result = worktreeStackRunGit(target.root, ["status", "--short", "--untracked-files=no"], { allowFailure: true });
    const trackedStatus = result.stdout.trim();
    if (!trackedStatus) {
        return;
    }
    throw new Error("[worktree] ERROR: Dependency install left tracked changes in " +
        `${target.label}:\n${trackedStatus}`);
}
/**
 * Optionally installs dependencies, syncs generated targets, and returns the cleanliness status.
 */
export function WorktreeStackKit_runCreateInstallIfRequested(options) {
    const { config, context } = options;
    if (!context.options.runInstall) {
        return config.installSkippedStatus;
    }
    const installTargets = config.resolveInstallTargets(context);
    console.log("[info] Installing dependencies in worktree root and package submodules...");
    for (const target of installTargets) {
        WorktreeStackKit_installCreateTargetIfNeeded({
            config,
            context,
            target,
        });
    }
    WorktreeStackKit_syncGeneratedCreateTargets({ config, context });
    console.log("[info] Verifying tracked-file cleanliness after dependency install and generated sync...");
    for (const target of config.resolveCleanlinessTargets({
        context,
        installTargets,
    })) {
        WorktreeStackKit_ensureCreateInstallLeftRepoClean(target);
    }
    return config.installVerifiedStatus;
}
/** Runs a configured non-fatal post-provision hook and returns whether it succeeded. */
export function WorktreeStackKit_runCreateBestEffortHook(options) {
    options.context.currentStep = options.hook.step;
    const result = WorktreeStackKit_runCreateCommandSpec(options.hook.spec, {
        allowFailure: true,
    });
    if (result.status === 0) {
        return true;
    }
    worktreeStackWarn(options.hook.failureWarning);
    return false;
}
/** Opens the configured editor when create is not delegating to a runtime start flow. */
export function WorktreeStackKit_openCreateEditor(options) {
    const { config, context } = options;
    context.currentStep = "open-editor";
    if (context.options.startMode !== "none") {
        worktreeStackInfo(config.launchEditorStartModeMessage(context.options.startMode));
        return;
    }
    if (!context.options.openWindsurf) {
        worktreeStackInfo(config.launchEditorDisabledMessage);
        return;
    }
    config.launchEditor(context);
}
/** Delegates to the configured window-start hook when the selected start mode matches. */
export function WorktreeStackKit_startCreateInWindow(options) {
    const { config, context } = options;
    context.currentStep = "start-window";
    if (context.options.startMode !== config.windowStartMode) {
        worktreeStackInfo(`Skipping window auto-start because start mode is '${context.options.startMode}'.`);
        return;
    }
    config.startInWindow(context);
}
/** Prints the configured create summary. */
export function WorktreeStackKit_printCreateSummary(options) {
    console.log(options.config.renderSummary(options.context));
}
/** Runs the configured same-terminal startup command and returns its status when selected. */
export function WorktreeStackKit_startCreateInCurrentTerminal(options) {
    const { config, context } = options;
    context.currentStep = "start-terminal";
    if (context.options.startMode !== config.terminalStartMode) {
        worktreeStackInfo(`Skipping same-terminal auto-start because start mode is '${context.options.startMode}'.`);
        return null;
    }
    worktreeStackInfo("Starting the new worktree immediately in this terminal...");
    return WorktreeStackKit_runCreateCommandSpec(config.buildStartTerminalCommand(context), {
        allowFailure: true,
    }).status;
}
