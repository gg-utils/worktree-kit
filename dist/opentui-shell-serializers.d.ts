/**
 * @fileoverview Plaintext serializers for worktree OpenTUI shell clipboard exports.
 *
 * Package-owned serializers keep record/action/issue formatting reusable while script adapters keep
 * host clipboard side effects. The functions accept structural inventory records so callers can use
 * richer project discovery models without importing root scripts into the package.
 *
 * @testing CLI: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI app shell that imports the worktree list, actions, and record-detail serializers for clipboard copy actions.
 * @see packages/worktree-kit/src/opentui-app-shell-panels.tsx - Issues panel surface that imports only the merged global and per-record issues serializer for clipboard copy from the diagnostics column.
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.ts - Menu option builder whose availability inputs gate the plaintext actions catalog produced here.
 * @see packages/worktree-kit/src/opentui-app-shell-view-model.ts - Inventory, record, and issue input contracts every serializer entrypoint accepts without pulling root scripts into the package.
 * @see packages/worktree-kit/src/opentui-shell-serializers.unit.test.ts - Node (tsx) unit coverage for list, record-detail, actions, and issues plaintext formatting.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_OpenTuiInventoryInput, WorktreeStackKit_OpenTuiIssueInput, WorktreeStackKit_OpenTuiRecordInput } from "./opentui-app-shell-view-model.js";
/** Builds a numbered plaintext list of discovered worktrees for clipboard export. */
export declare function WorktreeStackKit_serializeOpenTuiWorktreesList(options: {
    readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
}): string;
/** Renders the selected worktree's paths, metadata, registry, and health lines as plaintext. */
export declare function WorktreeStackKit_serializeOpenTuiRecordDetail(options: {
    readonly record: WorktreeStackKit_OpenTuiRecordInput | null | undefined;
}): string;
/** Builds a newline-separated catalog of enabled actions for clipboard export. */
export declare function WorktreeStackKit_serializeOpenTuiActions(options: {
    readonly inventory: WorktreeStackKit_OpenTuiInventoryInput | null;
    readonly selectedRecord: WorktreeStackKit_OpenTuiRecordInput | null | undefined;
}): string;
/** Serializes global and per-record discovery issues for clipboard export. */
export declare function WorktreeStackKit_serializeOpenTuiIssues(options: {
    readonly globalIssues: readonly WorktreeStackKit_OpenTuiIssueInput[];
    readonly label: string;
    readonly recordIssues: readonly WorktreeStackKit_OpenTuiIssueInput[];
}): string;
//# sourceMappingURL=opentui-shell-serializers.d.ts.map