/**
 * @fileoverview Config-driven command runner for syncing local workspace state.
 *
 * Flow: argv -> source/target resolution -> package-owned local-state sync -> optional project
 * hook after each target receives copied files and directories.
 *
 * @testing Node test runner: npm run worktree-kit:test from the repo root executes packages/worktree-kit unit tests including src/sync-local-workspaces.unit.test.ts.
 *
 * @see packages/worktree-kit/src/local-state-sync.ts - Owns the file and directory copy helpers plus the typed local-state sync config this runner invokes for each resolved target workspace.
 * @see scripts/worktree-stack/commands/sync-local-files.ts - Worktree-stack CLI entrypoint that imports WorktreeStackKit_runSyncLocalWorkspacesCommand from this module to apply the root worktrees.config.ts adapter wiring.
 * @see worktrees.config.ts - Root repository adapter that supplies the WorktreeStackKit_SyncLocalWorkspacesConfig instance consumed when the sync-local command runs under project-owned wiring.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackError, worktreeStackInfo, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackListPreparedWorktrees, worktreeStackResolveCanonicalRootWorkspacePath, worktreeStackResolveDefaultWorktreesBase, } from "@gg-utils/worktree-core/worktree-discovery";
import { WorktreeStackKit_syncLocalDirectoriesIntoTarget, WorktreeStackKit_syncLocalFilesIntoTarget, } from "./local-state-sync.js";
/** Renders usage text from generic options plus project-supplied examples and content lines. */
export function WorktreeStackKit_renderSyncLocalWorkspacesUsage(usage) {
    return [
        "Usage:",
        ...usage.commandLines.map((line) => `  ${line}`),
        "",
        "Options:",
        "  --source-workspace <path>   Source workspace for gitignored local state",
        "                              (default: current workspace)",
        "  --worktree <path>           Sync only this workspace path",
        "                              (repeatable)",
        "  --help                      Show this help",
        "",
        "Default behavior:",
        "  Syncs the source workspace local state into:",
        "  - the canonical root workspace",
        "  - every prepared worktree registered for that root workspace",
        "  - every git worktree directory discovered under the default worktrees base",
        "",
        "Synced local state:",
        ...usage.syncedLocalStateLines.map((line) => `  - ${line}`),
        "",
        "Examples:",
        ...usage.examples.map((line) => `  ${line}`),
        "",
        "Notes:",
        ...usage.notes.map((line) => `  - ${line}`),
    ].join("\n");
}
/** Parses sync-local-workspaces argv into source and explicit target options. */
export function WorktreeStackKit_parseSyncLocalWorkspacesArgs(options) {
    const { argv, defaultSourceWorkspacePath, usage } = options;
    const parsedOptions = {
        sourceWorkspacePath: defaultSourceWorkspacePath,
        targetWorktrees: [],
    };
    for (let index = 0; index < argv.length;) {
        const argument = argv[index];
        switch (argument) {
            case "--source-workspace": {
                const value = argv[index + 1];
                if (!value) {
                    worktreeStackError("Missing value for --source-workspace");
                }
                parsedOptions.sourceWorkspacePath = value;
                index += 2;
                break;
            }
            case "--worktree": {
                const value = argv[index + 1];
                if (!value) {
                    worktreeStackError("Missing value for --worktree");
                }
                parsedOptions.targetWorktrees.push(value);
                index += 2;
                break;
            }
            case "--help":
            case "-h":
                console.log(WorktreeStackKit_renderSyncLocalWorkspacesUsage(usage));
                return null;
            default:
                worktreeStackError(`Unknown argument: ${argument ?? ""}`);
        }
    }
    return parsedOptions;
}
/**
 * Resolves destination workspace paths that should receive copied local state.
 *
 * @remarks
 * Explicit targets are merged with the canonical root. Otherwise this combines prepared
 * worktrees registered in Git with sibling directories under the configured worktrees base that
 * contain a `.git` marker.
 */
