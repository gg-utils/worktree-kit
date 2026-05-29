/**
 * @fileoverview Config-driven staged parallel align-active command runner.
 *
 * Flow: argv + worktree config -> selected prepared worktrees -> staged parallel audit,
 * normalization, merge, refresh, and validation with project-owned subprocess surfaces supplied by
 * root config.
 *
 * @testing Node test (tsx): npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/align-active.ts - Sequential align-active factory whose metadata, plan, normalize, and validate helpers this module composes with spawned merge and refresh entrypoints.
 * @see packages/worktree-kit/src/repo-root-sync.ts - Locked repo-root target-branch checkout helper used for the serial sync-root-main stage between the merge wave and per-worktree refresh.
 * @see scripts/worktree-stack/commands/align-active-parallel.ts - Platform CLI adapter that injects `worktrees.config.ts` into `WorktreeStackKit_createAlignActiveParallelCommand` for `npm run worktrees:align-active:parallel`.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { worktreeStackError, worktreeStackInfo, worktreeStackMeasureDurationMs, worktreeStackNowMs, worktreeStackPrintKv, worktreeStackRequireCommand, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackAcquireRepoWriterLock, worktreeStackReleaseAllNamedLocks, worktreeStackReleaseRepoWriterLock, } from "@gg-utils/worktree-core/repo-locks";
import { WorktreeStackKit_createAlignActive, } from "./align-active.js";
import { WorktreeStackKit_syncRepoRootTargetCheckoutWithLocks, } from "./repo-root-sync.js";
export const WORKTREE_STACK_KIT_ALIGN_ACTIVE_PARALLEL_DEFAULT_ARTIFACTS_RELATIVE_PATH = path.join(".tmp", "worktree-stack", "align-active-parallel");
const ALIGN_ACTIVE_PARALLEL_STAGE_SEQUENCE = [
    "discover",
    "audit",
    "normalize",
    "merge",
    "sync-root-main",
    "refresh",
    "validate",
];
/** Renders parallel align-active CLI usage from project-supplied command lines. */
export function WorktreeStackKit_renderAlignActiveParallelUsage(config) {
    return [
        "Usage:",
        ...config.usage.commandLines.map((line) => `  ${line}`),
        "",
        "Options:",
        "  --worktree <path>                Prepared worktree path to include.",
        "                                   Repeat to limit the batch to specific worktrees.",
        "  --target-branch <branch>         Counterpart branch to align around (default: main)",
        "  --dirty-policy <policy>          How to handle dirty worktree repos:",
        "                                   - commit-and-push (default)",
        "                                   - fail",
        "  --refresh-mode <mode>            Refresh mode after merges:",
        "                                   - auto (default)",
        "                                   - live-worktree",
        "                                   - pushed-only",
        "  --plan                           Print the staged parallel plan only",
        "  --push                           Execute the staged parallel alignment",
        "  --help, -h                       Show this help",
    ].join("\n");
}
export function WorktreeStackKit_createAlignActiveParallelCommand(config) {
    const alignActive = WorktreeStackKit_createAlignActive(config.alignActive);
    const { buildAlignActiveOperationPlan, buildAlignActivePlanSummary, worktreeStackAlignActiveDetermineRefreshMode, worktreeStackAlignActiveNormalizeWorktreeDomain, worktreeStackAlignActiveReadMetadata, worktreeStackAlignActiveRequireTargetCheckoutReady, worktreeStackAlignActiveResolveRequestedWorktrees, worktreeStackAlignActiveValidateWorktreeAlignment, } = alignActive;
    /** Signals invalid or incomplete argv for the parallel align-active CLI (not runtime Git failures). */
    class AlignActiveParallelCliUsageError extends Error {
    }
    /**
     * Formats a calendar component as two digits for deterministic run id segments.
     *
     * @param value - Month, day, hour, minute, or second component.
     */
    function formatDatePart(value) {
        return String(value).padStart(2, "0");
    }
    /** Builds a unique run id string used for `.tmp/worktree-stack/align-active-parallel/<runId>` artifacts. */
    function createAlignActiveParallelRunId(date = new Date()) {
        return [
            "align-active-parallel-",
            date.getFullYear(),
            formatDatePart(date.getMonth() + 1),
            formatDatePart(date.getDate()),
            "-",
            formatDatePart(date.getHours()),
            formatDatePart(date.getMinutes()),
            formatDatePart(date.getSeconds()),
        ].join("");
    }
    /** Absolute log directory path for a parallel align-active run under the repo `.tmp` tree. */
    function createAlignActiveParallelRunDir(rootDir, runId, artifactsRelativePath = WORKTREE_STACK_KIT_ALIGN_ACTIVE_PARALLEL_DEFAULT_ARTIFACTS_RELATIVE_PATH) {
        return path.join(rootDir, artifactsRelativePath, runId);
    }
    /** Returns the ordered stage names executed by the parallel align-active orchestrator. */
    function listAlignActiveParallelStages() {
        return [...ALIGN_ACTIVE_PARALLEL_STAGE_SEQUENCE];
    }
    /** Prints usage text from project-supplied command lines. */
    function printUsage() {
        console.log(WorktreeStackKit_renderAlignActiveParallelUsage(config));
    }
    /**
     * Normalizes thrown values into a single-line `[worktree]` message for stderr and log files.
     *
     * @param error - Any throw value from CLI or library code.
     */
    function formatCliErrorMessage(error) {
        const message = error instanceof Error ? error.message : String(error);
        return message.startsWith("[worktree] ")
            ? message
            : `[worktree] ERROR: ${message}`;
    }
    /**
     * Reads the argv token immediately after a `--flag` and advances the parse cursor by two slots.
     *
     * @throws {AlignActiveParallelCliUsageError} When the flag is missing its value token.
     */
    function readRequiredArgvFlagValue(options) {
        const value = options.argv[options.index + 1];
        if (!value) {
            throw new AlignActiveParallelCliUsageError(`Missing value for ${options.flagName}`);
        }
        return { nextIndex: options.index + 2, value };
    }
    /**
     * Parses parallel align-active argv into options, validating dirty/refresh mode combinations.
     *
     * @throws {AlignActiveParallelCliUsageError} When argv is inconsistent or incomplete.
     */
    function parseAlignActiveParallelCliArgs(argv) {
        let dirtyPolicy = "commit-and-push";
        let executionMode = null;
        let refreshMode = "auto";
        let targetBranch = "main";
        const worktreePaths = [];
        for (let index = 0; index < argv.length;) {
            const argument = argv[index];
            switch (argument) {
                case "--worktree": {
                    const { nextIndex, value } = readRequiredArgvFlagValue({
                        argv,
                        flagName: "--worktree",
                        index,
                    });
                    worktreePaths.push(path.resolve(value));
                    index = nextIndex;
                    break;
                }
                case "--target-branch": {
                    const { nextIndex, value } = readRequiredArgvFlagValue({
                        argv,
                        flagName: "--target-branch",
                        index,
                    });
                    targetBranch = value;
                    index = nextIndex;
                    break;
                }
                case "--dirty-policy": {
                    const { nextIndex, value } = readRequiredArgvFlagValue({
                        argv,
                        flagName: "--dirty-policy",
                        index,
                    });
                    if (value !== "commit-and-push" && value !== "fail") {
                        throw new AlignActiveParallelCliUsageError("Choose --dirty-policy commit-and-push or fail.");
                    }
                    dirtyPolicy = value;
                    index = nextIndex;
                    break;
                }
                case "--refresh-mode": {
                    const { nextIndex, value } = readRequiredArgvFlagValue({
                        argv,
                        flagName: "--refresh-mode",
                        index,
                    });
                    if (value !== "auto" &&
                        value !== "live-worktree" &&
                        value !== "pushed-only") {
                        throw new AlignActiveParallelCliUsageError("Choose --refresh-mode auto, live-worktree, or pushed-only.");
                    }
                    refreshMode = value;
                    index = nextIndex;
                    break;
                }
                case "--plan":
                    if (executionMode && executionMode !== "plan") {
                        throw new AlignActiveParallelCliUsageError("Choose exactly one execution mode: --plan or --push.");
                    }
                    executionMode = "plan";
                    index += 1;
                    break;
                case "--push":
                    if (executionMode && executionMode !== "push") {
                        throw new AlignActiveParallelCliUsageError("Choose exactly one execution mode: --plan or --push.");
                    }
                    executionMode = "push";
                    index += 1;
                    break;
                case "--help":
                case "-h":
                    printUsage();
                    return null;
                default:
                    throw new AlignActiveParallelCliUsageError(`Unknown argument: ${argument}`);
            }
        }
        if (!executionMode) {
            throw new AlignActiveParallelCliUsageError("Choose exactly one execution mode: --plan or --push.");
        }
        return {
            dirtyPolicy,
            executionMode,
            refreshMode,
            targetBranch,
            worktreePaths,
        };
    }
    /**
     * Builds initial run state from CLI options (run id, artifact dir, copied worktree list).
     *
     * @param options - Parsed parallel CLI options.
     */
    function createState(options) {
        const runId = createAlignActiveParallelRunId();
        return {
            currentStep: "initialization",
            dirtyPolicy: options.dirtyPolicy,
            executionMode: options.executionMode,
            refreshMode: options.refreshMode,
            resolvedWorktreePaths: [],
            runDir: createAlignActiveParallelRunDir(config.projectRoot, runId, config.artifactsRelativePath),
            runId,
            stageDurationsMs: {},
            targetBranch: options.targetBranch,
            worktreePaths: [...options.worktreePaths],
        };
    }
    /**
     * Emits KV debug lines for the current step, policies, and resolved worktree paths.
     *
     * @param state - Run snapshot; used when printing diagnostics after a failure.
     */
    function printDebugContext(state) {
        worktreeStackPrintKv("step", state.currentStep);
        worktreeStackPrintKv("execution-mode", state.executionMode);
        worktreeStackPrintKv("target-branch", state.targetBranch);
        worktreeStackPrintKv("dirty-policy", state.dirtyPolicy);
        worktreeStackPrintKv("refresh-mode", state.refreshMode);
        worktreeStackPrintKv("run-id", state.runId);
        worktreeStackPrintKv("run-dir", state.runDir);
        if (state.resolvedWorktreePaths.length > 0) {
            worktreeStackPrintKv("resolved-worktrees", state.resolvedWorktreePaths.join(", "));
        }
    }
    /**
     * Ensures external binaries required by spawned subprocess stages exist on PATH.
     */
    function requirePrerequisites() {
        for (const commandName of config.requiredCommandNames) {
            worktreeStackRequireCommand(commandName);
        }
    }
    /**
     * Per-worktree log path under the run directory for a given stage.
     *
     * @param runDir - Root artifact directory for this parallel run.
     * @param stageName - Pipeline stage writing the log.
     * @param stackName - Prepared worktree stack short name (filename segment).
     */
    function stageLogPath(runDir, stageName, stackName) {
        return path.join(runDir, "logs", stageName, `${stackName}.log`);
    }
    /**
     * Appends one JSON object per line for machine-readable stage or lock telemetry.
     *
     * @param filePath - Destination log path (caller ensures directory exists when needed).
     * @param payload - Serializable event fields.
     */
    function appendJsonLine(filePath, payload) {
        fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`);
    }
    /**
     * Writes a stage lifecycle event when `WORKTREE_STACK_STAGE_EVENTS_FILE` is set.
     *
     * @param state - Run handle (signature parity with other stage hooks; emission is env-gated).
     * @param eventName - Event kind such as `stage-start` or `task-failed`.
     * @param stageName - Stage the event refers to.
     * @param details - Human-readable context (counts, paths, exit codes).
     */
    function emitStageEvent(state, eventName, stageName, details) {
        const stageEventsFile = process.env.WORKTREE_STACK_STAGE_EVENTS_FILE;
        if (!stageEventsFile) {
            return;
        }
        appendJsonLine(stageEventsFile, {
            details,
            event: eventName,
            stage: stageName,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Records wall-clock duration for a completed stage in `state.stageDurationsMs`.
     *
     * @param state - Run state updated in place.
     * @param stageName - Stage whose span is stored.
     * @param startedAtMs - Monotonic-compatible start timestamp from `worktreeStackNowMs`.
     * @param endedAtMs - End timestamp paired with `startedAtMs`.
     */
    function recordStageTiming(state, stageName, startedAtMs, endedAtMs) {
        state.stageDurationsMs[stageName] = worktreeStackMeasureDurationMs(startedAtMs, endedAtMs);
    }
    /**
     * Writes `timings.json` under the run directory from recorded stage durations.
     *
     * @param state - Run state containing populated `stageDurationsMs`.
     */
    function writeStageTimings(state) {
        const timings = listAlignActiveParallelStages()
            .map((stageName) => {
            const durationMs = state.stageDurationsMs[stageName];
            if (typeof durationMs !== "number") {
                return null;
            }
            return {
                durationMs,
                stage: stageName,
            };
        })
            .filter((entry) => entry !== null);
        fs.writeFileSync(path.join(state.runDir, "timings.json"), `${JSON.stringify({ stages: timings }, null, 2)}\n`);
    }
    /**
     * Maps stack metadata plus resolved refresh mode into the parallel batch summary shape.
     *
     * @param metadata - Worktree read from disk for one prepared stack.
     * @param refreshMode - Effective refresh mode after auto-resolution.
     */
    function buildSelectedWorktreeSummary(metadata, refreshMode) {
        return {
            refreshMode,
            rootBranch: metadata.rootBranch,
            stackName: metadata.stackName,
            submoduleBranch: metadata.submoduleBranch,
            worktreePath: metadata.worktreePath,
        };
    }
    /**
     * Materializes run directories, env hooks for event logs, and per-worktree selection files.
     *
     * @remarks
     * I/O: Creates the configured `<runId>` artifact subtrees and sets process env for lock/stage
     * JSONL consumers.
     *
     * @param state - Active run snapshot (branch, policies, paths).
     * @param selectedWorktrees - One entry per resolved prepared worktree in the batch.
     */
    function writeRunMetadata(state, selectedWorktrees) {
        fs.mkdirSync(path.join(state.runDir, "selected-worktrees"), {
            recursive: true,
        });
        fs.mkdirSync(path.join(state.runDir, "logs"), { recursive: true });
        process.env.WORKTREE_STACK_LOCK_EVENTS_FILE = path.join(state.runDir, "lock-events.jsonl");
        process.env.WORKTREE_STACK_STAGE_EVENTS_FILE = path.join(state.runDir, "stage-events.jsonl");
        fs.writeFileSync(path.join(state.runDir, "run-metadata.json"), `${JSON.stringify({
            createdAt: new Date().toISOString(),
            dirtyPolicy: state.dirtyPolicy,
            executionMode: state.executionMode,
            refreshMode: state.refreshMode,
            rootDir: config.projectRoot,
            runId: state.runId,
            targetBranch: state.targetBranch,
        }, null, 2)}\n`);
        fs.writeFileSync(path.join(state.runDir, "selected-worktrees.txt"), `${selectedWorktrees.map((entry) => entry.worktreePath).join("\n")}\n`);
        for (const selectedWorktree of selectedWorktrees) {
            fs.writeFileSync(path.join(state.runDir, "selected-worktrees", `${selectedWorktree.stackName}.json`), `${JSON.stringify(selectedWorktree, null, 2)}\n`);
        }
    }
    /**
     * Prints a human-readable plan: run identity, per-stack refresh mode, and merge operation order.
     *
     * @param state - Parsed run policies and artifact locations.
     * @param selectedWorktrees - Stacks that will participate if execution proceeds.
     */
    function printParallelPlan(state, selectedWorktrees) {
        console.log(`
  Parallel align-active plan:
  - run id: ${state.runId}
  - artifact dir: ${state.runDir}
  - target branch: ${state.targetBranch}
  - dirty policy: ${state.dirtyPolicy}
  - requested refresh mode: ${state.refreshMode}
  - stages: ${listAlignActiveParallelStages().join(" -> ")}`.trim());
        for (const selectedWorktree of selectedWorktrees) {
            const metadata = worktreeStackAlignActiveReadMetadata(selectedWorktree.worktreePath);
            console.log("");
            console.log(buildAlignActivePlanSummary({
                dirtyPolicy: state.dirtyPolicy,
                metadata,
                refreshMode: selectedWorktree.refreshMode,
                targetBranch: state.targetBranch,
            }));
            console.log("Operation order:");
            for (const operation of buildAlignActiveOperationPlan({
                metadata,
                refreshMode: selectedWorktree.refreshMode,
                rootDir: config.projectRoot,
                targetBranch: state.targetBranch,
            })) {
                console.log(`- ${operation}`);
            }
        }
    }
    /**
     * Factory for in-process log capture matching worktree-stack CLI line prefixes.
     *
     * @param lines - Mutable sink filled as normalize/validate tasks run.
     */
    function createBufferedLogger(lines) {
        return {
            /**
             * Records a single prefixed info line into the buffer.
             *
             * @param message - Log text without the `[worktree]` prefix (added here).
             */
            info(message) {
                lines.push(`[worktree] ${message}`);
            },
            /**
             * Records a two-column KV line aligned for readability in captured logs.
             *
             * @param key - Left column label.
             * @param value - Right column value.
             */
            printKv(key, value) {
                const paddedKey = `${key}:`.padEnd(24, " ");
                lines.push(`[worktree]   ${paddedKey} ${value}`);
            },
        };
    }
    /**
     * Spawns `npx tsx <script> ...` with stdout/stderr streamed to a dedicated log file.
     *
     * @remarks
     * I/O: Creates log directories and a write stream; resolves with child exit code.
     *
     * @param options - Child argv, env overlay, and log path.
     */
    function spawnStageProcess(options) {
        fs.mkdirSync(path.dirname(options.logFile), { recursive: true });
        const logStream = fs.createWriteStream(options.logFile, { flags: "w" });
        return new Promise((resolve, reject) => {
            const child = spawn(config.stageProcess.commandName, [...config.stageProcess.baseArgs, ...options.args], {
                cwd: config.projectRoot,
                env: options.env,
                stdio: ["ignore", "pipe", "pipe"],
            });
            child.stdout.on("data", (chunk) => {
                logStream.write(chunk);
            });
            child.stderr.on("data", (chunk) => {
                logStream.write(chunk);
            });
            child.on("error", (error) => {
                logStream.end(() => reject(error));
            });
            child.on("close", (code) => {
                logStream.end(() => resolve(code ?? 1));
            });
        });
    }
    /**
     * Runs in-process domain normalization for one worktree and flushes lines to the stage log.
     *
     * @param state - Policies applied to the normalize helper.
     * @param worktreePath - Absolute path to the prepared worktree.
     * @param logFile - Destination path for captured output and errors.
     */
    async function runNormalizeTask(state, worktreePath, logFile) {
        const lines = [];
        try {
            await worktreeStackAlignActiveNormalizeWorktreeDomain({
                dirtyPolicy: state.dirtyPolicy,
                executionMode: "push",
                logger: createBufferedLogger(lines),
                rootDir: config.projectRoot,
                worktreePath,
            });
            fs.writeFileSync(logFile, `${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`);
            return 0;
        }
        catch (error) {
            lines.push(formatCliErrorMessage(error));
            fs.writeFileSync(logFile, `${lines.join("\n")}\n`);
            return 1;
        }
    }
    /**
     * Validates final alignment for one stack and writes success or failure lines to the log.
     *
     * @param state - Target branch taken from CLI options.
     * @param worktreePath - Prepared worktree to validate.
     * @param logFile - Destination path for captured output and errors.
     */
    async function runValidateTask(state, worktreePath, logFile) {
        const lines = [];
        const logger = createBufferedLogger(lines);
        try {
            const metadata = worktreeStackAlignActiveReadMetadata(worktreePath);
            logger.info(`Validating stack '${metadata.stackName}' at ${metadata.worktreePath}`);
            worktreeStackAlignActiveValidateWorktreeAlignment(state.targetBranch, worktreePath);
            logger.info(`Validated alignment for '${metadata.stackName}'.`);
            fs.writeFileSync(logFile, `${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`);
            return 0;
        }
        catch (error) {
            lines.push(formatCliErrorMessage(error));
            fs.writeFileSync(logFile, `${lines.join("\n")}\n`);
            return 1;
        }
    }
    /**
     * Dispatches one parallel stage for a single worktree (spawned CLI or in-process helpers).
     *
     * @param state - Refresh policy and branch context for merge/refresh subprocess argv.
     * @param stageName - Per-worktree stage excluding discover and root sync.
     * @param worktreePath - Prepared worktree root passed to child or helpers.
     * @param logFile - Stage log path for this stack.
     */
    async function runStageTask(state, stageName, worktreePath, logFile) {
        const env = {
            ...process.env,
            WORKTREE_STACK_LOCK_EVENTS_FILE: process.env.WORKTREE_STACK_LOCK_EVENTS_FILE,
            WORKTREE_STACK_STAGE_EVENTS_FILE: process.env.WORKTREE_STACK_STAGE_EVENTS_FILE,
        };
        const selectedRefreshMode = worktreeStackAlignActiveDetermineRefreshMode(worktreePath, state.refreshMode);
        switch (stageName) {
            case "audit":
                return spawnStageProcess({
                    args: [
                        config.stageProcess.mergeEntrypoint,
                        "--worktree",
                        worktreePath,
                        "--target-branch",
                        state.targetBranch,
                        "--trust-worktree-submodule-state",
                        "--audit",
                    ],
                    env,
                    logFile,
                });
            case "normalize":
                return runNormalizeTask(state, worktreePath, logFile);
            case "merge":
                return spawnStageProcess({
                    args: [
                        config.stageProcess.mergeEntrypoint,
                        "--worktree",
                        worktreePath,
                        "--target-branch",
                        state.targetBranch,
                        "--skip-root-sync",
                        "--trust-worktree-submodule-state",
                        "--skip-batch-writer-lock",
                        "--push",
                    ],
                    env,
                    logFile,
                });
            case "refresh":
                return spawnStageProcess({
                    args: [
                        config.stageProcess.updateFromMainEntrypoint,
                        "--worktree",
                        worktreePath,
                        "--target-branch",
                        state.targetBranch,
                        "--mode",
                        selectedRefreshMode,
                        "--trust-worktree-submodule-state",
                        "--skip-batch-writer-lock",
                        "--push",
                    ],
                    env,
                    logFile,
                });
            case "validate":
                return runValidateTask(state, worktreePath, logFile);
        }
    }
    /**
     * Runs one stage across all selected worktrees concurrently, then enforces failure policy.
     *
     * @remarks
     * USAGE: Audit exit code 1 is treated as a warning; other stages fail the run on non-zero.
     *
     * @param state - Run dirs and telemetry; mutated with stage timing on success paths.
     * @param stageName - Stage executed in parallel across the batch.
     * @param selectedWorktrees - Stacks participating in this wave.
     */
    async function runWorktreeStageParallel(state, stageName, selectedWorktrees) {
        emitStageEvent(state, "stage-start", stageName, `worktrees=${selectedWorktrees.length}`);
        const startedAtMs = worktreeStackNowMs();
        const stageResults = await Promise.all(selectedWorktrees.map(async (selectedWorktree) => {
            const logFile = stageLogPath(state.runDir, stageName, selectedWorktree.stackName);
            const status = await runStageTask(state, stageName, selectedWorktree.worktreePath, logFile);
            return {
                logFile,
                status,
                worktreePath: selectedWorktree.worktreePath,
            };
        }));
        const endedAtMs = worktreeStackNowMs();
        recordStageTiming(state, stageName, startedAtMs, endedAtMs);
        let stageFailed = false;
        for (const result of stageResults) {
            if (stageName === "audit" && result.status === 1) {
                emitStageEvent(state, "task-warning", stageName, `${result.worktreePath} log=${result.logFile}`);
                continue;
            }
            if (result.status !== 0) {
                emitStageEvent(state, "task-failed", stageName, `${result.worktreePath} log=${result.logFile} exit=${result.status}`);
                worktreeStackPrintKv(`${stageName}-failure`, `${result.worktreePath} :: ${result.logFile}`);
                stageFailed = true;
                continue;
            }
            emitStageEvent(state, "task-succeeded", stageName, `${result.worktreePath} log=${result.logFile}`);
        }
        if (stageFailed) {
            emitStageEvent(state, "stage-failed", stageName, `see logs under ${path.join(state.runDir, "logs", stageName)}`);
            worktreeStackError(`Stage '${stageName}' failed. See logs under ${state.runDir}.`);
        }
        emitStageEvent(state, "stage-succeeded", stageName, `durationMs=${worktreeStackMeasureDurationMs(startedAtMs, endedAtMs)}`);
    }
    /**
     * Serial stage: brings the canonical repo root checkout onto the target branch under locks.
     *
     * @param state - Supplies target branch and run id for lock naming.
     */
    async function runSyncRootMainStage(state) {
        emitStageEvent(state, "stage-start", "sync-root-main", `targetBranch=${state.targetBranch}`);
        const startedAtMs = worktreeStackNowMs();
        state.currentStep = "sync-root-main";
        await WorktreeStackKit_syncRepoRootTargetCheckoutWithLocks({
            config: config.alignActive.repoRootSync,
            ownerLabel: `worktree-stack-align-active-parallel:${state.runId}:sync-root-main`,
            rootDir: config.projectRoot,
            targetBranch: state.targetBranch,
        });
        const endedAtMs = worktreeStackNowMs();
        recordStageTiming(state, "sync-root-main", startedAtMs, endedAtMs);
        emitStageEvent(state, "stage-succeeded", "sync-root-main", `durationMs=${worktreeStackMeasureDurationMs(startedAtMs, endedAtMs)}`);
    }
    /**
     * Executes staged parallel align-active across selected prepared worktrees (plan or push).
     *
     * @remarks
     * I/O: Writes run metadata under the configured artifact root and may mutate git remotes in
     * push mode.
     */
    async function runAlignActiveParallel(options) {
        const state = createState(options);
        try {
            state.currentStep = "preflight";
            requirePrerequisites();
            state.currentStep = "resolve-worktrees";
            state.resolvedWorktreePaths =
                worktreeStackAlignActiveResolveRequestedWorktrees(config.projectRoot, state.worktreePaths);
            state.currentStep = "target-checkout-ready";
            worktreeStackAlignActiveRequireTargetCheckoutReady(config.projectRoot, state.executionMode, state.targetBranch);
            const selectedWorktrees = state.resolvedWorktreePaths.map((worktreePath) => {
                const metadata = worktreeStackAlignActiveReadMetadata(worktreePath);
                return buildSelectedWorktreeSummary(metadata, worktreeStackAlignActiveDetermineRefreshMode(worktreePath, state.refreshMode));
            });
            fs.mkdirSync(state.runDir, { recursive: true });
            emitStageEvent(state, "stage-start", "discover", `worktrees=${selectedWorktrees.length}`);
            const discoverStartedAtMs = worktreeStackNowMs();
            writeRunMetadata(state, selectedWorktrees);
            const discoverEndedAtMs = worktreeStackNowMs();
            recordStageTiming(state, "discover", discoverStartedAtMs, discoverEndedAtMs);
            emitStageEvent(state, "stage-succeeded", "discover", `durationMs=${worktreeStackMeasureDurationMs(discoverStartedAtMs, discoverEndedAtMs)}`);
            worktreeStackInfo(`Parallel align-active artifact dir: ${state.runDir}`);
            worktreeStackInfo(`Selected ${selectedWorktrees.length} prepared worktree(s) for parallel align-active.`);
            if (state.executionMode === "plan") {
                printParallelPlan(state, selectedWorktrees);
                worktreeStackInfo("Plan only. Re-run with --push to execute the staged parallel alignment.");
                return 0;
            }
            await worktreeStackAcquireRepoWriterLock(config.projectRoot, `worktree-stack-align-active-parallel:${state.targetBranch}:${state.runId}`);
            await runWorktreeStageParallel(state, "audit", selectedWorktrees);
            await runWorktreeStageParallel(state, "normalize", selectedWorktrees);
            await runWorktreeStageParallel(state, "merge", selectedWorktrees);
            await runSyncRootMainStage(state);
            await runWorktreeStageParallel(state, "refresh", selectedWorktrees);
            await runWorktreeStageParallel(state, "validate", selectedWorktrees);
            writeStageTimings(state);
            worktreeStackInfo(`Parallel align-active completed for ${selectedWorktrees.length} worktree(s).`);
            worktreeStackInfo(`Artifacts: ${state.runDir}`);
            return 0;
        }
        catch (error) {
            console.error(formatCliErrorMessage(error));
            printDebugContext(state);
            return 1;
        }
        finally {
            worktreeStackReleaseAllNamedLocks();
            if (state.executionMode === "push") {
                worktreeStackReleaseRepoWriterLock(config.projectRoot);
            }
        }
    }
    /** CLI entrypoint wiring argv parsing to `runAlignActiveParallel`. */
    async function runAlignActiveParallelCli(argv) {
        try {
            const parsedOptions = parseAlignActiveParallelCliArgs(argv);
            if (parsedOptions === null) {
                return 0;
            }
            return await runAlignActiveParallel(parsedOptions);
        }
        catch (error) {
            console.error(formatCliErrorMessage(error));
            if (error instanceof AlignActiveParallelCliUsageError) {
                printUsage();
            }
            return 1;
        }
    }
    return {
        createAlignActiveParallelRunDir: (rootDir, runId) => createAlignActiveParallelRunDir(rootDir, runId, config.artifactsRelativePath),
        createAlignActiveParallelRunId,
        listAlignActiveParallelStages,
        parseAlignActiveParallelCliArgs,
        runAlignActiveParallel,
        runAlignActiveParallelCli,
    };
}
//# sourceMappingURL=align-active-parallel-command.js.map