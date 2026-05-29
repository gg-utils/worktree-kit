/**
 * @fileoverview Config-driven prepared-worktree environment diagnostics command.
 *
 * Flow: argv + project command config -> workspace resolution -> repair dry-run telemetry -> overlay
 * validation artifact inspection -> repair/manual-review suggestions. Product package names,
 * command paths, env vars, issue heuristics, and operator-facing command strings stay in root config.
 *
 * @testing Node.js test runner: cd packages/worktree-kit && npm test -- src/env-doctor-command.unit.test.ts
 * @testing CLI: npm run worktrees:env:doctor -- --help
 *
 * @see scripts/worktree-stack/commands/env-doctor.ts - Repository CLI shim that wires worktrees.config.ts factories into WorktreeStackKit_runEnvDoctorCommand for npm run worktrees:env:doctor.
 * @see worktrees.config.ts - Project-owned WorktreeStackKit_EnvDoctorCommandConfig builders whose overlay render/validate and repair dry-run commands this module executes via spawnSync.
 * @see packages/worktree-kit/src/env-doctor-command.unit.test.ts - Node test coverage for argv parsing, workspace resolution, telemetry parsing, and overlay artifact validation owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
/** Renders CLI usage and project-supplied examples for env doctor. */
export function WorktreeStackKit_renderEnvDoctorUsage(config) {
    return `Usage:\n${config.usageCommandLines.map((line) => `  ${line}`).join("\n")}\n\nOptions:\n  --worktree <path>  Prepared worktree path to inspect (defaults to current workspace)\n  --json             Print the diagnostic report as JSON\n  --help, -h         Show this help\n\nExamples:\n${config.usageExamples.map((line) => `  ${line}`).join("\n")}`;
}
/** Parses env-doctor argv without consulting global process argv. */
export function WorktreeStackKit_parseEnvDoctorArgs(options) {
    const { argv, config, defaultRequestedPath } = options;
    const { values } = parseArgs({
        allowPositionals: false,
        args: [...argv],
        options: {
            help: { type: "boolean", short: "h" },
            json: { type: "boolean" },
            worktree: { type: "string" },
        },
    });
    if (values.help === true) {
        console.log(WorktreeStackKit_renderEnvDoctorUsage(config));
        return null;
    }
    const requestedPath = typeof values.worktree === "string" && values.worktree.trim().length > 0
        ? values.worktree.trim()
        : defaultRequestedPath;
    return {
        jsonMode: values.json === true,
        requestedPath,
    };
}
/** Runs the config-driven env-doctor command and returns the intended process exit code. */
export function WorktreeStackKit_runEnvDoctorCommand(options) {
    const { argv, config, defaultRequestedPath } = options;
    const parsedOptions = WorktreeStackKit_parseEnvDoctorArgs({
        argv,
        config,
        defaultRequestedPath,
    });
    if (parsedOptions === null) {
        return 0;
    }
    let report;
    try {
        const workspacePath = WorktreeStackKit_resolveEnvDoctorWorkspacePath({
            candidatePath: parsedOptions.requestedPath,
            envFileName: config.envFileName,
        });
        report = WorktreeStackKit_buildEnvDoctorReport({
            config,
            jsonMode: parsedOptions.jsonMode,
            requestedPath: path.resolve(parsedOptions.requestedPath),
            workspacePath,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error.";
        const failureReport = {
            error: message,
            ok: false,
            requestedPath: path.resolve(parsedOptions.requestedPath),
        };
        if (parsedOptions.jsonMode) {
            console.log(JSON.stringify(failureReport, null, 2));
        }
        else {
            console.error("Worktree env doctor failed.");
            console.error(`- requested path: ${path.resolve(parsedOptions.requestedPath)}`);
            console.error(`- error: ${message}`);
            console.error("- suggested fix: run this from a prepared worktree root or pass --worktree /absolute/path/to/worktree");
        }
        return 1;
    }
    if (report.jsonMode) {
        console.log(JSON.stringify(report, null, 2));
    }
    else {
        WorktreeStackKit_printEnvDoctorHumanReport({ config, report });
    }
    return report.ok ? 0 : 1;
}
/** Parses `[worktree] key: value` telemetry lines emitted by repair scripts. */
export function WorktreeStackKit_parseEnvDoctorRepairFields(output) {
    const fields = {};
    for (const line of output.split(/\r?\n/u)) {
        const match = /^\[worktree\]\s+([A-Za-z0-9-]+):\s*(.*)$/u.exec(line);
        if (!match) {
            continue;
        }
        const key = match[1]?.trim();
        const value = match[2]?.trim() ?? "";
        if (!key) {
            continue;
        }
        fields[key] = value;
    }
    return fields;
}
/** Splits comma-separated missing-key summaries from repair output into trimmed tokens. */
export function WorktreeStackKit_parseEnvDoctorCommaSeparatedKeys(value) {
    if (!value || value === "<none>") {
        return [];
    }
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
/** Shell-safe single-quote wrapping for interpolating filesystem paths into suggested commands. */
export function WorktreeStackKit_envDoctorShellQuote(value) {
    if (value.length === 0) {
        return "''";
    }
    return `'${value.replace(/'/gu, "'\\''")}'`;
}
/** Walks parents until the configured env file denotes the workspace root. */
export function WorktreeStackKit_resolveEnvDoctorWorkspacePath(options) {
    const { candidatePath, envFileName } = options;
    if (!fs.existsSync(candidatePath)) {
        throw new Error(`Path does not exist: ${candidatePath}`);
    }
    let currentPath = path.resolve(candidatePath);
    if (fs.statSync(currentPath).isFile()) {
        currentPath = path.dirname(currentPath);
    }
    while (true) {
        if (fs.existsSync(path.join(currentPath, envFileName))) {
            return currentPath;
        }
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            break;
        }
        currentPath = parentPath;
    }
    throw new Error(`Could not resolve a workspace root with ${envFileName} from ${path.resolve(candidatePath)}.`);
}
/** Reads and narrowly validates an overlay validation artifact on disk. */
export function WorktreeStackKit_parseEnvDoctorOverlayArtifact(artifactPath) {
    if (!fs.existsSync(artifactPath)) {
        return null;
    }
    const rawArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    if (!WorktreeStackKit_envDoctorIsRecord(rawArtifact)) {
        return null;
    }
    const runAt = rawArtifact.runAt;
    const success = rawArtifact.success;
    const primaryMethod = rawArtifact.primaryMethod;
    const listenPort = rawArtifact.listenPort;
    const issues = rawArtifact.issues;
    const validatedFiles = WorktreeStackKit_envDoctorReadStringMap(rawArtifact.validatedFiles);
    if (typeof runAt !== "string" ||
        typeof success !== "boolean" ||
        typeof primaryMethod !== "string" ||
        typeof listenPort !== "number" ||
        !WorktreeStackKit_envDoctorIsStringArray(issues) ||
        validatedFiles === null) {
        return null;
    }
    return {
        issues,
        listenPort,
        primaryMethod,
        runAt,
        success,
        validatedFiles,
    };
}
/** Assembles the unified env-doctor report from repair telemetry and overlay validation. */
function WorktreeStackKit_buildEnvDoctorReport(options) {
    const { config, jsonMode, requestedPath, workspacePath } = options;
    const envFilePath = path.join(workspacePath, config.envFileName);
    const repairDryRun = WorktreeStackKit_runEnvDoctorRepairDryRun({
        config,
        workspacePath,
    });
    const canonicalRootWorkspacePath = repairDryRun.parsedFields[config.canonicalRootWorkspacePathField] ?? null;
    const overlayValidation = WorktreeStackKit_runEnvDoctorOverlayValidation({
        canonicalRootWorkspacePath,
        config,
        envFilePath,
        workspacePath,
    });
    const preparedWorktree = fs.existsSync(path.join(workspacePath, config.preparedMetadataRelativePath));
    const fixMetadata = WorktreeStackKit_collectEnvDoctorFixSuggestions({
        canonicalRootWorkspacePath,
        config,
        overlayValidation,
        repairDryRun,
        workspacePath,
    });
    const ok = repairDryRun.ok &&
        overlayValidation.ok &&
        config.packageConfigs.every((packageConfig) => (repairDryRun.missingRootKeysByPackage[packageConfig.displayName] ?? [])
            .length === 0) &&
        (!overlayValidation.artifactRefreshed ||
            (overlayValidation.artifact !== null &&
                overlayValidation.artifact.issues.length === 0));
    return {
        canonicalRootWorkspacePath,
        envFilePath,
        fixSuggestions: fixMetadata.fixSuggestions,
        jsonMode,
        manualReviewPaths: fixMetadata.manualReviewPaths,
        ok,
        overlayValidation,
        preparedWorktree,
        repairDryRun,
        requestedPath,
        workspacePath,
    };
}
/** Runs repair in dry-run mode to enumerate missing canonical root keys per configured package. */
function WorktreeStackKit_runEnvDoctorRepairDryRun(options) {
    const { config, workspacePath } = options;
    const command = config.buildRepairDryRunCommand({ workspacePath });
    const result = spawnSync(command.command, [...command.args], {
        cwd: command.cwd,
        encoding: "utf8",
        env: command.env ?? process.env,
        maxBuffer: 10 * 1024 * 1024,
    });
    const combinedOutput = [result.stdout, result.stderr]
        .filter((value) => value.length > 0)
        .join("\n");
    const parsedFields = WorktreeStackKit_parseEnvDoctorRepairFields(combinedOutput);
    const missingRootKeysByPackage = {};
    for (const packageConfig of config.packageConfigs) {
        missingRootKeysByPackage[packageConfig.displayName] =
            WorktreeStackKit_parseEnvDoctorCommaSeparatedKeys(parsedFields[packageConfig.missingRootKeysField]);
    }
    return {
        exitCode: result.status,
        missingRootKeysByPackage,
        ok: result.status === 0,
        parsedFields,
        stderr: result.stderr,
        stdout: result.stdout,
    };
}
/** Refreshes overlay outputs into a temp dir, validates them, then cleans up temporaries. */
function WorktreeStackKit_runEnvDoctorOverlayValidation(options) {
    const { canonicalRootWorkspacePath, config, envFilePath, workspacePath } = options;
    const artifactPath = config.overlayArtifactPath(workspacePath);
    const startedAt = Date.now();
    const generatedRootDir = fs.mkdtempSync(path.join(os.tmpdir(), config.overlayTempDirectoryPrefix));
    try {
        const renderCommand = config.buildOverlayRenderCommand({
            canonicalRootWorkspacePath,
            envFilePath,
            generatedRootDir,
            workspacePath,
        });
        const renderResult = spawnSync(renderCommand.command, [...renderCommand.args], {
            cwd: renderCommand.cwd,
            encoding: "utf8",
            env: renderCommand.env ?? process.env,
            maxBuffer: 10 * 1024 * 1024,
        });
        if (renderResult.status !== 0) {
            return {
                artifact: null,
                artifactPath,
                artifactRefreshed: false,
                exitCode: renderResult.status,
                ok: false,
                renderExitCode: renderResult.status,
                renderStderr: renderResult.stderr,
                renderStdout: renderResult.stdout,
                stderr: renderResult.stderr,
                stdout: renderResult.stdout,
            };
        }
        const validateCommand = config.buildOverlayValidateCommand({
            canonicalRootWorkspacePath,
            envFilePath,
            generatedRootDir,
            workspacePath,
        });
        const result = spawnSync(validateCommand.command, [...validateCommand.args], {
            cwd: validateCommand.cwd,
            encoding: "utf8",
            env: validateCommand.env ?? process.env,
            maxBuffer: 10 * 1024 * 1024,
        });
        const artifact = WorktreeStackKit_parseEnvDoctorOverlayArtifact(artifactPath);
        const artifactRefreshed = artifact !== null && Number.isFinite(Date.parse(artifact.runAt))
            ? Date.parse(artifact.runAt) >= startedAt - 5000
            : false;
        return {
            artifact,
            artifactPath,
            artifactRefreshed,
            exitCode: result.status,
            ok: result.status === 0,
            renderExitCode: renderResult.status,
            renderStderr: renderResult.stderr,
            renderStdout: renderResult.stdout,
            stderr: result.stderr,
            stdout: result.stdout,
        };
    }
    finally {
        fs.rmSync(generatedRootDir, { force: true, recursive: true });
    }
}
/** Builds operator-facing remediation commands and env files needing manual review. */
function WorktreeStackKit_collectEnvDoctorFixSuggestions(options) {
    const { canonicalRootWorkspacePath, config, overlayValidation, repairDryRun, workspacePath, } = options;
    const fixSuggestionSet = new Set();
    const manualReviewPathSet = new Set();
    const repairCommand = config.repairSuggestionCommand(workspacePath);
    const startCommand = config.startSuggestionCommand(workspacePath);
    if (!repairDryRun.ok) {
        fixSuggestionSet.add(repairCommand);
    }
    for (const packageConfig of config.packageConfigs) {
        if ((repairDryRun.missingRootKeysByPackage[packageConfig.displayName] ?? [])
            .length > 0) {
            fixSuggestionSet.add(repairCommand);
        }
    }
    const overlayIssues = overlayValidation.artifact && overlayValidation.artifactRefreshed
        ? overlayValidation.artifact.issues
        : [];
    if (!overlayValidation.ok &&
        overlayIssues.some((issue) => config.overlayStartSuggestionIssueFragments.some((fragment) => issue.includes(fragment)))) {
        fixSuggestionSet.add(startCommand);
    }
    for (const mapping of config.manualReviewIssueMappings) {
        if (overlayIssues.some((issue) => issue.startsWith(mapping.issuePrefix))) {
            manualReviewPathSet.add(path.join(workspacePath, mapping.workspaceRelativePath));
        }
    }
    for (const packageConfig of config.packageConfigs) {
        const missingKeys = repairDryRun.missingRootKeysByPackage[packageConfig.displayName] ?? [];
        if (missingKeys.length === 0) {
            continue;
        }
        manualReviewPathSet.add(path.join(workspacePath, packageConfig.envRelativePath));
        if (canonicalRootWorkspacePath) {
            manualReviewPathSet.add(path.join(canonicalRootWorkspacePath, packageConfig.envRelativePath));
        }
    }
    return {
        fixSuggestions: Array.from(fixSuggestionSet),
        manualReviewPaths: Array.from(manualReviewPathSet),
    };
}
/** Emits a multi-line human summary; routes passes to stdout and failures to stderr. */
function WorktreeStackKit_printEnvDoctorHumanReport(options) {
    const { config, report } = options;
    const lines = [];
    lines.push(report.ok ? "Worktree env doctor passed." : "Worktree env doctor failed.");
    lines.push(`- requested path: ${report.requestedPath}`);
    lines.push(`- workspace: ${report.workspacePath}`);
    lines.push(`- prepared worktree: ${report.preparedWorktree ? "yes" : "no"}`);
    lines.push(`- env file: ${report.envFilePath}`);
    if (report.canonicalRootWorkspacePath) {
        lines.push(`- canonical root workspace: ${report.canonicalRootWorkspacePath}`);
    }
    lines.push(`- repair dry-run: ${report.repairDryRun.ok ? "ok" : "fail"}${report.repairDryRun.exitCode !== null
        ? ` (exit ${report.repairDryRun.exitCode})`
        : ""}`);
    for (const packageConfig of config.packageConfigs) {
        const missingKeys = report.repairDryRun.missingRootKeysByPackage[packageConfig.displayName] ?? [];
        lines.push(`- ${packageConfig.displayName} missing root keys: ${missingKeys.length > 0 ? missingKeys.join(", ") : "<none>"}`);
    }
    const overlayIssueCount = report.overlayValidation.artifact && report.overlayValidation.artifactRefreshed
        ? report.overlayValidation.artifact.issues.length
        : 0;
    lines.push(`- overlay validation: ${report.overlayValidation.ok ? "ok" : "fail"}${report.overlayValidation.exitCode !== null
        ? ` (exit ${report.overlayValidation.exitCode})`
        : ""}`);
    lines.push(`- overlay artifact: ${report.overlayValidation.artifactPath}`);
    if (report.overlayValidation.artifact && report.overlayValidation.artifactRefreshed) {
        lines.push(`- overlay method: ${report.overlayValidation.artifact.primaryMethod} on port ${report.overlayValidation.artifact.listenPort}`);
        lines.push(`- overlay issues: ${String(overlayIssueCount)}`);
        for (const issue of report.overlayValidation.artifact.issues) {
            lines.push(`- issue: ${issue}`);
        }
    }
    else if (!report.overlayValidation.ok) {
        lines.push(`- overlay error: ${WorktreeStackKit_formatEnvDoctorCommandError({
            error: undefined,
            stderr: report.overlayValidation.renderExitCode !== 0
                ? report.overlayValidation.renderStderr
                : report.overlayValidation.stderr,
            stdout: report.overlayValidation.renderExitCode !== 0
                ? report.overlayValidation.renderStdout
                : report.overlayValidation.stdout,
        })}`);
    }
    if (!report.repairDryRun.ok) {
        lines.push(`- repair error: ${WorktreeStackKit_formatEnvDoctorCommandError({
            error: undefined,
            stderr: report.repairDryRun.stderr,
            stdout: report.repairDryRun.stdout,
        })}`);
    }
    if (report.fixSuggestions.length > 0) {
        for (const command of report.fixSuggestions) {
            lines.push(`- suggested fix: ${command}`);
        }
    }
    else {
        lines.push("- suggested fix: none");
    }
    for (const reviewPath of report.manualReviewPaths) {
        lines.push(`- review file: ${reviewPath}`);
    }
    const output = lines.join("\n");
    if (report.ok) {
        console.log(output);
        return;
    }
    console.error(output);
}
/** Prefer stderr, stdout, then spawn errors when surfacing subprocess failures. */
function WorktreeStackKit_formatEnvDoctorCommandError(options) {
    const stderr = options.stderr.trim();
    if (stderr.length > 0) {
        return stderr;
    }
    const stdout = options.stdout.trim();
    if (stdout.length > 0) {
        return stdout;
    }
    if (options.error instanceof Error && options.error.message.trim().length > 0) {
        return options.error.message;
    }
    return "Unknown error.";
}
/** Returns true when a JSON-derived value is a plain object bag for keyed field probing. */
function WorktreeStackKit_envDoctorIsRecord(value) {
    return typeof value === "object" && value !== null;
}
/** Validates a JSON-derived list is homogeneous strings. */
function WorktreeStackKit_envDoctorIsStringArray(value) {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
/** Coerces unknown JSON maps to string-valued records, rejecting heterogeneous values. */
function WorktreeStackKit_envDoctorReadStringMap(value) {
    if (!WorktreeStackKit_envDoctorIsRecord(value)) {
        return null;
    }
    const result = {};
    for (const [key, entryValue] of Object.entries(value)) {
        if (typeof entryValue !== "string") {
            return null;
        }
        result[key] = entryValue;
    }
    return result;
}
//# sourceMappingURL=env-doctor-command.js.map