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
export type WorktreeStackKit_MemoryMonitorConfig = {
    defaultLogDir: string;
    monitorRootPath: string;
    repoRoot: string;
    usageCommand: string;
};
export type WorktreeStackKit_ParseMemoryMonitorArgsResult_Options = {
    argv: readonly string[];
    defaultLogDir: string;
};
export type WorktreeStackKit_RunMemoryMonitorCommand_Options = {
    argv: readonly string[];
    config: WorktreeStackKit_MemoryMonitorConfig;
};
/**
 * Controls whether the monitor discovers all registered git worktrees or limits itself to
 * the prepared-worktree subset managed by the worktree stack.
 *
 * @remarks
 * PRE-CONDITION: "registered" is the default and scans every git worktree known to the repo.
 * PRE-CONDITION: "prepared-only" skips the primary checkout and only includes worktrees under
 * the `.tmp/worktree-stack/` subtree.
 */
export type MemoryMonitor_DiscoveryMode = "prepared-only" | "registered";
/**
 * Runtime options passed to the monitor after successful CLI argument parsing.
 *
 * @remarks
 * I/O: Consumed by the snapshot rendering and log-file append helpers.
 * These fields are derived from argv defaults and explicit flag overrides in
 * {@link WorktreeStackKit_parseMemoryMonitorArgsResult}.
 */
export type MemoryMonitor_Options = {
    discoveryMode: MemoryMonitor_DiscoveryMode;
    intervalSeconds: number;
    logDir: string;
    sampleLimit: number;
    topProcessesPerWorktree: number;
};
/**
 * Represents a single worktree entry in the monitoring catalog emitted at the start of each
 * snapshot block.
 *
 * @remarks
 * I/O: Produced by {@link memoryMonitorBuildCatalog} and rendered verbatim into CATALOG lines
 * in the legacy schema used by log scrapers.
 * All fields are pre-sanitized via {@link memoryMonitorSanitizeField} to keep log lines
 * single-line and parser-safe.
 */
export type MemoryMonitor_CatalogEntry = {
    branch: string;
    label: string;
    path: string;
};
/**
 * Represents one process line attributed to a specific worktree in the snapshot output.
 *
 * @remarks
 * I/O: Aggregated from raw `ps` rows and cwd resolution; sorted and sliced before rendering.
 * Field sanitization and truncation are applied during construction to preserve the legacy
 * log-schema contract.
 * `rssMb` is computed from the raw RSS value in kilobytes.
 */
export type MemoryMonitor_ProcessRow = {
    branch: string;
    command: string;
    cpu: string;
    cwd: string;
    label: string;
    mem: string;
    path: string;
    pid: string;
    ppid: string;
    rssMb: number;
};
/**
 * Result of parsing the monitor CLI argv without performing any process exit.
 *
 * @remarks
 * PURITY: No side effects; returns a tagged union rather than printing or exiting.
 * @example
 * ```typescript
 * const result = WorktreeStackKit_parseMemoryMonitorArgsResult(["--once", "--prepared-only"]);
 * if (result.kind === "ok") {
 *   void result.options.sampleLimit; // 1
 * }
 * ```
 */
export type MemoryMonitor_ParseArgsResult = {
    kind: "error";
    message: string;
    printUsage: boolean;
} | {
    kind: "help";
} | {
    kind: "ok";
    options: MemoryMonitor_Options;
};
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
export declare function WorktreeStackKit_parseMemoryMonitorArgsResult(options: WorktreeStackKit_ParseMemoryMonitorArgsResult_Options): MemoryMonitor_ParseArgsResult;
/**
 * Replaces tabs and CR/LF with spaces so snapshot fields stay single-line for log parsers.
 */
export declare function memoryMonitorSanitizeField(raw: string): string;
/**
 * Truncates long fields with an ellipsis suffix while preserving the legacy max-length contract.
 */
export declare function memoryMonitorTruncateField(rawValue: string, maxLength: number): string;
/**
 * Returns whether a `ps` command column matches the same Node/npm-family heuristic as the legacy shell `grep`.
 */
export declare function memoryMonitorCommandIsCandidate(commandText: string): boolean;
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
export declare function memoryMonitorRenderSnapshot(options: {
    catalog: readonly MemoryMonitor_CatalogEntry[];
    intervalSeconds: number;
    processRows: readonly MemoryMonitor_ProcessRow[];
    snapshotTimestamp: string;
    topProcessesPerWorktree: number;
}): string;
/**
 * CLI runtime loop: validates environment, rotates logs, captures snapshots until the sample budget.
 *
 * @remarks
 * I/O: Creates log directory, writes headers, snapshots on interval, always appends a stop trailer
 * in `finally`; returns a process exit code for harnesses.
 */
export declare function WorktreeStackKit_runMemoryMonitorCommand(commandOptions: WorktreeStackKit_RunMemoryMonitorCommand_Options): Promise<number>;
//# sourceMappingURL=memory-monitor.d.ts.map