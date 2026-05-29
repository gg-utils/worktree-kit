/**
 * @fileoverview Package-owned Ink create-draft resolution helpers.
 *
 * These helpers normalize create form drafts, predict worktree folder paths, choose available realm
 * and port slots from an in-memory inventory, build argv-ready create contexts, bind configured
 * draft resolvers, and match completed create runs back to inventory records. Project adapters
 * supply branch/default directory policy, realm pool entries, and the current date through explicit
 * config.
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/ink-create-resolution.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI draft, inventory, and create-request-context types that define the shapes normalized and produced by these resolution helpers.
 * @see packages/worktree-kit/src/ink-app.tsx - Interactive Ink create UI that imports these helpers to resolve drafts, preview paths, and build argv-ready create contexts from live inventory.
 * @see packages/worktree-kit/src/ink-create-resolution.unit.test.ts - Jest regression coverage for draft normalization, realm and slot prediction, folder-name tokens, and post-create inventory matching owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiCreateDraft, WorktreeStackKit_InkUiCreateRequestContext, WorktreeStackKit_InkUiInventory, WorktreeStackKit_InkUiRecord } from "./ink-ui-contracts.js";
/** Explicit defaults used when resolving create drafts against an inventory. */
export type WorktreeStackKit_InkCreateResolutionConfig = {
    readonly defaultBaseBranch: string;
    readonly defaultBranchPrefix: string;
    readonly defaultWorktreesDirectoryName: string;
    readonly getCurrentDate: () => Date;
    readonly realmPool: readonly string[];
};
/** Draft values after parsing plus derived paths used for previews and argv builders. */
export type WorktreeStackKit_InkResolvedCreateDraft = {
    readonly baseBranch: string;
    readonly branchPrefix: string;
    readonly copyEnvFromMain: boolean;
    readonly followUpStart: boolean;
    readonly followUpStartOpenWindsurf: boolean;
    readonly installPreferOnline: boolean;
    readonly installSkipExisting: boolean;
    readonly metadataSource: string;
    readonly openWindsurf: boolean;
    readonly predictedWorktreePath: string;
    readonly realmSlug: string;
    readonly rootBranch: string;
    readonly runInstall: boolean;
    readonly slot: number | null;
    readonly slotInput: string;
    readonly stackName: string;
    readonly submoduleBranch: string;
    readonly worktreePathOverride: string;
    readonly worktreesBase: string;
};
/** Result of matching a typed stack name against current inventory records. */
export type WorktreeStackKit_InkCreateResolution = {
    readonly candidateRecords: WorktreeStackKit_InkUiRecord[];
    readonly matchedRecord: WorktreeStackKit_InkUiRecord | null;
    readonly status: "ambiguous" | "not-found" | "resolved";
};
export type WorktreeStackKit_InkCreateDraftResolverInput = {
    readonly draft: WorktreeStackKit_InkUiCreateDraft;
    readonly inventory: WorktreeStackKit_InkUiInventory;
};
/** Builds a six-character local-date prefix (`YYMMDD`) for predicted folder names. */
export declare function WorktreeStackKit_formatInkWorktreeDatePrefix(date: Date): string;
/** Normalizes free-form realm strings into comparable lowercase kebab-case slugs. */
export declare function WorktreeStackKit_normalizeInkRealmSlug(value: string): string;
/** Parses a realm-pool string or list into unique normalized slugs. */
export declare function WorktreeStackKit_parseInkRealmPool(sourceValues: readonly string[]): string[];
/** Maps a normalized realm slug to the compact token embedded in predicted folder names. */
export declare function WorktreeStackKit_buildInkRealmFolderToken(realmSlug: string): string;
/** Maps a stack label to the stack segment used in predicted worktree folder names. */
export declare function WorktreeStackKit_buildInkStackFolderToken(stackName: string): string;
/** Collects normalized realm slugs already referenced across inventory records. */
export declare function WorktreeStackKit_getReservedInkRealmSlugs(inventory: WorktreeStackKit_InkUiInventory): Set<string>;
/** Predicts which realm slug a new stack would receive from the configured realm pool. */
export declare function WorktreeStackKit_getPredictedInkRealmSlug(options: {
    readonly config: WorktreeStackKit_InkCreateResolutionConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly stackName: string;
}): string | null;
/** Composes the predicted worktree directory name from date, realm, and stack tokens. */
export declare function WorktreeStackKit_buildPredictedInkWorktreeFolderName(options: {
    readonly config: WorktreeStackKit_InkCreateResolutionConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
    readonly stackName: string;
}): string;
/** Suggests the lowest unused positive integer slot based on inventory metadata. */
export declare function WorktreeStackKit_getSuggestedInkSlot(inventory: WorktreeStackKit_InkUiInventory): number;
/** Resolves the default parent directory for new worktrees from current checkout context. */
export declare function WorktreeStackKit_getDefaultInkWorktreesBase(options: {
    readonly config: WorktreeStackKit_InkCreateResolutionConfig;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): string;
/** Normalizes draft strings, derives slot/realm defaults, and predicts the future folder path. */
export declare function WorktreeStackKit_resolveInkCreateDraft(options: {
    readonly config: WorktreeStackKit_InkCreateResolutionConfig;
    readonly draft: WorktreeStackKit_InkUiCreateDraft;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkResolvedCreateDraft;
/** Binds a config factory once so adapters pass only current draft and inventory state. */
export declare function WorktreeStackKit_createInkCreateDraftResolver(getConfig: () => WorktreeStackKit_InkCreateResolutionConfig): (options: WorktreeStackKit_InkCreateDraftResolverInput) => WorktreeStackKit_InkResolvedCreateDraft;
/** Builds the argv-ready create context or `null` while mandatory fields are incomplete. */
export declare function WorktreeStackKit_createInkCreateContext(resolvedDraft: WorktreeStackKit_InkResolvedCreateDraft): WorktreeStackKit_InkUiCreateRequestContext | null;
/** After create completes, matches inventory rows against the requested stack/slot/branch tuple. */
export declare function WorktreeStackKit_resolveCreatedInkRecord(options: {
    readonly createContext: WorktreeStackKit_InkUiCreateRequestContext;
    readonly inventory: WorktreeStackKit_InkUiInventory;
}): WorktreeStackKit_InkCreateResolution;
//# sourceMappingURL=ink-create-resolution.d.ts.map