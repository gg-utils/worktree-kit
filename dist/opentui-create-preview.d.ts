/**
 * @fileoverview Reusable OpenTUI create-preview resolver.
 *
 * Root adapters provide project-specific port derivation, realm assignment, and environment copy;
 * this package owns the product-neutral preview branching shared by OpenTUI create flows:
 * validate slot-derived ports, honor explicit worktree paths, normalize realm assignments, build
 * default folder names, and parse realm-assignment JSON without importing root scripts or configs.
 *
 * @example
 * ```typescript
 * const previewer = WorktreeStackKit_createOpenTuiCreatePreviewer({
 *   deriveSlotPorts: (slot) => ({ api: 8000 + slot }),
 *   envSummaryMessages: { defaultPath: "copy env", explicitPath: "copy env manually" },
 *   resolveDefaultWorktreesBase: (repoRoot) => `${repoRoot}/worktrees`,
 *   resolveRealmAssignment: () => ({ assignment: { realmSlug: "worktree-01" }, ok: true }),
 * });
 * const preview = previewer.previewCreate({
 *   repoRoot: "/repo",
 *   requestedRealmSlug: "",
 *   slot: 1,
 *   stackName: "Demo",
 *   worktreePathOverride: "",
 *   worktreesBase: previewer.defaultWorktreesBase("/repo"),
 * });
 * ```
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/opentui-create-preview.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-create-preview.unit.test.ts - Jest regression coverage for realm JSON parsing, realm-pool resolver wiring, explicit-path vs default-path previews, and port derivation contracts asserted against this module.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI app controller that imports create-preview formatting helpers and result types while orchestrating the worktree-create wizard flow in the kit shell.
 * @see scripts/worktree-stack/ui/cli-opentui/lib/create-preview.ts - Root CLI adapter that binds project slot ports, env copy messaging, and realm-pool subprocess paths into the kit create-preview factory exported here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStack_CommandResult, WorktreeStack_RunCommandOptions } from "@gg-utils/worktree-core/foundation";
/** Copy shown for explicit/default create-preview branches. */
export type WorktreeStackKit_OpenTuiCreatePreviewEnvSummaryMessages = {
    readonly defaultPath: string;
    readonly explicitPath: string;
};
/** Realm assignment produced by a project adapter, usually from a realm-pool command. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignment = {
    readonly realmAssignmentSource?: string;
    readonly realmSlug: string;
};
/** Result returned by project adapters that resolve create-preview realm assignments. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignmentResult = {
    readonly assignment: WorktreeStackKit_OpenTuiCreateRealmAssignment;
    readonly ok: true;
} | {
    readonly errorMessage: string;
    readonly ok: false;
};
/** Input needed to resolve a project-specific realm assignment for create preview. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignmentRequest = {
    readonly repoRoot: string;
    readonly requestedRealmSlug: string;
    readonly stackName: string;
};
/** Synchronous command runner contract used by realm-pool preview adapters. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignmentCommandRunner = (command: string, args: readonly string[], options: WorktreeStack_RunCommandOptions) => WorktreeStack_CommandResult;
export type WorktreeStackKit_CreateOpenTuiRealmPoolAssignmentResolverOptions = {
    readonly getBaseEnv: () => NodeJS.ProcessEnv;
    readonly projectRootEnvKey: string;
    readonly realmPoolPreviewScriptPath: string;
    readonly runCommand: WorktreeStackKit_OpenTuiCreateRealmAssignmentCommandRunner;
};
/** Successful create-preview result containing the resolved worktree path, ports, and metadata. */
export type WorktreeStackKit_OpenTuiCreatePreviewOk<TPorts> = {
    readonly envSummary: string;
    readonly folderName: string;
    readonly ok: true;
    readonly ports: TPorts;
    readonly realmAssignmentSource: string;
    readonly realmSlug: string;
    readonly worktreePath: string;
};
/** Failed create-preview result containing a displayable error message. */
export type WorktreeStackKit_OpenTuiCreatePreviewErr = {
    readonly errorMessage: string;
    readonly ok: false;
};
/** Union of create-preview success and failure results. */
export type WorktreeStackKit_OpenTuiCreatePreview<TPorts> = WorktreeStackKit_OpenTuiCreatePreviewOk<TPorts> | WorktreeStackKit_OpenTuiCreatePreviewErr;
export type WorktreeStackKit_OpenTuiCreatePreviewOptions = {
    readonly dateToken?: string;
    readonly repoRoot: string;
    readonly requestedRealmSlug: string;
    readonly slot: number;
    readonly stackName: string;
    readonly worktreePathOverride: string;
    readonly worktreesBase: string;
};
export type WorktreeStackKit_CreateOpenTuiCreatePreviewerOptions<TPorts> = {
    readonly deriveSlotPorts: (slot: number) => TPorts;
    readonly envSummaryMessages: WorktreeStackKit_OpenTuiCreatePreviewEnvSummaryMessages;
    readonly resolveDefaultWorktreesBase: (repoRoot: string) => string;
    readonly resolveRealmAssignment: (options: WorktreeStackKit_OpenTuiCreateRealmAssignmentRequest) => WorktreeStackKit_OpenTuiCreateRealmAssignmentResult;
};
export type WorktreeStackKit_OpenTuiCreatePreviewer<TPorts> = {
    readonly defaultWorktreesBase: (repoRoot: string) => string;
    readonly previewCreate: (options: WorktreeStackKit_OpenTuiCreatePreviewOptions) => WorktreeStackKit_OpenTuiCreatePreview<TPorts>;
};
/** Port key/label pair used to make project-specific port bundles displayable. */
export type WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem<TPorts extends Readonly<Record<string, number>>> = {
    readonly key: keyof TPorts & string;
    readonly label: string;
};
/** Parses the JSON shape returned by a project realm-assignment command. */
export declare function WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson(stdout: string): WorktreeStackKit_OpenTuiCreateRealmAssignmentResult;
/** Builds a resolver that shells out to a project realm-pool preview command. */
export declare function WorktreeStackKit_createOpenTuiRealmPoolAssignmentResolver(options: WorktreeStackKit_CreateOpenTuiRealmPoolAssignmentResolverOptions): (request: WorktreeStackKit_OpenTuiCreateRealmAssignmentRequest) => WorktreeStackKit_OpenTuiCreateRealmAssignmentResult;
/** Resolves the read-only create preview shared by OpenTUI adapters. */
export declare function WorktreeStackKit_previewOpenTuiCreate<TPorts>(options: {
    readonly dateToken?: string;
    readonly deriveSlotPorts: (slot: number) => TPorts;
    readonly envSummaryMessages: WorktreeStackKit_OpenTuiCreatePreviewEnvSummaryMessages;
    readonly requestedRealmSlug: string;
    readonly resolveRealmAssignment: (options: {
        readonly requestedRealmSlug: string;
        readonly stackName: string;
    }) => WorktreeStackKit_OpenTuiCreateRealmAssignmentResult;
    readonly slot: number;
    readonly stackName: string;
    readonly worktreePathOverride: string;
    readonly worktreesBase: string;
}): WorktreeStackKit_OpenTuiCreatePreview<TPorts>;
/** Binds project create-preview defaults into a small adapter-facing surface. */
export declare function WorktreeStackKit_createOpenTuiCreatePreviewer<TPorts>(options: WorktreeStackKit_CreateOpenTuiCreatePreviewerOptions<TPorts>): WorktreeStackKit_OpenTuiCreatePreviewer<TPorts>;
/** Formats the create preview body rendered after the form validates. */
export declare function WorktreeStackKit_formatOpenTuiCreatePreviewText<TPorts extends Readonly<Record<string, number>>>(options: {
    readonly commandPreview: string;
    readonly portSummaryItems: readonly WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem<TPorts>[];
    readonly preview: WorktreeStackKit_OpenTuiCreatePreviewOk<TPorts>;
}): string;
//# sourceMappingURL=opentui-create-preview.d.ts.map