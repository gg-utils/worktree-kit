/**
 * @fileoverview Config-driven checkout and submodule state-check command runner.
 *
 * Flow: explicit checkout context resolver + git probes -> checkout summary block -> matrix table.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see scripts/worktree-stack/commands/state-check.ts - Local-edge CLI adapter that resolves checkout contract context and invokes `WorktreeStackKit_runStateCheckCommand` with repo argv wiring.
 * @see packages/worktree-kit/src/state-check.unit.test.ts - Jest unit coverage for argv parsing, git-output parsers/formatters, and the stdout matrix owned by this runner.
 * @see packages/worktree-kit/src/index.ts - Package export surface that re-exports this module for `@gg-utils/worktree-kit/state-check` consumers.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type WorktreeStackKit_StateCheckContext = {
  checkoutType: string;
  expectedRootBranch: string;
  expectedSubmoduleBranch: string;
  metadataError: string | null;
  metadataPath: string | null;
  metadataState: string;
};

export type WorktreeStackKit_StateCheckConfig = {
  canonicalRootBranch: string;
  developmentBranch: string;
  repoRoot: string;
  resolveContext: (repoRoot: string) => WorktreeStackKit_StateCheckContext;
  usageCommand: string;
};

export type WorktreeStackKit_RunStateCheckCommand_Options = {
  argv: readonly string[];
  config: WorktreeStackKit_StateCheckConfig;
};

/** Table row discriminator for the printed checkout matrix. */
type WorktreeStateCheck_RepoKind = "root" | "submodule";

/** Parsed CLI switches controlling fetch behavior and help display. */
export type WorktreeStateCheck_Options = {
  fetch: boolean;
  help: boolean;
};

/** Resolved checkout contract used to annotate the summary block. */
type WorktreeStateCheck_Context = WorktreeStackKit_StateCheckContext;

/** Normalized outcome from a spawned `git` child process for downstream parsing. */
export type WorktreeStateCheck_CommandResult = {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
};

/** Submodule entry parsed from `.gitmodules` for path and configured upstream branch. */
export type WorktreeStateCheck_SubmoduleDefinition = {
  name: string;
  path: string;
  configuredBranch: string;
};

/** Printed matrix row combining expected vs actual branch, dirtiness, and ahead/behind strings. */
export type WorktreeStateCheck_Row = {
  repo: string;
  kind: WorktreeStateCheck_RepoKind;
  configuredBranch: string;
  expectedCheckout: string;
  actualCheckout: string;
  status: string;
  vsOriginCurrent: string;
  vsOriginMain: string;
  vsOriginDevelopment: string;
};

/** Non-fatal `git fetch` failure captured for the trailing warnings section. */
type WorktreeStateCheck_FetchWarning = {
  repo: string;
  message: string;
};

/** Per-repo working tree facts gathered before row assembly. */
export type WorktreeStateCheck_RepoState = {
  actualCheckout: string;
  isDirty: boolean;
  vsOriginCurrent: string;
  vsOriginMain: string;
  vsOriginDevelopment: string;
};

const NOT_APPLICABLE = "N/A";
const UNAVAILABLE = "UNAVAILABLE";
const DETACHED = "DETACHED";
const MISSING = "MISSING";
const ERROR_VALUE = "ERROR";

/**
 * Runs the checkout matrix command using explicit project-supplied context.
 *
 * @remarks
 * I/O: Reads filesystem metadata, may run `git fetch` when `--fetch` is passed, writes
 * human-readable tables to stdout.
 */
