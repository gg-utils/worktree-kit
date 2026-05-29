/**
 * @fileoverview Config-driven prepared-worktree destroy command runner.
 *
 * Flow: argv + project cleanup command config -> target resolution -> registry validation ->
 * configured cleanup hooks -> git/filesystem removal -> optional prune. Project-specific integration
 * scripts and environment variables stay in root config.
 *
 * @testing Node test runner: npm run worktree-kit:test from the repository root (executes packages/worktree-kit unit tests that cover this module).
 *
 * @see scripts/worktree-stack/commands/destroy.ts - Root destroy CLI adapter that forwards argv and worktrees.config.ts destroy hooks into WorktreeStackKit_runDestroyCli implemented here.
 * @see worktrees.config.ts - Declares WorktreeStackKit_DestroyCommandConfig cleanup command builders, required commands, and usage lines the root adapter passes into this module.
 * @see packages/worktree-kit/src/destroy-command.unit.test.ts - Node test coverage for argv parsing, stack-name worktree resolution, and destroy preflight behavior owned by this file.
 * @see docs/COMMANDS.md - Command index describing how the root destroy adapter delegates orchestration to this kit-owned parser and removal sequencing.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackError, worktreeStackInfo, worktreeStackPrintKv, worktreeStackRequireCommand, worktreeStackRequireFile, worktreeStackRunCommand, worktreeStackRunGit, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackGitWorktreePrunable, worktreeStackGitWorktreeRegistered, } from "@gg-utils/worktree-core/git-worktree-sync";
import { worktreeStackReadJsonField, worktreeStackResolveDefaultWorktreesBase, } from "@gg-utils/worktree-core/worktree-discovery";
/** Indicates argv for destroy is missing, contradictory, or references an unknown flag. */
class WorktreeStackKit_DestroyCliUsageError extends Error {
}
/** Renders destroy CLI usage from project-supplied command lines. */
export function WorktreeStackKit_renderDestroyUsage(config) {
    return `Usage:
${config.usageCommandLines.map((line) => `  ${line}`).join("\n")}

Required:
  --worktree <path>    Absolute/relative worktree path
  OR
  --name <stack-name>  Logical stack name under default/selected worktrees base

Options:
  --worktrees-base <path>  Parent folder containing stack worktrees
  --prune                  Run git worktree prune after remove
  --help                   Show this help`;
}
/** Normalizes any thrown value into a single-line stderr message with a worktree-stack prefix. */
export function WorktreeStackKit_formatDestroyCliErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith("[worktree] ")
        ? message
        : `[worktree] ERROR: ${message}`;
}
/** Parses destroy argv, requiring exactly one of `--worktree` or `--name`. */
export function WorktreeStackKit_parseDestroyCliArgs(options) {
    const { argv, config } = options;
    let prune = false;
    let stackName = "";
    let worktreePath = "";
    let worktreesBase = worktreeStackResolveDefaultWorktreesBase({
        defaultWorktreesDirectoryName: config.defaultWorktreesDirectoryName,
        projectRoot: config.projectRoot,
    });
    for (let index = 0; index < argv.length;) {
        const argument = argv[index];
        switch (argument) {
            case "--worktree": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_DestroyCliUsageError("Missing value for --worktree");
                }
                worktreePath = value;
                index += 2;
                break;
            }
            case "--name": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_DestroyCliUsageError("Missing value for --name");
                }
                stackName = value;
                index += 2;
                break;
            }
            case "--worktrees-base": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_DestroyCliUsageError("Missing value for --worktrees-base");
                }
                worktreesBase = value;
                index += 2;
                break;
            }
            case "--prune":
                prune = true;
                index += 1;
                break;
            case "--help":
            case "-h":
                console.log(WorktreeStackKit_renderDestroyUsage(config));
                return null;
            default:
                throw new WorktreeStackKit_DestroyCliUsageError(`Unknown argument: ${String(argument)}`);
        }
    }
    if (!worktreePath && !stackName) {
        throw new WorktreeStackKit_DestroyCliUsageError("Provide --worktree or --name.");
    }
    if (worktreePath && stackName) {
        throw new WorktreeStackKit_DestroyCliUsageError("Use only one of --worktree or --name.");
    }
    return {
        prune,
        stackName,
        worktreePath: worktreePath ? path.resolve(worktreePath) : "",
        worktreesBase: path.resolve(worktreesBase),
    };
}
/** Locates a prepared worktree directory under `worktreesBase` matching `stackName` heuristics. */
export function WorktreeStackKit_resolveDestroyWorktreePathFromStackName(worktreesBase, stackName) {
    const legacyPath = path.join(worktreesBase, stackName);
    const requestedStackName = stackName.toLowerCase();
    const candidatePaths = [];
    if (fs.existsSync(worktreesBase) && fs.statSync(worktreesBase).isDirectory()) {
        for (const entry of fs.readdirSync(worktreesBase, { withFileTypes: true })) {
            if (!entry.isDirectory()) {
                continue;
            }
            const candidatePath = path.join(worktreesBase, entry.name);
            const metadataPath = path.join(candidatePath, ".tmp", "worktree-stack", "metadata.json");
            if (!fs.existsSync(metadataPath)) {
                continue;
            }
            const metadataStackName = (worktreeStackReadJsonField(metadataPath, "stackName") ?? "").toLowerCase();
            if (metadataStackName && metadataStackName === requestedStackName) {
                candidatePaths.push(candidatePath);
            }
        }
    }
    if (candidatePaths.length === 0) {
        return legacyPath;
    }
    candidatePaths.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
    if (candidatePaths.length > 1) {
        worktreeStackWarn(`Multiple prepared worktree folders match stack name '${stackName}'. Selecting the newest one.`);
        for (const candidatePath of candidatePaths) {
            worktreeStackPrintKv("candidate-worktree", candidatePath);
        }
    }
    return candidatePaths[0] ?? legacyPath;
}
/** Destroys a prepared worktree, using configured cleanup hooks when applicable. */
export function WorktreeStackKit_runDestroy(options) {
    const { config, destroyOptions } = options;
    const state = WorktreeStackKit_createDestroyState({ config, destroyOptions });
    try {
        WorktreeStackKit_requireDestroyPrerequisites({ config, state });
        WorktreeStackKit_validateDestroyTarget(state);
        WorktreeStackKit_printDestroyMetadataSummaryIfPresent(state);
        if (fs.existsSync(state.worktreeEnvFile)) {
            state.currentStep = "cleanup-existing-env";
            if (config.cleanupExistingEnv) {
                config.cleanupExistingEnv(state);
            }
            else {
                WorktreeStackKit_runConfiguredDestroyCommand(config.buildExistingEnvCleanupCommand?.(state) ?? null);
            }
        }
        else if (!fs.existsSync(state.worktreePath)) {
            state.currentStep = "cleanup-missing-worktree";
            worktreeStackWarn(`Worktree path does not exist on disk: ${state.worktreePath}`);
            worktreeStackInfo("Attempting best-effort cleanup by workspace path.");
            if (config.cleanupMissingWorktree) {
                config.cleanupMissingWorktree(state);
            }
            else {
                WorktreeStackKit_runConfiguredDestroyCommand(config.buildMissingWorktreeCleanupCommand?.(state) ?? null);
            }
        }
        if (!fs.existsSync(state.worktreePath)) {
            WorktreeStackKit_runPostRemovalCleanup({ config, state });
            WorktreeStackKit_pruneDestroyMetadata(state);
            return 0;
        }
        WorktreeStackKit_removeDestroyTarget(state);
        WorktreeStackKit_runPostRemovalCleanup({ config, state });
        WorktreeStackKit_pruneDestroyMetadata(state);
        console.log(`✅ Worktree removed: ${state.worktreePath}`);
        return 0;
    }
    catch (error) {
        console.error(WorktreeStackKit_formatDestroyCliErrorMessage(error));
        WorktreeStackKit_printDestroyDebugContext(state);
        return 1;
    }
}
/** CLI entrypoint wiring argv parsing to destroy execution. */
export function WorktreeStackKit_runDestroyCli(options) {
    const { argv, config } = options;
    try {
        const destroyOptions = WorktreeStackKit_parseDestroyCliArgs({ argv, config });
        return destroyOptions === null
            ? 0
            : WorktreeStackKit_runDestroy({ config, destroyOptions });
    }
    catch (error) {
        console.error(WorktreeStackKit_formatDestroyCliErrorMessage(error));
        if (error instanceof WorktreeStackKit_DestroyCliUsageError) {
            console.log(WorktreeStackKit_renderDestroyUsage(config));
        }
        return 1;
    }
}
/** Builds initial destroy state from parsed options. */
function WorktreeStackKit_createDestroyState(options) {
    const { config, destroyOptions } = options;
    const worktreePath = destroyOptions.stackName
        ? WorktreeStackKit_resolveDestroyWorktreePathFromStackName(destroyOptions.worktreesBase, destroyOptions.stackName)
        : destroyOptions.worktreePath;
    return {
        currentStep: "initialization",
        metadataPath: path.join(worktreePath, ".tmp", "worktree-stack", "metadata.json"),
        projectRoot: config.projectRoot,
        runPrune: destroyOptions.prune,
        stackName: destroyOptions.stackName,
        worktreeEnvFile: path.join(worktreePath, ".env.local-edge"),
        worktreePath,
        worktreesBase: destroyOptions.worktreesBase,
    };
}
/** Emits key/value diagnostic lines for the current destroy run when reporting a failure. */
function WorktreeStackKit_printDestroyDebugContext(state) {
    worktreeStackPrintKv("step", state.currentStep);
    worktreeStackPrintKv("worktree-path", state.worktreePath);
    worktreeStackPrintKv("stack-name", state.stackName);
    worktreeStackPrintKv("worktrees-base", state.worktreesBase);
    worktreeStackPrintKv("env-file", state.worktreeEnvFile);
    worktreeStackPrintKv("metadata-path", state.metadataPath);
    worktreeStackPrintKv("run-prune", String(state.runPrune));
}
/** Verifies configured external commands and files before destructive operations. */
function WorktreeStackKit_requireDestroyPrerequisites(options) {
    const { config, state } = options;
    state.currentStep = "preflight";
    for (const commandName of config.requiredCommandNames) {
        worktreeStackRequireCommand(commandName);
    }
    for (const file of config.requiredFiles) {
        worktreeStackRequireFile(file.filePath, file.description);
    }
}
/** Blocks destroying the repo root and warns when the path is not a registered git worktree. */
function WorktreeStackKit_validateDestroyTarget(state) {
    state.currentStep = "validate-target";
    if (state.worktreePath === state.projectRoot) {
        worktreeStackError("Refusing to destroy the repository root as a worktree.");
    }
    if (fs.existsSync(state.worktreePath) &&
        !worktreeStackGitWorktreeRegistered(state.projectRoot, state.worktreePath)) {
        worktreeStackWarn("Target path exists but is not listed by 'git worktree list'. Destroy will continue with best-effort cleanup.");
    }
}
/** Prints selected metadata keys when metadata is present under the worktree. */
function WorktreeStackKit_printDestroyMetadataSummaryIfPresent(state) {
    if (!fs.existsSync(state.metadataPath)) {
        return;
    }
    const metadataRealm = worktreeStackReadJsonField(state.metadataPath, "realmSlug") ?? "";
    const metadataBranch = worktreeStackReadJsonField(state.metadataPath, "rootBranch") ?? "";
    if (metadataRealm) {
        worktreeStackPrintKv("metadata-realm", metadataRealm);
    }
    if (metadataBranch) {
        worktreeStackPrintKv("metadata-root-branch", metadataBranch);
    }
}
/** Runs one configured external cleanup command when provided. */
function WorktreeStackKit_runConfiguredDestroyCommand(command) {
    if (command === null) {
        return;
    }
    const runOptions = {
        allowFailure: command.allowFailure,
        cwd: command.cwd,
        env: command.env,
        stdio: command.stdio,
    };
    const result = worktreeStackRunCommand(command.command, command.args, runOptions);
    if (result.status !== 0 && command.warningOnFailure) {
        worktreeStackWarn(command.warningOnFailure);
    }
}
/** Runs configured post-removal cleanup hooks. */
function WorktreeStackKit_runPostRemovalCleanup(options) {
    const { config, state } = options;
    state.currentStep = "post-removal-cleanup";
    for (const command of config.buildPostRemovalCleanupCommands?.(state) ?? []) {
        WorktreeStackKit_runConfiguredDestroyCommand(command);
    }
}
/** Removes the worktree via git when registered, otherwise direct fallback cleanup. */
function WorktreeStackKit_removeDestroyTarget(state) {
    state.currentStep = "remove-worktree";
    worktreeStackInfo(`Removing worktree: ${state.worktreePath}`);
    if (!worktreeStackGitWorktreeRegistered(state.projectRoot, state.worktreePath)) {
        worktreeStackWarn("Worktree is no longer registered. Falling back to direct filesystem cleanup.");
        WorktreeStackKit_removeDestroyDirectoryFallback(state);
        return;
    }
    if (worktreeStackGitWorktreePrunable(state.projectRoot, state.worktreePath)) {
        worktreeStackWarn("Worktree is marked prunable. Falling back to direct filesystem cleanup before prune.");
        WorktreeStackKit_removeDestroyDirectoryFallback(state);
        return;
    }
    try {
        worktreeStackRunGit(state.projectRoot, ["worktree", "remove", "--force", state.worktreePath], { stdio: "inherit" });
    }
    catch (error) {
        worktreeStackWarn(`Git worktree remove failed: ${String(error)}. Using fallback cleanup.`);
        WorktreeStackKit_removeDestroyDirectoryFallback(state);
    }
}
/** Deletes the worktree directory with `fs.rmSync` when git-managed removal is not used. */
function WorktreeStackKit_removeDestroyDirectoryFallback(state) {
    state.currentStep = "remove-worktree-fallback";
    worktreeStackInfo(`Removing worktree directory directly: ${state.worktreePath}`);
    const status = worktreeStackRunGit(state.worktreePath, ["status", "--porcelain"], {
        allowFailure: true,
    });
    if (status.stdout.trim() !== "") {
        throw new Error(`Worktree has uncommitted changes, refusing to force delete: ${state.worktreePath}`);
    }
    fs.rmSync(state.worktreePath, { force: true, recursive: true });
}
/** Runs `git worktree prune` at the repo root when requested. */
function WorktreeStackKit_pruneDestroyMetadata(state) {
    if (!state.runPrune) {
        return;
    }
    state.currentStep = "prune-worktree-metadata";
    worktreeStackInfo("Pruning stale worktree metadata...");
    worktreeStackRunGit(state.projectRoot, ["worktree", "prune"], {
        stdio: "inherit",
    });
}
//# sourceMappingURL=destroy-command.js.map