export function WorktreeStackKit_resolveSyncLocalWorkspaceTargets(options) {
    const { canonicalRootWorkspacePath, defaultWorktreesBasePath, explicitTargets, } = options;
    if (explicitTargets.length > 0) {
        return [canonicalRootWorkspacePath, ...explicitTargets];
    }
    const resolvedTargets = new Set([
        canonicalRootWorkspacePath,
        ...worktreeStackListPreparedWorktrees(canonicalRootWorkspacePath),
    ]);
    if (fs.existsSync(defaultWorktreesBasePath) &&
        fs.statSync(defaultWorktreesBasePath).isDirectory()) {
        for (const entry of fs.readdirSync(defaultWorktreesBasePath, {
            withFileTypes: true,
        })) {
            if (!entry.isDirectory()) {
                continue;
            }
            const candidatePath = path.join(defaultWorktreesBasePath, entry.name);
            if (fs.existsSync(path.join(candidatePath, ".git"))) {
                resolvedTargets.add(candidatePath);
            }
        }
    }
    return [...resolvedTargets];
}
/** Syncs one target workspace and runs the configured post-sync hook if one exists. */
export function WorktreeStackKit_syncLocalWorkspaceTarget(options) {
    const { config, sourceWorkspacePath, targetWorkspacePath } = options;
    if (!fs.existsSync(targetWorkspacePath) ||
        !fs.statSync(targetWorkspacePath).isDirectory()) {
        worktreeStackWarn(`Skipping missing workspace target: ${targetWorkspacePath}`);
        return;
    }
    if (path.resolve(targetWorkspacePath) === path.resolve(sourceWorkspacePath)) {
        worktreeStackInfo(`Source workspace already authoritative: ${targetWorkspacePath}`);
        return;
    }
    WorktreeStackKit_syncLocalFilesIntoTarget({
        config: config.localStateSync,
        sourceWorkspacePath,
        targetWorkspacePath,
    });
    WorktreeStackKit_syncLocalDirectoriesIntoTarget({
        config: config.localStateSync,
        sourceWorkspacePath,
        targetWorkspacePath,
    });
    config.afterSyncTarget?.({
        projectRoot: config.projectRoot,
        sourceWorkspacePath,
        targetWorkspacePath,
    });
}
/** Validates the source workspace, resolves target workspaces, and syncs each target. */
export function WorktreeStackKit_runSyncLocalWorkspacesCommand(options) {
    const { argv, config } = options;
    const parsedOptions = WorktreeStackKit_parseSyncLocalWorkspacesArgs({
        argv,
        defaultSourceWorkspacePath: config.defaultSourceWorkspacePath,
        usage: config.usage,
    });
    if (parsedOptions === null) {
        return;
    }
    if (!fs.existsSync(parsedOptions.sourceWorkspacePath) ||
        !fs.statSync(parsedOptions.sourceWorkspacePath).isDirectory()) {
        worktreeStackError(`Source workspace does not exist: ${parsedOptions.sourceWorkspacePath}`);
    }
    const canonicalRootWorkspacePath = worktreeStackResolveCanonicalRootWorkspacePath(config.projectRoot);
    const defaultWorktreesBasePath = worktreeStackResolveDefaultWorktreesBase({
        defaultWorktreesDirectoryName: config.defaultWorktreesDirectoryName,
        projectRoot: config.projectRoot,
    });
    const targetWorkspacePaths = WorktreeStackKit_resolveSyncLocalWorkspaceTargets({
        canonicalRootWorkspacePath,
        defaultWorktreesBasePath,
        explicitTargets: parsedOptions.targetWorktrees.map((target) => path.resolve(target)),
    });
    for (const targetWorkspacePath of targetWorkspacePaths) {
        WorktreeStackKit_syncLocalWorkspaceTarget({
            config,
            sourceWorkspacePath: path.resolve(parsedOptions.sourceWorkspacePath),
            targetWorkspacePath,
        });
    }
}
//# sourceMappingURL=sync-local-workspaces.js.map