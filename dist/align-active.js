/**
 * @fileoverview Config-driven align-active helpers for prepared worktree synchronization.
 *
 * Flow: explicit required-submodule config + worktree metadata -> refresh-mode selection,
 * merge/update planning, dirty normalization, and final validation without project package names in
 * reusable code.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/align-active.unit.test.ts
 *
 * @see packages/worktree-kit/src/align-active-command.ts - argv-driven sequential align-active runner that calls WorktreeStackKit_createAlignActive to plan, normalize, and validate prepared worktrees.
 * @see packages/worktree-kit/src/merge-command.ts - Injected merge plan builder whose steps are spliced into align-active operation lists after per-repo normalization.
 * @see packages/worktree-kit/src/update-from-main-command.ts - Injected update-from-main plan builder whose refresh steps follow merge plus batch-end repo-root sync in align-active plans.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import path from "node:path";
import { worktreeStackCheckoutBranch, worktreeStackRemoteBranchExists, } from "@gg-utils/worktree-core/git-branches";
import { worktreeStackAttachExpectedBranch, worktreeStackCheckoutCanAttachExpectedBranch, worktreeStackCheckoutMatchesExpectedBranch, worktreeStackCurrentCheckoutDescription, } from "@gg-utils/worktree-core/git-worktree-sync";
import { worktreeStackError, worktreeStackInfo, worktreeStackPrintKv, worktreeStackRequireDirectory, worktreeStackRequireFile, worktreeStackRunGit, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackWithRepoMutationLock } from "@gg-utils/worktree-core/repo-locks";
import { worktreeStackListPreparedWorktrees, worktreeStackReadJsonField, } from "@gg-utils/worktree-core/worktree-discovery";
import { WorktreeStackKit_createMergeCommand, } from "./merge-command.js";
import { WorktreeStackKit_createUpdateFromMainCommand, } from "./update-from-main-command.js";
import { WorktreeStackKit_syncRequiredSubmoduleBranches, } from "./repo-root-sync.js";
export function WorktreeStackKit_createAlignActive(config) {
    const requiredSubmodulePaths = config.requiredSubmodulePaths.map((submodulePath) => submodulePath);
    const mergeCommand = WorktreeStackKit_createMergeCommand(config.mergeCommand);
    const updateFromMainCommand = WorktreeStackKit_createUpdateFromMainCommand(config.updateFromMainCommand);
    const worktreeAlignActiveDefaultLogger = {
        info: worktreeStackInfo,
        printKv: worktreeStackPrintKv,
    };
    function metadataPathForWorktree(worktreePath) {
        return path.join(worktreePath, config.metadataRelativePath);
    }
    /**
     * Reads a required non-empty string field from worktree metadata JSON or aborts the workflow.
     *
     * @remarks
     * I/O: delegates to `worktreeStackReadJsonField`. Missing or empty values terminate via
     * `worktreeStackError`.
     */
    function worktreeAlignActiveRequireMetadataValue(metadataPath, fieldName) {
        const value = worktreeStackReadJsonField(metadataPath, fieldName);
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
        worktreeStackError(`Missing worktree metadata field '${fieldName}': ${metadataPath}`);
    }
    /** Reads and validates the worktree metadata file, returning the parsed metadata or throwing. */
    function worktreeStackAlignActiveReadMetadata(worktreePath) {
        const metadataPath = metadataPathForWorktree(worktreePath);
        worktreeStackRequireFile(metadataPath, "worktree metadata");
        return {
            metadataPath,
            rootBranch: worktreeAlignActiveRequireMetadataValue(metadataPath, "rootBranch"),
            stackName: worktreeAlignActiveRequireMetadataValue(metadataPath, "stackName"),
            submoduleBranch: worktreeAlignActiveRequireMetadataValue(metadataPath, "submoduleBranch"),
            worktreePath,
        };
    }
    /** Reads a single metadata field value from the worktree metadata file. */
    function worktreeStackAlignActiveMetadataField(worktreePath, fieldName) {
        return worktreeAlignActiveRequireMetadataValue(metadataPathForWorktree(worktreePath), fieldName);
    }
    /** Returns true if the given repo directory has uncommitted changes. */
    function worktreeStackAlignActiveRepoDirty(repoDir) {
        return (worktreeStackRunGit(repoDir, ["status", "--short"], {
            allowFailure: true,
        }).stdout.trim().length > 0);
    }
    /** Enforces that push-mode execution runs from the correct root checkout on targetBranch with a clean working tree. */
    function worktreeStackAlignActiveRequireTargetCheckoutReady(rootDir, executionMode, targetBranch) {
        if (executionMode !== "push" || targetBranch !== "main") {
            return;
        }
        const currentBranch = worktreeStackRunGit(rootDir, ["branch", "--show-current"], {
            allowFailure: true,
        }).stdout.trim();
        if (currentBranch !== targetBranch) {
            worktreeStackError(`Run align-active from the repo-root '${targetBranch}' checkout so merge syncs can complete safely. Current branch: ${currentBranch}`);
        }
        if (worktreeStackAlignActiveRepoDirty(rootDir)) {
            worktreeStackError(`Run align-active from a clean repo-root '${targetBranch}' checkout so the final batch-end root sync can complete safely.`);
        }
    }
    /** Resolves explicit worktree paths or discovers all prepared worktrees under rootDir. */
    function worktreeStackAlignActiveResolveRequestedWorktrees(rootDir, requestedWorktreePaths) {
        if (requestedWorktreePaths.length > 0) {
            const normalizedPaths = new Set();
            for (const requestedPath of requestedWorktreePaths) {
                if (!requestedPath.length) {
                    worktreeStackError("Empty --worktree value is not allowed.");
                }
                const normalizedPath = path.resolve(requestedPath);
                worktreeStackRequireDirectory(normalizedPath, "prepared worktree");
                worktreeStackRequireFile(metadataPathForWorktree(normalizedPath), "worktree metadata");
                normalizedPaths.add(normalizedPath);
            }
            return [...normalizedPaths];
        }
        const discoveredPaths = worktreeStackListPreparedWorktrees(rootDir).sort((left, right) => left.localeCompare(right));
        if (discoveredPaths.length === 0) {
            worktreeStackError("No prepared worktrees were discovered from git worktree metadata.");
        }
        return discoveredPaths;
    }
    /** Determines the resolved refresh mode from dirty state, without accessing the filesystem. */
    function worktreeStackAlignActiveDetermineRefreshModeFromDirtyState(options) {
        if (options.requestedRefreshMode !== "auto") {
            return options.requestedRefreshMode;
        }
        if (options.rootDirty) {
            return "pushed-only";
        }
        for (const submodule of requiredSubmodulePaths) {
            if (options.submoduleDirtyStates[submodule]) {
                return "pushed-only";
            }
        }
        return "live-worktree";
    }
    /** Determines the resolved refresh mode for a worktree by checking dirty state of the root and all submodules. */
    function worktreeStackAlignActiveDetermineRefreshMode(worktreePath, requestedRefreshMode) {
        const submoduleDirtyStates = Object.fromEntries(requiredSubmodulePaths.map((submodule) => [
            submodule,
            worktreeStackAlignActiveRepoDirty(path.join(worktreePath, submodule)),
        ]));
        return worktreeStackAlignActiveDetermineRefreshModeFromDirtyState({
            requestedRefreshMode,
            rootDirty: worktreeStackAlignActiveRepoDirty(worktreePath),
            submoduleDirtyStates,
        });
    }
    /** Decides how to handle a dirty repo with an existing remote based on the provided state. */
    function worktreeStackAlignActiveDecideDirtyRemoteHandling(state) {
        if (!state.repoIsDirty) {
            return { action: "continue" };
        }
        if (state.dirtyPolicy === "fail") {
            return {
                action: "error",
                message: "dirty-policy-fail",
            };
        }
        if (state.remoteBranchExists &&
            state.initialAheadCount > 0 &&
            state.initialBehindCount > 0) {
            return {
                action: "error",
                message: "dirty-preexisting-divergence",
            };
        }
        if (state.remoteBranchExists &&
            state.initialAheadCount === 0 &&
            state.initialBehindCount > 0) {
            return {
                action: "checkpoint-then-merge-remote",
            };
        }
        return {
            action: "checkpoint-and-continue",
        };
    }
    /** Builds the list of repos (root + submodules) that must pass alignment validation for a worktree. */
    function worktreeStackAlignActiveBuildValidationTargets(metadata) {
        return [
            ...requiredSubmodulePaths.map((submodule) => ({
                branchName: metadata.submoduleBranch,
                label: `${metadata.stackName}-${submodule}`,
                repoDir: path.join(metadata.worktreePath, submodule),
            })),
            {
                branchName: metadata.rootBranch,
                label: `${metadata.stackName}-root`,
                repoDir: metadata.worktreePath,
            },
        ];
    }
    /** Builds a human-readable plan summary string for an align-active operation. */
    function buildAlignActivePlanSummary(options) {
        return `
  Align-active plan for stack '${options.metadata.stackName}':
  - worktree path: ${options.metadata.worktreePath}
  - target branch: ${options.targetBranch}
  - dirty policy: ${options.dirtyPolicy}
  - refresh mode: ${options.refreshMode}
  - root branch: ${options.metadata.rootBranch}
  - submodule branch: ${options.metadata.submoduleBranch}`.trim();
    }
    /** Builds the step-by-step operation plan for aligning a worktree domain to targetBranch. */
    function buildAlignActiveOperationPlan(options) {
        const mergeOptions = {
            mergeTmpRoot: path.join(options.rootDir, config.mergeCommand.mergeTmpRootRelativePath, "<merge-run-id>"),
            rootBranch: options.metadata.rootBranch,
            submoduleBranch: options.metadata.submoduleBranch,
            targetBranch: options.targetBranch,
            worktreePath: options.metadata.worktreePath,
        };
        const refreshOptions = {
            refreshMode: options.refreshMode,
            refreshTmpRoot: path.join(options.rootDir, config.updateFromMainCommand.refreshTmpRootRelativePath, "<refresh-run-id>"),
            rootBranch: options.metadata.rootBranch,
            submoduleBranch: options.metadata.submoduleBranch,
            targetBranch: options.targetBranch,
            worktreePath: options.metadata.worktreePath,
        };
        return [
            ...requiredSubmodulePaths.map((submodule) => `normalize ${submodule} ${path.join(options.metadata.worktreePath, submodule)}:${options.metadata.submoduleBranch}`),
            `normalize root ${options.metadata.worktreePath}:${options.metadata.rootBranch}`,
            ...mergeCommand.buildMergeOperationPlan(mergeOptions),
            `sync repo-root checkout ${options.rootDir}:${options.targetBranch} once after the merge batch`,
            ...updateFromMainCommand.buildUpdateFromMainOperationPlan(refreshOptions),
            ...worktreeStackAlignActiveBuildValidationTargets(options.metadata).map((target) => `validate ${target.label} ${target.repoDir}: origin/${options.targetBranch} <= origin/${target.branchName} and repo clean`),
        ];
    }
    /**
     * Measures how many commits local HEAD is ahead of and behind `origin/<branchName>`.
     *
     * @remarks
     * I/O: runs `git rev-list --left-right --count` with `allowFailure`; unparsable numeric tokens
     * become zero via `Number.parseInt` fallbacks.
     */
    function worktreeAlignActiveReadAheadBehindCounts(repoDir, branchName) {
        const [aheadRaw = "0", behindRaw = "0"] = worktreeStackRunGit(repoDir, ["rev-list", "--left-right", "--count", `HEAD...origin/${branchName}`], { allowFailure: true })
            .stdout.trim()
            .split(/\s+/u);
        return {
            aheadCount: Number.parseInt(aheadRaw, 10) || 0,
            behindCount: Number.parseInt(behindRaw, 10) || 0,
        };
    }
    /**
     * Reconciles an unexpected checkout with the prepared branch before remote normalization continues.
     *
     * @remarks
     * Push-mode can checkout a clean wrong branch directly; detached/non-push paths must be attachable
     * to the expected branch or the workflow aborts.
     */
    function worktreeAlignActiveEnsureExpectedCheckout(options) {
        if (worktreeStackCheckoutMatchesExpectedBranch(options.repoDir, options.branchName)) {
            return;
        }
        if (options.executionMode === "push" &&
            options.currentBranch.length > 0 &&
            options.currentBranch !== options.branchName) {
            if (options.repoIsDirtyBeforeNormalization) {
                worktreeStackError(`Prepared branch mismatch for dirty ${options.label}. expected=${options.branchName} actual=${options.actualCheckout}`);
            }
            options.logger.printKv(`${options.label}-normalize`, `checkout ${options.branchName} from ${options.actualCheckout}`);
            worktreeStackCheckoutBranch(options.repoDir, options.branchName);
            return;
        }
        if (!worktreeStackCheckoutCanAttachExpectedBranch(options.repoDir, options.branchName)) {
            worktreeStackError(`Prepared branch mismatch for ${options.label}. expected=${options.branchName} actual=${options.actualCheckout}`);
        }
        options.logger.printKv(`${options.label}-normalize`, `reattach detached HEAD to ${options.branchName}`);
    }
    /**
     * Aborts when `origin` is missing or unreachable for the given repository directory.
     *
     * @remarks
     * I/O: non-fatal `git remote get-url origin` probe; failure uses the same message shape as the
     * inlined predecessor for operator grep parity.
     */
    function worktreeAlignActiveRequireOriginRemote(options) {
        if (worktreeStackRunGit(options.repoDir, ["remote", "get-url", "origin"], {
            allowFailure: true,
            stdio: "ignore",
        }).status !== 0) {
            worktreeStackError(`Missing origin remote for ${options.label}: ${options.repoDir}`);
        }
    }
    /**
     * Runs dirty-repo checkpointing, optional merge-from-remote, and push when the dirty-remote decision
     * requires it. Preserves the prior ordering: decision handling, optional ahead/behind logging,
     * checkpoint message, git add/commit, then merge/push gates.
     *
     * @returns `true` when the caller must stop (early-return parity with the inlined predecessor).
     */
    function worktreeAlignActiveHandleDirtyRepoDuringNormalize(options) {
        options.logger.printKv(`${options.label}-dirty`, "yes");
        const dirtyRemoteDecision = worktreeStackAlignActiveDecideDirtyRemoteHandling({
            dirtyPolicy: options.dirtyPolicy,
            initialAheadCount: options.initialCounts.aheadCount,
            initialBehindCount: options.initialCounts.behindCount,
            remoteBranchExists: options.remoteBranchExists,
            repoIsDirty: true,
        });
        if (dirtyRemoteDecision.action === "error") {
            if (dirtyRemoteDecision.message === "dirty-policy-fail") {
                worktreeStackError(`Dirty worktree repo blocked by --dirty-policy fail: ${options.label} :: ${options.repoDir}`);
            }
            options.logger.printKv(`${options.label}-ahead`, String(options.initialCounts.aheadCount));
            options.logger.printKv(`${options.label}-behind`, String(options.initialCounts.behindCount));
            worktreeStackError(`Branch already diverged from origin/${options.branchName} before dirty checkpointing: ${options.label} :: ${options.repoDir}`);
        }
        if (dirtyRemoteDecision.action === "checkpoint-then-merge-remote") {
            options.logger.printKv(`${options.label}-ahead`, String(options.initialCounts.aheadCount));
            options.logger.printKv(`${options.label}-behind`, String(options.initialCounts.behindCount));
            options.logger.printKv(`${options.label}-normalize`, `checkpoint dirty changes, merge origin/${options.branchName}, push HEAD to origin/${options.branchName}`);
        }
        options.logger.printKv(`${options.label}-checkpoint`, options.checkpointMessage);
        if (options.executionMode === "push") {
            worktreeStackRunGit(options.repoDir, ["-c", "submodule.recurse=false", "add", "-A"], {
                stdio: "ignore",
            });
            worktreeStackRunGit(options.repoDir, [
                "-c",
                "submodule.recurse=false",
                "commit",
                "-m",
                options.checkpointMessage,
            ], { stdio: "ignore" });
            if (dirtyRemoteDecision.action === "checkpoint-then-merge-remote") {
                const mergeResult = worktreeStackRunGit(options.repoDir, [
                    "-c",
                    "submodule.recurse=false",
                    "merge",
                    "--no-edit",
                    `origin/${options.branchName}`,
                ], { allowFailure: true, stdio: "ignore" });
                if (mergeResult.status !== 0) {
                    worktreeStackError(`Dirty-behind normalization conflicted while merging origin/${options.branchName}: ${options.label} :: ${options.repoDir}`);
                }
                worktreeStackRunGit(options.repoDir, [
                    "-c",
                    "submodule.recurse=false",
                    "push",
                    "origin",
                    `HEAD:${options.branchName}`,
                ], { stdio: "ignore" });
                return true;
            }
        }
        else if (dirtyRemoteDecision.action === "checkpoint-then-merge-remote") {
            return true;
        }
        return false;
    }
    /**
     * After dirty handling (or a clean tree), reconciles `origin/<branch>`: fetch counts, fast-forward,
     * push ahead-only, or create the remote branch. Matches the prior fetch/merge/push sequencing.
     */
    function worktreeAlignActiveApplyRemoteBranchAlignmentAfterFetch(options) {
        if (options.remoteBranchExists) {
            worktreeStackRunGit(options.repoDir, [
                "-c",
                "submodule.recurse=false",
                "fetch",
                "--quiet",
                "origin",
                options.branchName,
                "--prune",
            ], { stdio: "ignore" });
            const counts = worktreeAlignActiveReadAheadBehindCounts(options.repoDir, options.branchName);
            options.logger.printKv(`${options.label}-ahead`, String(counts.aheadCount));
            options.logger.printKv(`${options.label}-behind`, String(counts.behindCount));
            if (counts.aheadCount > 0 && counts.behindCount > 0) {
                worktreeStackError(`Branch diverged from origin/${options.branchName}: ${options.label} :: ${options.repoDir}`);
            }
            if (counts.behindCount > 0 && counts.aheadCount === 0) {
                options.logger.printKv(`${options.label}-normalize`, `fast-forward to origin/${options.branchName}`);
                if (options.executionMode === "push") {
                    worktreeStackRunGit(options.repoDir, [
                        "-c",
                        "submodule.recurse=false",
                        "merge",
                        "--ff-only",
                        `origin/${options.branchName}`,
                    ], { stdio: "ignore" });
                }
                return;
            }
            if (counts.aheadCount > 0 && counts.behindCount === 0) {
                options.logger.printKv(`${options.label}-normalize`, `push HEAD to origin/${options.branchName}`);
                if (options.executionMode === "push") {
                    worktreeStackRunGit(options.repoDir, [
                        "-c",
                        "submodule.recurse=false",
                        "push",
                        "origin",
                        `HEAD:${options.branchName}`,
                    ], { stdio: "ignore" });
                }
                return;
            }
            options.logger.printKv(`${options.label}-normalize`, `already matched origin/${options.branchName}`);
            return;
        }
        options.logger.printKv(`${options.label}-normalize`, `create origin/${options.branchName}`);
        if (options.executionMode === "push") {
            worktreeStackRunGit(options.repoDir, [
                "-c",
                "submodule.recurse=false",
                "push",
                "--set-upstream",
                "origin",
                options.branchName,
            ], { stdio: "ignore" });
        }
    }
    /**
     * Aligns one repository checkout with its prepared branch and remote without acquiring mutation locks.
     *
     * @remarks
     * Push-mode callers must run this through `worktreeStackAlignActiveNormalizeRepoBranch`, which wraps
     * writes in `worktreeStackWithRepoMutationLock`. Performs fetch, dirty checkpoints, merges,
     * fast-forwards, and pushes according to dirty policy and ahead/behind counts.
     */
    async function worktreeStackAlignActiveNormalizeRepoBranchUnlocked(options) {
        worktreeStackRequireDirectory(options.repoDir, `${options.label} repository`);
        const actualCheckout = worktreeStackCurrentCheckoutDescription(options.repoDir);
        const currentBranch = worktreeStackRunGit(options.repoDir, ["branch", "--show-current"], {
            allowFailure: true,
        }).stdout.trim();
        options.logger.printKv(`${options.label}-checkout`, actualCheckout);
        const repoIsDirtyBeforeNormalization = worktreeStackAlignActiveRepoDirty(options.repoDir);
        worktreeAlignActiveEnsureExpectedCheckout({
            actualCheckout,
            branchName: options.branchName,
            currentBranch,
            executionMode: options.executionMode,
            label: options.label,
            logger: options.logger,
            repoDir: options.repoDir,
            repoIsDirtyBeforeNormalization,
        });
        if (options.executionMode === "push") {
            worktreeStackAttachExpectedBranch(options.repoDir, options.branchName);
        }
        worktreeAlignActiveRequireOriginRemote({
            label: options.label,
            repoDir: options.repoDir,
        });
        worktreeStackRunGit(options.repoDir, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            "--quiet",
            "origin",
            options.branchName,
            "--prune",
        ], { allowFailure: true, stdio: "ignore" });
        const remoteBranchExists = worktreeStackRemoteBranchExists(options.repoDir, "origin", options.branchName);
        const initialCounts = remoteBranchExists
            ? worktreeAlignActiveReadAheadBehindCounts(options.repoDir, options.branchName)
            : { aheadCount: 0, behindCount: 0 };
        const repoIsDirty = worktreeStackAlignActiveRepoDirty(options.repoDir);
        if (repoIsDirty) {
            const shouldReturn = worktreeAlignActiveHandleDirtyRepoDuringNormalize({
                branchName: options.branchName,
                checkpointMessage: options.checkpointMessage,
                dirtyPolicy: options.dirtyPolicy,
                executionMode: options.executionMode,
                label: options.label,
                logger: options.logger,
                repoDir: options.repoDir,
                remoteBranchExists,
                initialCounts,
            });
            if (shouldReturn) {
                return;
            }
        }
        else {
            options.logger.printKv(`${options.label}-dirty`, "no");
        }
        worktreeAlignActiveApplyRemoteBranchAlignmentAfterFetch({
            branchName: options.branchName,
            executionMode: options.executionMode,
            label: options.label,
            logger: options.logger,
            repoDir: options.repoDir,
            remoteBranchExists,
        });
    }
    /** Normalizes a single repo's branch alignment, with optional locking for push-mode execution. */
    async function worktreeStackAlignActiveNormalizeRepoBranch(options) {
        const logger = options.logger ?? worktreeAlignActiveDefaultLogger;
        if (options.executionMode !== "push") {
            await worktreeStackAlignActiveNormalizeRepoBranchUnlocked({
                ...options,
                logger,
            });
            return;
        }
        await worktreeStackWithRepoMutationLock(options.rootDir, options.repoDir, `worktree-stack-normalize:${options.label}:${options.branchName}`, "wait", async () => {
            await worktreeStackAlignActiveNormalizeRepoBranchUnlocked({
                ...options,
                logger,
            });
        });
    }
    /** Normalizes all repos (root + submodules) in a worktree domain to their expected branches. */
    async function worktreeStackAlignActiveNormalizeWorktreeDomain(options) {
        const logger = options.logger ?? worktreeAlignActiveDefaultLogger;
        const metadata = worktreeStackAlignActiveReadMetadata(options.worktreePath);
        logger.info(`Normalizing stack '${metadata.stackName}' at ${metadata.worktreePath}`);
        for (const submodule of requiredSubmodulePaths) {
            await worktreeStackAlignActiveNormalizeRepoBranch({
                branchName: metadata.submoduleBranch,
                checkpointMessage: `chore(worktree-stack): checkpoint ${metadata.stackName} ${submodule} before align-active`,
                dirtyPolicy: options.dirtyPolicy,
                executionMode: options.executionMode,
                label: `${metadata.stackName}-${submodule}`,
                logger,
                repoDir: path.join(metadata.worktreePath, submodule),
                rootDir: options.rootDir,
            });
        }
        await worktreeStackAlignActiveNormalizeRepoBranch({
            branchName: metadata.rootBranch,
            checkpointMessage: `chore(worktree-stack): checkpoint ${metadata.stackName} root before align-active`,
            dirtyPolicy: options.dirtyPolicy,
            executionMode: options.executionMode,
            label: `${metadata.stackName}-root`,
            logger,
            repoDir: metadata.worktreePath,
            rootDir: options.rootDir,
        });
        if (options.executionMode === "push") {
            logger.info(`Restoring required submodule checkouts to ${metadata.submoduleBranch} after root normalization.`);
            WorktreeStackKit_syncRequiredSubmoduleBranches({
                branchName: metadata.submoduleBranch,
                config: config.repoRootSync,
                rootDir: metadata.worktreePath,
                syncMode: "attach-only",
            });
        }
        return metadata;
    }
    /**
     * Verifies `origin/<targetBranch>` is an ancestor of `origin/<sourceBranch>` for one repo.
     *
     * @remarks
     * I/O: fetches both refs from `origin`, then checks ancestry with `merge-base --is-ancestor`. Also
     * fails when the working tree is still dirty after the caller's refresh path.
     */
    function worktreeStackAlignActiveValidateRepoAlignment(targetBranch, repoDir, sourceBranch, label) {
        worktreeStackRunGit(repoDir, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            "--quiet",
            "origin",
            targetBranch,
            sourceBranch,
            "--prune",
        ], { stdio: "ignore" });
        if (worktreeStackRunGit(repoDir, [
            "merge-base",
            "--is-ancestor",
            `origin/${targetBranch}`,
            `origin/${sourceBranch}`,
        ], { allowFailure: true, stdio: "ignore" }).status !== 0) {
            worktreeStackError(`Alignment validation failed: ${label} :: origin/${targetBranch} is not an ancestor of origin/${sourceBranch}`);
        }
        if (worktreeStackAlignActiveRepoDirty(repoDir)) {
            worktreeStackError(`Alignment validation failed: ${label} repo is still dirty after refresh: ${repoDir}`);
        }
    }
    /** Validates that a worktree domain is correctly aligned to targetBranch by checking ancestry and checkout state. */
    function worktreeStackAlignActiveValidateWorktreeAlignment(targetBranch, worktreePath) {
        const metadata = worktreeStackAlignActiveReadMetadata(worktreePath);
        for (const target of worktreeStackAlignActiveBuildValidationTargets(metadata)) {
            worktreeStackAlignActiveValidateRepoAlignment(targetBranch, target.repoDir, target.branchName, target.label);
        }
        for (const submodule of requiredSubmodulePaths) {
            if (!worktreeStackCheckoutMatchesExpectedBranch(path.join(worktreePath, submodule), metadata.submoduleBranch)) {
                worktreeStackError(`Required submodule checkout drifted after alignment: ${metadata.stackName} :: ${submodule}`);
            }
        }
        if (!worktreeStackCheckoutMatchesExpectedBranch(worktreePath, metadata.rootBranch)) {
            worktreeStackError(`Root checkout drifted after alignment: ${metadata.stackName}`);
        }
    }
    return {
        buildAlignActiveOperationPlan,
        buildAlignActivePlanSummary,
        worktreeStackAlignActiveBuildValidationTargets,
        worktreeStackAlignActiveDecideDirtyRemoteHandling,
        worktreeStackAlignActiveDetermineRefreshMode,
        worktreeStackAlignActiveDetermineRefreshModeFromDirtyState,
        worktreeStackAlignActiveMetadataField,
        worktreeStackAlignActiveNormalizeRepoBranch,
        worktreeStackAlignActiveNormalizeWorktreeDomain,
        worktreeStackAlignActiveReadMetadata,
        worktreeStackAlignActiveRepoDirty,
        worktreeStackAlignActiveRequireTargetCheckoutReady,
        worktreeStackAlignActiveResolveRequestedWorktrees,
        worktreeStackAlignActiveValidateWorktreeAlignment,
    };
}
//# sourceMappingURL=align-active.js.map