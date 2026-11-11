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
import { basename, dirname, join, resolve as resolvePath } from "node:path";
/** Builds a six-character local-date prefix (`YYMMDD`) for predicted folder names. */
export function WorktreeStackKit_formatInkWorktreeDatePrefix(date) {
    const year = String(date.getFullYear() % 100).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}
/** Normalizes free-form realm strings into comparable lowercase kebab-case slugs. */
export function WorktreeStackKit_normalizeInkRealmSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/gu, "-")
        .replace(/^-+|-+$/gu, "")
        .replace(/-+/gu, "-");
}
/** Parses a realm-pool string or list into unique normalized slugs. */
export function WorktreeStackKit_parseInkRealmPool(sourceValues) {
    return Array.from(new Set(sourceValues
        .map((value) => WorktreeStackKit_normalizeInkRealmSlug(value))
        .filter((value) => value.length > 0)));
}
/** Maps a normalized realm slug to the compact token embedded in predicted folder names. */
export function WorktreeStackKit_buildInkRealmFolderToken(realmSlug) {
    const normalizedRealmSlug = WorktreeStackKit_normalizeInkRealmSlug(realmSlug);
    const pooledMatch = normalizedRealmSlug.match(/^worktree-(\d+)$/u);
    const pooledRealmNumber = pooledMatch?.[1];
    if (pooledRealmNumber) {
        return `WT${pooledRealmNumber.padStart(2, "0")}`;
    }
    const compactToken = normalizedRealmSlug
        .split(/[^a-z0-9]+/u)
        .filter((segment) => segment.length > 0)
        .map((segment) => /^\d+$/u.test(segment) ? segment : (segment[0]?.toUpperCase() ?? ""))
        .join("")
        .slice(0, 5);
    return `R${compactToken || "0"}`.slice(0, 6);
}
/** Maps a stack label to the stack segment used in predicted worktree folder names. */
export function WorktreeStackKit_buildInkStackFolderToken(stackName) {
    const normalizedStackName = stackName
        .trim()
        .replace(/[^A-Za-z0-9-]+/gu, "-")
        .replace(/^-+|-+$/gu, "")
        .replace(/-+/gu, "-")
        .toUpperCase();
    return normalizedStackName.length > 0 ? normalizedStackName : "<STACK-NAME>";
}
/** Collects normalized realm slugs already referenced across inventory records. */
export function WorktreeStackKit_getReservedInkRealmSlugs(inventory) {
    return new Set(inventory.records.flatMap((record) => {
        const reservedRealmSlugs = [
            record.metadata?.realmSlug,
            record.handbook?.realmSlug,
            record.realmRecord?.realmSlug,
        ];
        return reservedRealmSlugs.flatMap((realmSlug) => realmSlug && realmSlug.trim().length > 0
            ? [WorktreeStackKit_normalizeInkRealmSlug(realmSlug)]
            : []);
    }));
}
/** Predicts which realm slug a new stack would receive from the configured realm pool. */
export function WorktreeStackKit_getPredictedInkRealmSlug(options) {
    if (options.stackName.trim().length === 0) {
        return null;
    }
    const reservedRealmSlugs = WorktreeStackKit_getReservedInkRealmSlugs(options.inventory);
    const availablePooledRealm = WorktreeStackKit_parseInkRealmPool(options.config.realmPool).find((candidate) => !reservedRealmSlugs.has(candidate));
    if (availablePooledRealm) {
        return availablePooledRealm;
    }
    return WorktreeStackKit_normalizeInkRealmSlug(options.stackName);
}
/** Composes the predicted worktree directory name from date, realm, and stack tokens. */
export function WorktreeStackKit_buildPredictedInkWorktreeFolderName(options) {
    const realmSlug = WorktreeStackKit_getPredictedInkRealmSlug(options);
    const realmToken = realmSlug
        ? WorktreeStackKit_buildInkRealmFolderToken(realmSlug)
        : "<REALM>";
    const stackToken = options.stackName.trim().length > 0
        ? WorktreeStackKit_buildInkStackFolderToken(options.stackName)
        : "<STACK-NAME>";
    return `${WorktreeStackKit_formatInkWorktreeDatePrefix(options.config.getCurrentDate())}${realmToken}-${stackToken}`;
}
/** Suggests the lowest unused positive integer slot based on inventory metadata. */
export function WorktreeStackKit_getSuggestedInkSlot(inventory) {
    const usedSlots = new Set(inventory.records
        .map((record) => record.metadata?.slot)
        .filter((slot) => typeof slot === "number" && Number.isInteger(slot) && slot > 0));
    let slot = 1;
    while (usedSlots.has(slot)) {
        slot += 1;
    }
    return slot;
}
/** Resolves the default parent directory for new worktrees from current checkout context. */
export function WorktreeStackKit_getDefaultInkWorktreesBase(options) {
    const currentRecord = options.inventory.records.find((record) => record.currentCheckout ||
        record.worktreePath === options.inventory.projectRoot) ?? null;
    if (currentRecord?.metadata?.workspaceType === "worktree" ||
        basename(dirname(options.inventory.projectRoot)) ===
            options.config.defaultWorktreesDirectoryName) {
        return dirname(options.inventory.projectRoot);
    }
    return join(options.inventory.projectRoot, "..", options.config.defaultWorktreesDirectoryName);
}
/** Normalizes draft strings, derives slot/realm defaults, and predicts the future folder path. */
export function WorktreeStackKit_resolveInkCreateDraft(options) {
    const branchPrefix = options.draft.branchPrefix.trim() || options.config.defaultBranchPrefix;
    const stackName = options.draft.stackName.trim();
    const suggestedSlot = String(WorktreeStackKit_getSuggestedInkSlot(options.inventory));
    const slotInput = options.draft.slotInput.trim() || suggestedSlot;
    const parsedSlot = Number.parseInt(slotInput, 10);
    const slot = Number.isInteger(parsedSlot) && parsedSlot > 0 ? parsedSlot : null;
    const baseBranch = options.draft.baseBranch.trim() || options.config.defaultBaseBranch;
    const rootBranch = options.draft.rootBranch.trim() ||
        (stackName.length > 0 ? `${branchPrefix}/${stackName}` : "");
    const submoduleBranch = options.draft.submoduleBranch.trim() ||
        (stackName.length > 0 ? `${branchPrefix}/${stackName}` : "");
    const worktreesBase = options.draft.worktreesBase.trim() ||
        WorktreeStackKit_getDefaultInkWorktreesBase(options);
    const realmSlug = options.draft.realmSlug.trim();
    const worktreePathOverride = options.draft.worktreePathOverride.trim();
    const metadataSource = options.draft.metadataSource.trim();
    const predictedWorktreePath = worktreePathOverride.length > 0
        ? resolvePath(options.inventory.projectRoot, worktreePathOverride)
        : join(worktreesBase, WorktreeStackKit_buildPredictedInkWorktreeFolderName({
            config: options.config,
            inventory: options.inventory,
            stackName,
        }));
    return {
        baseBranch,
        branchPrefix,
        copyEnvFromMain: options.draft.copyEnvFromMain,
        followUpStart: options.draft.followUpStart,
        followUpStartOpenWindsurf: options.draft.followUpStart && options.draft.followUpStartOpenWindsurf,
        installPreferOnline: options.draft.runInstall && options.draft.installPreferOnline,
        installSkipExisting: options.draft.runInstall && options.draft.installSkipExisting,
        metadataSource,
        openWindsurf: options.draft.openWindsurf,
        predictedWorktreePath,
        realmSlug,
        rootBranch,
        runInstall: options.draft.runInstall,
        slot,
        slotInput,
        stackName,
        submoduleBranch,
        worktreePathOverride,
        worktreesBase,
    };
}
/** Binds a config factory once so adapters pass only current draft and inventory state. */
export function WorktreeStackKit_createInkCreateDraftResolver(getConfig) {
    return (options) => WorktreeStackKit_resolveInkCreateDraft({
        config: getConfig(),
        draft: options.draft,
        inventory: options.inventory,
    });
}
/** Builds the argv-ready create context or `null` while mandatory fields are incomplete. */
export function WorktreeStackKit_createInkCreateContext(resolvedDraft) {
    if (resolvedDraft.stackName.length === 0 ||
        resolvedDraft.slot === null ||
        resolvedDraft.rootBranch.length === 0 ||
        resolvedDraft.submoduleBranch.length === 0) {
        return null;
    }
    return {
        baseBranch: resolvedDraft.baseBranch,
        branchPrefix: resolvedDraft.branchPrefix,
        followUpStart: resolvedDraft.followUpStart,
        followUpStartOpenWindsurf: resolvedDraft.followUpStartOpenWindsurf,
        metadataSource: resolvedDraft.metadataSource,
        predictedWorktreePath: resolvedDraft.predictedWorktreePath,
        realmSlug: resolvedDraft.realmSlug,
        rootBranch: resolvedDraft.rootBranch,
        slot: resolvedDraft.slot,
        stackName: resolvedDraft.stackName,
        submoduleBranch: resolvedDraft.submoduleBranch,
        worktreePathOverride: resolvedDraft.worktreePathOverride,
        worktreesBase: resolvedDraft.worktreesBase,
    };
}
/** After create completes, matches inventory rows against the requested stack/slot/branch tuple. */
export function WorktreeStackKit_resolveCreatedInkRecord(options) {
    const candidateRecords = options.inventory.records.filter((record) => {
        const metadata = record.metadata;
        return (metadata?.stackName === options.createContext.stackName &&
            metadata.slot === options.createContext.slot &&
            metadata.rootBranch === options.createContext.rootBranch &&
            metadata.submoduleBranch === options.createContext.submoduleBranch);
    });
    if (candidateRecords.length === 1) {
        return {
            candidateRecords,
            matchedRecord: candidateRecords[0] ?? null,
            status: "resolved",
        };
    }
    if (candidateRecords.length > 1) {
        return {
            candidateRecords,
            matchedRecord: null,
            status: "ambiguous",
        };
    }
    return {
        candidateRecords: [],
        matchedRecord: null,
        status: "not-found",
    };
}
