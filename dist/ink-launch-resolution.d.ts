/**
 * @fileoverview Reusable resolution of parsed worktree Ink launch targets.
 *
 * Flow: project UI loads an inventory and static action catalog, package logic resolves the initial
 * selected record/action, create draft, screen, notice, and action-option patch. The package also
 * owns translation from its richer Ink UI inventory into the small launch inventory contract.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/ink-launch-resolution.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-launch-options.ts - Parsed argv launch contract and action identifiers that this module maps to catalog indices, screens, and option patches.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Rich Ink UI inventory records that `WorktreeStackKit_createInkLaunchInventory` collapses into the minimal path and stack-name candidates matched here.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink shell that wires project inventory and parsed launch targets into `WorktreeStackKit_resolveInkLaunchTarget` when bootstrapping the interactive UI.
 * @see packages/worktree-kit/src/ink-launch-resolution.unit.test.ts - Node `node:test` regression module asserting stack and path resolution, global versus record action scoping, and argv-derived option patches.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkActionId, WorktreeStackKit_InkCreateDraft, WorktreeStackKit_InkLaunchTarget } from "./ink-launch-options.js";
import type { WorktreeStackKit_InkUiInventory } from "./ink-ui-contracts.js";
/** Scope category needed to decide whether a worktree selector should affect the launch. */
export type WorktreeStackKit_InkLaunchActionScope = "record" | "global";
/** Minimal action-catalog entry consumed by launch-target resolution. */
export type WorktreeStackKit_InkLaunchActionDefinition = {
    readonly id: WorktreeStackKit_InkActionId;
    readonly label: string;
    readonly scope: WorktreeStackKit_InkLaunchActionScope;
};
/** Minimal inventory record consumed by launch-target resolution. */
export type WorktreeStackKit_InkLaunchInventoryRecord = {
    readonly stackNameCandidates: readonly string[];
    readonly worktreePath: string;
};
/** Minimal inventory consumed by launch-target resolution. */
export type WorktreeStackKit_InkLaunchInventory = {
    readonly projectRoot: string;
    readonly records: readonly WorktreeStackKit_InkLaunchInventoryRecord[];
};
/** Action-option fields currently prefilled by launcher argv. */
export type WorktreeStackKit_InkLaunchActionOptionsPatch = {
    readonly poolNextStackName?: string;
    readonly stateCheckFetch?: boolean;
};
/** Normalized Ink bootstrap selection derived from argv plus optional launch overrides. */
export type WorktreeStackKit_InkResolvedLaunchTarget = {
    readonly actionOptionsPatch: WorktreeStackKit_InkLaunchActionOptionsPatch | null;
    readonly createDraft: WorktreeStackKit_InkCreateDraft;
    readonly noticeMessage: string | null;
    readonly screen: "shell" | "action-editor";
    readonly selectedActionIndex: number;
    readonly selectedIndex: number;
};
/** Input for resolving one parsed Ink launch target against a project-supplied inventory. */
export type WorktreeStackKit_ResolveInkLaunchTarget_Options = {
    readonly actionDefinitions: readonly WorktreeStackKit_InkLaunchActionDefinition[];
    readonly initialCreateDraft: WorktreeStackKit_InkCreateDraft;
    readonly inventory: WorktreeStackKit_InkLaunchInventory;
    readonly target: WorktreeStackKit_InkLaunchTarget | null;
};
export type WorktreeStackKit_CreateInkLaunchTargetResolverOptions = {
    readonly actionDefinitions: readonly WorktreeStackKit_InkLaunchActionDefinition[];
    readonly createInitialCreateDraft: () => WorktreeStackKit_InkCreateDraft;
};
/** Converts package-owned UI inventory records into the minimal launch-resolution inventory. */
export declare function WorktreeStackKit_createInkLaunchInventory(inventory: WorktreeStackKit_InkUiInventory): WorktreeStackKit_InkLaunchInventory;
/** Applies CLI launch hints to inventory-backed defaults for initial Ink screen state. */
export declare function WorktreeStackKit_resolveInkLaunchTarget(options: WorktreeStackKit_ResolveInkLaunchTarget_Options): WorktreeStackKit_InkResolvedLaunchTarget;
/** Binds a launcher catalog and draft factory for script adapters. */
export declare function WorktreeStackKit_createInkLaunchTargetResolver(options: WorktreeStackKit_CreateInkLaunchTargetResolverOptions): (inventory: WorktreeStackKit_InkUiInventory, target: WorktreeStackKit_InkLaunchTarget | null) => WorktreeStackKit_InkResolvedLaunchTarget;
//# sourceMappingURL=ink-launch-resolution.d.ts.map