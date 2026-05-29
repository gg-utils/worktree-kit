/**
 * @fileoverview Config-driven configured-submodule discovery and branch synchronization helpers.
 *
 * Flow: project app-submodule path config + `.gitmodules` + prepared-worktree metadata -> expected
 * submodule branch plans -> fetch/update/checkout operations.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/index.ts - Barrel re-export that surfaces this configured-submodule API through the primary `@gg-utils/worktree-kit` package entry and `./configured-submodules` export map.
 * @see packages/worktree-kit/src/update-from-main-command.ts - Update-from-main orchestration that invokes submodule fetch, sync, and update helpers from this module during prepared-worktree refresh.
 * @see packages/worktree-kit/src/configured-submodules.unit.test.ts - Jest unit tests that assert `.gitmodules` branch discovery and prepared-worktree `metadata.json` branch override behavior owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import fs from "node:fs";
import path from "node:path";

import {
  worktreeStackCheckoutBranch,
  worktreeStackRemoteExists,
} from "@gg-utils/worktree-core/git-branches";
import {
  worktreeStackInfo,
  worktreeStackRunCommand,
  worktreeStackRunGit,
  worktreeStackWarn,
  worktreeStackError,
} from "@gg-utils/worktree-core/foundation";
import { worktreeStackReadJsonField } from "@gg-utils/worktree-core/worktree-discovery";

/** A configured submodule with its branch, name, and workspace-relative path. */
export type WorktreeStackKit_ConfiguredSubmodule = {
  branchName: string;
  name: string;
  path: string;
};

/** Sync mode for configured submodule operations. */
export type WorktreeStackKit_ConfiguredSubmoduleSyncMode =
  | "attach-only"
  | "ff-only";

export type WorktreeStackKit_ConfiguredSubmodulesConfig = {
  appSubmodulePaths: readonly string[];
};

export type WorktreeStackKit_ListConfiguredSubmodules_Options = {
  config: WorktreeStackKit_ConfiguredSubmodulesConfig;
  rootDir: string;
};

export type WorktreeStackKit_UpdateConfiguredSubmodules_Options = {
  config: WorktreeStackKit_ConfiguredSubmodulesConfig;
  rootDir: string;
};

export type WorktreeStackKit_SyncConfiguredSubmoduleBranches_Options = {
  config: WorktreeStackKit_ConfiguredSubmodulesConfig;
  remoteName?: string;
  rootDir: string;
  syncMode?: WorktreeStackKit_ConfiguredSubmoduleSyncMode;
};

/**
 * Lists all configured submodules from `.gitmodules` with their branch, name, and relative path.
 */
export function WorktreeStackKit_listConfiguredSubmodules(
  options: WorktreeStackKit_ListConfiguredSubmodules_Options,
): WorktreeStackKit_ConfiguredSubmodule[] {
  const { config, rootDir } = options;
  const appSubmodulePaths = new Set(config.appSubmodulePaths);
  const gitmodulesPath = path.join(rootDir, ".gitmodules");
  if (!fs.existsSync(gitmodulesPath)) {
    return [];
  }

  const metadataPath = path.join(
    rootDir,
    ".tmp",
    "worktree-stack",
    "metadata.json",
  );
  const preparedWorktreeSubmoduleBranch = fs.existsSync(metadataPath)
    ? worktreeStackReadJsonField(metadataPath, "submoduleBranch")
    : null;

  const pathLines = worktreeStackRunCommand(
    "git",
    [
      "config",
      "--file",
      gitmodulesPath,
      "--get-regexp",
      "^submodule\\..*\\.path$",
    ],
    {
      allowFailure: true,
    },
  );
  if (pathLines.status !== 0) {
    return [];
  }

  return pathLines.stdout
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [key, submodulePath] = line.split(/\s+/u, 2);
      const submoduleName =
        key?.replace(/^submodule\./u, "").replace(/\.path$/u, "") ?? "";
      const branchResult = worktreeStackRunCommand(
        "git",
        [
          "config",
          "--file",
          gitmodulesPath,
          "--get",
          `submodule.${submoduleName}.branch`,
        ],
        {
          allowFailure: true,
        },
      );
      const gitmodulesBranch = branchResult.stdout.trim();
      const branchName =
        submodulePath !== undefined &&
        appSubmodulePaths.has(submodulePath) &&
        typeof preparedWorktreeSubmoduleBranch === "string" &&
        preparedWorktreeSubmoduleBranch.length > 0
          ? preparedWorktreeSubmoduleBranch
          : gitmodulesBranch || "main";

      return {
        branchName,
        name: submoduleName,
        path: submodulePath ?? "",
      };
    });
}

/** Returns just the paths of all configured submodules under `rootDir`. */
export function WorktreeStackKit_listConfiguredSubmodulePaths(
  options: WorktreeStackKit_ListConfiguredSubmodules_Options,
): string[] {
  return WorktreeStackKit_listConfiguredSubmodules(options).map(
    (submodule) => submodule.path,
  );
}

