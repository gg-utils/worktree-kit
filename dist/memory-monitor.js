/**
 * @fileoverview Config-driven worktree memory monitor command and snapshot helpers.
 *
 * Flow: argv + explicit project config -> git/worktree catalog -> process cwd attribution ->
 * per-worktree snapshot rendering -> append/mirror log output. Package code owns reusable parsing,
 * process matching, and render contracts; root adapters own project-specific paths and invocation text.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/memory-monitor.unit.test.ts
 * @testing CLI: npx tsx scripts/worktree-stack/commands/memory-monitor.ts --help
 *
 * @see scripts/worktree-stack/commands/memory-monitor.ts - Root `tsx` adapter that passes `worktrees.config.ts` paths into {@link WorktreeStackKit_runMemoryMonitorCommand} for the operator-facing monitor CLI.
 * @see packages/worktree-kit/src/memory-monitor.unit.test.ts - Node test module that locks argv parsing, field sanitization, and snapshot line contracts for this implementation.
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports this module as `@gg-utils/worktree-kit/memory-monitor` for stack tooling and config imports.
 * @see worktrees.config.ts - `worktreesConfigMemoryMonitorConfig` factory that supplies `repoRoot`, stack paths, and usage text consumed when the monitor runs from the worktree-stack scripts.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { worktreeStackRunGit } from "@gg-utils/worktree-core/foundation";
import { worktreeStackListPreparedWorktrees, worktreeStackListRegisteredWorktrees, } from "@gg-utils/worktree-core/worktree-discovery";
const MEMORY_MONITOR_CANDIDATE_NAMES = [
    "node",
    "npm",
    "npx",
    "pnpm",
    "yarn",
    "bun",
    "tsx",
    "next-server",
    "astro",
    "vite",
    "jest",
    "playwright",
    "turbo",
];
/**
 * Escapes regex metacharacters when embedding process-name literals into `RegExp` fragments.
 *
 * @remarks
 * PURITY: Pure string transform used only when building {@link MEMORY_MONITOR_CANDIDATE_TESTS}.
 */
