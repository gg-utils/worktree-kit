/**
 * @fileoverview Defines the ordered reusable worktree Ink action catalog (ids, labels, descriptions,
 * record vs global scope) consumed by package Ink UIs and script adapters.
 *
 * Script adapters and UI renderers own project-specific command planning and display; this module
 * only owns stable list metadata and ordering.
 *
 * @example
 * ```typescript
 * import { WORKTREE_STACK_KIT_INK_ACTIONS } from "@gg-utils/worktree-kit/ink-action-catalog";
 *
 * const recordScoped = WORKTREE_STACK_KIT_INK_ACTIONS.filter((action) => action.scope === "record");
 * ```
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-action-catalog.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-launch-options.ts - Owns the `WorktreeStackKit_InkActionId` closed union and argv contracts every catalog `id` must stay aligned with.
 * @see packages/worktree-kit/src/ink-keyboard-routing.ts - Indexes this ordered catalog by selection and validates ids during Ink keyboard routing.
 * @see scripts/worktree-stack/ui/cli-ink/worktree-ink-actions.ts - Root worktree-stack Ink adapter that re-exports the default catalog for script launchers.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkActionId } from "./ink-launch-options.js";
/** Static definition of an action shown in worktree Ink UI action lists. */
export type WorktreeStackKit_InkActionDefinition = {
    readonly description: string;
    readonly id: WorktreeStackKit_InkActionId;
    readonly label: string;
    readonly scope: "record" | "global";
};
/** Ordered worktree action catalog for Ink-style UIs. */
export declare const WORKTREE_STACK_KIT_INK_ACTIONS: readonly WorktreeStackKit_InkActionDefinition[];
//# sourceMappingURL=ink-action-catalog.d.ts.map