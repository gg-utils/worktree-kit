/**
 * @fileoverview Codex workspace registration helpers for prepared worktree paths.
 *
 * Flow: action + worktree path + label -> Codex config/state rewrite -> saved workspace roots and
 * labels. The package stays product-neutral; root adapters only preserve command surfaces.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see scripts/worktree-stack/integrations/codex-project.ts - Legacy tsx adapter that forwards argv into {@link WorktreeStackKit_runCodexProjectCli} so root `npm run worktrees:codex:*` commands stay stable.
 * @see packages/worktree-kit/src/codex-project-integration.unit.test.ts - Jest unit coverage for Codex `config.toml` trusted-project blocks and `.codex-global-state.json` workspace-root mutations owned here.
 * @see docs/COMMANDS.md - Command catalog documenting `worktrees:codex:register` and `worktrees:codex:unregister` and routing operators to this package-owned integration surface.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { worktreeStackInfo } from "@gg-utils/worktree-core/foundation";
/** Signals argv/help failures so callers can print usage without masking runtime errors. */
export class WorktreeStackKit_CodexProjectCliUsageError extends Error {
}
/** Narrows unknown JSON values to plain objects for shallow cloning into Codex state. */
function WorktreeStackKit_isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Escapes regex metacharacters so filesystem paths embed safely in `RegExp` sources. */
function WorktreeStackKit_escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
/** Canonicalizes user-supplied worktree paths before Codex config/state writes. */
export function WorktreeStackKit_normalizeCodexWorktreePath(worktreePath) {
    return path.resolve(worktreePath);
}
/** Normalizes stderr messages with a stable `[worktree]` prefix for CLI operators. */
function WorktreeStackKit_formatCodexCliErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith("[worktree] ")
        ? message
        : `[worktree] ERROR: ${message}`;
}
/** Builds a multiline regex that matches one Codex `[projects."path"]` trusted block. */
function WorktreeStackKit_buildCodexProjectBlockRegex(targetPath) {
    const escapedTargetPath = WorktreeStackKit_escapeRegex(targetPath);
    return new RegExp(String.raw `(?:^|\n)\[projects\."${escapedTargetPath}"\]\n` +
        String.raw `(?:[^\n]*\n)*?(?=\n\[|$)`, "m");
}
/** Supplies the empty Codex workspace-root registry shape used when state is absent or invalid. */
function WorktreeStackKit_defaultCodexState() {
    return {
        "electron-saved-workspace-roots": [],
        "active-workspace-roots": [],
        "electron-workspace-root-labels": {},
    };
}
/** Loads Codex global JSON state from disk, cloning object roots when parseable. */
function WorktreeStackKit_loadCodexState(statePath) {
    try {
        const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
        return WorktreeStackKit_isRecord(parsed)
            ? { ...parsed }
            : WorktreeStackKit_defaultCodexState();
    }
    catch {
        return WorktreeStackKit_defaultCodexState();
    }
}
/** Resolves `CODEX_HOME` defaulting to `~/.codex`, plus config/state file locations. */
export function WorktreeStackKit_resolveCodexProjectPaths(env = process.env, homeDir = os.homedir()) {
    const codexHomeDir = env.CODEX_HOME || path.join(homeDir, ".codex");
    return {
        codexHomeDir,
        configPath: path.join(codexHomeDir, "config.toml"),
        statePath: path.join(codexHomeDir, ".codex-global-state.json"),
    };
}
/** Rewrites Codex `config.toml` text to add/remove a trusted project block. */
export function WorktreeStackKit_updateCodexConfigContent(options) {
    const { action, currentContent, worktreePath } = options;
    const block = `[projects."${worktreePath}"]\ntrust_level = "trusted"\n`;
    const blockRegex = WorktreeStackKit_buildCodexProjectBlockRegex(worktreePath);
    if (action === "register") {
        if (blockRegex.test(currentContent)) {
            return currentContent.replace(blockRegex, (matchedBlock) => matchedBlock.startsWith("\n") ? `\n${block}` : block);
        }
        const trimmedContent = currentContent.replace(/\s*$/u, "");
        const separator = trimmedContent.trim().length > 0 ? "\n\n" : "";
        return `${trimmedContent}${separator}${block}\n`;
    }
    const nextContent = currentContent
        .replace(blockRegex, (matchedBlock) => matchedBlock.startsWith("\n") ? "\n" : "")
        .replace(/\n{3,}/gu, "\n\n")
        .replace(/^\n+/u, "")
        .trimEnd();
    return `${nextContent}${nextContent.length > 0 ? "\n" : ""}`;
}
/** Returns the next Codex global state with workspace roots/labels adjusted for the path. */
export function WorktreeStackKit_updateCodexState(options) {
    const { action, label, state, worktreePath } = options;
    const nextState = { ...state };
    const savedRootsValue = nextState["electron-saved-workspace-roots"];
    const savedRoots = Array.isArray(savedRootsValue) ? [...savedRootsValue] : [];
    if (action === "register") {
        if (!savedRoots.some((candidate) => candidate === worktreePath)) {
            savedRoots.unshift(worktreePath);
        }
        nextState["electron-saved-workspace-roots"] = savedRoots;
    }
    else {
        nextState["electron-saved-workspace-roots"] = savedRoots.filter((candidate) => candidate !== worktreePath);
    }
    const activeRootsValue = nextState["active-workspace-roots"];
    const activeRoots = Array.isArray(activeRootsValue) ? [...activeRootsValue] : [];
    if (action === "unregister") {
        nextState["active-workspace-roots"] = activeRoots.filter((candidate) => candidate !== worktreePath);
    }
    const labelsValue = nextState["electron-workspace-root-labels"];
    const labels = WorktreeStackKit_isRecord(labelsValue) ? { ...labelsValue } : {};
    const trimmedLabel = label.trim();
    if (action === "register") {
        if (trimmedLabel.length > 0) {
            labels[worktreePath] = trimmedLabel;
        }
    }
    else {
        delete labels[worktreePath];
    }
    nextState["electron-workspace-root-labels"] = labels;
    return nextState;
}
/** Applies register/unregister mutations to Codex config and JSON state on disk. */
export function WorktreeStackKit_runCodexProjectMutation(options) {
    const normalizedWorktreePath = WorktreeStackKit_normalizeCodexWorktreePath(options.worktreePath);
    const paths = WorktreeStackKit_resolveCodexProjectPaths(options.env, options.homeDir);
    fs.mkdirSync(paths.codexHomeDir, { recursive: true });
    if (options.action === "register") {
        const currentConfig = fs.existsSync(paths.configPath)
            ? fs.readFileSync(paths.configPath, "utf8")
            : "";
        const nextConfig = WorktreeStackKit_updateCodexConfigContent({
            action: "register",
            currentContent: currentConfig,
            worktreePath: normalizedWorktreePath,
        });
        fs.mkdirSync(path.dirname(paths.configPath), { recursive: true });
        fs.writeFileSync(paths.configPath, nextConfig, "utf8");
    }
    else if (fs.existsSync(paths.configPath)) {
        const nextConfig = WorktreeStackKit_updateCodexConfigContent({
            action: "unregister",
            currentContent: fs.readFileSync(paths.configPath, "utf8"),
            worktreePath: normalizedWorktreePath,
        });
        fs.writeFileSync(paths.configPath, nextConfig, "utf8");
    }
    const nextState = WorktreeStackKit_updateCodexState({
        action: options.action,
        label: options.label,
        state: WorktreeStackKit_loadCodexState(paths.statePath),
        worktreePath: normalizedWorktreePath,
    });
    fs.mkdirSync(path.dirname(paths.statePath), { recursive: true });
    fs.writeFileSync(paths.statePath, JSON.stringify(nextState), "utf8");
}
/** Prints Codex integration CLI usage and behavior notes to stdout. */
export function WorktreeStackKit_printCodexProjectUsage() {
    const usageCommand = "npx tsx scripts/worktree-stack/integrations/codex-project.ts " +
        "(--register|--unregister) --worktree <path> [options]";
    console.log(`Usage:
  npm run worktrees:codex:register -- --worktree <path> [options]
  npm run worktrees:codex:unregister -- --worktree <path>
  ${usageCommand}

Options:
  --label <name>       Human-friendly label for the Codex macOS app workspace list
  --help               Show this help

Behavior:
  --register   Adds the worktree path to Codex trusted projects and saved workspace roots
  --unregister Removes the worktree path from Codex trusted projects and saved workspace roots`);
}
/** Parses integration argv into structured options. */
export function WorktreeStackKit_parseCodexProjectCliArgs(argv) {
    let action = null;
    let label = "";
    let worktreePath = "";
    for (let index = 0; index < argv.length;) {
        const argument = argv[index];
        switch (argument) {
            case "--register":
                action = "register";
                index += 1;
                break;
            case "--unregister":
                action = "unregister";
                index += 1;
                break;
            case "--worktree": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_CodexProjectCliUsageError("Missing value for --worktree");
                }
                worktreePath = value;
                index += 2;
                break;
            }
            case "--label": {
                const value = argv[index + 1];
                if (typeof value !== "string") {
                    throw new WorktreeStackKit_CodexProjectCliUsageError("Missing value for --label");
                }
                label = value;
                index += 2;
                break;
            }
            case "--help":
            case "-h":
                WorktreeStackKit_printCodexProjectUsage();
                process.exit(0);
            default:
                throw new WorktreeStackKit_CodexProjectCliUsageError(`Unknown argument: ${argument}`);
        }
    }
    if (!action || worktreePath.length === 0) {
        throw new WorktreeStackKit_CodexProjectCliUsageError("Both an action and --worktree are required.");
    }
    return {
        action,
        label,
        worktreePath,
    };
}
/** CLI entrypoint that wires parsing to Codex config/state mutation. */
export function WorktreeStackKit_runCodexProjectCli(argv, env = process.env, homeDir = os.homedir()) {
    try {
        const options = WorktreeStackKit_parseCodexProjectCliArgs(argv);
        WorktreeStackKit_runCodexProjectMutation({
            ...options,
            env,
            homeDir,
        });
        const normalizedWorktreePath = WorktreeStackKit_normalizeCodexWorktreePath(options.worktreePath);
        if (options.action === "register") {
            worktreeStackInfo(`Registered worktree in Codex macOS app project state: ${normalizedWorktreePath}`);
        }
        else {
            worktreeStackInfo(`Unregistered worktree from Codex macOS app project state: ${normalizedWorktreePath}`);
        }
        return 0;
    }
    catch (error) {
        console.error(WorktreeStackKit_formatCodexCliErrorMessage(error));
        if (error instanceof WorktreeStackKit_CodexProjectCliUsageError) {
            WorktreeStackKit_printCodexProjectUsage();
        }
        return 1;
    }
}
