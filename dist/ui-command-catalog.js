/**
 * @fileoverview Reusable UI command builders for worktree-stack launch surfaces.
 *
 * Ink, OpenTUI, and numbered interactive adapters collect user input in script-owned view
 * components. This package module owns the pure argv construction, command preview formatting, and
 * generic spawn handoff so those adapters can stay thin while project config still owns which npm
 * scripts and compatibility command paths are exposed.
 *
 * @testing Node test: npm run worktree-kit:test from the repository root executes packages/worktree-kit unit tests via tsx --test (package.json test glob includes ui-command-catalog.unit.test.ts).
 *
 * @see packages/worktree-kit/src/interactive-flows.ts - Numbered/Ink interactive flows that import command specs, preview formatters, and synchronous spawn dispatch from this module after prompts resolve.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI controller wiring that composes argv builders and npm/tsx preview strings exported here for stack maintenance invocations.
 * @see packages/worktree-kit/src/ui-command-catalog.unit.test.ts - Node test module that asserts argv mapping, preview text, and spawn argv wiring for the exported helpers.
 * @see docs/COMMANDS.md - Platform command catalog documenting worktrees CLIs and where `@gg-utils/worktree-kit/ui-command-catalog` fits in the interactive OpenTUI and script surfaces.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { worktreeStackShellQuote } from "@gg-utils/worktree-core/foundation";
/** Builds forwarded args for `worktrees:create` from structured interactive answers. */
export function WorktreeStackKit_buildUiCreateArgs(options) {
    const args = [
        "--name",
        options.stackName,
        "--slot",
        String(options.slot),
        "--base-branch",
        options.baseBranch,
        "--root-branch",
        options.rootBranch,
        "--submodule-branch",
        options.submoduleBranch,
        "--worktrees-base",
        options.worktreesBase,
    ];
    if (options.copyEnvFromMain) {
        args.push("--copy-env-from-main");
    }
    if (!options.installDependencies) {
        args.push("--no-install");
    }
    else {
        if (options.installSkipExisting) {
            args.push("--install-skip-existing");
        }
        if (options.installPreferOnline) {
            args.push("--install-prefer-online");
        }
    }
    if (options.openWindsurf) {
        args.push("--open-windsurf");
    }
    if (options.startMode === "terminal") {
        args.push("--start");
    }
    if (options.startMode === "iterm") {
        args.push("--start-iterm");
    }
    return args;
}
/** Builds forwarded args for `worktrees:start`, including optional editor opt-in. */
export function WorktreeStackKit_buildUiStartArgs(options) {
    const args = ["--worktree", options.worktreePath];
    if (options.openWindsurf) {
        args.push("--open-windsurf");
    }
    return args;
}
/** Builds forwarded args for `worktrees:update-from-main`. */
export function WorktreeStackKit_buildUiUpdateFromMainArgs(options) {
    return [
        "--worktree",
        options.worktreePath,
        "--mode",
        options.mode,
        "--target-branch",
        options.targetBranch,
        options.executionMode === "push" ? "--push" : "--plan",
    ];
}
/** Builds forwarded args for `worktrees:merge`. */
export function WorktreeStackKit_buildUiMergeArgs(options) {
    return [
        "--worktree",
        options.worktreePath,
        "--target-branch",
        options.targetBranch,
        options.executionMode === "push" ? "--push" : "--plan",
    ];
}
/** Builds forwarded args for `worktrees:destroy`, optionally requesting prune. */
export function WorktreeStackKit_buildUiDestroyArgs(options) {
    const args = ["--worktree", options.worktreePath];
    if (options.prune) {
        args.push("--prune");
    }
    return args;
}
/** Builds forwarded args for previewing the next pooled realm from a stack-name seed. */
export function WorktreeStackKit_buildUiPoolNextArgs(stackName) {
    return ["--stack-name", stackName];
}
/** Shell-quotes a preview token only when needed for unambiguous display. */
export function WorktreeStackKit_quoteUiCommandToken(token) {
    if (token.length === 0 || /[\s'"]/u.test(token)) {
        return worktreeStackShellQuote(token);
    }
    return token;
}
/** Formats an npm run command string with optional forwarded args. */
export function WorktreeStackKit_formatUiNpmRunCommand(options) {
    const forwardedArgs = options.forwardedArgs.map(WorktreeStackKit_quoteUiCommandToken);
    return [
        "npm",
        "run",
        options.npmScript,
        ...(forwardedArgs.length > 0 ? ["--", ...forwardedArgs] : ["--"]),
    ].join(" ");
}
/** Formats an `npx tsx <script>` command string with shell-safe argv. */
export function WorktreeStackKit_formatUiTsxCommand(options) {
    return [
        "npx",
        "tsx",
        path.join(options.repoRoot, options.scriptPath),
        ...options.args.map(WorktreeStackKit_quoteUiCommandToken),
    ].join(" ");
}
/** Produces a human-readable preview string for the command about to run. */
export function WorktreeStackKit_formatUiCommandPreview(options) {
    if (options.spec.kind === "npm") {
        return WorktreeStackKit_formatUiNpmRunCommand({
            forwardedArgs: options.spec.args,
            npmScript: options.spec.script,
        });
    }
    return WorktreeStackKit_formatUiTsxCommand({
        args: options.spec.args,
        repoRoot: options.repoRoot,
        scriptPath: options.spec.scriptPath,
    });
}
/** Synchronously executes a UI command spec with inherited stdio inside `repoRoot`. */
export function WorktreeStackKit_runUiCommand(options) {
    const command = options.spec.kind === "npm"
        ? {
            args: [
                "run",
                options.spec.script,
                ...(options.spec.args.length > 0 ? ["--", ...options.spec.args] : []),
            ],
            binary: "npm",
        }
        : {
            args: [
                "tsx",
                path.join(options.repoRoot, options.spec.scriptPath),
                ...options.spec.args,
            ],
            binary: "npx",
        };
    const result = spawnSync(command.binary, command.args, {
        cwd: options.repoRoot,
        env: { ...process.env },
        stdio: "inherit",
    });
    if (result.error) {
        throw result.error;
    }
    if ((result.status ?? 1) !== 0) {
        process.exit(result.status ?? 1);
    }
}
/** Builds argv for `worktrees:create` from an OpenTUI create form. */
export function WorktreeStackKit_buildOpenTuiCreateArgv(model) {
    const slot = Number.parseInt(model.slot.trim(), 10);
    if (!Number.isInteger(slot) || slot <= 0) {
        throw new Error("Slot must be a positive integer.");
    }
    if (!model.stackName.trim()) {
        throw new Error("Stack name is required.");
    }
    const argv = ["--name", model.stackName.trim(), "--slot", String(slot)];
    if (model.baseBranch.trim().length > 0) {
        argv.push("--base-branch", model.baseBranch.trim());
    }
    if (model.rootBranch.trim().length > 0) {
        argv.push("--root-branch", model.rootBranch.trim());
    }
    if (model.submoduleBranch.trim().length > 0) {
        argv.push("--submodule-branch", model.submoduleBranch.trim());
    }
    if (model.metadataSource.trim().length > 0) {
        argv.push("--metadata-source", model.metadataSource.trim());
    }
    if (model.realm.trim().length > 0) {
        argv.push("--realm", model.realm.trim());
    }
    if (model.worktreePathOverride.trim().length > 0) {
        argv.push("--worktree-path", model.worktreePathOverride.trim());
    }
    if (model.worktreesBase.trim().length > 0) {
        argv.push("--worktrees-base", model.worktreesBase.trim());
    }
    if (model.copyEnvFromMain) {
        argv.push("--copy-env-from-main");
    }
    if (!model.runInstall) {
        argv.push("--no-install");
    }
    if (model.installSkipExisting) {
        argv.push("--install-skip-existing");
    }
    if (!model.installPreferOffline) {
        argv.push("--install-prefer-online");
    }
    if (model.startMode === "terminal") {
        argv.push("--start");
    }
    else if (model.startMode === "iterm") {
        argv.push("--start-iterm");
    }
    if (model.openWindsurf) {
        argv.push("--open-windsurf");
    }
    return argv;
}
/** Builds forwarded argv for the worktree repair npm-script from UI state. */
export function WorktreeStackKit_buildOpenTuiRepairArgv(options) {
    const argv = [];
    const paths = WorktreeStackKit_splitUiPathLines(options.worktreeLines);
    for (const worktreePath of paths) {
        argv.push("--worktree", worktreePath);
    }
    if (options.includePackageEnv) {
        argv.push("--include-package-env");
        if (options.legacyMissingOnlyAlias) {
            argv.push("--package-env-mode", "missing-only");
        }
    }
    if (options.dryRun) {
        argv.push("--dry-run");
    }
    return argv;
}
/** Builds argv for `worktrees:switch` from the OpenTUI switch form. */
export function WorktreeStackKit_buildOpenTuiSwitchArgv(model) {
    const argv = [];
    if (model.prefix.trim().length > 0) {
        argv.push("--prefix", model.prefix.trim());
    }
    if (model.stackName.trim().length > 0) {
        argv.push("--name", model.stackName.trim());
    }
    if (model.worktreesBase.trim() !== "default") {
        argv.push("--worktrees-base", model.worktreesBase.trim());
    }
    return argv;
}
/** Splits comma/newline separated UI path buffers into trimmed non-empty path tokens. */
export function WorktreeStackKit_splitUiPathLines(rawValue) {
    return rawValue
        .split(/[,\r\n]+/gu)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}
/** Builds the `--source-workspace` / `--worktree` argv fragments consumed by sync commands. */
export function WorktreeStackKit_buildOpenTuiSyncArgv(options) {
    const argv = [];
    if (options.sourceWorkspace.trim().length > 0) {
        argv.push("--source-workspace", options.sourceWorkspace.trim());
    }
    for (const worktreePath of WorktreeStackKit_splitUiPathLines(options.worktreeLines)) {
        argv.push("--worktree", worktreePath);
    }
    return argv;
}
