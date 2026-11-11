/**
 * @fileoverview Config-driven realm assignment and Git provisioning helpers for worktree creation.
 *
 * Flow: create context + project hooks -> realm reuse/allocation, worktree path derivation, root
 * worktree provisioning, submodule initialization, and branch/upstream alignment.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-realm-and-git.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Prepared-worktree create runner that imports realm resolution, root worktree creation, submodule checkout, upstream wiring, and submodule init helpers owned in this module.
 * @see packages/worktree-kit/src/configured-submodules.ts - Submodule clone/update implementation invoked when initializeCreateSubmodules materializes configured gitlinks under the new worktree path.
 * @see packages/worktree-kit/src/create-cli-context.ts - Parses argv and builds WorktreeStackKit_CreateOptions fields picked into context types for stack names, branches, realm slug, and worktrees base paths consumed here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackEnsureBranchUpstream, worktreeStackRemoteBranchExists, } from "@gg-utils/worktree-core/git-branches";
import { worktreeStackError, worktreeStackRunGit, worktreeStackWarn, worktreeStackInfo, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackBuildFolderName, worktreeStackReadJsonField, } from "@gg-utils/worktree-core/worktree-discovery";
import { WorktreeStackKit_updateConfiguredSubmodules, } from "./configured-submodules.js";
/** Normalizes a realm string to a lowercase DNS-like slug with single internal hyphens. */
export function WorktreeStackKit_normalizeCreateRealmSlug(value) {
    const slugWithPossibleBoundaryHyphens = value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/gu, "-");
    let startIndex = 0;
    let endIndex = slugWithPossibleBoundaryHyphens.length;
    while (startIndex < endIndex &&
        slugWithPossibleBoundaryHyphens.charAt(startIndex) === "-") {
        startIndex += 1;
    }
    while (endIndex > startIndex &&
        slugWithPossibleBoundaryHyphens.charAt(endIndex - 1) === "-") {
        endIndex -= 1;
    }
    return slugWithPossibleBoundaryHyphens.slice(startIndex, endIndex);
}
/** Locates prior stack metadata matching stack and branch names under the configured base path. */
export function WorktreeStackKit_findExistingPreparedWorktreeMetadataPath(options) {
    const { config, context } = options;
    if (!fs.existsSync(context.options.worktreesBase)) {
        return "";
    }
    const entries = fs
        .readdirSync(context.options.worktreesBase, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(context.options.worktreesBase, entry.name))
        .sort((left, right) => right.localeCompare(left));
    for (const candidatePath of entries) {
        const candidateMetadataPath = path.join(candidatePath, config.metadataRelativePath);
        if (!fs.existsSync(candidateMetadataPath)) {
            continue;
        }
        const candidateStackName = worktreeStackReadJsonField(candidateMetadataPath, config.stackNameMetadataField) ?? "";
        const candidateRootBranch = worktreeStackReadJsonField(candidateMetadataPath, config.rootBranchMetadataField) ?? "";
        const candidateSubmoduleBranch = worktreeStackReadJsonField(candidateMetadataPath, config.submoduleBranchMetadataField) ?? "";
        if (candidateStackName === context.options.stackName &&
            candidateRootBranch === context.options.rootBranch &&
            candidateSubmoduleBranch === context.options.submoduleBranch) {
            return candidateMetadataPath;
        }
    }
    return "";
}
/** Resolves `realmSlug` from existing metadata or through the configured allocator hook. */
export function WorktreeStackKit_resolveCreateRealmAssignment(options) {
    const { config, context } = options;
    context.currentStep = "resolve-realm-assignment";
    const existingMetadataPath = WorktreeStackKit_findExistingPreparedWorktreeMetadataPath({
        config,
        context,
    });
    if (existingMetadataPath) {
        context.realmSlug =
            worktreeStackReadJsonField(existingMetadataPath, config.realmMetadataField) ?? "";
        context.realmAssignmentSource =
            worktreeStackReadJsonField(existingMetadataPath, config.realmAssignmentSourceMetadataField) ?? config.defaultRealmAssignmentSource;
        context.worktreePath =
            worktreeStackReadJsonField(existingMetadataPath, config.worktreePathMetadataField) ?? context.worktreePath;
        worktreeStackInfo("Reusing existing realm assignment from metadata: " +
            `realm='${context.realmSlug}' source='${context.realmAssignmentSource}'`);
        return;
    }
    const assignment = config.allocateRealm({
        projectRoot: context.rootDir,
        requestedRealmSlug: context.options.requestedRealmSlug,
        stackName: context.options.stackName,
    });
    context.realmSlug = WorktreeStackKit_normalizeCreateRealmSlug(assignment.realmSlug ?? "");
    context.realmAssignmentSource =
        assignment.realmAssignmentSource ?? config.defaultRealmAssignmentSource;
    if (!context.realmSlug) {
        worktreeStackError("Realm allocation returned an empty realm slug.");
    }
    worktreeStackInfo(`Assigned realm '${context.realmSlug}' (source=${context.realmAssignmentSource}).`);
}
/** Fills `worktreePath` from folder naming when no explicit path was provided. */
export function WorktreeStackKit_resolveCreateWorktreePath(context) {
    context.currentStep = "resolve-worktree-path";
    if (context.worktreePath) {
        return;
    }
    context.worktreePath = path.join(context.options.worktreesBase, worktreeStackBuildFolderName(context.options.worktreeFolderDateToken, context.realmSlug, context.options.stackName));
}
/** Creates the git worktree directory and `git worktree add` for root branch when missing. */
export function WorktreeStackKit_ensureCreateWorktree(context) {
    fs.mkdirSync(context.options.worktreesBase, { recursive: true });
    const gitMarkerPath = path.join(context.worktreePath, ".git");
    if (fs.existsSync(gitMarkerPath)) {
        console.log(`[info] Worktree already exists: ${context.worktreePath}`);
        return;
    }
    const branchExists = worktreeStackRunGit(context.rootDir, [
        "show-ref",
        "--verify",
        "--quiet",
        `refs/heads/${context.options.rootBranch}`,
    ], {
        allowFailure: true,
        stdio: "ignore",
    }).status === 0;
    if (branchExists) {
        console.log(`[info] Creating worktree from existing local branch: ${context.options.rootBranch}`);
        worktreeStackRunGit(context.rootDir, ["worktree", "add", context.worktreePath, context.options.rootBranch], { stdio: "inherit" });
        return;
    }
    console.log("[info] Creating new worktree branch " +
        `'${context.options.rootBranch}' from '${context.options.baseBranch}'`);
    worktreeStackRunGit(context.rootDir, [
        "worktree",
        "add",
        context.worktreePath,
        "-b",
        context.options.rootBranch,
        context.options.baseBranch,
    ], { stdio: "inherit" });
}
/** Disables `submodule.recurse` locally in the new worktree to avoid surprising nested updates. */
export function WorktreeStackKit_configureCreateWorktreeGitSafety(context) {
    context.currentStep = "configure-worktree-git-safety";
    worktreeStackRunGit(context.worktreePath, [
        "config",
        "--local",
        "submodule.recurse",
        "false",
    ]);
}
/** Best-effort upstream tracking setup for the root repo branch inside the worktree. */
export function WorktreeStackKit_ensureCreateRootBranchUpstream(options) {
    const { config, context } = options;
    context.currentStep = "configure-root-upstream";
    if (!worktreeStackEnsureBranchUpstream(context.worktreePath, context.options.rootBranch, config.remoteName)) {
        worktreeStackWarn(`Root branch upstream was not fully configured for ${context.options.rootBranch}.`);
    }
}
/**
 * Checks out `branchName` in a submodule, creating it from remote or a fallback base when needed.
 */
