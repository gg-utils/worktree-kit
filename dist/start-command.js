/**
 * @fileoverview Config-driven prepared-worktree start command runner.
 *
 * Flow: argv + project config -> prepared-worktree validation -> optional repair -> configured
 * preflight/register/router commands -> configured long-running runtime command. Project-specific
 * submodule names, local-edge script paths, env keys, and editor launcher details stay in root config.
 *
 * @testing Node test runner: npm run worktree-kit:test --
 *
 * @see scripts/worktree-stack/commands/start.ts - Repository `worktrees:start` adapter that resolves the repo root, loads worktrees.config.ts, and delegates argv into WorktreeStackKit_createStartCommand from this module.
 * @see worktrees.config.ts - Root prepared-worktree configuration whose checkout contracts, submodule paths, env keys, and local-edge hook builders populate the config object this factory consumes.
 * @see packages/worktree-kit/src/start-command.unit.test.ts - Node test runner suite that exercises argv parsing, usage rendering, and the configured start pipeline behavior owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { EnvMaterialize_parseEnvDocument } from "@gg-utils/env-materialize-core/env-document";
import { worktreeStackError, worktreeStackInfo, worktreeStackPrintKv, worktreeStackRequireCommand, worktreeStackRequireDirectory, worktreeStackRequireFile, worktreeStackRunCommand, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackCheckoutMatchesExpectedBranch, worktreeStackCurrentCheckoutDescription, worktreeStackGitWorktreeRegistered, worktreeStackTailFileIfPresent, } from "@gg-utils/worktree-core/git-worktree-sync";
import { worktreeStackReadJsonField, worktreeStackResolveCanonicalRootWorkspacePath, } from "@gg-utils/worktree-core/worktree-discovery";
/** Renders start CLI usage from project-supplied command lines and editor label. */
export function WorktreeStackKit_renderStartUsage(config) {
    return [
        "Usage:",
        ...config.usage.commandLines.map((line) => `  ${line}`),
        "",
        "Options:",
        "  --worktree <path>      Path to prepared worktree root",
        `  --open-windsurf        Opt into opening the worktree in ${config.editor.displayName}`,
        "  --no-open-windsurf     Compatibility flag; editor opening is disabled by default",
        "  --help, -h             Show this help",
    ].join("\n");
}
export function WorktreeStackKit_createStartCommand(config) {
    /** Signals invalid `worktrees:start` argv so the CLI can print usage. */
    class StartCliUsageError extends Error {
    }
    /** Prints the `worktrees:start` help text to stdout for direct CLI usage. */
    function printUsage() {
        console.log(WorktreeStackKit_renderStartUsage(config));
    }
    /** Normalizes thrown values into a single-line `[worktree]`-prefixed CLI error string. */
    function formatCliErrorMessage(error) {
        const message = error instanceof Error ? error.message : String(error);
        return message.startsWith("[worktree] ")
            ? message
            : `[worktree] ERROR: ${message}`;
    }
    /** Parses `worktrees:start` argv into options. */
    function parseStartCliArgs(argv) {
        const options = {
            openWindsurf: false,
            worktreePath: "",
        };
        for (let index = 0; index < argv.length;) {
            const argument = argv[index];
            switch (argument) {
                case "--worktree": {
                    const value = argv[index + 1];
                    if (!value) {
                        throw new StartCliUsageError("Missing value for --worktree");
                    }
                    options.worktreePath = value;
                    index += 2;
                    break;
                }
                case "--open-windsurf":
                    options.openWindsurf = true;
                    index += 1;
                    break;
                case "--no-open-windsurf":
                    options.openWindsurf = false;
                    index += 1;
                    break;
                case "--help":
                case "-h":
                    printUsage();
                    return null;
                default:
                    throw new StartCliUsageError(`Unknown argument: ${argument}`);
            }
        }
        if (!options.worktreePath) {
            throw new StartCliUsageError("--worktree is required.");
        }
        return {
            ...options,
            worktreePath: path.resolve(options.worktreePath),
        };
    }
    /** Reads a single env value as a string from a .env file, returning empty string if missing. */
    function readSimpleEnvValue(filePath, key) {
        if (!fs.existsSync(filePath)) {
            return "";
        }
        return (EnvMaterialize_parseEnvDocument(fs.readFileSync(filePath, "utf8")).valuesByKey.get(key) ?? "");
    }
    /** Resolves the machine root directory from a configured generated-dir env value. */
    function machineRootFromEnvFile(envFile, workspaceFallback) {
        const generatedDir = readSimpleEnvValue(envFile, config.envKeys.generatedDir);
        if (generatedDir.length === 0) {
            return path.join(workspaceFallback, config.defaultMachineRootRelativePath);
        }
        if (path.basename(generatedDir) === "generated") {
            return path.dirname(generatedDir);
        }
        return generatedDir;
    }
    /** Builds the initial startup context from canonical root discovery and resolved CLI options. */
    function createContext(options) {
        const rootWorkspacePath = worktreeStackResolveCanonicalRootWorkspacePath(config.projectRoot);
        const worktreeEnvFile = path.join(options.worktreePath, config.worktreeEnvRelativePath);
        return {
            currentStep: "initialization",
            localEdgeMachineRoot: path.join(options.worktreePath, config.defaultMachineRootRelativePath),
            metadataPath: path.join(options.worktreePath, config.metadataRelativePath),
            rootWorkspaceEnvFile: path.join(rootWorkspacePath, config.canonicalRootEnvRelativePath),
            rootWorkspacePath,
            startLogPrefix: "",
            worktreeAgentContextPath: path.join(options.worktreePath, config.worktreeAgentContextRelativePath),
            worktreeEnvFile,
            worktreeLogDir: config.startLogDir,
            worktreePath: options.worktreePath,
        };
    }
    /** Emits key-value debug lines for the active startup context during failure handling. */
    function printDebugContext(context) {
        worktreeStackPrintKv("step", context.currentStep);
        worktreeStackPrintKv("worktree-path", context.worktreePath);
        worktreeStackPrintKv("root-workspace-path", context.rootWorkspacePath);
        worktreeStackPrintKv("root-workspace-env-file", context.rootWorkspaceEnvFile);
        worktreeStackPrintKv("env-file", context.worktreeEnvFile);
        worktreeStackPrintKv("metadata-path", context.metadataPath);
        worktreeStackPrintKv("agent-context-path", context.worktreeAgentContextPath);
        worktreeStackPrintKv("machine-root", context.localEdgeMachineRoot);
        worktreeStackPrintKv("logs-dir", context.worktreeLogDir);
    }
    /** Resolves the absolute log path for a phase-specific transcript under `startLogPrefix`. */
    function startLogFile(context, suffix) {
        return `${context.startLogPrefix}.${suffix}.log`;
    }
    /** Tails the most recent lines from known phase logs when troubleshooting a failed start. */
    function tailKnownLogs(context) {
        if (!context.startLogPrefix) {
            return;
        }
        for (const suffix of config.knownLogSuffixes) {
            worktreeStackTailFileIfPresent(startLogFile(context, suffix), 80);
        }
    }
    /** Verifies host tooling and required project entrypoints exist before work proceeds. */
    function requirePrerequisites(context) {
        context.currentStep = "preflight";
        for (const commandName of config.requiredCommandNames) {
            worktreeStackRequireCommand(commandName);
        }
        for (const requiredFile of config.requiredFiles) {
            worktreeStackRequireFile(requiredFile.filePath, requiredFile.description);
        }
    }
    /** Invokes the configured checkout-kind helper for a single contract field. */
    function resolveCheckoutField(context, fieldName) {
        const command = config.checkoutContract.buildFieldCommand({
            fieldName,
            projectRoot: config.projectRoot,
            worktreePath: context.worktreePath,
        });
        const result = worktreeStackRunCommand(command.command, command.args, {
            allowFailure: true,
            cwd: command.cwd ?? config.projectRoot,
        });
        if (result.status !== 0) {
            worktreeStackError(`Failed to resolve checkout contract field '${fieldName}'.`);
        }
        return result.stdout.trim();
    }
    /** Ensures the operator pointed `worktrees:start` at the expected checkout contract. */
    function validateRequestedCheckoutKind(context) {
        context.currentStep = "validate-checkout-kind";
        const checkoutKind = resolveCheckoutField(context, "checkoutKind");
        if (checkoutKind === config.checkoutContract.expectedCheckoutKind) {
            return;
        }
        worktreeStackError("Requested path is not an accepted prepared worktree root.");
    }
    /** Warns when the canonical root env file is absent so inheritance may be incomplete. */
    function warnIfRootEnvMissing(context) {
        if (fs.existsSync(context.rootWorkspaceEnvFile)) {
            return;
        }
        worktreeStackWarn("Root local runtime env file is missing. Existing worktrees may not inherit shared defaults.");
        worktreeStackPrintKv("expected-root-env-file", context.rootWorkspaceEnvFile);
    }
    /** Collects configured dependency paths that appear absent for the worktree root. */
    function listMissingRuntimeDependencyPaths(worktreePath) {
        return config.requiredRuntimeDependencyRelativePaths
            .map((relativePath) => path.join(worktreePath, relativePath))
            .filter((candidatePath) => !fs.existsSync(candidatePath));
    }
    /** Emits a warning for each configured dependency path that appears absent. */
    function warnIfDependenciesLookMissing(worktreePath) {
        for (const missingPath of listMissingRuntimeDependencyPaths(worktreePath)) {
            worktreeStackWarn(`Dependencies may be missing: ${missingPath}`);
        }
    }
    /** Aborts startup when configured dependency paths are missing for runtime commands. */
    function requireDependenciesForRuntime(context) {
        context.currentStep = "validate-dependencies";
        const missingPaths = listMissingRuntimeDependencyPaths(context.worktreePath);
        if (missingPaths.length === 0) {
            return;
        }
        worktreeStackError("Cannot start the worktree runtime because required dependencies are missing.");
    }
    /** Returns whether prepared-worktree stack artifacts look incomplete or stale on disk. */
    function worktreeNeedsRepair(context) {
        if (!fs.existsSync(context.metadataPath)) {
            return true;
        }
        if (!fs.existsSync(path.join(context.worktreePath, config.canonicalRootWorkspacePathRelativePath))) {
            return true;
        }
        if (!fs.existsSync(path.join(context.worktreePath, config.worktreeInfoRelativePath))) {
            return true;
        }
        if (!fs.existsSync(context.worktreeAgentContextPath)) {
            return true;
        }
        if (!fs.existsSync(path.join(context.worktreePath, config.worktreeReadmeRelativePath))) {
            return true;
        }
        return (worktreeStackReadJsonField(context.metadataPath, "canonicalRootWorkspacePath") === null);
    }
    /** Produces a child-process env map wiring configured local runtime file paths. */
    function buildLocalEdgeCommandEnv(context) {
        return {
            ...process.env,
            [config.envKeys.spawnedEnvFile]: context.worktreeEnvFile,
            [config.envKeys.spawnedProjectRoot]: context.worktreePath,
            [config.envKeys.spawnedRootEnvFile]: context.rootWorkspaceEnvFile,
        };
    }
    /** Runs a configured subprocess from the configured cwd, persisting output to a phase log file. */
    function runLoggedCommand(options) {
        const logPath = startLogFile(options.context, options.logSuffix);
        const result = worktreeStackRunCommand(options.command.command, options.command.args, {
            allowFailure: true,
            cwd: options.command.cwd ?? config.projectRoot,
            env: options.env,
        });
        fs.writeFileSync(logPath, `${result.stdout}${result.stderr}`, "utf8");
        if (result.status !== 0) {
            worktreeStackError(`Command failed (${result.status}): ${options.command.command} ${options.command.args.join(" ")}`);
        }
    }
    function runLoggedAction(options) {
        const logPath = startLogFile(options.context, options.logSuffix);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        const result = options.action();
        fs.writeFileSync(logPath, `${result?.stdout ?? ""}${result?.stderr ?? ""}`, "utf8");
    }
    /** Invokes the configured repair command when prepared-worktree artifacts fail readiness probes. */
    function repairPreparedWorktreeIfNeeded(context, commandContext) {
        if (!worktreeNeedsRepair(context)) {
            return;
        }
        context.currentStep = "repair-prepared-worktree";
        worktreeStackInfo("Repairing stale prepared worktree artifacts before start...");
        if (config.repairWorktreeArtifacts) {
            runLoggedAction({
                action: () => config.repairWorktreeArtifacts?.(commandContext),
                context,
                logSuffix: "repair",
            });
            return;
        }
        if (!config.buildRepairCommand) {
            worktreeStackError("Prepared-worktree repair hook is not configured.");
        }
        runLoggedCommand({
            command: config.buildRepairCommand(commandContext),
            context,
            env: buildLocalEdgeCommandEnv(context),
            logSuffix: "repair",
        });
    }
    /** Best-effort cleanup hook marking a realm inactive after the runtime session ends. */
    function markRealmInactive(context, commandContext) {
        if (!commandContext.realmSlug) {
            return;
        }
        if (config.markRealmInactive) {
            try {
                config.markRealmInactive(commandContext);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                worktreeStackWarn(`Failed to mark realm inactive: ${message}`);
            }
            return;
        }
        if (!config.buildMarkRealmInactiveCommand) {
            worktreeStackWarn("Realm inactive hook is not configured.");
            return;
        }
        const command = config.buildMarkRealmInactiveCommand(commandContext);
        worktreeStackRunCommand(command.command, command.args, {
            allowFailure: true,
            cwd: command.cwd ?? config.projectRoot,
            env: buildLocalEdgeCommandEnv(context),
            stdio: "ignore",
        });
    }
    /** Opens the configured editor launcher when the opt-in flag is enabled. */
    function openWorktreeInEditor(worktreePath, openEditor) {
        if (!openEditor) {
            worktreeStackInfo(`Skipping ${config.editor.displayName} launch because it was disabled.`);
            return;
        }
        const launcherExists = spawnSync("which", [config.editor.launcherCommand], {
            encoding: "utf8",
            stdio: "ignore",
        }).status === 0;
        if (!launcherExists) {
            worktreeStackWarn(`${config.editor.displayName} launcher is unavailable: ${config.editor.launcherCommand}`);
            return;
        }
        if (!fs.existsSync(worktreePath)) {
            worktreeStackWarn(`Cannot open missing worktree in ${config.editor.displayName}: ${worktreePath}`);
            return;
        }
        const child = spawn(config.editor.launcherCommand, [worktreePath], {
            detached: true,
            stdio: "ignore",
        });
        child.unref();
        worktreeStackInfo(`Opening worktree in ${config.editor.displayName}: ${worktreePath}`);
    }
    function createCommandContext(options) {
        return {
            projectRoot: config.projectRoot,
            realmSlug: options.realmSlug,
            worktreePath: options.worktreePath,
        };
    }
    /** Boots a prepared worktree runtime using configured validation and local runtime hooks. */
    function runWorktreeStart(options) {
        const context = createContext(options);
        if (!fs.existsSync(context.worktreePath) ||
            !fs.statSync(context.worktreePath).isDirectory()) {
            console.error(`[error] Worktree path does not exist: ${context.worktreePath}`);
            return 1;
        }
        fs.mkdirSync(context.worktreeLogDir, { recursive: true });
        try {
            requirePrerequisites(context);
            validateRequestedCheckoutKind(context);
            if (!fs.existsSync(context.worktreeEnvFile)) {
                console.error(`[error] Missing worktree local runtime env file: ${context.worktreeEnvFile}`);
                return 1;
            }
            warnIfRootEnvMissing(context);
            context.localEdgeMachineRoot = machineRootFromEnvFile(context.worktreeEnvFile, context.worktreePath);
            warnIfDependenciesLookMissing(context.worktreePath);
            const earlyRealmSlug = readSimpleEnvValue(context.worktreeEnvFile, config.envKeys.realmSlug) ||
                "unknown";
            context.startLogPrefix = path.join(context.worktreeLogDir, `start-${earlyRealmSlug}`);
            for (const suffix of config.clearBeforeRepairLogSuffixes) {
                fs.rmSync(startLogFile(context, suffix), { force: true });
            }
            repairPreparedWorktreeIfNeeded(context, createCommandContext({
                realmSlug: earlyRealmSlug,
                worktreePath: context.worktreePath,
            }));
            if (!fs.existsSync(context.metadataPath)) {
                console.error(`[error] Missing worktree metadata file after repair: ${context.metadataPath}`);
                return 1;
            }
            const rootBranch = worktreeStackReadJsonField(context.metadataPath, "rootBranch") ?? "";
            const submoduleBranch = worktreeStackReadJsonField(context.metadataPath, "submoduleBranch") ??
                "";
            const realmSlug = worktreeStackReadJsonField(context.metadataPath, "realmSlug") ?? "";
            const metadataWorktreePath = worktreeStackReadJsonField(context.metadataPath, "worktreePath") ?? "";
            const metadataSlot = worktreeStackReadJsonField(context.metadataPath, "slot") ?? "";
            const commandContext = createCommandContext({
                realmSlug,
                worktreePath: context.worktreePath,
            });
            context.startLogPrefix = path.join(context.worktreeLogDir, `start-${realmSlug}`);
            for (const suffix of config.clearAfterRealmResolvedLogSuffixes) {
                fs.rmSync(startLogFile(context, suffix), { force: true });
            }
            if (metadataWorktreePath !== context.worktreePath) {
                worktreeStackError("Metadata worktree path does not match requested path.");
            }
            if (readSimpleEnvValue(context.worktreeEnvFile, config.envKeys.realmSlug) !== realmSlug) {
                worktreeStackError("Worktree local runtime env realm does not match metadata realm.");
            }
            if (!worktreeStackGitWorktreeRegistered(config.projectRoot, context.worktreePath)) {
                worktreeStackWarn("Requested path is not currently listed by 'git worktree list'. " +
                    "Start will continue, but the worktree registration appears stale.");
            }
            if (!fs.existsSync(context.worktreeAgentContextPath)) {
                worktreeStackWarn(`Worktree agent context is missing: ${context.worktreeAgentContextPath}`);
            }
            context.currentStep = "validate-submodule-layout";
            for (const submodule of config.requiredSubmodules) {
                const submodulePath = path.join(context.worktreePath, submodule.path);
                worktreeStackRequireDirectory(submodulePath, "required worktree submodule");
                worktreeStackRequireFile(path.join(submodulePath, submodule.packageManifestRelativePath), "submodule package manifest");
            }
            requireDependenciesForRuntime(context);
            context.currentStep = "validate-branches";
            if (!worktreeStackCheckoutMatchesExpectedBranch(context.worktreePath, rootBranch)) {
                const actualCheckout = worktreeStackCurrentCheckoutDescription(context.worktreePath);
                console.error(`[error] Root branch mismatch. metadata=${rootBranch} ` +
                    `actual=${actualCheckout}`);
                return 1;
            }
            for (const submodule of config.requiredSubmodules) {
                const repoDir = path.join(context.worktreePath, submodule.path);
                if (!worktreeStackCheckoutMatchesExpectedBranch(repoDir, submoduleBranch)) {
                    const actualCheckout = worktreeStackCurrentCheckoutDescription(repoDir);
                    console.error(`[error] Submodule branch mismatch in ${submodule.path}. ` +
                        `metadata=${submoduleBranch} actual=${actualCheckout}`);
                    return 1;
                }
            }
            const localEdgeEnv = buildLocalEdgeCommandEnv(context);
            context.currentStep = "local-runtime-preflight";
            worktreeStackInfo(`Running local runtime preflight for worktree realm '${realmSlug}'...`);
            runLoggedCommand({
                command: config.buildPreflightCommand(commandContext),
                context,
                env: localEdgeEnv,
                logSuffix: "preflight",
            });
            context.currentStep = "register-realm";
            worktreeStackInfo(`Registering realm '${realmSlug}' for worktree: ${context.worktreePath}`);
            if (config.registerRealm) {
                runLoggedAction({
                    action: () => config.registerRealm?.(commandContext),
                    context,
                    logSuffix: "register",
                });
            }
            else {
                if (!config.buildRealmRegisterCommand) {
                    worktreeStackError("Realm registration hook is not configured.");
                }
                runLoggedCommand({
                    command: config.buildRealmRegisterCommand(commandContext),
                    context,
                    env: localEdgeEnv,
                    logSuffix: "register",
                });
            }
            context.currentStep = "reconcile-router";
            worktreeStackInfo("Reconciling shared local runtime router artifacts and runtime...");
            runLoggedCommand({
                command: config.buildReconcileRouterCommand(commandContext),
                context,
                env: localEdgeEnv,
                logSuffix: "reconcile-router",
            });
            context.currentStep = "start-runtime";
            worktreeStackInfo("Starting worktree runtime behind shared local runtime...");
            worktreeStackPrintKv("realm-slug", realmSlug);
            worktreeStackPrintKv("slot", metadataSlot);
            worktreeStackPrintKv("handbook", context.worktreeAgentContextPath);
            openWorktreeInEditor(context.worktreePath, options.openWindsurf);
            context.currentStep = "start-runtime-launch";
            const runtimeCommand = config.buildRuntimeCommand(commandContext);
            const runtimeRunOptions = {
                allowFailure: true,
                cwd: runtimeCommand.cwd ?? config.projectRoot,
                env: {
                    ...localEdgeEnv,
                    [config.envKeys.runtimeAliasBypass]: config.envKeys.runtimeAliasBypassValue,
                },
                stdio: "inherit",
            };
            const runtimeResult = worktreeStackRunCommand(runtimeCommand.command, runtimeCommand.args, runtimeRunOptions);
            markRealmInactive(context, commandContext);
            return runtimeResult.status;
        }
        catch (error) {
            console.error(formatCliErrorMessage(error));
            printDebugContext(context);
            tailKnownLogs(context);
            return 1;
        }
    }
    /** CLI entrypoint wiring argv parsing to `runWorktreeStart`. */
    function runWorktreeStartCli(argv) {
        try {
            const parsedOptions = parseStartCliArgs(argv);
            if (parsedOptions === null) {
                return 0;
            }
            return runWorktreeStart(parsedOptions);
        }
        catch (error) {
            console.error(formatCliErrorMessage(error));
            if (error instanceof StartCliUsageError) {
                printUsage();
            }
            return 1;
        }
    }
    return {
        parseStartCliArgs,
        runWorktreeStart,
        runWorktreeStartCli,
    };
}
