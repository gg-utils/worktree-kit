/**
 * @fileoverview Package-owned type contracts for reusable worktree Ink UI shells.
 *
 * The contracts are product-neutral data shapes for inventory, action planning, session state,
 * reducer events, and create/switch drafts. Root script adapters keep compatibility aliases for the
 * historical `WorktreeInk*` names while reusable code imports this package-owned namespace.
 *
 * @example
 * ```typescript
 * import type { WorktreeStackKit_InkUiAction } from "@gg-utils/worktree-kit/ink-ui-contracts";
 *
 * const action: WorktreeStackKit_InkUiAction = { type: "load-start" };
 * ```
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/ink-reducer.unit.test.ts
 * @testing CLI: npm run worktree-kit:type-check
 *
 * @see packages/worktree-kit/src/ink-reducer.ts - Reducer that interprets the discriminated action union and `WorktreeStackKit_InkUiState` contract defined here when advancing the Ink UI snapshot.
 * @see packages/worktree-kit/src/ink-inventory-discovery.ts - Inventory builder that fills `WorktreeStackKit_InkUiRecord` rows, issues, and summaries from git and local-edge artifacts using these field shapes.
 * @see scripts/worktree-stack/ui/cli-ink/types.ts - Root CLI compatibility layer that imports this module and keeps historical `WorktreeInk*` aliases for legacy script imports.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export {};
//# sourceMappingURL=ink-ui-contracts.js.map