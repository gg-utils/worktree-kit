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
import { type WorktreeStackKit_ConfiguredSubmodulesConfig } from "./configured-submodules.js";
import type { WorktreeStackKit_CreateOptions } from "./create-cli-context.js";
export type WorktreeStackKit_CreateRealmAndGitContext = {
    currentStep: string;
    options: Pick<WorktreeStackKit_CreateOptions, "baseBranch" | "requestedRealmSlug" | "rootBranch" | "stackName" | "submoduleBranch" | "worktreeFolderDateToken" | "worktreesBase">;
    realmAssignmentSource: string;
    realmSlug: string;
    rootDir: string;
    worktreePath: string;
};
export type WorktreeStackKit_CreateRealmAssignment = {
    realmAssignmentSource?: string;
    realmSlug?: string;
};
export type WorktreeStackKit_AllocateCreateRealmOptions = {
    projectRoot: string;
    requestedRealmSlug: string;
    stackName: string;
};
export type WorktreeStackKit_CreateRealmAndGitConfig = {
    allocateRealm: (options: WorktreeStackKit_AllocateCreateRealmOptions) => WorktreeStackKit_CreateRealmAssignment;
    configuredSubmodules: WorktreeStackKit_ConfiguredSubmodulesConfig;
    defaultFallbackBaseBranch: string;
    defaultRealmAssignmentSource: string;
    metadataRelativePath: string;
    realmAssignmentSourceMetadataField: string;
    realmMetadataField: string;
    remoteName: string;
    requiredSubmoduleManifestRelativePaths: readonly string[];
    rootBranchMetadataField: string;
    stackNameMetadataField: string;
    submoduleBranchMetadataField: string;
    worktreePathMetadataField: string;
};
/** Normalizes a realm string to a lowercase DNS-like slug with single internal hyphens. */
export declare function WorktreeStackKit_normalizeCreateRealmSlug(value: string): string;
/** Locates prior stack metadata matching stack and branch names under the configured base path. */
export declare function WorktreeStackKit_findExistingPreparedWorktreeMetadataPath(options: {
    config: WorktreeStackKit_CreateRealmAndGitConfig;
    context: WorktreeStackKit_CreateRealmAndGitContext;
}): string;
/** Resolves `realmSlug` from existing metadata or through the configured allocator hook. */
export declare function WorktreeStackKit_resolveCreateRealmAssignment(options: {
    config: WorktreeStackKit_CreateRealmAndGitConfig;
    context: WorktreeStackKit_CreateRealmAndGitContext;
}): void;
/** Fills `worktreePath` from folder naming when no explicit path was provided. */
export declare function WorktreeStackKit_resolveCreateWorktreePath(context: WorktreeStackKit_CreateRealmAndGitContext): void;
/** Creates the git worktree directory and `git worktree add` for root branch when missing. */
export declare function WorktreeStackKit_ensureCreateWorktree(context: WorktreeStackKit_CreateRealmAndGitContext): void;
/** Disables `submodule.recurse` locally in the new worktree to avoid surprising nested updates. */
export declare function WorktreeStackKit_configureCreateWorktreeGitSafety(context: WorktreeStackKit_CreateRealmAndGitContext): void;
/** Best-effort upstream tracking setup for the root repo branch inside the worktree. */
export declare function WorktreeStackKit_ensureCreateRootBranchUpstream(options: {
    config: WorktreeStackKit_CreateRealmAndGitConfig;
    context: WorktreeStackKit_CreateRealmAndGitContext;
}): void;
/**
 * Checks out `branchName` in a submodule, creating it from remote or a fallback base when needed.
 */
export declare function WorktreeStackKit_checkoutCreateSubmoduleBranch(options: {
    branchName: string;
    config: WorktreeStackKit_CreateRealmAndGitConfig;
    context: WorktreeStackKit_CreateRealmAndGitContext;
    submoduleRoot: string;
}): void;
/** Best-effort upstream tracking for a submodule branch after checkout. */
export declare function WorktreeStackKit_ensureCreateSubmoduleBranchUpstream(options: {
    branchName: string;
    config: WorktreeStackKit_CreateRealmAndGitConfig;
    submoduleRoot: string;
}): void;
/** Clones/configures gitlinks under the new worktree, with recovery when update fails. */
export declare function WorktreeStackKit_initializeCreateSubmodules(options: {
    config: WorktreeStackKit_CreateRealmAndGitConfig;
    context: WorktreeStackKit_CreateRealmAndGitContext;
}): void;
