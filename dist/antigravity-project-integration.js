/**
 * @fileoverview Antigravity/Gemini workspace registration helpers for prepared worktree paths.
 *
 * Flow: action + worktree path + label -> projects.json mutation -> saved workspace roots. The
 * package stays product-neutral; root adapters only preserve command surfaces.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see scripts/worktree-stack/integrations/antigravity-project.ts - Root tsx entrypoint that forwards argv to WorktreeStackKit_runAntigravityProjectCli from this module so historical script paths stay stable.
 * @see packages/worktree-kit/src/antigravity-project-integration.unit.test.ts - Jest regression coverage for projects.json mutation, Antigravity path resolution, and CLI argv parsing owned by this module.
 * @see docs/COMMANDS.md - Platform command catalog that documents npm worktrees:antigravity:* wiring operators use alongside this integration.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { worktreeStackInfo } from "@gg-utils/worktree-core/foundation";
/** Signals argv/help failures so callers can print usage without masking runtime errors. */
export class WorktreeStackKit_AntigravityProjectCliUsageError extends Error {
}
/** Narrows unknown JSON values to plain objects for shallow cloning into project state. */
function WorktreeStackKit_isAntigravityRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Canonicalizes user-supplied worktree paths before Antigravity state writes. */
export function WorktreeStackKit_normalizeAntigravityWorktreePath(worktreePath) {
    return path.resolve(worktreePath);
}
/** Normalizes stderr messages with a stable `[worktree]` prefix for CLI operators. */
function WorktreeStackKit_formatAntigravityCliErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith("[worktree] ")
        ? message
        : `[worktree] ERROR: ${message}`;
}
/** Loads Antigravity/Gemini JSON state from disk, coercing invalid roots into defaults. */
function WorktreeStackKit_loadAntigravityProjectsState(projectsPath) {
    try {
        const parsed = JSON.parse(fs.readFileSync(projectsPath, "utf8"));
        if (!WorktreeStackKit_isAntigravityRecord(parsed)) {
            return { projects: {} };
        }
        const projects = WorktreeStackKit_isAntigravityRecord(parsed.projects)
            ? { ...parsed.projects }
            : {};
        return {
            ...parsed,
            projects,
        };
    }
    catch (error) {
        console.error(`[worktree] Could not load Antigravity projects state from ${projectsPath}:`, error);
        return { projects: {} };
    }
}
/** Resolves `ANTIGRAVITY_HOME` / `GEMINI_HOME` plus the `projects.json` file location. */
export function WorktreeStackKit_resolveAntigravityProjectPaths(env = process.env, homeDir = os.homedir()) {
    const antigravityHomeDir = env.ANTIGRAVITY_HOME || env.GEMINI_HOME || path.join(homeDir, ".gemini");
    return {
        antigravityHomeDir,
        projectsPath: path.join(antigravityHomeDir, "projects.json"),
    };
}
/** Returns the next `projects.json` object with the worktree path added or removed. */
export function WorktreeStackKit_updateAntigravityProjectsState(options) {
    const { action, label, projectsState, worktreePath } = options;
    const nextState = { ...projectsState };
    const existingProjectsValue = nextState.projects;
    const existingProjects = WorktreeStackKit_isAntigravityRecord(existingProjectsValue)
        ? existingProjectsValue
        : {};
    if (action === "register") {
        const existingLabelValue = existingProjects[worktreePath];
        const existingLabel = typeof existingLabelValue === "string" && existingLabelValue.trim().length > 0
            ? existingLabelValue.trim()
            : path.basename(worktreePath);
        const nextLabel = label.trim().length > 0 ? label.trim() : existingLabel;
        const nextProjects = {
            [worktreePath]: nextLabel,
        };
        for (const [candidatePath, candidateLabel] of Object.entries(existingProjects)) {
            if (candidatePath === worktreePath) {
                continue;
            }
            nextProjects[candidatePath] = candidateLabel;
        }
        nextState.projects = nextProjects;
        return nextState;
    }
    const nextProjects = {};
    for (const [candidatePath, candidateLabel] of Object.entries(existingProjects)) {
        if (candidatePath === worktreePath) {
            continue;
        }
        nextProjects[candidatePath] = candidateLabel;
    }
    nextState.projects = nextProjects;
    return nextState;
}
/** Applies register/unregister mutations to Antigravity/Gemini `projects.json` on disk. */
export function WorktreeStackKit_runAntigravityProjectMutation(options) {
    const normalizedWorktreePath = WorktreeStackKit_normalizeAntigravityWorktreePath(options.worktreePath);
    const paths = WorktreeStackKit_resolveAntigravityProjectPaths(options.env, options.homeDir);
    const nextState = WorktreeStackKit_updateAntigravityProjectsState({
        action: options.action,
        label: options.label,
        projectsState: WorktreeStackKit_loadAntigravityProjectsState(paths.projectsPath),
        worktreePath: normalizedWorktreePath,
    });
    fs.mkdirSync(paths.antigravityHomeDir, { recursive: true });
    fs.writeFileSync(paths.projectsPath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
}
/** Prints Antigravity integration CLI usage and behavior notes to stdout. */
export function WorktreeStackKit_printAntigravityProjectUsage() {
    const usageCommand = "npx tsx scripts/worktree-stack/integrations/antigravity-project.ts " +
        "(--register|--unregister) --worktree <path> [options]";
    console.log(`Usage:
  npm run worktrees:antigravity:register -- --worktree <path> [options]
  npm run worktrees:antigravity:unregister -- --worktree <path>
  ${usageCommand}

Options:
  --label <name>       Human-friendly label for the Antigravity workspace list
  --help               Show this help

Behavior:
  --register   Adds the worktree path to Antigravity's workspace list in ~/.gemini/projects.json
  --unregister Removes the worktree path from Antigravity's workspace list in
               ~/.gemini/projects.json`);
}
/** Parses integration argv into structured options. */
export function WorktreeStackKit_parseAntigravityProjectCliArgs(argv) {
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
                    throw new WorktreeStackKit_AntigravityProjectCliUsageError("Missing value for --worktree");
                }
                worktreePath = value;
                index += 2;
                break;
            }
            case "--label": {
                const value = argv[index + 1];
                if (typeof value !== "string") {
                    throw new WorktreeStackKit_AntigravityProjectCliUsageError("Missing value for --label");
                }
                label = value;
                index += 2;
                break;
            }
            case "--help":
            case "-h":
                WorktreeStackKit_printAntigravityProjectUsage();
                process.exit(0);
            default:
                throw new WorktreeStackKit_AntigravityProjectCliUsageError(`Unknown argument: ${argument}`);
        }
    }
    if (!action || worktreePath.length === 0) {
        throw new WorktreeStackKit_AntigravityProjectCliUsageError("Both an action and --worktree are required.");
    }
    return {
        action,
        label,
        worktreePath,
    };
}
/** CLI entrypoint that wires parsing to Antigravity/Gemini project-state mutation. */
export function WorktreeStackKit_runAntigravityProjectCli(argv, env = process.env, homeDir = os.homedir()) {
    try {
        const options = WorktreeStackKit_parseAntigravityProjectCliArgs(argv);
        WorktreeStackKit_runAntigravityProjectMutation({
            ...options,
            env,
            homeDir,
        });
        const normalizedWorktreePath = WorktreeStackKit_normalizeAntigravityWorktreePath(options.worktreePath);
        if (options.action === "register") {
            worktreeStackInfo(`Registered worktree in Antigravity workspace list: ${normalizedWorktreePath}`);
        }
        else {
            worktreeStackInfo(`Unregistered worktree from Antigravity workspace list: ${normalizedWorktreePath}`);
        }
        return 0;
    }
    catch (error) {
        console.error(WorktreeStackKit_formatAntigravityCliErrorMessage(error));
        if (error instanceof WorktreeStackKit_AntigravityProjectCliUsageError) {
            WorktreeStackKit_printAntigravityProjectUsage();
        }
        return 1;
    }
}
//# sourceMappingURL=antigravity-project-integration.js.map