function memoryMonitorEscapeRegExpLiteral(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
const MEMORY_MONITOR_CANDIDATE_TESTS = MEMORY_MONITOR_CANDIDATE_NAMES.map((name) => {
    const escaped = memoryMonitorEscapeRegExpLiteral(name);
    return new RegExp(`(^|[ /])(${escaped})([ /(:]|$)`, "iu");
});
const MEMORY_MONITOR_MAX_PARENT_DEPTH = 4;
/**
 * Validates a decimal CLI argument string and returns a user-facing error message when invalid.
 *
 * @remarks
 * PURITY: No side effects; accepts only base-10 digit strings strictly greater than zero.
 */
function memoryMonitorRequirePositiveIntegerOrError(rawValue, flagName) {
    if (!/^\d+$/u.test(rawValue) || Number.parseInt(rawValue, 10) <= 0) {
        return `${flagName} must be a positive integer. Received: ${rawValue}`;
    }
    return null;
}
/**
 * Parses one argv token (and its value when applicable) against the monitor flag grammar.
 *
 * @remarks
 * PURITY: Mutates `state` for recognized flags; returns errors instead of printing.
 */
function memoryMonitorHandleArgvToken(argv, index, state) {
    const token = argv[index] ?? "";
    if (token === "--interval-seconds") {
        const raw = argv[index + 1] ?? "";
        const err = memoryMonitorRequirePositiveIntegerOrError(raw, "--interval-seconds");
        if (err !== null) {
            return { advance: 0, result: { kind: "error", message: err, printUsage: false } };
        }
        state.intervalSeconds = Number.parseInt(raw, 10);
        return { advance: 2 };
    }
    if (token === "--samples") {
        const raw = argv[index + 1] ?? "";
        const err = memoryMonitorRequirePositiveIntegerOrError(raw, "--samples");
        if (err !== null) {
            return { advance: 0, result: { kind: "error", message: err, printUsage: false } };
        }
        state.sampleLimit = Number.parseInt(raw, 10);
        return { advance: 2 };
    }
    if (token === "--once") {
        state.sampleLimit = 1;
        return { advance: 1 };
    }
    if (token === "--top-processes") {
        const raw = argv[index + 1] ?? "";
        const err = memoryMonitorRequirePositiveIntegerOrError(raw, "--top-processes");
        if (err !== null) {
            return { advance: 0, result: { kind: "error", message: err, printUsage: false } };
        }
        state.topProcessesPerWorktree = Number.parseInt(raw, 10);
        return { advance: 2 };
    }
    if (token === "--log-dir") {
        const next = argv[index + 1] ?? "";
        if (next.length === 0) {
            return {
                advance: 0,
                result: {
                    kind: "error",
                    message: "--log-dir requires a non-empty path.",
                    printUsage: false,
                },
            };
        }
        state.logDir = next;
        return { advance: 2 };
    }
    if (token === "--prepared-only") {
        state.discoveryMode = "prepared-only";
        return { advance: 1 };
    }
    if (token === "--help" || token === "-h") {
        return { advance: 0, result: { kind: "help" } };
    }
    return {
        advance: 0,
        result: {
            kind: "error",
            message: `Unknown argument: ${token}`,
            printUsage: true,
        },
    };
}
/**
 * Parses argv without exiting; mirrors the CLI flag semantics for tests and tooling.
 *
 * @remarks
 * PURITY: No process exit; returns `help` or `error` instead of printing usage.
 * USAGE: The CLI entry uses `memoryMonitorParseArgsAndExit`, which maps results to stdout/stderr and
 * `process.exit`.
 *
 * @example
 * ```typescript
 * const result = WorktreeStackKit_parseMemoryMonitorArgsResult(["--samples", "2", "--prepared-only"]);
 * ```
 */
export function WorktreeStackKit_parseMemoryMonitorArgsResult(options) {
    const { argv, defaultLogDir } = options;
    const state = {
        discoveryMode: "registered",
        intervalSeconds: 10,
        logDir: defaultLogDir,
        sampleLimit: 0,
        topProcessesPerWorktree: 5,
    };
    for (let index = 0; index < argv.length;) {
        const step = memoryMonitorHandleArgvToken(argv, index, state);
        if (step.result !== undefined) {
            return step.result;
        }
        index += step.advance;
    }
    return {
        kind: "ok",
        options: {
            discoveryMode: state.discoveryMode,
            intervalSeconds: state.intervalSeconds,
            logDir: state.logDir,
            sampleLimit: state.sampleLimit,
            topProcessesPerWorktree: state.topProcessesPerWorktree,
        },
    };
}
/**
 * Parses argv and exits the process on help or validation errors.
 *
 * @remarks
 * I/O: Prints usage or errors to the tty and calls `process.exit`; tests should prefer
 * {@link WorktreeStackKit_parseMemoryMonitorArgsResult}.
 */
function memoryMonitorParseArgsAndExit(argv, config) {
    const parsed = WorktreeStackKit_parseMemoryMonitorArgsResult({
        argv,
        defaultLogDir: config.defaultLogDir,
    });
    if (parsed.kind === "help") {
        memoryMonitorPrintUsage(config.usageCommand);
        process.exit(0);
    }
    if (parsed.kind === "error") {
        memoryMonitorPrintError(parsed.message);
        if (parsed.printUsage) {
            memoryMonitorPrintUsage(config.usageCommand);
        }
        process.exit(1);
    }
    return parsed.options;
}
/**
 * Prints a monitor-scoped error line to stderr.
 *
 * @remarks
 * I/O: `console.error`; shared by parse failures and best-effort cwd resolution warnings.
 */
function memoryMonitorPrintError(message) {
    console.error(`[worktree] ERROR: ${message}`);
}
/**
 * Prints the full CLI usage banner to stdout.
 *
 * @remarks
 * I/O: `console.log`; invoked for `--help` and some unknown-argument paths.
 */
function memoryMonitorPrintUsage(usageCommand) {
    console.log(`Usage: ${usageCommand} [options]

Dynamically monitor Node/npm-style processes running from all registered git worktrees.

Options:
  --interval-seconds <seconds>   Sampling interval in seconds (default: 10)
  --samples <count>              Stop after N snapshots instead of running forever
  --once                         Capture a single snapshot and exit
  --top-processes <count>        Number of per-worktree process lines to print (default: 5)
  --log-dir <path>               Override the log directory
  --prepared-only                Limit discovery to prepared worktrees (skip primary checkout)
  --help, -h                     Show this help text
`);
}
/**
 * Replaces tabs and CR/LF with spaces so snapshot fields stay single-line for log parsers.
 */
export function memoryMonitorSanitizeField(raw) {
    return raw.replaceAll(/[\t\r\n]/gu, " ");
}
/**
 * Truncates long fields with an ellipsis suffix while preserving the legacy max-length contract.
 */
export function memoryMonitorTruncateField(rawValue, maxLength) {
    const sanitized = memoryMonitorSanitizeField(rawValue);
    if (sanitized.length <= maxLength) {
        return sanitized;
    }
    if (maxLength <= 3) {
        return sanitized.slice(0, maxLength);
    }
    return `${sanitized.slice(0, maxLength - 3)}...`;
}
/**
 * Returns whether a `ps` command column matches the same Node/npm-family heuristic as the legacy shell `grep`.
 */
export function memoryMonitorCommandIsCandidate(commandText) {
    return MEMORY_MONITOR_CANDIDATE_TESTS.some((pattern) => pattern.test(commandText));
}
/**
 * Detects whether `/proc` is present and directory-like for cwd resolution.
 *
 * @remarks
 * I/O: `fs.existsSync`/`statSync`; logs via {@link memoryMonitorPrintError} on stat failure.
 */
function memoryMonitorHasProcFs() {
    try {
        return fs.existsSync("/proc") && fs.statSync("/proc").isDirectory();
    }
    catch (error) {
        memoryMonitorPrintError(String(error));
        return false;
    }
}
/**
 * Returns whether a command resolves on PATH via `which`.
 *
 * @remarks
 * I/O: Spawns `which` with ignored stdio; treats non-zero exit as unavailable.
 */
function memoryMonitorCommandAvailable(commandName) {
    const result = spawnSync("which", [commandName], {
        encoding: "utf8",
        stdio: "ignore",
    });
    return result.status === 0;
}
/**
 * Verifies `git` and `ps` exist and that cwd tooling (`/proc` or `lsof`) is usable.
 *
 * @remarks
 * I/O: May print errors and `process.exit(1)` when the environment cannot satisfy cwd resolution.
 */
function memoryMonitorEnsureDependencies() {
    memoryMonitorRequireCommandOrExit("git");
    memoryMonitorRequireCommandOrExit("ps");
    if (!memoryMonitorHasProcFs() && !memoryMonitorCommandAvailable("lsof")) {
        memoryMonitorPrintError("This monitor needs either /proc support or lsof to resolve process cwd values.");
        process.exit(1);
    }
}
/**
 * Ensures a required external command exists, otherwise prints and exits fatally.
 *
 * @remarks
 * I/O: stderr message plus `process.exit(1)` when `which` fails.
 */
function memoryMonitorRequireCommandOrExit(commandName) {
    if (!memoryMonitorCommandAvailable(commandName)) {
        memoryMonitorPrintError(`Required command is not available: ${commandName}`);
        process.exit(1);
    }
}
/**
 * Captures the local `date` shell output used in log headers and stop banners.
 *
 * @remarks
 * I/O: Synchronous `execSync("date")`; trailing newlines trimmed from stdout.
 */
function memoryMonitorShellDate() {
    return execSync("date", { encoding: "utf8" }).trimEnd();
}
/**
 * Formats a wall-clock instant as the snapshot title timestamp (`YYYY-MM-DD HH:mm:ss`).
 *
 * @remarks
 * PURITY: Pure formatting for {@link memoryMonitorRenderSnapshot} titles.
 */
function memoryMonitorFormatSnapshotTimestamp(date) {
    /**
     * Zero-pads a numeric calendar or clock field to two digits.
     *
     * @remarks
     * PURITY: Local helper for {@link memoryMonitorFormatSnapshotTimestamp}.
     */
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
/**
 * Builds a compact timestamp string used in the rotating log file basename.
 *
 * @remarks
 * PURITY: Filename-safe ordering (`YYYYMMDD_HHMMSS`); no filesystem I/O.
 */
function memoryMonitorLogFileTimestamp(date) {
    /**
     * Zero-pads a numeric calendar or clock field to two digits.
     *
     * @remarks
     * PURITY: Local helper for {@link memoryMonitorLogFileTimestamp}.
     */
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
/**
 * Lists filesystem paths to monitor according to the discovery mode.
 *
 * @remarks
 * I/O: Delegates to prepared vs registered worktree enumerators; falls back to repo root
 * when the catalog would otherwise be empty.
 */
function memoryMonitorDiscoverWorktreePaths(options, config) {
    const paths = options.discoveryMode === "prepared-only"
        ? worktreeStackListPreparedWorktrees(config.repoRoot)
        : worktreeStackListRegisteredWorktrees(config.repoRoot);
    const sorted = [...paths].sort((left, right) => left.localeCompare(right));
    if (sorted.length > 0) {
        return sorted;
    }
    return [config.repoRoot];
}
/**
 * Derives the short catalog label from a worktree directory path.
 *
 * @remarks
 * PURITY: Uses `path.basename` only.
 */
function memoryMonitorWorktreeLabel(worktreePath) {
    return path.basename(worktreePath);
}
/**
 * Resolves the current git branch name for a worktree, or `unknown` when git fails.
 *
 * @remarks
 * I/O: Invokes `git rev-parse` via {@link worktreeStackRunGit} with `allowFailure`.
 */
function memoryMonitorWorktreeBranch(worktreePath) {
    const result = worktreeStackRunGit(worktreePath, ["rev-parse", "--abbrev-ref", "HEAD"], {
        allowFailure: true,
    });
    if (result.status !== 0) {
        return "unknown";
    }
    const line = result.stdout.split(/\r?\n/u)[0]?.trim();
    return line && line.length > 0 ? line : "unknown";
}
/**
 * Builds sanitized catalog rows aligned with the monitoring path ordering.
 *
 * @remarks
 * PURITY: Sanitizes branch, label, and path for stable log lines.
 */
function memoryMonitorBuildCatalog(paths) {
    return paths.map((worktreePath) => ({
        branch: memoryMonitorSanitizeField(memoryMonitorWorktreeBranch(worktreePath)),
        label: memoryMonitorSanitizeField(memoryMonitorWorktreeLabel(worktreePath)),
        path: memoryMonitorSanitizeField(worktreePath),
    }));
}
/**
 * Chooses the longest matching worktree path prefix for a process cwd.
 *
 * @remarks
 * PURITY: Longest-prefix wins among paths where `cwd` equals or extends `candidate/`.
 */
function memoryMonitorWorktreeIndexForCwd(cwdPath, worktreePaths) {
    let bestIndex = -1;
    let bestLength = 0;
    for (let index = 0; index < worktreePaths.length; index += 1) {
        const candidatePath = worktreePaths[index] ?? "";
        if (candidatePath.length === 0) {
            continue;
        }
        if (cwdPath === candidatePath || cwdPath.startsWith(`${candidatePath}/`)) {
            if (candidatePath.length > bestLength) {
                bestLength = candidatePath.length;
                bestIndex = index;
            }
        }
    }
    return bestIndex;
}
/**
 * Reads the parent PID column for a process from `ps`.
 *
 * @remarks
 * I/O: Spawns `ps -p <pid> -o ppid=`; returns empty string on failure or missing rows.
 */
function memoryMonitorProcessParentPid(pid) {
    const result = spawnSync("ps", ["-p", pid, "-o", "ppid="], {
        encoding: "utf8",
    });
    if (result.status !== 0) {
        return "";
    }
    const line = result.stdout.trim().split(/\r?\n/u)[0]?.trim();
    return line ?? "";
}
/**
 * Resolves a process cwd via `/proc/<pid>/cwd`.
 *
 * @remarks
 * I/O: `readlinkSync`; logs failures and returns empty string when unreadable.
 */
function memoryMonitorReadProcCwd(pid) {
    try {
        return fs.readlinkSync(path.join("/proc", pid, "cwd"));
    }
    catch (error) {
        memoryMonitorPrintError(String(error));
        return "";
    }
}
/**
 * Resolves cwd for one PID using `lsof` when `/proc` is unavailable.
 *
 * @remarks
 * I/O: Spawns `lsof` with cwd descriptor filters; picks the first `n` field from stdout.
 */
function memoryMonitorLsofSingleCwd(pid) {
    const result = spawnSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], {
        encoding: "utf8",
    });
    if (result.status !== 0) {
        return "";
    }
    for (const line of result.stdout.split(/\r?\n/u)) {
        if (line.startsWith("n")) {
            return line.slice(1);
        }
    }
    return "";
}
/**
 * Returns a cached cwd string or empty when the PID has not been prefetched.
 *
 * @remarks
 * PURITY: Read-only map lookup used to avoid repeated `/proc` or `lsof` work per PID.
 */
function memoryMonitorLookupCwdFromCache(pid, cache) {
    return cache.get(pid) ?? "";
}
/**
 * Resolves cwd for a PID using cache-first, then `/proc`, then `lsof` fallbacks.
 *
 * @remarks
 * I/O: May invoke {@link memoryMonitorReadProcCwd} or `lsof` when the cache misses.
 */
function memoryMonitorProcessCwd(pid, cache) {
    const cached = memoryMonitorLookupCwdFromCache(pid, cache);
    if (cached.length > 0) {
        return cached;
    }
    if (memoryMonitorHasProcFs()) {
        const fromProc = memoryMonitorReadProcCwd(pid);
        if (fromProc.length > 0) {
            return fromProc;
        }
    }
    if (memoryMonitorCommandAvailable("lsof")) {
        return memoryMonitorLsofSingleCwd(pid);
    }
    return "";
}
/**
 * Populates cwd entries by reading `/proc/<pid>/cwd` for each PID in bulk.
 *
 * @remarks
 * I/O: Mutates `cache`; skips empty PIDs and logs read failures via {@link memoryMonitorReadProcCwd}.
 */
function memoryMonitorFillCwdCacheFromProc(pidList, cache) {
    for (const pid of pidList) {
        if (pid.length === 0) {
            continue;
        }
        const cwdPath = memoryMonitorReadProcCwd(pid);
        if (cwdPath.length > 0) {
            cache.set(pid, cwdPath);
        }
    }
}
/**
 * Batch-fills cwd entries with one `lsof` invocation when `/proc` is not viable.
 *
 * @remarks
 * I/O: Spawns `lsof` with multiple PIDs; silently no-ops when `lsof` is missing or outputs nothing.
 */
function memoryMonitorFillCwdCacheFromLsofBatch(pidList, cache) {
    if (!memoryMonitorCommandAvailable("lsof")) {
        return;
    }
    const pidCsv = pidList.filter((value) => value.length > 0).join(",");
    if (pidCsv.length === 0) {
        return;
    }
    const result = spawnSync("lsof", ["-a", "-d", "cwd", "-p", pidCsv, "-Fn"], {
        encoding: "utf8",
    });
    if (result.status !== 0 && result.stdout.length === 0) {
        return;
    }
    let currentPid = "";
    for (const line of result.stdout.split(/\r?\n/u)) {
        if (line.startsWith("p")) {
            currentPid = line.slice(1);
            continue;
        }
        if (line.startsWith("n") && currentPid.length > 0) {
            cache.set(currentPid, line.slice(1));
        }
    }
}
/**
 * Builds a PID-to-cwd cache using `/proc` when possible, otherwise batched `lsof`.
 *
 * @remarks
 * I/O: Delegates to proc-first or lsof batch helpers; returns an empty map when `pidList` is empty.
 */
function memoryMonitorBuildProcessCwdCache(pidList) {
    const cache = new Map();
    if (pidList.length === 0) {
        return { cache };
    }
    if (memoryMonitorHasProcFs()) {
        memoryMonitorFillCwdCacheFromProc(pidList, cache);
        return { cache };
    }
    memoryMonitorFillCwdCacheFromLsofBatch(pidList, cache);
    return { cache };
}
/**
 * Walks a shallow parent chain to attribute a PID to a catalog worktree via cwd matching.
 *
 * @remarks
 * I/O: Consults cwd cache and may call {@link memoryMonitorProcessParentPid} while ascending;
 * bounded by `MEMORY_MONITOR_MAX_PARENT_DEPTH` to avoid infinite loops.
 */
function memoryMonitorResolveProcessWorktree(pid, initialPpid, worktreePaths, cwdCache) {
    let currentPid = pid;
    let currentPpid = initialPpid;
    let depth = 0;
    while (currentPid.length > 0 &&
        currentPid !== "0" &&
        depth <= MEMORY_MONITOR_MAX_PARENT_DEPTH) {
        const currentCwd = memoryMonitorProcessCwd(currentPid, cwdCache);
        if (currentCwd.length > 0) {
            const matchedIndex = memoryMonitorWorktreeIndexForCwd(currentCwd, worktreePaths);
            if (matchedIndex >= 0) {
                return { cwdPath: currentCwd, worktreeIndex: matchedIndex };
            }
        }
        if (currentPpid.length === 0 || currentPpid === currentPid) {
            currentPpid = memoryMonitorProcessParentPid(currentPid);
        }
        currentPid = currentPpid;
        currentPpid = "";
        depth += 1;
    }
    return null;
}
/**
 * Parses a whitespace-delimited `ps` line into structured columns before the free-form command.
 *
 * @remarks
 * PURITY: Returns null when fewer than five leading numeric/command fields are present.
 */
function memoryMonitorParsePsLine(line) {
    const trimmed = line.trimStart();
    const fields = [];
    let position = 0;
    for (let fieldIndex = 0; fieldIndex < 5; fieldIndex += 1) {
        while (position < trimmed.length && trimmed[position] === " ") {
            position += 1;
        }
        const start = position;
        while (position < trimmed.length && trimmed[position] !== " ") {
            position += 1;
        }
        if (start === position) {
            return null;
        }
        fields.push(trimmed.slice(start, position));
    }
    while (position < trimmed.length && trimmed[position] === " ") {
        position += 1;
    }
    const command = trimmed.slice(position);
    const pid = fields[0] ?? "";
    const ppid = fields[1] ?? "";
    const cpu = fields[2] ?? "";
    const mem = fields[3] ?? "";
    const rss = fields[4] ?? "";
    if (pid.length === 0 || command.length === 0) {
        return null;
    }
    return { command, cpu, mem, pid, ppid, rss };
}
/**
 * Lists candidate Node-family processes via `ps` and filters to the heuristic command patterns.
 *
 * @remarks
 * I/O: Spawns `ps`; exits the process when `ps` fails; skips unparsable or non-candidate rows.
 */
function memoryMonitorCollectPsRows() {
    const result = spawnSync("ps", ["-axo", "pid=,ppid=,pcpu=,pmem=,rss=,command="], { encoding: "utf8" });
    if (result.status !== 0) {
        memoryMonitorPrintError("Failed to run ps for process listing.");
        process.exit(1);
    }
    const rows = [];
    for (const line of result.stdout.split(/\r?\n/u)) {
        if (line.trim().length === 0) {
            continue;
        }
        const parsed = memoryMonitorParsePsLine(line);
        if (!parsed) {
            continue;
        }
        if (!memoryMonitorCommandIsCandidate(parsed.command)) {
            continue;
        }
        rows.push(parsed);
    }
    return rows;
}
/**
 * Orders process rows by worktree label, then descending RSS megabytes for stable snapshots.
 *
 * @remarks
 * PURITY: Copies before sort to avoid mutating caller arrays.
 */
function memoryMonitorSortProcessRows(rows) {
    return [...rows].sort((left, right) => {
        const labelCmp = left.label.localeCompare(right.label);
        if (labelCmp !== 0) {
            return labelCmp;
        }
        return right.rssMb - left.rssMb;
    });
}
/**
 * Renders one `=== Snapshot ===` block including `CATALOG`, `WORKTREE`, `SUMMARY`, and `PROCESS` lines.
 *
 * @remarks
 * I/O: Pure string synthesis; callers append to log files and stdout.
 * Column order and numeric formatting match the former `awk` END block so log scrapers stay stable.
 * Output ends with a trailing blank line after the catalog loop, matching the legacy `print ""`.
 *
 * @example
 * ```typescript
 * memoryMonitorRenderSnapshot({
 *   catalog: [{ branch: "main", label: "wt", path: "/tmp/wt" }],
 *   intervalSeconds: 10,
 *   processRows: [],
 *   snapshotTimestamp: "2026-04-12 12:00:00",
 *   topProcessesPerWorktree: 5,
 * });
 * ```
 */
export function memoryMonitorRenderSnapshot(options) {
    const sorted = memoryMonitorSortProcessRows(options.processRows);
    const { intervalSeconds, snapshotTimestamp, topProcessesPerWorktree, } = options;
    const catalog = options.catalog;
    const processCount = new Map();
    const totalCpu = new Map();
    const totalMem = new Map();
    const totalRssMb = new Map();
    const topSeen = new Map();
    const processLines = new Map();
    let matchedProcesses = 0;
    for (const row of sorted) {
        const label = row.label;
        matchedProcesses += 1;
        processCount.set(label, (processCount.get(label) ?? 0) + 1);
        totalCpu.set(label, (totalCpu.get(label) ?? 0) + Number.parseFloat(row.cpu));
        totalMem.set(label, (totalMem.get(label) ?? 0) + Number.parseFloat(row.mem));
        totalRssMb.set(label, (totalRssMb.get(label) ?? 0) + row.rssMb);
        const seen = topSeen.get(label) ?? 0;
        if (seen < topProcessesPerWorktree) {
            topSeen.set(label, seen + 1);
            const line = `PROCESS | label=${label} | pid=${row.pid} | ppid=${row.ppid} | rss_mb=${String(row.rssMb)} | cpu=${row.cpu}% | mem=${row.mem}% | cwd=${row.cwd} | command=${row.command}`;
            const bucket = processLines.get(label) ?? [];
            bucket.push(line);
            processLines.set(label, bucket);
        }
    }
    const lines = [];
    lines.push(`=== Snapshot ${snapshotTimestamp} ===`);
    lines.push(`CATALOG | worktrees=${String(catalog.length)} | matched_processes=${String(matchedProcesses)} | interval_seconds=${String(intervalSeconds)} | top_processes_per_worktree=${String(topProcessesPerWorktree)}`);
    for (const entry of catalog) {
        const label = entry.label;
        lines.push(`WORKTREE | label=${label} | branch=${entry.branch} | path=${entry.path}`);
        const processes = processCount.get(label) ?? 0;
        const rssSum = totalRssMb.get(label) ?? 0;
        const cpuSum = totalCpu.get(label) ?? 0;
        const memSum = totalMem.get(label) ?? 0;
        lines.push(`SUMMARY | label=${memoryMonitorSanitizeField(label)} | processes=${String(processes)} | total_rss_mb=${String(Math.trunc(rssSum))} | total_cpu=${cpuSum.toFixed(1)} | total_mem_pct=${memSum.toFixed(1)}`);
        for (const processLine of processLines.get(label) ?? []) {
            lines.push(processLine);
        }
    }
    lines.push("");
    return `${lines.join("\n")}\n`;
}
/**
 * Correlates filtered `ps` rows with catalog worktrees using cwd and parent-walk attribution.
 *
 * @remarks
 * I/O: Runs process discovery, builds a cwd cache, and constructs renderer-ready rows with sanitized,
 * truncated command and cwd fields.
 */
function memoryMonitorBuildProcessRows(catalog, worktreePaths) {
    const psRows = memoryMonitorCollectPsRows();
    const pidSet = new Set();
    for (const row of psRows) {
        pidSet.add(row.pid);
        if (row.ppid.length > 0 && row.ppid !== "0") {
            pidSet.add(row.ppid);
        }
    }
    const { cache } = memoryMonitorBuildProcessCwdCache([...pidSet]);
    const output = [];
    for (const row of psRows) {
        const resolved = memoryMonitorResolveProcessWorktree(row.pid, row.ppid, worktreePaths, cache);
        if (!resolved) {
            continue;
        }
        if (!/^\d+$/u.test(row.rss)) {
            continue;
        }
        const rssMb = Math.trunc(Number.parseInt(row.rss, 10) / 1024);
        const wt = catalog[resolved.worktreeIndex];
        if (!wt) {
            continue;
        }
        output.push({
            branch: memoryMonitorSanitizeField(wt.branch),
            command: memoryMonitorTruncateField(row.command, 160),
            cpu: memoryMonitorSanitizeField(row.cpu),
            cwd: memoryMonitorTruncateField(resolved.cwdPath, 120),
            label: memoryMonitorSanitizeField(wt.label),
            mem: memoryMonitorSanitizeField(row.mem),
            path: memoryMonitorSanitizeField(wt.path),
            pid: memoryMonitorSanitizeField(row.pid),
            ppid: memoryMonitorSanitizeField(row.ppid),
            rssMb,
        });
    }
    return output;
}
/**
 * Appends a rendered snapshot to the log file and mirrors it to stdout.
 *
 * @remarks
 * I/O: `appendFileSync` plus `process.stdout.write` to preserve streaming parity with the shell tool.
 */
function memoryMonitorAppendSnapshot(logFilePath, snapshotText) {
    fs.appendFileSync(logFilePath, snapshotText, "utf8");
    process.stdout.write(snapshotText);
}
/**
 * Writes the session header block once at monitor startup and echoes it to stdout.
 *
 * @remarks
 * I/O: `writeFileSync` truncates/creates the log; mirrors discovery and sampling options for auditability.
 */
function memoryMonitorWriteHeader(logFilePath, options, config) {
    const startedAt = memoryMonitorShellDate();
    const headerLines = [];
    headerLines.push(`=== Worktree Memory Monitor Started: ${startedAt} ===`);
    headerLines.push(`root_dir=${config.monitorRootPath}`);
    headerLines.push(`log_file=${logFilePath}`);
    headerLines.push(`discovery_mode=${options.discoveryMode}`);
    headerLines.push(`interval_seconds=${String(options.intervalSeconds)}`);
    headerLines.push(`top_processes_per_worktree=${String(options.topProcessesPerWorktree)}`);
    if (options.sampleLimit > 0) {
        headerLines.push(`sample_limit=${String(options.sampleLimit)}`);
    }
    else {
        headerLines.push("sample_limit=unbounded");
    }
    headerLines.push("");
    const text = `${headerLines.join("\n")}\n`;
    fs.writeFileSync(logFilePath, text, "utf8");
    process.stdout.write(text);
}
/**
 * Appends the monitor-stopped trailer; swallows append errors when the log is missing.
 *
 * @remarks
 * I/O: Best-effort `appendFileSync`; stderr via {@link memoryMonitorPrintError} on failure.
 */
function memoryMonitorAppendStopped(logFilePath) {
    const text = `=== Worktree Memory Monitor Stopped: ${memoryMonitorShellDate()} ===\n`;
    try {
        fs.appendFileSync(logFilePath, text, "utf8");
    }
    catch (error) {
        // Best-effort: log file may be missing if startup failed early.
        memoryMonitorPrintError(String(error));
    }
}
/**
 * Waits asynchronously between sampling iterations without busy looping.
 *
 * @remarks
 * I/O: Schedules via `setTimeout`; resolves after `ms` milliseconds elapse.
 */
async function memoryMonitorDelayMs(ms) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * CLI runtime loop: validates environment, rotates logs, captures snapshots until the sample budget.
 *
 * @remarks
 * I/O: Creates log directory, writes headers, snapshots on interval, always appends a stop trailer
 * in `finally`; returns a process exit code for harnesses.
 */
export async function WorktreeStackKit_runMemoryMonitorCommand(commandOptions) {
    const { argv, config } = commandOptions;
    const options = memoryMonitorParseArgsAndExit(argv, config);
    memoryMonitorEnsureDependencies();
    fs.mkdirSync(options.logDir, { recursive: true });
    const stamp = memoryMonitorLogFileTimestamp(new Date());
    const logFilePath = path.join(options.logDir, `memory_monitor_${stamp}.log`);
    memoryMonitorWriteHeader(logFilePath, options, config);
    try {
        let snapshotCount = 0;
        while (true) {
            const worktreePaths = memoryMonitorDiscoverWorktreePaths(options, config);
            const catalog = memoryMonitorBuildCatalog(worktreePaths);
            const processRows = memoryMonitorBuildProcessRows(catalog, worktreePaths);
            const snapshotText = memoryMonitorRenderSnapshot({
                catalog,
                intervalSeconds: options.intervalSeconds,
                processRows,
                snapshotTimestamp: memoryMonitorFormatSnapshotTimestamp(new Date()),
                topProcessesPerWorktree: options.topProcessesPerWorktree,
            });
            memoryMonitorAppendSnapshot(logFilePath, snapshotText);
            snapshotCount += 1;
            if (options.sampleLimit > 0 && snapshotCount >= options.sampleLimit) {
                break;
            }
            await memoryMonitorDelayMs(options.intervalSeconds * 1000);
        }
    }
    finally {
        memoryMonitorAppendStopped(logFilePath);
    }
    return 0;
}
