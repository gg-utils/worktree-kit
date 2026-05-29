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
/** Ordered worktree action catalog for Ink-style UIs. */
export const WORKTREE_STACK_KIT_INK_ACTIONS = [
    {
        id: "start",
        label: "Start Environment",
        description: "Register realm and start services",
        scope: "record",
    },
    {
        id: "destroy",
        label: "Delete Worktree",
        description: "Remove worktree and unregister realm",
        scope: "record",
    },
    {
        id: "update-from-main",
        label: "Update From Main",
        description: "Pull latest changes from main branch",
        scope: "record",
    },
    {
        id: "merge",
        label: "Merge to Main",
        description: "Merge worktree branches into main",
        scope: "record",
    },
    {
        id: "create",
        label: "Create Worktree",
        description: "New worktree with branches and config",
        scope: "global",
    },
    {
        id: "switch",
        label: "Switch Worktree",
        description: "Jump to worktree by prefix and name",
        scope: "global",
    },
    {
        id: "repair",
        label: "Repair Worktrees",
        description: "Fix metadata, handbooks, and env files",
        scope: "global",
    },
    {
        id: "sync-local-files",
        label: "Sync Local Files",
        description: "Copy local config to worktrees",
        scope: "global",
    },
    {
        id: "platform-bootstrap",
        label: "Bootstrap Platform",
        description: "Install submodules and dependencies",
        scope: "global",
    },
    {
        id: "list-active-realms",
        label: "List Active Realms",
        description: "Show running environments",
        scope: "global",
    },
    {
        id: "router-status",
        label: "Router Status",
        description: "Check if nginx router is running",
        scope: "global",
    },
    {
        id: "healthcheck",
        label: "Health Check",
        description: "Test all registered realms",
        scope: "global",
    },
    {
        id: "realm-pool-list",
        label: "Realm Pool Status",
        description: "View realm assignments",
        scope: "global",
    },
    {
        id: "realm-pool-guide",
        label: "Realm Pool Guide",
        description: "How realm naming works",
        scope: "global",
    },
    {
        id: "realm-pool-prepare",
        label: "Prepare Realm Pool",
        description: "Generate TLS for realm pool",
        scope: "global",
    },
    {
        id: "realm-pool-next",
        label: "Preview Next Realm",
        description: "See which realm a stack gets",
        scope: "global",
    },
    {
        id: "realm-prune-stale",
        label: "Clean Up Realms",
        description: "Remove stale registry entries",
        scope: "global",
    },
    {
        id: "checkout-state-check",
        label: "Check Git Status",
        description: "Show branch and submodule state",
        scope: "global",
    },
];
//# sourceMappingURL=ink-action-catalog.js.map