export function WorktreeStackKit_checkoutCreateSubmoduleBranch(options) {
    const { branchName, config, context, submoduleRoot } = options;
    worktreeStackRunGit(submoduleRoot, ["fetch", config.remoteName, "--prune"], {
        allowFailure: true,
        stdio: "ignore",
    });
    const hasLocalBranch = worktreeStackRunGit(submoduleRoot, ["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], {
        allowFailure: true,
        stdio: "ignore",
    }).status === 0;
    if (hasLocalBranch) {
        worktreeStackRunGit(submoduleRoot, ["checkout", branchName], {
            stdio: "inherit",
        });
        return;
    }
    if (worktreeStackRemoteBranchExists(submoduleRoot, config.remoteName, branchName)) {
        worktreeStackRunGit(submoduleRoot, [
            "checkout",
            "-b",
            branchName,
            "--track",
            `${config.remoteName}/${branchName}`,
        ], { stdio: "inherit" });
        return;
    }
    let fallbackBase = context.options.baseBranch;
    const remoteBaseExists = worktreeStackRunGit(submoduleRoot, [
        "rev-parse",
        "--verify",
        "--quiet",
        `${config.remoteName}/${fallbackBase}`,
    ], {
        allowFailure: true,
        stdio: "ignore",
    }).status === 0;
    if (!remoteBaseExists) {
        fallbackBase = config.defaultFallbackBaseBranch;
    }
    worktreeStackRunGit(submoduleRoot, [
        "checkout",
        "--no-track",
        "-b",
        branchName,
        `${config.remoteName}/${fallbackBase}`,
    ], { stdio: "inherit" });
}
/** Best-effort upstream tracking for a submodule branch after checkout. */
export function WorktreeStackKit_ensureCreateSubmoduleBranchUpstream(options) {
    const { branchName, config, submoduleRoot } = options;
    if (!worktreeStackEnsureBranchUpstream(submoduleRoot, branchName, config.remoteName)) {
        worktreeStackWarn("Submodule branch upstream was not fully configured for " +
            `${path.basename(submoduleRoot)} :: ${branchName}.`);
    }
}
/** Clones/configures gitlinks under the new worktree, with recovery when update fails. */
export function WorktreeStackKit_initializeCreateSubmodules(options) {
    const { config, context } = options;
    console.log("[info] Initializing submodules...");
    try {
        WorktreeStackKit_updateConfiguredSubmodules({
            config: config.configuredSubmodules,
            rootDir: context.worktreePath,
        });
        return;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[warn] Submodule update failed; attempting to continue with existing checkouts. ${message}`);
    }
    const missing = [];
    for (const requiredManifest of config.requiredSubmoduleManifestRelativePaths) {
        if (!fs.existsSync(path.join(context.worktreePath, requiredManifest))) {
            missing.push(path.dirname(requiredManifest));
        }
    }
    if (missing.length > 0) {
        worktreeStackError(`Required submodules are missing: ${missing.join(" ")}`);
    }
    console.log("[warn] Continuing with existing submodule directories (gitlink mismatch likely).");
}