export async function WorktreeStackKit_runStateCheckCommand(
  options: WorktreeStackKit_RunStateCheckCommand_Options,
): Promise<number> {
  const { argv, config } = options;
  const parsedOptions = WorktreeStateCheck_parseArgs(argv);

  if (parsedOptions.help) {
    WorktreeStateCheck_printHelp(config.usageCommand);
    return 0;
  }

  const repoRoot = config.repoRoot;
  const context = config.resolveContext(repoRoot);
  const submodules = WorktreeStateCheck_listSubmodules(repoRoot);
  const fetchWarnings: WorktreeStateCheck_FetchWarning[] = [];

  if (parsedOptions.fetch) {
    await WorktreeStateCheck_fetchAllRepos(repoRoot, submodules, fetchWarnings);
  }

  const submodulePaths = submodules.map((submodule) =>
    path.join(repoRoot, submodule.path),
  );

  await WorktreeStateCheck_ensureUntrackedCache([repoRoot, ...submodulePaths]);

  const [rootState, submoduleStatusResult, ...submoduleStates] =
    await Promise.all([
      WorktreeStateCheck_gatherRepoState(repoRoot, config),
      WorktreeStateCheck_runGitAsync(repoRoot, ["submodule", "status"]),
      ...submodulePaths.map((submodulePath) =>
        WorktreeStateCheck_gatherRepoState(submodulePath, config),
      ),
    ]);

  const submodulePrefixes = WorktreeStateCheck_parseSubmoduleStatusOutput(
    submoduleStatusResult,
  );

  const rows: WorktreeStateCheck_Row[] = [
    WorktreeStateCheck_buildRootRowFromState(rootState, context),
    ...submodules.map((submodule, index) =>
      WorktreeStateCheck_buildSubmoduleRowFromState(
        submodule,
        submoduleStates[index],
        submodulePrefixes.get(submodule.path),
        context,
      ),
    ),
  ];

  const actualRootBranch = rows[0]?.actualCheckout ?? UNAVAILABLE;

  console.log("=== Checkout ===");
  console.log(`Type: ${context.checkoutType}`);
  console.log(`Expected root branch: ${context.expectedRootBranch}`);
  console.log(`Actual root branch:   ${actualRootBranch}`);
  console.log(`Expected submodules:  ${context.expectedSubmoduleBranch}`);
  console.log(
    `Remote refs:          ${
      parsedOptions.fetch
        ? "fetched from origin before comparison"
        : "cached local origin refs (pass --fetch to refresh)"
    }`,
  );

  if (context.metadataPath) {
    console.log(
      `Metadata file:        ${path.relative(repoRoot, context.metadataPath)}`,
    );
  }
  if (context.metadataState !== "absent") {
    console.log(`Metadata state:       ${context.metadataState}`);
  }
  if (context.metadataError) {
    console.log(`Metadata error:       ${context.metadataError}`);
  }

  console.log("");
  WorktreeStateCheck_printTable(rows);
  console.log("");
  console.log(
    "Legend: aN/bM = ahead N, behind M relative to the named remote ref.",
  );
  console.log(
    `Special values: ${DETACHED}, ${UNAVAILABLE}, ${MISSING}, ` +
      `${ERROR_VALUE}, ${NOT_APPLICABLE}.`,
  );

  if (fetchWarnings.length > 0) {
    console.log("");
    console.log("Fetch warnings:");

    for (const warning of fetchWarnings) {
      console.log(`- ${warning.repo}: ${warning.message}`);
    }
  }

  return 0;
}

/**
 * Parses supported CLI flags and rejects unknown tokens early.
 *
 * @remarks
 * PURITY: No I/O; throws on the first unrecognized argument so misuse fails fast.
 * @param argv - Process argv slice after the script path.
 */
