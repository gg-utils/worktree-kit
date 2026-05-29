/**
 * @fileoverview Reusable discovery and labeling helpers for classic worktree interactive pickers.
 *
 * Flow: git worktree porcelain + prepared-worktree metadata files -> stable picker rows, used slot
 * sets, and path validation. Project adapters provide the repo root and may wrap default arguments.
 *
 * @testing Node test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/interactive-flows.ts - Interactive lifecycle runners that import these helpers to build worktree rows, slot hints, and path validation for shared picker prompts.
 * @see scripts/worktree-stack/ui/cli-interactive/worktrees.ts - Root-repo CLI surface that forwards interactive worktree discovery to this package export for scripted prompts.
 * @see packages/worktree-kit/src/interactive-worktrees.unit.test.ts - Node test runner regression file asserting porcelain parsing, metadata summaries, and slot selection helpers owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackRunGit } from "@gg-utils/worktree-core/foundation";
/** Parses `git worktree list --porcelain` output into absolute paths excluding the main checkout. */
export function WorktreeStackKit_parseInteractiveGitWorktreeListPorcelain(output, rootDir) {
    const lines = output.split(/\r?\n/gu);
    const collected = [];
    for (const line of lines) {
        if (!line.startsWith("worktree ")) {
            continue;
        }
        const worktreePath = line.slice("worktree ".length).trim();
        if (worktreePath.length === 0) {
            continue;
        }
        const resolvedPath = path.resolve(worktreePath);
        if (resolvedPath !== rootDir) {
            collected.push(resolvedPath);
        }
    }
    return collected;
}
/** Narrow `unknown` to an object record without using unsafe assertions. */
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Parses a positive slot integer from a metadata field. */
function parseMetadataSlot(value) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        return value;
    }
    if (typeof value === "string" && /^[0-9]+$/u.test(value)) {
        return Number.parseInt(value, 10);
    }
    return null;
}
/** Loads and narrows worktree metadata from disk, or returns null when the file is missing. */
export function WorktreeStackKit_readInteractiveMetadata(metadataPath) {
    if (!fs.existsSync(metadataPath)) {
        return null;
    }
    const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const payload = isRecord(parsed) ? parsed : {};
    return {
        realmSlug: typeof payload.realmSlug === "string" ? payload.realmSlug : "",
        rootBranch: typeof payload.rootBranch === "string" ? payload.rootBranch : "",
        slot: parseMetadataSlot(payload.slot),
        stackName: typeof payload.stackName === "string" ? payload.stackName : "",
    };
}
/** Builds the single-line human label shown beside a worktree in interactive pickers. */
export function WorktreeStackKit_describeInteractiveWorktree(options) {
    if (options.metadata === null) {
        return options.folderName;
    }
    return [
        options.metadata.stackName || options.folderName,
        `slot ${options.metadata.slot === null ? "?" : String(options.metadata.slot)}`,
        `realm ${options.metadata.realmSlug || "?"}`,
        `branch ${options.metadata.rootBranch || "?"}`,
    ].join(" | ");
}
/** Lists prepared worktrees by combining git porcelain paths with metadata JSON hints. */
export function WorktreeStackKit_collectInteractiveKnownWorktrees(repoRoot) {
    const worktreeList = worktreeStackRunGit(repoRoot, ["worktree", "list", "--porcelain"], {
        allowFailure: true,
    });
    if (worktreeList.status !== 0) {
        return [];
    }
    return WorktreeStackKit_parseInteractiveGitWorktreeListPorcelain(worktreeList.stdout, repoRoot).map((worktreePath) => {
        const folderName = path.basename(worktreePath);
        const metadataPath = path.join(worktreePath, ".tmp", "worktree-stack", "metadata.json");
        const metadata = WorktreeStackKit_readInteractiveMetadata(metadataPath);
        return {
            folderName,
            metadataPath,
            path: worktreePath,
            realmSlug: metadata?.realmSlug ?? "",
            rootBranch: metadata?.rootBranch ?? "",
            slot: metadata?.slot ?? null,
            stackName: metadata?.stackName ?? "",
            summary: WorktreeStackKit_describeInteractiveWorktree({
                folderName,
                metadata,
            }),
        };
    });
}
/** Returns positive slot integers already claimed by known prepared worktrees. */
export function WorktreeStackKit_collectInteractiveUsedSlots(worktrees) {
    return worktrees
        .map((worktree) => worktree.slot)
        .filter((slot) => typeof slot === "number" && slot > 0);
}
/** Chooses the lowest unused positive integer slot not present in `usedSlots`. */
export function WorktreeStackKit_pickNextInteractiveSlot(usedSlots) {
    const used = new Set(usedSlots);
    let candidate = 1;
    while (used.has(candidate)) {
        candidate += 1;
    }
    return candidate;
}
/** Resolves a user-supplied filesystem path to its realpath after verifying it exists. */
export function WorktreeStackKit_resolveExistingInteractivePath(inputPath) {
    const resolvedPath = path.resolve(inputPath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Path does not exist: ${resolvedPath}`);
    }
    return fs.realpathSync(resolvedPath);
}
//# sourceMappingURL=interactive-worktrees.js.map