/** Fetches and updates all configured submodules under `rootDir` to match configured branches. */
export function WorktreeStackKit_updateConfiguredSubmodules(
  options: WorktreeStackKit_UpdateConfiguredSubmodules_Options,
): void {
  const { config, rootDir } = options;
  const configuredSubmodules = WorktreeStackKit_listConfiguredSubmodules({
    config,
    rootDir,
  });
  if (configuredSubmodules.length === 0) {
    worktreeStackWarn(
      `No configured submodules were found in ${rootDir}/.gitmodules`,
    );
    return;
  }

  worktreeStackInfo(
    `Updating ${configuredSubmodules.length} configured submodule checkout(s) from ${rootDir}.`,
  );

  for (const submodule of configuredSubmodules) {
    const submoduleRoot = path.join(rootDir, submodule.path);
    if (
      !fs.existsSync(submoduleRoot) ||
      !fs.statSync(submoduleRoot).isDirectory()
    ) {
      worktreeStackWarn(
        `Skipping configured submodule that is missing on disk before fetch: ${submodule.path}`,
      );
      continue;
    }

    worktreeStackInfo(
      `Fetching origin/${submodule.branchName} for configured submodule ${submodule.path}.`,
    );
    worktreeStackRunGit(
      submoduleRoot,
      [
        "-c",
        "submodule.recurse=false",
        "fetch",
        "origin",
        submodule.branchName,
        "--prune",
      ],
      {
        allowFailure: true,
        stdio: "ignore",
      },
    );
  }

  const submodulePaths = configuredSubmodules.map(
    (submodule) => submodule.path,
  );
  worktreeStackInfo(
    `Synchronizing git metadata for configured submodule path(s): ${submodulePaths.join(", ")}`,
  );
  worktreeStackRunGit(rootDir, [
    "-c",
    "submodule.recurse=false",
    "submodule",
    "sync",
    "--",
    ...submodulePaths,
  ]);
  worktreeStackInfo(
    `Ensuring configured submodule checkout(s) are initialized: ${submodulePaths.join(", ")}`,
  );
  worktreeStackRunGit(rootDir, [
    "-c",
    "submodule.recurse=false",
    "submodule",
    "update",
    "--init",
    "--",
    ...submodulePaths,
  ]);
}

/** Syncs all configured submodules to their expected branches using the specified sync mode. */
export function WorktreeStackKit_syncConfiguredSubmoduleBranches(
  options: WorktreeStackKit_SyncConfiguredSubmoduleBranches_Options,
): void {
  const {
    config,
    remoteName = "origin",
    rootDir,
    syncMode = "attach-only",
  } = options;
  const configuredSubmodules = WorktreeStackKit_listConfiguredSubmodules({
    config,
    rootDir,
  });
  if (configuredSubmodules.length === 0) {
    worktreeStackWarn(
      `No configured submodules were found in ${rootDir}/.gitmodules`,
    );
    return;
  }

  worktreeStackInfo(
    `Syncing ${configuredSubmodules.length} configured submodule branch checkout(s) ` +
      `in ${syncMode} mode.`,
  );

  for (const submodule of configuredSubmodules) {
    const repoDir = path.join(rootDir, submodule.path);
    if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
      worktreeStackWarn(
        `Skipping missing configured submodule checkout: ${submodule.path}`,
      );
      continue;
    }

    if (!worktreeStackRemoteExists(repoDir, remoteName)) {
      worktreeStackWarn(
        `Skipping submodule without remote '${remoteName}': ${repoDir}`,
      );
      continue;
    }

    worktreeStackInfo(
      `Preparing ${submodule.path} on ${remoteName}/${submodule.branchName}.`,
    );
    worktreeStackRunGit(
      repoDir,
      [
        "-c",
        "submodule.recurse=false",
        "fetch",
        remoteName,
        submodule.branchName,
        "--prune",
      ],
      {
        stdio: "ignore",
      },
    );
    worktreeStackInfo(
      `Checking out ${submodule.path} to branch ${submodule.branchName}.`,
    );
    worktreeStackCheckoutBranch(repoDir, submodule.branchName, remoteName);

    if (syncMode === "ff-only") {
      worktreeStackInfo(`Fast-forward validating ${submodule.path}.`);
      const statusResult = worktreeStackRunGit(repoDir, ["status", "--short"], {
        allowFailure: true,
      });
      if (statusResult.stdout.trim().length > 0) {
        worktreeStackError(
          `Cannot fast-forward a dirty configured submodule checkout: ${repoDir}`,
        );
      }

      worktreeStackRunGit(
        repoDir,
        [
          "-c",
          "submodule.recurse=false",
          "merge",
          "--ff-only",
          `${remoteName}/${submodule.branchName}`,
        ],
        {
          stdio: "ignore",
        },
      );
    }

    worktreeStackInfo(
      `Configured submodule branch ready: ${submodule.path} -> ${submodule.branchName}`,
    );
  }
}
