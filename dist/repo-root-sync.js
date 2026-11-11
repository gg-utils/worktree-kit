/**
 * @fileoverview Config-driven repo-root branch sync helpers for worktree workflows.
 *
 * Flow: explicit submodule path config + git probes + repo locks -> clean repo-root main sync,
 * configured submodule update, and required submodule branch readiness without project literals in
 * reusable package code.
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/repo-root-sync.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-submodules.ts - Configured submodule update helpers this module invokes after fast-forwarding the repo-root checkout so optional submodule checkouts match project-owned path config.
 * @see packages/worktree-kit/src/merge-command.ts - Merge orchestration that calls `WorktreeStackKit_syncRepoRootTargetCheckout` when post-merge alignment must bring the repo-root checkout and required submodules in sync with `main`.
 * @see packages/worktree-kit/src/repo-root-sync.unit.test.ts - Jest regression coverage for repo-root fetch, ff-only merge, dirty-worktree guards, configured submodule refresh, and lock-wrapped checkout sequencing owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackCheckoutBranch, worktreeStackRemoteExists, } from "@gg-utils/worktree-core/git-branches";
import { worktreeStackError, worktreeStackInfo, worktreeStackRunGit, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackAcquireRepoMutationLock, worktreeStackAcquireRootMainSyncLock, worktreeStackReleaseRepoMutationLock, worktreeStackReleaseRootMainSyncLock, } from "@gg-utils/worktree-core/repo-locks";
import { WorktreeStackKit_updateConfiguredSubmodules, } from "./configured-submodules.js";
/** Fetches and checks out `branchName` across required configured submodule paths. */
export function WorktreeStackKit_syncRequiredSubmoduleBranches(options) {
    const { branchName, config, remoteName = "origin", rootDir, syncMode = "attach-only", } = options;
    for (const submodule of config.requiredSubmodulePaths) {
        const repoDir = path.join(rootDir, submodule);
        if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
            worktreeStackWarn(`Skipping missing required submodule checkout: ${submodule}`);
            continue;
        }
        if (!worktreeStackRemoteExists(repoDir, remoteName)) {
            worktreeStackWarn(`Skipping required submodule without remote '${remoteName}': ${repoDir}`);
            continue;
        }
        worktreeStackRunGit(repoDir, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            remoteName,
            branchName,
            "--prune",
        ], { stdio: "ignore" });
        worktreeStackCheckoutBranch(repoDir, branchName, remoteName);
        if (syncMode === "ff-only") {
            const statusResult = worktreeStackRunGit(repoDir, ["status", "--short"], {
                allowFailure: true,
            });
            if (statusResult.stdout.trim().length > 0) {
                worktreeStackError(`Cannot fast-forward a dirty required submodule checkout: ${repoDir}`);
            }
            worktreeStackRunGit(repoDir, [
                "-c",
                "submodule.recurse=false",
                "merge",
                "--ff-only",
                `${remoteName}/${branchName}`,
            ], { stdio: "ignore" });
        }
        worktreeStackInfo(`Required submodule branch ready: ${submodule} -> ${branchName}`);
    }
}
/** Fast-forwards the repo-root checkout on `main`, including configured submodule checkouts. */
export function WorktreeStackKit_syncRepoRootTargetCheckout(options) {
    const { config, remoteName = "origin", rootDir, targetBranch } = options;
    if (targetBranch !== "main") {
        worktreeStackInfo(`Skipping repo-root checkout sync because target branch is '${targetBranch}', not 'main'.`);
        return;
    }
    const rootCheckoutBranch = worktreeStackRunGit(rootDir, ["branch", "--show-current"], {
        allowFailure: true,
    }).stdout.trim();
    if (rootCheckoutBranch !== targetBranch) {
        worktreeStackWarn(`Skipping repo-root checkout sync because the repo-root checkout is on '${rootCheckoutBranch}', not '${targetBranch}'.`);
        return;
    }
    const rootStatus = worktreeStackRunGit(rootDir, ["status", "--short"], {
        allowFailure: true,
    }).stdout.trim();
    if (rootStatus.length > 0) {
        worktreeStackError(`Repo-root checkout must be clean before syncing ${targetBranch}: ${rootDir}`);
    }
    worktreeStackRunGit(rootDir, [
        "-c",
        "submodule.recurse=false",
        "fetch",
        "--quiet",
        remoteName,
        targetBranch,
        "--prune",
    ], { stdio: "ignore" });
    const preRemoteSha = worktreeStackRunGit(rootDir, ["rev-parse", `${remoteName}/${targetBranch}`], { allowFailure: true }).stdout.trim();
    const counts = worktreeStackRunGit(rootDir, [
        "rev-list",
        "--left-right",
        "--count",
        `HEAD...${remoteName}/${targetBranch}`,
    ], { allowFailure: true }).stdout.trim();
    const [aheadCount = "0", behindCount = "0"] = counts.split(/\s+/u);
    if (aheadCount !== "0" && behindCount !== "0") {
        worktreeStackError(`Repo-root checkout diverged from ${remoteName}/${targetBranch}: ${rootDir}`);
    }
    if (behindCount !== "0") {
        worktreeStackRunGit(rootDir, [
            "-c",
            "submodule.recurse=false",
            "merge",
            "--ff-only",
            `${remoteName}/${targetBranch}`,
        ], { stdio: "ignore" });
    }
    const postHeadSha = worktreeStackRunGit(rootDir, [
        "rev-parse",
        "HEAD",
    ]).stdout.trim();
    if (aheadCount !== "0" && behindCount === "0") {
        if (preRemoteSha !== postHeadSha) {
            worktreeStackRunGit(rootDir, [
                "-c",
                "submodule.recurse=false",
                "push",
                remoteName,
                targetBranch,
                "--force-with-lease",
            ], { stdio: "inherit" });
            worktreeStackInfo(`Pushed ${rootDir} ${targetBranch} -> ${remoteName}/${targetBranch}`);
        }
        else {
            worktreeStackInfo(`Repo-root checkout already in sync with ${remoteName}/${targetBranch}; no push needed.`);
        }
    }
    WorktreeStackKit_updateConfiguredSubmodules({
        config: config.configuredSubmodules,
        rootDir,
    });
    WorktreeStackKit_syncRequiredSubmoduleBranches({
        branchName: targetBranch,
        config,
        remoteName,
        rootDir,
        syncMode: "ff-only",
    });
    const finalStatus = worktreeStackRunGit(rootDir, ["status", "--short"], {
        allowFailure: true,
    }).stdout.trim();
    if (finalStatus.length > 0) {
        worktreeStackError(`Repo-root checkout is dirty after syncing ${targetBranch}; restore optional submodules to the recorded gitlink before proceeding.`);
    }
}
/** Wraps repo-root target checkout sync with root-main and per-repo mutation locks. */
export async function WorktreeStackKit_syncRepoRootTargetCheckoutWithLocks(options) {
    const { config, ownerLabel, remoteName = "origin", rootDir, targetBranch } = options;
    if (targetBranch !== "main") {
        WorktreeStackKit_syncRepoRootTargetCheckout({
            config,
            remoteName,
            rootDir,
            targetBranch,
        });
        return;
    }
    const acquiredRepoDirs = [];
    await worktreeStackAcquireRootMainSyncLock(rootDir, targetBranch, ownerLabel, "wait");
    await worktreeStackAcquireRepoMutationLock(rootDir, rootDir, `${ownerLabel}:root`, "wait");
    acquiredRepoDirs.push(rootDir);
    try {
        for (const submodule of config.requiredSubmodulePaths) {
            const repoDir = path.join(rootDir, submodule);
            if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
                continue;
            }
            if (!worktreeStackRemoteExists(repoDir, remoteName)) {
                continue;
            }
            await worktreeStackAcquireRepoMutationLock(rootDir, repoDir, `${ownerLabel}:${submodule}`, "wait");
            acquiredRepoDirs.push(repoDir);
        }
        WorktreeStackKit_syncRepoRootTargetCheckout({
            config,
            remoteName,
            rootDir,
            targetBranch,
        });
    }
    finally {
        for (const repoDir of acquiredRepoDirs.reverse()) {
            worktreeStackReleaseRepoMutationLock(rootDir, repoDir);
        }
        worktreeStackReleaseRootMainSyncLock(rootDir, targetBranch);
    }
}
