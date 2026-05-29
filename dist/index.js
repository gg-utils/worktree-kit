/**
 * @fileoverview Barrel entrypoint for `@gg-utils/worktree-kit`, aggregating Ink and OpenTUI interactive shells, prepared-worktree lifecycle commands, and config-driven submodule, env, and workspace sync helpers behind one import surface.
 *
 * This file re-exports sibling modules so callers can use the package root or the explicit `exports` subpaths declared in `packages/worktree-kit/package.json` without duplicating wiring.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_deriveSlotPortMap } from "@gg-utils/worktree-kit";
 *
 * const ports = WorktreeStackKit_deriveSlotPortMap({
 *   slot: 1,
 *   portDefinitions: [{ key: "api", basePort: 3000 }],
 * });
 * ```
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root to execute packages/worktree-kit unit tests via tsx (see the package.json test script for the exact file glob).
 * @testing TypeScript: npm run worktree-kit:type-check from the repository root to compile-check `packages/worktree-kit` after barrel export changes.
 *
 * @see worktrees.config.ts - consumer root adapter importing `@gg-utils/worktree-kit` subpaths to bind slot ports, submodule sync, interactive flows, and lifecycle commands to workspace policy.
 * @see packages/worktree-kit/README.md - Package README documenting subpath exports, CLI versus adapter boundaries, and how root configs compose these primitives.
 * @see packages/worktree-kit/package.json - Package manifest whose `exports` map mirrors the modules re-exported here for consumers and tooling.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
export * from "./slot-ports.js";
export * from "./configured-submodules.js";
export * from "./interactive-session.js";
export * from "./interactive-worktrees.js";
export * from "./interactive-paths.js";
export * from "./interactive-flows.js";
export * from "./ink-launch-options.js";
export * from "./ink-entrypoint.js";
export * from "./ink-launch-resolution.js";
export * from "./ink-create-model.js";
export * from "./ink-action-catalog.js";
export * from "./ink-action-plan-dispatcher.js";
export * from "./ink-reducer-helpers.js";
export * from "./ink-reducer.js";
export * from "./ink-display-view-model.js";
export * from "./ink-keyboard-routing.js";
export * from "./ink-ui-contracts.js";
export * from "./ink-inventory-discovery.js";
export * from "./ink-record-workflow-plans.js";
export * from "./ink-admin-task-plans.js";
export * from "./ink-create-switch-plans.js";
export * from "./ink-create-resolution.js";
export * from "./ink-bridge.js";
export * from "./ink-result-model.js";
export * from "./ink-shell-view-model.js";
export * from "./ink-fullscreen-view-model.js";
export * from "./local-state-sync.js";
export * from "./env-file.js";
export * from "./create-cli-context.js";
export * from "./create-command.js";
export * from "./configured-create-command.js";
export * from "./create-preflight-validation.js";
export * from "./create-realm-and-git.js";
export * from "./create-env-orchestration.js";
export * from "./create-post-provision.js";
export * from "./codex-project-integration.js";
export * from "./antigravity-project-integration.js";
export * from "./zsh-aliases-integration.js";
export * from "./dev-compatibility.js";
export * from "./sync-local-workspaces.js";
export * from "./state-check.js";
export * from "./memory-monitor.js";
export * from "./repo-root-sync.js";
export * from "./switch-command.js";
export * from "./destroy-command.js";
export * from "./env-doctor-command.js";
export * from "./repair-command.js";
export * from "./update-from-main-command.js";
export * from "./merge-command.js";
export * from "./align-active.js";
export * from "./align-active-command.js";
export * from "./align-active-parallel-command.js";
export * from "./start-command.js";
export * from "./ui-command-catalog.js";
export * from "./opentui-shell-contracts.js";
export * from "./opentui-shell-keyboard.js";
export * from "./opentui-shell-menu-actions.js";
export * from "./opentui-create-wizard-form-plans.js";
export * from "./opentui-create-wizard-panels.js";
export * from "./opentui-create-preview.js";
export * from "./opentui-action-scroll-npm-plans.js";
export * from "./opentui-action-scroll-worktree-pick.js";
export * from "./opentui-action-scroll-global-plans.js";
export * from "./opentui-action-scroll-switch-plans.js";
export * from "./opentui-action-scroll-diagnostics-pool-plans.js";
export * from "./opentui-action-scroll-maintenance-plans.js";
export * from "./opentui-app-shell-view-model.js";
export * from "./opentui-app-shell-panels.js";
export * from "./opentui-app-run-lifecycle.js";
export * from "./opentui-child-process.js";
export * from "./opentui-app-controller.js";
export * from "./opentui-shell-serializers.js";
export * from "./ink-action-options-panel.js";
export * from "./ink-issue-line.js";
export * from "./ink-fullscreen-screens.js";
export * from "./ink-shell.js";
export * from "./ink-app.js";
export * from "./opentui-auto-focus-tab-select.js";
export * from "./opentui-layout-test-harness.js";
export * from "./opentui-diagnostics-pool-panel.js";
export * from "./opentui-maintenance-panels.js";
export * from "./opentui-npm-panels.js";
export * from "./opentui-global-panels.js";
export * from "./opentui-worktree-pick-panel.js";
export * from "./opentui-switch-panel.js";
export * from "./opentui-action-scroll.js";
export * from "./opentui-app-shell.js";
//# sourceMappingURL=index.js.map