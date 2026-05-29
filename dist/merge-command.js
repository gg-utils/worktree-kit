/**
 * @fileoverview Config-driven prepared-worktree merge command runner.
 *
 * Flow: argv + project branch/submodule config -> prepared-worktree validation -> submodule-first
 * merges -> root gitlink resolution -> optional repo-root sync. Project package paths, command
 * surfaces, temp-root layout, and repo-root sync policy stay in root config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/repo-root-sync.ts - Repo-root checkout sync helpers this merge runner calls after submodule-first merges when config requires aligning the repo-root checkout with resolved gitlinks.
 * @see scripts/worktree-stack/commands/merge.ts - Root `worktrees:merge` CLI adapter that constructs WorktreeStackKit_createMergeCommand from worktrees.config.ts and delegates argv, audit, plan, and push execution to this module.
 * @see worktrees.config.ts - Project-owned merge tmp paths, required submodules, command surfaces, and repo-root sync knobs the root merge script passes into WorktreeStackKit_MergeCommandConfig consumed here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackError, worktreeStackInfo, worktreeStackPrintKv, worktreeStackRequireCommand, worktreeStackRequireDirectory, worktreeStackRequireFile, worktreeStackRunGit, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackAttachExpectedBranch, worktreeStackCheckoutMatchesExpectedBranch, worktreeStackCleanupStaleTempMergeWorktrees, worktreeStackCurrentCheckoutDescription, worktreeStackGitWorktreeRegistered, worktreeStackResolveGitmodulesSubmoduleBranch, } from "@gg-utils/worktree-core/git-worktree-sync";
import { worktreeStackAcquireRepoWriterLock, worktreeStackReleaseAllNamedLocks, worktreeStackReleaseRepoWriterLock, worktreeStackWithRepoMutationLock, } from "@gg-utils/worktree-core/repo-locks";
import { worktreeStackReadJsonField } from "@gg-utils/worktree-core/worktree-discovery";
import { WorktreeStackKit_syncRepoRootTargetCheckoutWithLocks, } from "./repo-root-sync.js";
/** Renders merge CLI usage from project-supplied command lines. */
export function WorktreeStackKit_renderMergeUsage(config) {
    return [
        "Usage:",
        ...config.usage.commandLines.map((line) => `  ${line}`),
        "",
        "Required:",
        "  --worktree <path>          Prepared worktree path to merge from",
        "",
        "Execution modes (choose exactly one):",
        "  --plan                     Print the planned merges only",
        "  --push                     Execute the merges and push to origin/<target-branch>",
        "  --audit                    Run diagnostic checks and report findings (read-only)",
        "",
        "Options:",
        "  --target-branch <branch>   Counterpart branch to merge into (default: main)",
        "  --skip-root-sync           Skip syncing the repo-root main checkout after push",
        "  --trust-worktree-submodule-state",
        "                             Skip .gitmodules branch validation for submodules",
        "  --help, -h                 Show this help",
    ].join("\n");
}
function WorktreeStackKit_mergePlanLabel(submodule) {
    return submodule.planLabel ?? submodule.path;
}
export function WorktreeStackKit_createMergeCommand(config) {
    const requiredSubmodulePaths = config.requiredSubmodules.map((submodule) => submodule.path);
    /**
     * Signals invalid or incomplete merge CLI arguments before orchestration begins.
     *
     * @remarks
     * Caught by `runMergeCli` to print usage without treating the failure as a git/runtime error.
     */
    class WorktreeStackKit_MergeCliUsageError extends Error {
    }
    /** Prints merge CLI usage to stdout when `--help` is requested or after usage errors. */
    function printUsage() {
        console.log(WorktreeStackKit_renderMergeUsage(config));
    }
    /**
     * Normalizes thrown values into a single-line stderr-friendly `[worktree]` message.
     *
     * @remarks
     * Preserves messages that already carry the `[worktree]` prefix from lower-level helpers.
     */
    function formatCliErrorMessage(error) {
        const message = error instanceof Error ? error.message : String(error);
        return message.startsWith("[worktree] ")
            ? message
            : `[worktree] ERROR: ${message}`;
    }
    /**
     * Parses `worktrees:merge` argv into structured options, enforcing mutually exclusive modes.
     *
     * @throws {WorktreeStackKit_MergeCliUsageError} When required flags are missing or combinations are invalid.
     */
    function parseMergeCliArgs(argv) {
        let executionMode = null;
        let skipBatchWriterLock = false;
        let skipRootSync = false;
        let targetBranch = "main";
        let trustWorktreeSubmoduleState = false;
        let worktreePath = "";
        for (let index = 0; index < argv.length;) {
            const argument = argv[index];
            switch (argument) {
                case "--worktree": {
                    const value = argv[index + 1];
                    if (!value) {
                        throw new WorktreeStackKit_MergeCliUsageError("Missing value for --worktree");
                    }
                    worktreePath = value;
                    index += 2;
                    break;
                }
                case "--target-branch": {
                    const value = argv[index + 1];
                    if (!value) {
                        throw new WorktreeStackKit_MergeCliUsageError("Missing value for --target-branch");
                    }
                    targetBranch = value;
                    index += 2;
                    break;
                }
                case "--skip-root-sync":
                    skipRootSync = true;
                    index += 1;
                    break;
                case "--skip-batch-writer-lock":
                    skipBatchWriterLock = true;
                    index += 1;
                    break;
                case "--trust-worktree-submodule-state":
                    trustWorktreeSubmoduleState = true;
                    index += 1;
                    break;
                case "--push":
                    if (executionMode && executionMode !== "push") {
                        throw new WorktreeStackKit_MergeCliUsageError("--push, --plan, and --audit are mutually exclusive. Choose exactly one.");
                    }
                    executionMode = "push";
                    index += 1;
                    break;
                case "--plan":
                    if (executionMode && executionMode !== "plan") {
                        throw new WorktreeStackKit_MergeCliUsageError("--push, --plan, and --audit are mutually exclusive. Choose exactly one.");
                    }
                    executionMode = "plan";
                    index += 1;
                    break;
                case "--audit":
                    if (executionMode && executionMode !== "audit") {
                        throw new WorktreeStackKit_MergeCliUsageError("--push, --plan, and --audit are mutually exclusive. Choose exactly one.");
                    }
                    executionMode = "audit";
                    index += 1;
                    break;
                case "--help":
                case "-h":
                    printUsage();
                    return null;
                default:
                    throw new WorktreeStackKit_MergeCliUsageError(`Unknown argument: ${argument}`);
            }
        }
        if (!worktreePath) {
            throw new WorktreeStackKit_MergeCliUsageError("--worktree is required.");
        }
        if (!executionMode) {
            throw new WorktreeStackKit_MergeCliUsageError("Choose exactly one execution mode: --plan, --push, or --audit.");
        }
        return {
            executionMode,
            skipBatchWriterLock,
            skipRootSync,
            targetBranch,
            trustWorktreeSubmoduleState,
            worktreePath: path.resolve(worktreePath),
        };
    }
    /**
     * Builds the initial merge state from CLI options, including a unique temp directory.
     *
     * @remarks
     * Resolves `worktreePath` to an absolute path via `parseMergeCliArgs` before this runs.
     */
    function createState(options) {
        const mergeRunId = `merge-${new Date().toISOString().replace(/[:.]/gu, "-")}`;
        return {
            currentStep: "initialization",
            currentTempWorktree: "",
            executionMode: options.executionMode,
            mergeRunId,
            mergeTmpRoot: path.join(config.projectRoot, config.mergeTmpRootRelativePath, mergeRunId),
            mergedSubmoduleShas: {},
            metadataPath: path.join(options.worktreePath, config.metadataRelativePath),
            rootBranch: "",
            skipRootSync: options.skipRootSync,
            stackName: "",
            submoduleBranch: "",
            targetBranch: options.targetBranch,
            trustWorktreeSubmoduleState: options.trustWorktreeSubmoduleState,
            worktreePath: options.worktreePath,
        };
    }
    /** Emits key-value debug lines for the current step and worktree metadata on failure paths. */
    function printDebugContext(state) {
        worktreeStackPrintKv("step", state.currentStep);
        worktreeStackPrintKv("worktree-path", state.worktreePath);
        worktreeStackPrintKv("metadata-path", state.metadataPath);
        worktreeStackPrintKv("stack-name", state.stackName);
        worktreeStackPrintKv("root-branch", state.rootBranch);
        worktreeStackPrintKv("submodule-branch", state.submoduleBranch);
        worktreeStackPrintKv("target-branch", state.targetBranch);
        worktreeStackPrintKv("execution-mode", state.executionMode);
        if (state.currentTempWorktree) {
            worktreeStackPrintKv("current-temp-worktree", state.currentTempWorktree);
        }
    }
    /** Logs recorded post-merge submodule SHAs used later for root gitlink resolution. */
    function printMergedSubmoduleShas(state) {
        for (const submodule of requiredSubmodulePaths) {
            const value = state.mergedSubmoduleShas[submodule];
            if (value) {
                worktreeStackPrintKv(`${submodule}-merged-sha`, value);
            }
        }
    }
    /**
     * Asserts external tooling and metadata exist before merge or audit progresses.
     *
     * @remarks
     * I/O: Reads `state.metadataPath`; verifies `git` and `node` on PATH.
     */
    function requirePrerequisites(state) {
        state.currentStep = "preflight";
        for (const commandName of config.requiredCommandNames) {
            worktreeStackRequireCommand(commandName);
        }
        worktreeStackRequireFile(state.metadataPath, "worktree metadata");
    }
    /**
     * Ensures `origin/<branchName>` exists after a best-effort fetch.
     *
     * @remarks
     * I/O: Runs `git fetch` and `rev-parse` against `repoDir`; exits via `worktreeStackError` when missing.
     */
    function requireRemoteBranch(repoDir, branchName) {
        worktreeStackRunGit(repoDir, ["fetch", "origin", branchName, "--prune"], {
            allowFailure: true,
            stdio: "ignore",
        });
        if (worktreeStackRunGit(repoDir, [
            "rev-parse",
            "--verify",
            "--quiet",
            `refs/remotes/origin/${branchName}`,
        ], { allowFailure: true, stdio: "ignore" }).status === 0) {
            return;
        }
        worktreeStackError(`Remote branch does not exist: ${repoDir} :: origin/${branchName}`);
    }
    /**
     * Aborts when `repoDir` has unstaged or uncommitted changes before mutating merges.
     *
     * @param label - Human-readable domain name included in the fatal error message.
     */
    function requireCleanWorkingTree(repoDir, label) {
        const status = worktreeStackRunGit(repoDir, ["status", "--short"], {
            allowFailure: true,
        }).stdout.trim();
        if (!status.length) {
            return;
        }
        worktreeStackError(`Working tree is dirty and cannot be merged safely: ${label} :: ${repoDir}`);
    }
    /**
     * Best-effort removal of a detached merge worktree directory.
     *
     * @remarks
     * I/O: Runs `git worktree remove --force`; ignores missing paths and non-fatal git failures.
     */
    function cleanupTempWorktree(repoDir, tempWorktree) {
        if (!tempWorktree || !fs.existsSync(tempWorktree)) {
            return;
        }
        worktreeStackRunGit(repoDir, ["worktree", "remove", "--force", tempWorktree], {
            allowFailure: true,
            stdio: "ignore",
        });
    }
    /** Returns paths still marked unmerged after a failed or in-progress merge in `repoDir`. */
    function listUnmergedPaths(repoDir) {
        return worktreeStackRunGit(repoDir, ["diff", "--name-only", "--diff-filter=U"], {
            allowFailure: true,
        })
            .stdout.split(/\r?\n/gu)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }
    /**
     * Stages submodule gitlink entries in the root index at each merged submodule SHA.
     *
     * @remarks
     * I/O: `git update-index` in `rootRepoDir`; requires `state.mergedSubmoduleShas` populated for every required submodule.
     */
    function resolveRootGitlinksToMergedSubmodules(state, rootRepoDir) {
        for (const submodule of requiredSubmodulePaths) {
            const submoduleSha = state.mergedSubmoduleShas[submodule];
            if (!submoduleSha) {
                worktreeStackError(`Missing merged submodule SHA for ${submodule}`);
            }
            worktreeStackRunGit(rootRepoDir, ["update-index", "--cacheinfo", "160000", submoduleSha, submodule], { stdio: "ignore" });
        }
    }
    /**
     * Finalizes the in-progress root merge with a commit when merge state or staged gitlinks demand it.
     *
     * @remarks
     * I/O: Commits in `repoDir` when `MERGE_HEAD` exists or the short status is non-empty.
     */
    function commitRootMergeIfNeeded(state, repoDir, branchName) {
        if (worktreeStackRunGit(repoDir, ["rev-parse", "--verify", "--quiet", "MERGE_HEAD"], {
            allowFailure: true,
            stdio: "ignore",
        }).status === 0) {
            state.currentStep = "commit-root-merge";
            const result = worktreeStackRunGit(repoDir, ["commit", "--no-edit"], {
                stdio: "pipe",
            });
            if (result.status !== 0) {
                throw new Error(`Git commit failed: ${result.stderr || result.stdout}`);
            }
            return;
        }
        const status = worktreeStackRunGit(repoDir, ["status", "--short", "--untracked-files=no"], { allowFailure: true }).stdout.trim();
        if (status.length > 0) {
            state.currentStep = "commit-root-merge";
            worktreeStackRunGit(repoDir, [
                "commit",
                "-m",
                `chore(worktree-stack): merge ${branchName} into ${state.targetBranch}`,
            ], { stdio: "ignore" });
        }
    }
    /**
     * Confirms `origin/<sourceBranch>` is an ancestor of `origin/<target>` before treating the merge as safe.
     *
     * @remarks
     * I/O: Fetches both refs in `repoDir`; aborts via `worktreeStackError` when ancestry fails.
     */
    function validateRemoteMerge(state, label, repoDir, sourceBranch) {
        state.currentStep = `validate-${label}-remote-merge`;
        worktreeStackRunGit(repoDir, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            "--quiet",
            "origin",
            state.targetBranch,
            sourceBranch,
            "--prune",
        ], { stdio: "ignore" });
        if (worktreeStackRunGit(repoDir, [
            "merge-base",
            "--is-ancestor",
            `origin/${sourceBranch}`,
            `origin/${state.targetBranch}`,
        ], { allowFailure: true, stdio: "ignore" }).status === 0) {
            return;
        }
        worktreeStackError(`Ancestry validation failed: ${label} :: origin/${sourceBranch} is not an ancestor of origin/${state.targetBranch}`);
    }
    /**
     * Resolves which git ref or HEAD SHA to merge for a domain, optionally publishing the source branch.
     *
     * @remarks
     * I/O: Fetches and may push `sourceBranch` to origin in `--push` mode when the remote ref is missing or HEAD is ahead.
     */
    function determineMergeSourceRef(state, label, repoDir, sourceBranch) {
        state.currentStep = `fetch-${label}`;
        requireRemoteBranch(repoDir, state.targetBranch);
        requireCleanWorkingTree(repoDir, label);
        worktreeStackRunGit(repoDir, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            "--quiet",
            "origin",
            state.targetBranch,
            "--prune",
        ], { stdio: "ignore" });
        let sourceBranchExists = false;
        if (worktreeStackRunGit(repoDir, ["fetch", "origin", sourceBranch, "--prune"], { allowFailure: true, stdio: "ignore" }).status === 0 &&
            worktreeStackRunGit(repoDir, [
                "rev-parse",
                "--verify",
                "--quiet",
                `refs/remotes/origin/${sourceBranch}`,
            ], { allowFailure: true, stdio: "ignore" }).status === 0) {
            sourceBranchExists = true;
        }
        const headSha = worktreeStackRunGit(repoDir, [
            "rev-parse",
            "HEAD",
        ]).stdout.trim();
        worktreeStackPrintKv(`${label}-source-head`, headSha);
        if (sourceBranchExists) {
            const [aheadCount = "0", behindCount = "0"] = worktreeStackRunGit(repoDir, [
                "rev-list",
                "--left-right",
                "--count",
                `HEAD...origin/${sourceBranch}`,
            ], { allowFailure: true })
                .stdout.trim()
                .split(/\s+/u);
            worktreeStackPrintKv(`${label}-source-ahead`, aheadCount);
            worktreeStackPrintKv(`${label}-source-behind`, behindCount);
            if (aheadCount !== "0" && behindCount !== "0") {
                worktreeStackError(`Source branch diverged from origin/${sourceBranch}: ${label} :: ${repoDir}`);
            }
            if (aheadCount === "0") {
                const sourceRef = `origin/${sourceBranch}`;
                worktreeStackPrintKv(`${label}-source`, `${repoDir}:${sourceRef}`);
                return sourceRef;
            }
        }
        if (state.executionMode === "plan") {
            if (sourceBranchExists) {
                worktreeStackPrintKv(`${label}-source-publish`, `will push HEAD to origin/${sourceBranch}`);
            }
            else {
                worktreeStackPrintKv(`${label}-source-publish`, `will create origin/${sourceBranch} from HEAD`);
            }
            worktreeStackPrintKv(`${label}-source`, `${repoDir}:${headSha}`);
            return headSha;
        }
        state.currentStep = `publish-${label}-source-branch`;
        worktreeStackRunGit(repoDir, [
            "-c",
            "submodule.recurse=false",
            "push",
            "origin",
            `HEAD:${sourceBranch}`,
        ], { stdio: "ignore" });
        worktreeStackRunGit(repoDir, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            "--quiet",
            "origin",
            sourceBranch,
            "--prune",
        ], { stdio: "ignore" });
        worktreeStackPrintKv(`${label}-source`, `${repoDir}:${headSha}`);
        return headSha;
    }
    /**
     * Loads stack metadata and verifies root and submodule checkouts match expected branches.
     *
     * @remarks
     * I/O: Reads `metadata.json` fields into `state`; consults `.gitmodules` unless `trustWorktreeSubmoduleState`.
     */
    function validateWorktreeState(state) {
        state.currentStep = "validate-worktree-state";
        state.stackName =
            worktreeStackReadJsonField(state.metadataPath, "stackName") ?? "";
        state.rootBranch =
            worktreeStackReadJsonField(state.metadataPath, "rootBranch") ?? "";
        state.submoduleBranch =
            worktreeStackReadJsonField(state.metadataPath, "submoduleBranch") ?? "";
        const actualRootBranch = worktreeStackCurrentCheckoutDescription(state.worktreePath);
        if (!worktreeStackCheckoutMatchesExpectedBranch(state.worktreePath, state.rootBranch)) {
            worktreeStackError(`Root branch mismatch. metadata=${state.rootBranch} actual=${actualRootBranch}`);
        }
        for (const submodule of requiredSubmodulePaths) {
            const repoDir = path.join(state.worktreePath, submodule);
            worktreeStackRequireDirectory(repoDir, "required worktree submodule");
            const actualSubmoduleBranch = worktreeStackCurrentCheckoutDescription(repoDir);
            if (!state.trustWorktreeSubmoduleState) {
                const gitmodulesBranch = worktreeStackResolveGitmodulesSubmoduleBranch(path.join(state.worktreePath, ".gitmodules"), submodule);
                if (!worktreeStackCheckoutMatchesExpectedBranch(repoDir, gitmodulesBranch)) {
                    worktreeStackError(`Submodule branch mismatch in ${submodule}. gitmodules=${gitmodulesBranch} actual=${actualSubmoduleBranch}`);
                }
            }
            else {
                worktreeStackWarn(`validate_worktree_state: .gitmodules branch validation bypassed by --trust-worktree-submodule-state for ${submodule} (currently on ${actualSubmoduleBranch})`);
            }
        }
    }
    /** Returns the multi-line human-readable merge plan shown in audit/plan modes. */
    function buildMergePlanSummary(state) {
        const submoduleLines = config.requiredSubmodules.map((submodule) => {
            const label = WorktreeStackKit_mergePlanLabel(submodule);
            return `- ${label}: ${state.worktreePath}/${submodule.path}:${state.submoduleBranch} -> origin/${state.targetBranch}`;
        });
        return [
            `Merge plan for stack '${state.stackName}':`,
            `- target branch: ${state.targetBranch}`,
            `- root repo:       ${state.worktreePath}:${state.rootBranch} -> origin/${state.targetBranch}`,
            ...submoduleLines,
            "",
            "Execution model:",
            `- temporary detached merge worktrees under ${state.mergeTmpRoot}`,
            "- submodules first, root repo last",
            "- source refs are taken from the validated worktree HEADs and published to origin/<worktree-branch> when needed",
            "- root gitlinks are resolved to the merged submodule target-branch SHAs before the root merge is committed",
            "- in --push mode for target branch 'main', the repo-root main checkout is synchronized afterward unless --skip-root-sync is used",
            "- requires clean working trees in the root worktree and all required submodules",
        ].join("\n");
    }
    /** Machine-oriented ordered checklist of merge steps for logging and diagnostics. */
    function buildMergeOperationPlan(options) {
        return [
            ...config.requiredSubmodules.map((submodule) => `merge ${submodule.path} ${options.worktreePath}/${submodule.path}:` +
                `${options.submoduleBranch} -> origin/${options.targetBranch} via ` +
                `temp worktrees under ${options.mergeTmpRoot}`),
            `merge root ${options.worktreePath}:${options.rootBranch} -> ` +
                `origin/${options.targetBranch} via temp worktrees under ${options.mergeTmpRoot}`,
        ];
    }
    /**
     * Performs merge mechanics for one domain without acquiring the cross-repo writer lock.
     *
     * @remarks
     * I/O: Creates temp worktrees, runs merge and push, records merged SHAs; early-returns in `--plan` after printing refs.
     */
    async function mergeRepoUnlocked(state, label, sourceRepoDir, sourceBranch) {
        const tempWorktree = path.join(state.mergeTmpRoot, label);
        if (label !== "root") {
            worktreeStackRunGit(sourceRepoDir, [
                "-c",
                "submodule.recurse=false",
                "fetch",
                "origin",
                sourceBranch,
                "--prune",
            ], { allowFailure: true, stdio: "ignore" });
            try {
                worktreeStackAttachExpectedBranch(sourceRepoDir, sourceBranch);
            }
            catch (error) {
                worktreeStackWarn(`Could not reattach ${label} to ${sourceBranch} before merge; proceeding anyway. (${formatCliErrorMessage(error)})`);
            }
        }
        const sourceRef = determineMergeSourceRef(state, label, sourceRepoDir, sourceBranch);
        worktreeStackPrintKv(`${label}-target`, `origin/${state.targetBranch}`);
        if (state.executionMode === "plan") {
            return;
        }
        state.currentStep = `prepare-${label}-merge-worktree`;
        if (worktreeStackRunGit(sourceRepoDir, [
            "-c",
            "submodule.recurse=false",
            "merge-base",
            "--is-ancestor",
            `origin/${sourceBranch}`,
            `origin/${state.targetBranch}`,
        ], { allowFailure: true, stdio: "ignore" }).status === 0) {
            const [autoAhead = "0", autoBehind = "0"] = worktreeStackRunGit(sourceRepoDir, [
                "-c",
                "submodule.recurse=false",
                "rev-list",
                "--left-right",
                "--count",
                `origin/${sourceBranch}...origin/${state.targetBranch}`,
            ], { allowFailure: true })
                .stdout.trim()
                .split(/\s+/u);
            if (autoAhead === "0" && autoBehind !== "0") {
                worktreeStackInfo(`Auto-advancing ${label}: origin/${sourceBranch} is behind origin/${state.targetBranch} by ${autoBehind} commits. Force-pushing origin/${state.targetBranch} -> origin/${sourceBranch}.`);
                worktreeStackRunGit(sourceRepoDir, [
                    "-c",
                    "submodule.recurse=false",
                    "push",
                    "origin",
                    `origin/${state.targetBranch}:refs/heads/${sourceBranch}`,
                    "--force-with-lease",
                ], { stdio: "ignore" });
                worktreeStackRunGit(sourceRepoDir, [
                    "-c",
                    "submodule.recurse=false",
                    "fetch",
                    "--quiet",
                    "origin",
                    sourceBranch,
                    "--prune",
                ], { stdio: "ignore" });
            }
            worktreeStackInfo(`Skipping ${label}: origin/${sourceBranch} is already an ancestor of origin/${state.targetBranch}`);
            if (label !== "root") {
                state.mergedSubmoduleShas[label] = worktreeStackRunGit(sourceRepoDir, [
                    "rev-parse",
                    `origin/${sourceBranch}`,
                ]).stdout.trim();
            }
            return;
        }
        fs.mkdirSync(state.mergeTmpRoot, { recursive: true });
        cleanupTempWorktree(sourceRepoDir, tempWorktree);
        worktreeStackRunGit(sourceRepoDir, [
            "-c",
            "submodule.recurse=false",
            "worktree",
            "add",
            "--detach",
            tempWorktree,
            `origin/${state.targetBranch}`,
        ], { stdio: "ignore" });
        state.currentTempWorktree = tempWorktree;
        state.currentStep = `merge-${label}`;
        const preMergeHead = worktreeStackRunGit(tempWorktree, [
            "rev-parse",
            "HEAD",
        ]).stdout.trim();
        if (label === "root") {
            worktreeStackRunGit(tempWorktree, [
                "-c",
                "submodule.recurse=false",
                "merge",
                "--no-ff",
                "--no-commit",
                sourceRef,
            ], { allowFailure: true, stdio: "ignore" });
            state.currentStep = "resolve-root-gitlinks";
            resolveRootGitlinksToMergedSubmodules(state, tempWorktree);
            if (listUnmergedPaths(tempWorktree).length > 0) {
                worktreeStackError("Root merge still has unresolved conflicts.");
            }
            commitRootMergeIfNeeded(state, tempWorktree, sourceBranch);
        }
        else {
            worktreeStackRunGit(tempWorktree, [
                "-c",
                "submodule.recurse=false",
                "merge",
                "--no-ff",
                "--no-edit",
                sourceRef,
            ], { stdio: "ignore" });
            const mergedHeadSha = worktreeStackRunGit(tempWorktree, [
                "rev-parse",
                "HEAD",
            ]).stdout.trim();
            const mergedFirstParent = worktreeStackRunGit(tempWorktree, ["rev-parse", "--short", "HEAD^1"], { allowFailure: true }).stdout.trim();
            if (mergedFirstParent === preMergeHead) {
                worktreeStackInfo(`Fast-forward merge: no new commit created for ${label} (source was ancestor of target)`);
            }
            state.mergedSubmoduleShas[label] = mergedHeadSha;
            worktreeStackPrintKv(`${label}-merged-head`, mergedHeadSha);
        }
        const mergeCommit = worktreeStackRunGit(tempWorktree, [
            "rev-parse",
            "--short",
            "HEAD",
        ]).stdout.trim();
        worktreeStackPrintKv(`${label}-merge-commit`, mergeCommit);
        state.currentStep = `push-${label}`;
        const pushHeadSha = worktreeStackRunGit(tempWorktree, [
            "rev-parse",
            "HEAD",
        ]).stdout.trim();
        worktreeStackRunGit(tempWorktree, [
            "-c",
            "submodule.recurse=false",
            "push",
            "origin",
            `${pushHeadSha}:refs/heads/${state.targetBranch}`,
            "--force-with-lease",
        ], { stdio: "ignore" });
        cleanupTempWorktree(sourceRepoDir, tempWorktree);
        state.currentTempWorktree = "";
    }
    /**
     * Runs `mergeRepoUnlocked` under `worktreeStackWithRepoMutationLock` when executing `--push`.
     *
     * @remarks
     * Audit and plan modes skip the lock wrapper to avoid serializing read-only diagnostics.
     */
    async function mergeRepo(state, label, sourceRepoDir, sourceBranch) {
        if (state.executionMode !== "push") {
            await mergeRepoUnlocked(state, label, sourceRepoDir, sourceBranch);
            return;
        }
        await worktreeStackWithRepoMutationLock(config.projectRoot, sourceRepoDir, `worktree-stack-merge:${state.targetBranch}:${label}:${sourceBranch}`, "wait", async () => {
            await mergeRepoUnlocked(state, label, sourceRepoDir, sourceBranch);
        });
    }
    /**
     * Pushes the root temp worktree result to `origin/<target>` when it advanced submodule gitlinks.
     *
     * @remarks
     * I/O: Reads `root` temp worktree HEAD and compares to remote before a force-with-lease push.
     */
    async function pushRootAfterSubmoduleCascadeUnlocked(state) {
        const rootTempWorktree = path.join(state.mergeTmpRoot, "root");
        if (!fs.existsSync(rootTempWorktree) ||
            !fs.statSync(rootTempWorktree).isDirectory()) {
            worktreeStackWarn(`Root temp worktree not found at ${rootTempWorktree}; skipping cascade push.`);
            return;
        }
        state.currentStep = "re-fetch-root-before-cascade-push";
        worktreeStackRunGit(state.worktreePath, [
            "-c",
            "submodule.recurse=false",
            "fetch",
            "--quiet",
            "origin",
            state.targetBranch,
            "--prune",
        ], { stdio: "ignore" });
        const rootHeadSha = worktreeStackRunGit(rootTempWorktree, [
            "rev-parse",
            "HEAD",
        ]).stdout.trim();
        worktreeStackPrintKv("root-cascade-head", rootHeadSha);
        const remoteTargetSha = worktreeStackRunGit(state.worktreePath, ["rev-parse", `origin/${state.targetBranch}`], { allowFailure: true }).stdout.trim();
        if (rootHeadSha === remoteTargetSha) {
            worktreeStackInfo(`Root push: origin/${state.targetBranch} already at ${rootHeadSha}; no push needed.`);
            return;
        }
        state.currentStep = "push-root-cascade";
        worktreeStackInfo(`Root push: pushing updated gitlinks from cascade (${rootHeadSha} -> origin/${state.targetBranch})`);
        worktreeStackRunGit(rootTempWorktree, [
            "-c",
            "submodule.recurse=false",
            "push",
            "origin",
            `${rootHeadSha}:refs/heads/${state.targetBranch}`,
            "--force-with-lease",
        ], { stdio: "ignore" });
    }
    /**
     * Wraps cascade root push with the repo mutation lock only for `--push` execution.
     */
    async function pushRootAfterSubmoduleCascade(state) {
        if (state.executionMode !== "push") {
            await pushRootAfterSubmoduleCascadeUnlocked(state);
            return;
        }
        await worktreeStackWithRepoMutationLock(config.projectRoot, state.worktreePath, `worktree-stack-merge:${state.targetBranch}:root-cascade:${state.rootBranch}`, "wait", async () => {
            await pushRootAfterSubmoduleCascadeUnlocked(state);
        });
    }
    /** Prints one machine-parseable audit line to stderr with padded fixed-width fields. */
    function emitAuditFinding(finding) {
        console.error(`audit-findings severity=${finding.severity.padEnd(8, " ")} check=${finding.checkId.padEnd(6, " ")} domain=${finding.domain.padEnd(20, " ")} entity=${finding.entity.padEnd(12, " ")} message=${finding.message}`);
    }
    /** Creates empty audit counters for one diagnostic pass. */
    function createMergeAuditCounters() {
        return {
            errorCount: 0,
            fatalCount: 0,
            findingCount: 0,
            infoCount: 0,
            warningCount: 0,
        };
    }
    /** Emits one finding and increments aggregate severity counters for the summary line. */
    function pushMergeAuditFinding(counters, finding) {
        emitAuditFinding(finding);
        counters.findingCount += 1;
        if (finding.severity === "fatal") {
            counters.fatalCount += 1;
        }
        else if (finding.severity === "error") {
            counters.errorCount += 1;
        }
        else if (finding.severity === "warning") {
            counters.warningCount += 1;
        }
        else {
            counters.infoCount += 1;
        }
    }
    /** Audits whether a repo has dirty tracked/untracked state. */
    function auditDirtyWorktree(options) {
        const dirtyOutput = worktreeStackRunGit(options.repoDir, ["status", "--short"], {
            allowFailure: true,
        }).stdout.trim();
        if (dirtyOutput.length === 0) {
            return;
        }
        options.pushFinding({
            checkId: options.checkId,
            detail: `dirty-path-count=${dirtyOutput.split(/\r?\n/gu).length}`,
            domain: options.domain,
            entity: "worktree",
            message: options.domain === "root"
                ? "working-tree-is-dirty"
                : "submodule-is-dirty",
            severity: "error",
        });
    }
    /** Returns the checked-out branch and emits a detached-checkout finding when no branch is active. */
    function auditCheckoutBranch(options) {
        const branch = worktreeStackRunGit(options.repoDir, ["branch", "--show-current"], {
            allowFailure: true,
        }).stdout.trim();
        if (branch) {
            return branch;
        }
        const detachedSha = worktreeStackRunGit(options.repoDir, ["rev-parse", "--short", "HEAD"], {
            allowFailure: true,
        }).stdout.trim() || "unknown";
        options.pushFinding({
            checkId: options.checkId,
            detail: `current=detached@${detachedSha}`,
            domain: options.domain,
            entity: "worktree",
            message: options.detachedMessage,
            severity: "error",
        });
        return "";
    }
    /** Audits broken `.git` file references for root or submodule worktree checkouts. */
    function auditGitdirReference(options) {
        const gitFile = path.join(options.repoDir, ".git");
        if (!fs.existsSync(gitFile) || !fs.statSync(gitFile).isFile()) {
            return;
        }
        const gitdirRef = fs
            .readFileSync(gitFile, "utf8")
            .replace(/^gitdir:\s*/u, "")
            .trim();
        const resolvedGitdir = path.isAbsolute(gitdirRef)
            ? gitdirRef
            : path.join(options.repoDir, gitdirRef);
        if (fs.existsSync(resolvedGitdir)) {
            return;
        }
        options.pushFinding({
            checkId: options.checkId,
            detail: `path=${options.repoDir};gitdir=${resolvedGitdir}`,
            domain: options.domain,
            entity: "gitdir",
            message: "broken-gitdir-reference",
            severity: "fatal",
        });
    }
    /** Audits whether the prepared root branch is stale or diverged from origin/${state.targetBranch}. */
    function auditRootBranchFreshness(state, pushFinding) {
        if (!state.rootBranch) {
            return;
        }
        worktreeStackRunGit(state.worktreePath, ["fetch", "origin", state.rootBranch, "--prune"], {
            allowFailure: true,
            stdio: "ignore",
        });
        if (worktreeStackRunGit(state.worktreePath, ["rev-parse", "--verify", "--quiet", `origin/${state.rootBranch}`], { allowFailure: true, stdio: "ignore" }).status !== 0) {
            return;
        }
        const [ahead = "0", behind = "0"] = worktreeStackRunGit(state.worktreePath, [
            "rev-list",
            "--left-right",
            "--count",
            `origin/${state.rootBranch}...origin/${state.targetBranch}`,
        ], { allowFailure: true })
            .stdout.trim()
            .split(/\s+/u);
        if (ahead === "0" && behind !== "0") {
            pushFinding({
                checkId: "AUD-10",
                detail: `branch=${state.rootBranch};behind-target-by=${behind}`,
                domain: "root",
                entity: `branch:${state.rootBranch}`,
                message: "branch-is-stale-behind-target",
                severity: "warning",
            });
        }
        else if (ahead !== "0" && behind !== "0") {
            pushFinding({
                checkId: "AUD-10",
                detail: `branch=${state.rootBranch};ahead=${ahead};behind=${behind}`,
                domain: "root",
                entity: `branch:${state.rootBranch}`,
                message: "branch-is-diverged",
                severity: "error",
            });
        }
    }
    /** Audits one registered submodule checkout for dirty, detached, branch, and gitdir drift. */
    function auditSubmoduleCheckout(options) {
        const repoDir = path.join(options.state.worktreePath, options.submodule);
        if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
            return;
        }
        const domain = `submodule:${options.submodule}`;
        auditDirtyWorktree({
            checkId: "AUD-7",
            domain,
            pushFinding: options.pushFinding,
            repoDir,
        });
        const subBranch = auditCheckoutBranch({
            checkId: "AUD-8",
            detachedMessage: "submodule-is-detached",
            domain,
            pushFinding: options.pushFinding,
            repoDir,
        });
        const gitmodulesBranch = worktreeStackResolveGitmodulesSubmoduleBranch(path.join(options.state.worktreePath, ".gitmodules"), options.submodule);
        if (gitmodulesBranch &&
            subBranch &&
            !worktreeStackCheckoutMatchesExpectedBranch(repoDir, gitmodulesBranch)) {
            options.pushFinding({
                checkId: "AUD-9",
                detail: `gitmodules-branch=${gitmodulesBranch};actual-branch=${subBranch}`,
                domain,
                entity: "gitmodules",
                message: "gitmodules-branch-mismatch",
                severity: "error",
            });
        }
        auditGitdirReference({
            checkId: "AUD-12",
            domain,
            pushFinding: options.pushFinding,
            repoDir,
        });
    }
    /** Converts final audit counters into summary lines and exit status. */
    function finishMergeAudit(counters) {
        let auditExitCode = 0;
        let auditResult = "PASS";
        if (counters.fatalCount > 0) {
            auditExitCode = 2;
            auditResult = "FATAL";
        }
        else if (counters.errorCount > 0 || counters.warningCount > 0) {
            auditExitCode = 1;
            auditResult = "ISSUES_FOUND";
        }
        console.error(`audit-summary total=${counters.findingCount} info=${counters.infoCount} warning=${counters.warningCount} error=${counters.errorCount} fatal=${counters.fatalCount}`);
        console.error(`audit-exit-code=${auditExitCode}`);
        console.error(`audit-result=${auditResult}`);
        return auditExitCode;
    }
    /**
     * Read-only diagnostics pass returning an exit code derived from worst finding severity.
     *
     * @remarks
     * I/O: Inspects worktrees, metadata, git cleanliness, and stale temp dirs without mutating remotes.
     */
    async function runAuditMode(state) {
        const counters = createMergeAuditCounters();
        /** Emits one finding into the current audit counter set. */
        const pushFinding = (finding) => {
            pushMergeAuditFinding(counters, finding);
        };
        state.currentStep = "audit-phase1";
        if (!worktreeStackGitWorktreeRegistered(config.projectRoot, state.worktreePath)) {
            pushFinding({
                checkId: "AUD-1",
                detail: `path=${state.worktreePath}`,
                domain: "root",
                entity: "worktree",
                message: "worktree-is-not-registered",
                severity: "fatal",
            });
        }
        else {
            pushFinding({
                checkId: "AUD-1",
                detail: `path=${state.worktreePath}`,
                domain: "root",
                entity: "worktree",
                message: "worktree-domain-enumerated",
                severity: "info",
            });
        }
        if (!fs.existsSync(state.metadataPath)) {
            pushFinding({
                checkId: "AUD-2",
                detail: `path=${state.metadataPath}`,
                domain: "root",
                entity: "metadata",
                message: "metadata-missing",
                severity: "fatal",
            });
        }
        else {
            pushFinding({
                checkId: "AUD-2",
                detail: `stack-name=${state.stackName};root-branch=${state.rootBranch};submodule-branch=${state.submoduleBranch}`,
                domain: "root",
                entity: "metadata",
                message: "metadata-loaded",
                severity: "info",
            });
        }
        state.currentStep = "audit-phase2";
        auditDirtyWorktree({
            checkId: "AUD-3",
            domain: "root",
            pushFinding,
            repoDir: state.worktreePath,
        });
        auditCheckoutBranch({
            checkId: "AUD-4",
            detachedMessage: "root-worktree-is-detached",
            domain: "root",
            pushFinding,
            repoDir: state.worktreePath,
        });
        auditGitdirReference({
            checkId: "AUD-5",
            domain: "root",
            pushFinding,
            repoDir: state.worktreePath,
        });
        auditRootBranchFreshness(state, pushFinding);
        state.currentStep = "audit-phase3";
        worktreeStackRunGit(state.worktreePath, ["fetch", "origin", state.targetBranch, "--prune"], { allowFailure: true, stdio: "ignore" });
        for (const submodule of requiredSubmodulePaths) {
            auditSubmoduleCheckout({ pushFinding, state, submodule });
        }
        state.currentStep = "audit-phase4";
        if (fs.existsSync(state.mergeTmpRoot) &&
            fs.statSync(state.mergeTmpRoot).isDirectory()) {
            const tempWorktrees = fs
                .readdirSync(state.mergeTmpRoot, { withFileTypes: true })
                .filter((entry) => entry.isDirectory()).length;
            if (tempWorktrees > 0) {
                pushFinding({
                    checkId: "AUD-13",
                    detail: `count=${tempWorktrees}`,
                    domain: "system",
                    entity: "temp-worktree",
                    message: "orphaned-temp-worktrees-found",
                    severity: "warning",
                });
            }
        }
        return finishMergeAudit(counters);
    }
    /**
     * Executes merge-to-main orchestration for a prepared worktree across audit, plan, or push modes.
     *
     * @remarks
     * I/O: Mutates git state and remotes in push mode; acquires repo-wide locks when configured.
     */
    async function runMerge(options) {
        const state = createState(options);
        if (!fs.existsSync(state.worktreePath) ||
            !fs.statSync(state.worktreePath).isDirectory()) {
            console.error(`[worktree] ERROR: Worktree path does not exist: ${state.worktreePath}`);
            return 1;
        }
        if (fs.existsSync(state.metadataPath)) {
            state.rootBranch =
                worktreeStackReadJsonField(state.metadataPath, "rootBranch") ?? "";
            state.submoduleBranch =
                worktreeStackReadJsonField(state.metadataPath, "submoduleBranch") ?? "";
            state.stackName =
                worktreeStackReadJsonField(state.metadataPath, "stackName") ?? "";
        }
        try {
            if (state.executionMode === "audit") {
                worktreeStackRequireCommand("git");
                return await runAuditMode(state);
            }
            if (state.executionMode === "push" && !options.skipBatchWriterLock) {
                await worktreeStackAcquireRepoWriterLock(config.projectRoot, `worktree-stack-merge:${state.targetBranch}:${state.worktreePath}`);
            }
            requirePrerequisites(state);
            state.currentStep = "reattach-root-before-validation";
            state.rootBranch =
                worktreeStackReadJsonField(state.metadataPath, "rootBranch") ?? "";
            try {
                worktreeStackAttachExpectedBranch(state.worktreePath, state.rootBranch);
            }
            catch (error) {
                worktreeStackWarn(`Root was detached; could not reattach to ${state.rootBranch}. Proceeding with validation anyway. (${formatCliErrorMessage(error)})`);
            }
            validateWorktreeState(state);
            console.log(buildMergePlanSummary(state));
            for (const submodule of requiredSubmodulePaths) {
                await mergeRepo(state, submodule, path.join(state.worktreePath, submodule), state.submoduleBranch);
            }
            await mergeRepo(state, "root", state.worktreePath, state.rootBranch);
            if (state.executionMode === "push") {
                await pushRootAfterSubmoduleCascade(state);
            }
            if (state.executionMode === "plan") {
                worktreeStackInfo("Plan only. Re-run with --push to execute the merge.");
                return 0;
            }
            for (const submodule of requiredSubmodulePaths) {
                validateRemoteMerge(state, submodule, path.join(state.worktreePath, submodule), state.submoduleBranch);
            }
            validateRemoteMerge(state, "root", state.worktreePath, state.rootBranch);
            if (!state.skipRootSync) {
                state.currentStep = "sync-root-checkout";
                await WorktreeStackKit_syncRepoRootTargetCheckoutWithLocks({
                    config: config.repoRootSync,
                    ownerLabel: `worktree-stack-merge:${state.targetBranch}:${state.worktreePath}:sync-root`,
                    rootDir: config.projectRoot,
                    targetBranch: state.targetBranch,
                });
            }
            worktreeStackInfo(`Merged the worktree domain into origin/${state.targetBranch}.`);
            if (state.executionMode === "push") {
                state.currentStep = "cleanup-stale-temp-worktrees";
                worktreeStackCleanupStaleTempMergeWorktrees(path.dirname(state.mergeTmpRoot), path.basename(state.mergeTmpRoot));
            }
            return 0;
        }
        catch (error) {
            console.error(formatCliErrorMessage(error));
            printDebugContext(state);
            printMergedSubmoduleShas(state);
            if (state.currentTempWorktree) {
                worktreeStackWarn(`Temporary merge worktree preserved for inspection: ${state.currentTempWorktree}`);
            }
            return 1;
        }
        finally {
            worktreeStackReleaseAllNamedLocks();
            if (state.executionMode === "push" && !options.skipBatchWriterLock) {
                worktreeStackReleaseRepoWriterLock(config.projectRoot);
            }
        }
    }
    /** CLI entrypoint that parses argv then delegates to `runMerge`. */
    async function runMergeCli(argv) {
        try {
            const parsedOptions = parseMergeCliArgs(argv);
            if (parsedOptions === null) {
                return 0;
            }
            return await runMerge(parsedOptions);
        }
        catch (error) {
            console.error(formatCliErrorMessage(error));
            if (error instanceof WorktreeStackKit_MergeCliUsageError) {
                printUsage();
            }
            return 1;
        }
    }
    return {
        buildMergeOperationPlan,
        buildMergePlanSummary,
        parseMergeCliArgs,
        runMerge,
        runMergeCli,
    };
}
//# sourceMappingURL=merge-command.js.map