export function WorktreeStateCheck_parseArgs(
  argv: readonly string[],
): WorktreeStateCheck_Options {
  let fetch = false;
  let help = false;

  for (const argument of argv) {
    if (argument === "--fetch") {
      fetch = true;
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return { fetch, help };
}

/**
 * Prints usage text to stdout for `--help` / `-h`.
 *
 * @remarks
 * I/O: Writes only to stdout; does not set exit codes.
 */
function WorktreeStateCheck_printHelp(usageCommand: string): void {
  console.log(`Usage: ${usageCommand}`);
  console.log("");
  console.log(
    "Print the checkout and submodule state table for the current repository root.",
  );
  console.log("");
  console.log("Options:");
  console.log(
    "  --fetch   Refresh origin refs in the root repo and initialized submodules first",
  );
  console.log("  --help    Show this help text");
}

/**
 * Runs `git` in `repoPath` and resolves stdout/stderr plus exit status.
 *
 * @remarks
 * I/O: Spawns `git` with stdio piped; resolves on `close` or spawn `error` with best-effort
 * stderr capture.
 * @param repoPath - Working directory passed to the child process.
 * @param args - Git arguments after the `git` executable name.
 */
function WorktreeStateCheck_runGitAsync(
  repoPath: string,
  args: readonly string[],
): Promise<WorktreeStateCheck_CommandResult> {
  return new Promise((resolve) => {
    const child = spawn("git", args, {
      cwd: repoPath,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        status: code,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
    child.on("error", (err) => {
      resolve({ ok: false, status: null, stdout: "", stderr: err.message });
    });
  });
}

/**
 * Returns whether `repoPath` looks like a git worktree (has a `.git` entry).
 *
 * @remarks
 * I/O: Best-effort synchronous filesystem probe; returns false on unexpected read errors.
 * @param repoPath - Candidate repository root.
 */
function WorktreeStateCheck_isGitWorkTree(repoPath: string): boolean {
  try {
    return fs.existsSync(path.join(repoPath, ".git"));
  } catch {
    return false;
  }
}

/**
 * Enables `core.untrackedCache` where missing so porcelain status stays faster on large trees.
 *
 * @remarks
 * I/O: Runs `git config` per git worktree path; no-ops when already `true`.
 * @param repoPaths - Roots to consider (root repo plus submodule paths).
 */
async function WorktreeStateCheck_ensureUntrackedCache(
  repoPaths: readonly string[],
): Promise<void> {
  await Promise.all(
    repoPaths
      .filter((p) => WorktreeStateCheck_isGitWorkTree(p))
      .map(async (p) => {
        const current = await WorktreeStateCheck_runGitAsync(p, [
          "config",
          "--get",
          "core.untrackedCache",
        ]);
        if (current.ok && current.stdout.trim() === "true") {
          return;
        }
        await WorktreeStateCheck_runGitAsync(p, [
          "config",
          "core.untrackedCache",
          "true",
        ]);
      }),
  );
}

/**
 * Parses `.gitmodules` sections into submodule path and configured branch rows.
 *
 * @remarks
 * I/O: Reads `.gitmodules` synchronously when present; returns an empty list when missing.
 * @param repoRoot - Parent repository root containing `.gitmodules`.
 */
function WorktreeStateCheck_listSubmodules(
  repoRoot: string,
): WorktreeStateCheck_SubmoduleDefinition[] {
  const gitmodulesPath = path.join(repoRoot, ".gitmodules");

  if (!fs.existsSync(gitmodulesPath)) {
    return [];
  }

  const content = fs.readFileSync(gitmodulesPath, "utf8");
  const submodules: WorktreeStateCheck_SubmoduleDefinition[] = [];
  const sectionRegex = /^\[submodule "([^"]+)"\]/gm;
  let match: RegExpExecArray | null;
  const sections: Array<{ name: string; start: number }> = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({ name: match[1], start: match.index + match[0].length });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const end =
      i + 1 < sections.length ? sections[i + 1].start : content.length;
    const body = content.slice(section.start, end);
    const pathMatch = body.match(/^\s+path\s*=\s*(.+)$/m);
    const branchMatch = body.match(/^\s+branch\s*=\s*(.+)$/m);

    if (!pathMatch) {
      continue;
    }

    submodules.push({
      name: section.name,
      path: pathMatch[1].trim(),
      configuredBranch: branchMatch ? branchMatch[1].trim() : "UNSET",
    });
  }

  return submodules;
}

/**
 * Fetches `origin` for the root repo and initialized submodule subrepos, recording failures.
 *
 * @remarks
 * I/O: Runs `git fetch` with submodule recursion disabled; appends non-fatal warnings instead of
 * throwing.
 * @param repoRoot - Platform checkout root.
 * @param submodules - Submodule definitions driving additional fetch targets.
 * @param warnings - Out-parameter populated with per-repo failure messages.
 */
async function WorktreeStateCheck_fetchAllRepos(
  repoRoot: string,
  submodules: WorktreeStateCheck_SubmoduleDefinition[],
  warnings: WorktreeStateCheck_FetchWarning[],
): Promise<void> {
  const repos = [
    { path: repoRoot, label: "." },
    ...submodules.map((s) => ({
      path: path.join(repoRoot, s.path),
      label: s.path,
    })),
  ];

  const results = await Promise.all(
    repos
      .filter((r) => WorktreeStateCheck_isGitWorkTree(r.path))
      .map(async (repo) => {
        const result = await WorktreeStateCheck_runGitAsync(repo.path, [
          "-c",
          "submodule.recurse=false",
          "fetch",
          "--quiet",
          "origin",
          "--prune",
        ]);

        if (!result.ok) {
          const message =
            result.stderr.trim() ||
            result.stdout.trim() ||
            `git fetch exited with status ${result.status}`;
          return { repo: repo.label, message };
        }

        return null;
      }),
  );

  for (const warning of results) {
    if (warning) {
      warnings.push(warning);
    }
  }
}

/**
 * Interprets `git status --porcelain=v2 -b` output into HEAD branch and dirty flag.
 *
 * @remarks
 * PURITY: Pure string parsing aside from reading `result` fields; maps `(detached)` to the
 * sentinel `DETACHED`.
 * @param result - Captured git status invocation result.
 */
export function WorktreeStateCheck_parseStatusV2(
  result: WorktreeStateCheck_CommandResult,
): { branch: string; dirty: boolean } {
  if (!result.ok) {
    return { branch: UNAVAILABLE, dirty: false };
  }

  const lines = result.stdout.split("\n");
  let branch = UNAVAILABLE;
  let dirty = false;

  for (const line of lines) {
    if (line.startsWith("# branch.head ")) {
      const value = line.slice("# branch.head ".length);
      branch = value === "(detached)" ? DETACHED : value || UNAVAILABLE;
    } else if (line.length > 0 && !line.startsWith("#")) {
      dirty = true;
    }
  }

  return { branch, dirty };
}

/**
 * Formats `rev-list --left-right --count` output into table cells or error sentinels.
 *
 * @remarks
 * PURITY: Inspects stderr for missing refs/repos to emit `MISSING` vs generic `ERROR`.
 * @param result - Captured `rev-list` invocation result.
 */
export function WorktreeStateCheck_formatRevListResult(
  result: WorktreeStateCheck_CommandResult,
): string {
  if (!result.ok) {
    if (
      result.stderr.includes("unknown revision") ||
      result.stderr.includes("bad revision") ||
      result.stderr.includes("not a git repository")
    ) {
      return MISSING;
    }
    return ERROR_VALUE;
  }

  const counts = WorktreeStateCheck_parseAheadBehind(result.stdout);
  return counts
    ? WorktreeStateCheck_formatAheadBehind(counts.ahead, counts.behind)
    : ERROR_VALUE;
}

/**
 * Collects branch, dirtiness, and ahead/behind summaries relative to canonical remote refs.
 *
 * @remarks
 * I/O: Issues parallel `git` calls; may add a follow-up `rev-list` when the branch is neither main
 * nor development.
 * @param repoPath - Repository or submodule path to inspect.
 */
async function WorktreeStateCheck_gatherRepoState(
  repoPath: string,
  config: WorktreeStackKit_StateCheckConfig,
): Promise<WorktreeStateCheck_RepoState> {
  if (!WorktreeStateCheck_isGitWorkTree(repoPath)) {
    return {
      actualCheckout: UNAVAILABLE,
      isDirty: false,
      vsOriginCurrent: UNAVAILABLE,
      vsOriginMain: UNAVAILABLE,
      vsOriginDevelopment: UNAVAILABLE,
    };
  }

  const [statusResult, vsMainResult, vsDevResult] = await Promise.all([
    WorktreeStateCheck_runGitAsync(repoPath, [
      "status",
      "--porcelain=v2",
      "-b",
      "--untracked-files=normal",
      "--ignore-submodules=all",
    ]),
    WorktreeStateCheck_runGitAsync(repoPath, [
      "rev-list",
      "--left-right",
      "--count",
      `HEAD...refs/remotes/origin/${config.canonicalRootBranch}`,
    ]),
    WorktreeStateCheck_runGitAsync(repoPath, [
      "rev-list",
      "--left-right",
      "--count",
      `HEAD...refs/remotes/origin/${config.developmentBranch}`,
    ]),
  ]);

  const { branch, dirty } = WorktreeStateCheck_parseStatusV2(statusResult);

  const vsOriginMain = WorktreeStateCheck_formatRevListResult(vsMainResult);
  const vsOriginDevelopment =
    WorktreeStateCheck_formatRevListResult(vsDevResult);

  let vsOriginCurrent: string;

  if (branch === DETACHED) {
    vsOriginCurrent = DETACHED;
  } else if (branch === UNAVAILABLE) {
    vsOriginCurrent = UNAVAILABLE;
  } else if (branch === config.canonicalRootBranch) {
    vsOriginCurrent = vsOriginMain;
  } else if (branch === config.developmentBranch) {
    vsOriginCurrent = vsOriginDevelopment;
  } else {
    const currentResult = await WorktreeStateCheck_runGitAsync(repoPath, [
      "rev-list",
      "--left-right",
      "--count",
      `HEAD...refs/remotes/origin/${branch}`,
    ]);
    vsOriginCurrent = WorktreeStateCheck_formatRevListResult(currentResult);
  }

  return {
    actualCheckout: branch,
    isDirty: dirty,
    vsOriginCurrent,
    vsOriginMain,
    vsOriginDevelopment,
  };
}

/**
 * Maps submodule paths to the leading `git submodule status` prefix character.
 *
 * @remarks
 * PURITY: Parses stdout lines only; returns an empty map when the command failed with no stdout.
 * @param result - Captured `git submodule status` output.
 */
export function WorktreeStateCheck_parseSubmoduleStatusOutput(
  result: WorktreeStateCheck_CommandResult,
): Map<string, string> {
  const map = new Map<string, string>();

  if (!result.ok && result.stdout.trim().length === 0) {
    return map;
  }

  for (const line of result.stdout.split(/\r?\n/)) {
    if (line.length === 0) {
      continue;
    }

    const prefix = line[0];
    const rest = line.slice(1);
    const spaceIndex = rest.indexOf(" ");

    if (spaceIndex === -1) {
      continue;
    }

    const afterSha = rest.slice(spaceIndex + 1);
    const pathEnd = afterSha.indexOf(" ");
    const subPath = pathEnd === -1 ? afterSha : afterSha.slice(0, pathEnd);

    if (subPath.length > 0) {
      map.set(subPath, prefix);
    }
  }

  return map;
}

/**
 * Combines submodule status prefix with working tree state into a human-readable status column.
 *
 * @remarks
 * PURITY: String selection only; encodes `NOT INIT`, conflict, pointer mismatch, and dirty
 * combinations.
 * @param prefix - First character from `git submodule status`, when known.
 * @param state - Gathered repo state for the submodule checkout.
 */
export function WorktreeStateCheck_resolveSubmoduleStatusFromState(
  prefix: string | undefined,
  state: WorktreeStateCheck_RepoState,
): string {
  if (prefix === undefined) {
    return MISSING;
  }

  if (prefix === "-") {
    return "NOT INIT";
  }

  if (prefix === "U") {
    return "CONFLICT";
  }

  if (state.actualCheckout === UNAVAILABLE) {
    return UNAVAILABLE;
  }

  if (prefix === "+" && state.isDirty) {
    return "POINTER MISMATCH + DIRTY";
  }

  if (prefix === "+") {
    return "POINTER MISMATCH";
  }

  if (state.isDirty) {
    return "DIRTY";
  }

  return "OK";
}

/**
 * Parses the two whitespace-separated integers from `rev-list --left-right --count` stdout.
 *
 * @remarks
 * PURITY: Validates integer pairs; returns null when the shape is unexpected.
 * @param rawCounts - Single-line stdout from `rev-list`.
 */
export function WorktreeStateCheck_parseAheadBehind(
  rawCounts: string,
): { ahead: number; behind: number } | null {
  const parts = rawCounts.trim().split(/\s+/);

  if (parts.length < 2) {
    return null;
  }

  const ahead = Number(parts[0]);
  const behind = Number(parts[1]);

  if (!Number.isInteger(ahead) || !Number.isInteger(behind)) {
    return null;
  }

  return { ahead, behind };
}

/**
 * Renders ahead/behind integers using the `aN/bM` legend convention.
 *
 * @remarks
 * PURITY: Pure string formatting.
 * @param ahead - Commits reachable from HEAD but not the remote ref.
 * @param behind - Commits reachable from the remote ref but not HEAD.
 */
export function WorktreeStateCheck_formatAheadBehind(
  ahead: number,
  behind: number,
): string {
  return `a${ahead}/b${behind}`;
}

/**
 * Builds the matrix row for the platform root from gathered repo state and contract expectations.
 *
 * @remarks
 * PURITY: Assembles the row object only; `configuredBranch` is `N/A` for the root entry.
 * @param state - Root working tree inspection snapshot.
 * @param context - Expected branches from the checkout contract.
 */
export function WorktreeStateCheck_buildRootRowFromState(
  state: WorktreeStateCheck_RepoState,
  context: WorktreeStateCheck_Context,
): WorktreeStateCheck_Row {
  return {
    repo: ".",
    kind: "root",
    configuredBranch: NOT_APPLICABLE,
    expectedCheckout: context.expectedRootBranch,
    actualCheckout: state.actualCheckout,
    status:
      state.actualCheckout === UNAVAILABLE
        ? UNAVAILABLE
        : state.isDirty
          ? "DIRTY"
          : "OK",
    vsOriginCurrent: state.vsOriginCurrent,
    vsOriginMain: state.vsOriginMain,
    vsOriginDevelopment: state.vsOriginDevelopment,
  };
}

/**
 * Builds a submodule row combining `.gitmodules` configuration with live checkout diagnostics.
 *
 * @remarks
 * PURITY: Delegates status text to `WorktreeStateCheck_resolveSubmoduleStatusFromState`.
 * @param submodule - Parsed `.gitmodules` definition for path and configured branch.
 * @param state - Submodule working tree inspection snapshot.
 * @param prefix - Submodule status prefix from `git submodule status`, when parsing succeeded.
 * @param context - Expected submodule branch from the checkout contract.
 */
export function WorktreeStateCheck_buildSubmoduleRowFromState(
  submodule: WorktreeStateCheck_SubmoduleDefinition,
  state: WorktreeStateCheck_RepoState,
  prefix: string | undefined,
  context: WorktreeStateCheck_Context,
): WorktreeStateCheck_Row {
  return {
    repo: submodule.path,
    kind: "submodule",
    configuredBranch: submodule.configuredBranch,
    expectedCheckout: context.expectedSubmoduleBranch,
    actualCheckout: state.actualCheckout,
    status: WorktreeStateCheck_resolveSubmoduleStatusFromState(prefix, state),
    vsOriginCurrent: state.vsOriginCurrent,
    vsOriginMain: state.vsOriginMain,
    vsOriginDevelopment: state.vsOriginDevelopment,
  };
}

/**
 * Repeats `character` `count` times, clamping negative counts to zero.
 *
 * @remarks
 * PURITY: Pure string builder used for ASCII table separators.
 * @param character - Single-character fill token.
 * @param count - Desired repetition length.
 */
function WorktreeStateCheck_repeat(character: string, count: number): string {
  return character.repeat(Math.max(0, count));
}

/**
 * Left-aligns `value` within `width` by appending spaces (no truncation).
 *
 * @remarks
 * PURITY: Used for fixed-width CLI table columns.
 * @param value - Cell text without trailing padding.
 * @param width - Target visual width; shorter values are padded, longer values overflow as-is.
 */
function WorktreeStateCheck_pad(value: string, width: number): string {
  return `${value}${WorktreeStateCheck_repeat(" ", width - value.length)}`;
}

/**
 * Prints a pipe-bordered table of checkout rows with computed column widths.
 *
 * @remarks
 * I/O: Writes formatted lines to stdout; assumes rows are non-empty for sensible widths.
 * @param rows - Root plus submodule rows to render.
 */
function WorktreeStateCheck_printTable(rows: WorktreeStateCheck_Row[]): void {
  const columns: Array<{
    header: string;
    getValue: (row: WorktreeStateCheck_Row) => string;
  }> = [
    { header: "Repo", getValue: (row) => row.repo },
    { header: "Kind", getValue: (row) => row.kind },
    {
      header: "Configured (.gitmodules)",
      getValue: (row) => row.configuredBranch,
    },
    { header: "Expected here", getValue: (row) => row.expectedCheckout },
    { header: "Actual checkout", getValue: (row) => row.actualCheckout },
    { header: "Status", getValue: (row) => row.status },
    { header: "vs origin/current", getValue: (row) => row.vsOriginCurrent },
    { header: "vs origin/main", getValue: (row) => row.vsOriginMain },
    {
      header: "vs origin/development",
      getValue: (row) => row.vsOriginDevelopment,
    },
  ];

  const widths = columns.map((column) => {
    let width = column.header.length;

    for (const row of rows) {
      width = Math.max(width, column.getValue(row).length);
    }

    return width;
  });

  const headerLine = columns
    .map((column, index) =>
      WorktreeStateCheck_pad(column.header, widths[index]),
    )
    .join(" | ");
  const separatorLine = widths
    .map((width) => WorktreeStateCheck_repeat("-", width))
    .join(" | ");

  console.log(`| ${headerLine} |`);
  console.log(`| ${separatorLine} |`);

  for (const row of rows) {
    const line = columns
      .map((column, index) =>
        WorktreeStateCheck_pad(column.getValue(row), widths[index]),
      )
      .join(" | ");
    console.log(`| ${line} |`);
  }
}
