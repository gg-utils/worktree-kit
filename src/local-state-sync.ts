/**
 * @fileoverview Config-driven local-state file and directory sync helpers for prepared worktrees.
 *
 * Flow: explicit sync file/directory config -> tracked-content filtering -> workspace path rewrite
 * for configured text files -> target workspace copy.
 *
 * @testing Node.js test: npm run worktree-kit:test from the repository root (tsx Node test runner for packages/worktree-kit, including local-state-sync.unit.test.ts).
 *
 * @see packages/worktree-kit/src/configured-submodules.ts - Submodule path resolver whose listing drives which repo root receives `git ls-files` when deciding whether a candidate local directory is untracked.
 * @see packages/worktree-core/src/foundation.ts - Shared `worktreeStackRunGit` and logging primitives used for allow-failure `ls-files` probes and user-visible sync progress lines.
 * @see packages/worktree-kit/src/sync-local-workspaces.ts - CLI-oriented orchestrator that imports the exported sync helpers to mirror configured local files and directories into each target prepared-worktree workspace.
 * @see worktrees.config.ts - Host adapter that builds `WorktreeStackKit_LocalStateSyncConfig` consumed by this module when the platform wires worktree-kit into root worktree automation.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import fs from "node:fs";
import path from "node:path";

import {
  worktreeStackInfo,
  worktreeStackRunGit,
} from "@gg-utils/worktree-core/foundation";

import {
  WorktreeStackKit_listConfiguredSubmodulePaths,
  type WorktreeStackKit_ConfiguredSubmodulesConfig,
} from "./configured-submodules.js";

export type WorktreeStackKit_LocalStateSyncConfig = {
  configuredSubmodules: WorktreeStackKit_ConfiguredSubmodulesConfig;
  detectableLocalDirectoryBasenames: readonly string[];
  rewriteWorkspacePathFiles: readonly string[];
  syncableLocalDirectories: readonly string[];
  syncableLocalFiles: readonly string[];
};

export type WorktreeStackKit_DetectLocalDirectories_Options = {
  config: WorktreeStackKit_LocalStateSyncConfig;
  sourceWorkspacePath: string;
};

export type WorktreeStackKit_SyncLocalFilesIntoTarget_Options = {
  config: WorktreeStackKit_LocalStateSyncConfig;
  sourceWorkspacePath: string;
  targetWorkspacePath: string;
};

export type WorktreeStackKit_SyncLocalDirectoriesIntoTarget_Options = {
  config: WorktreeStackKit_LocalStateSyncConfig;
  sourceWorkspacePath: string;
  targetWorkspacePath: string;
};

/** Replaces escaped absolute source workspace paths in flat text. */
function WorktreeStackKit_rewriteWorkspacePathInTextContent(options: {
  content: string;
  sourceWorkspacePath: string;
  targetWorkspacePath: string;
}): string {
  const { content, sourceWorkspacePath, targetWorkspacePath } = options;
  const normalizedSourceWorkspacePath = path.resolve(sourceWorkspacePath);
  const normalizedTargetWorkspacePath = path.resolve(targetWorkspacePath);
  const escapedSourceWorkspacePath = normalizedSourceWorkspacePath.replace(
    /[.*+?^${}()|[\]\\]/gu,
    "\\$&",
  );

  return content.replace(
    new RegExp(`${escapedSourceWorkspacePath}(?=$|[/"'\\s])`, "gu"),
    normalizedTargetWorkspacePath,
  );
}

/** Copies one configured syncable file into the target workspace. */
function WorktreeStackKit_copySyncableLocalFileIntoTarget(options: {
  config: WorktreeStackKit_LocalStateSyncConfig;
  relativePath: string;
  sourceWorkspacePath: string;
  targetWorkspacePath: string;
}): void {
  const { config, relativePath, sourceWorkspacePath, targetWorkspacePath } =
    options;
  const sourcePath = path.join(sourceWorkspacePath, relativePath);
  const targetPath = path.join(targetWorkspacePath, relativePath);

  if (config.rewriteWorkspacePathFiles.includes(relativePath)) {
    const rewrittenConfig = WorktreeStackKit_rewriteWorkspacePathInTextContent({
      content: fs.readFileSync(sourcePath, "utf8"),
      sourceWorkspacePath,
      targetWorkspacePath,
    });
    fs.writeFileSync(targetPath, rewrittenConfig, "utf8");
    return;
  }

  fs.copyFileSync(sourcePath, targetPath);
}

/** Reports whether `git ls-files` lists any tracked content for a workspace-relative path. */
function WorktreeStackKit_gitPathHasTrackedContent(options: {
  config: WorktreeStackKit_LocalStateSyncConfig;
  relativePath: string;
  workspacePath: string;
}): boolean {
  const { config, relativePath, workspacePath } = options;
  let repoDir = workspacePath;
  let repoRelativePath = relativePath;

  for (const submodulePath of WorktreeStackKit_listConfiguredSubmodulePaths({
    config: config.configuredSubmodules,
    rootDir: workspacePath,
  })) {
    if (
      relativePath !== submodulePath &&
      !relativePath.startsWith(`${submodulePath}/`)
    ) {
      continue;
    }

    repoDir = path.join(workspacePath, submodulePath);
    repoRelativePath = relativePath
      .slice(submodulePath.length)
      .replace(/^\/+/u, "");
    break;
  }

  const result = worktreeStackRunGit(
    repoDir,
    ["ls-files", "--", repoRelativePath],
    { allowFailure: true },
  );
  return result.status === 0 && result.stdout.trim().length > 0;
}

/** Detects gitignored local directories that exist in the source workspace. */
export function WorktreeStackKit_detectLocalDirectories(
  options: WorktreeStackKit_DetectLocalDirectories_Options,
): string[] {
  const { config, sourceWorkspacePath } = options;
  const detectedDirectories = new Set<string>();

  for (const directoryBasename of config.detectableLocalDirectoryBasenames) {
    const relativePath = directoryBasename;
    if (
      fs.existsSync(path.join(sourceWorkspacePath, relativePath)) &&
      fs.statSync(path.join(sourceWorkspacePath, relativePath)).isDirectory() &&
      !WorktreeStackKit_gitPathHasTrackedContent({
        config,
        relativePath,
        workspacePath: sourceWorkspacePath,
      })
    ) {
      detectedDirectories.add(relativePath);
    }
  }

  for (const submodulePath of WorktreeStackKit_listConfiguredSubmodulePaths({
    config: config.configuredSubmodules,
    rootDir: sourceWorkspacePath,
  })) {
    for (const directoryBasename of config.detectableLocalDirectoryBasenames) {
      const relativePath = path.join(submodulePath, directoryBasename);
      if (
        fs.existsSync(path.join(sourceWorkspacePath, relativePath)) &&
        fs.statSync(path.join(sourceWorkspacePath, relativePath)).isDirectory() &&
        !WorktreeStackKit_gitPathHasTrackedContent({
          config,
          relativePath,
          workspacePath: sourceWorkspacePath,
        })
      ) {
        detectedDirectories.add(relativePath);
      }
    }
  }

  return [...detectedDirectories];
}

/** Copies configured syncable local files from the source workspace into the target workspace. */
export function WorktreeStackKit_syncLocalFilesIntoTarget(
  options: WorktreeStackKit_SyncLocalFilesIntoTarget_Options,
): void {
  const { config, sourceWorkspacePath, targetWorkspacePath } = options;
  for (const relativePath of config.syncableLocalFiles) {
    const sourcePath = path.join(sourceWorkspacePath, relativePath);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      continue;
    }

    const targetPath = path.join(targetWorkspacePath, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    WorktreeStackKit_copySyncableLocalFileIntoTarget({
      config,
      relativePath,
      sourceWorkspacePath,
      targetWorkspacePath,
    });
    worktreeStackInfo(
      `Synced local file into workspace: ${relativePath} -> ${targetWorkspacePath}`,
    );
  }
}

/** Recursively copies one local directory from the source workspace into the target. */
function WorktreeStackKit_syncLocalDirectoryPathIntoTarget(options: {
  localRelativePath: string;
  sourceWorkspacePath: string;
  targetWorkspacePath: string;
}): void {
  const { localRelativePath, sourceWorkspacePath, targetWorkspacePath } =
    options;
  const sourcePath = path.join(sourceWorkspacePath, localRelativePath);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
    return;
  }

  const targetPath = path.join(targetWorkspacePath, localRelativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.rmSync(targetPath, { force: true, recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true });
  worktreeStackInfo(
    `Synced local directory into workspace: ${localRelativePath} -> ${targetWorkspacePath}`,
  );
}

/** Syncs configured and detected local directories from the source workspace into the target. */
export function WorktreeStackKit_syncLocalDirectoriesIntoTarget(
  options: WorktreeStackKit_SyncLocalDirectoriesIntoTarget_Options,
): void {
  const { config, sourceWorkspacePath, targetWorkspacePath } = options;
  const seenRelativePaths = new Set<string>();

  for (const relativePath of config.syncableLocalDirectories) {
    seenRelativePaths.add(relativePath);
    WorktreeStackKit_syncLocalDirectoryPathIntoTarget({
      localRelativePath: relativePath,
      sourceWorkspacePath,
      targetWorkspacePath,
    });
  }

  for (const relativePath of WorktreeStackKit_detectLocalDirectories({
    config,
    sourceWorkspacePath,
  })) {
    if (seenRelativePaths.has(relativePath)) {
      continue;
    }

    seenRelativePaths.add(relativePath);
    WorktreeStackKit_syncLocalDirectoryPathIntoTarget({
      localRelativePath: relativePath,
      sourceWorkspacePath,
      targetWorkspacePath,
    });
  }
}
