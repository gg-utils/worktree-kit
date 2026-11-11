/**
 * @fileoverview Reusable UI command builders for worktree-stack launch surfaces.
 *
 * Ink, OpenTUI, and numbered interactive adapters collect user input in script-owned view
 * components. This package module owns the pure argv construction, command preview formatting, and
 * generic spawn handoff so those adapters can stay thin while project config still owns which npm
 * scripts and compatibility command paths are exposed.
 *
 * @testing Node test: npm run worktree-kit:test from the repository root executes packages/worktree-kit unit tests via tsx --test (package.json test glob includes ui-command-catalog.unit.test.ts).
 *
 * @see packages/worktree-kit/src/interactive-flows.ts - Numbered/Ink interactive flows that import command specs, preview formatters, and synchronous spawn dispatch from this module after prompts resolve.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI controller wiring that composes argv builders and npm/tsx preview strings exported here for stack maintenance invocations.
 * @see packages/worktree-kit/src/ui-command-catalog.unit.test.ts - Node test module that asserts argv mapping, preview text, and spawn argv wiring for the exported helpers.
 * @see docs/COMMANDS.md - Platform command catalog documenting worktrees CLIs and where `@gg-utils/worktree-kit/ui-command-catalog` fits in the interactive OpenTUI and script surfaces.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Discriminated spawn plan for either an npm script or a direct `tsx` command file. */
export type WorktreeStackKit_UiCommandSpec = {
    args: string[];
    kind: "npm";
    script: string;
} | {
    args: string[];
    kind: "tsx";
    scriptPath: string;
};
/** Field bundle gathered from interactive prompts before forwarding to `worktrees:create`. */
export type WorktreeStackKit_UiCreateOptions = {
    baseBranch: string;
    copyEnvFromMain: boolean;
    installDependencies: boolean;
    installPreferOnline: boolean;
    installSkipExisting: boolean;
    openWindsurf: boolean;
    rootBranch: string;
    slot: number;
    stackName: string;
    startMode: "iterm" | "none" | "terminal";
    submoduleBranch: string;
    worktreesBase: string;
};
/** Refresh semantics forwarded to update-from-main workflows. */
export type WorktreeStackKit_UiUpdateMode = "live-worktree" | "pushed-only";
/** Whether UI flows should stop at a plan preview or execute/push. */
export type WorktreeStackKit_UiExecutionMode = "plan" | "push";
/** Form model capturing user-supplied create-form fields for OpenTUI create flows. */
export type WorktreeStackKit_UiCreateFormModel = {
    baseBranch: string;
    copyEnvFromMain: boolean;
    installPreferOffline: boolean;
    installSkipExisting: boolean;
    metadataSource: string;
    openWindsurf: boolean;
    realm: string;
    rootBranch: string;
    runInstall: boolean;
    slot: string;
    stackName: string;
    startMode: "iterm" | "none" | "terminal";
    submoduleBranch: string;
    worktreePathOverride: string;
    worktreesBase: string;
};
/** Form model capturing user-supplied switch-form fields for OpenTUI switch flows. */
export type WorktreeStackKit_UiSwitchFormModel = {
    prefix: string;
    stackName: string;
    worktreesBase: string;
};
/** Builds forwarded args for `worktrees:create` from structured interactive answers. */
export declare function WorktreeStackKit_buildUiCreateArgs(options: WorktreeStackKit_UiCreateOptions): string[];
/** Builds forwarded args for `worktrees:start`, including optional editor opt-in. */
export declare function WorktreeStackKit_buildUiStartArgs(options: {
    openWindsurf: boolean;
    worktreePath: string;
}): string[];
/** Builds forwarded args for `worktrees:update-from-main`. */
export declare function WorktreeStackKit_buildUiUpdateFromMainArgs(options: {
    executionMode: WorktreeStackKit_UiExecutionMode;
    mode: WorktreeStackKit_UiUpdateMode;
    targetBranch: string;
    worktreePath: string;
}): string[];
/** Builds forwarded args for `worktrees:merge`. */
export declare function WorktreeStackKit_buildUiMergeArgs(options: {
    executionMode: WorktreeStackKit_UiExecutionMode;
    targetBranch: string;
    worktreePath: string;
}): string[];
/** Builds forwarded args for `worktrees:destroy`, optionally requesting prune. */
export declare function WorktreeStackKit_buildUiDestroyArgs(options: {
    prune: boolean;
    worktreePath: string;
}): string[];
/** Builds forwarded args for previewing the next pooled realm from a stack-name seed. */
export declare function WorktreeStackKit_buildUiPoolNextArgs(stackName: string): string[];
/** Shell-quotes a preview token only when needed for unambiguous display. */
export declare function WorktreeStackKit_quoteUiCommandToken(token: string): string;
/** Formats an npm run command string with optional forwarded args. */
export declare function WorktreeStackKit_formatUiNpmRunCommand(options: {
    forwardedArgs: readonly string[];
    npmScript: string;
}): string;
/** Formats an `npx tsx <script>` command string with shell-safe argv. */
export declare function WorktreeStackKit_formatUiTsxCommand(options: {
    args: readonly string[];
    repoRoot: string;
    scriptPath: string;
}): string;
/** Produces a human-readable preview string for the command about to run. */
export declare function WorktreeStackKit_formatUiCommandPreview(options: {
    repoRoot: string;
    spec: WorktreeStackKit_UiCommandSpec;
}): string;
/** Synchronously executes a UI command spec with inherited stdio inside `repoRoot`. */
export declare function WorktreeStackKit_runUiCommand(options: {
    repoRoot: string;
    spec: WorktreeStackKit_UiCommandSpec;
}): void;
/** Builds argv for `worktrees:create` from an OpenTUI create form. */
export declare function WorktreeStackKit_buildOpenTuiCreateArgv(model: WorktreeStackKit_UiCreateFormModel): string[];
/** Builds forwarded argv for the worktree repair npm-script from UI state. */
export declare function WorktreeStackKit_buildOpenTuiRepairArgv(options: {
    dryRun: boolean;
    includePackageEnv: boolean;
    legacyMissingOnlyAlias: boolean;
    worktreeLines: string;
}): string[];
/** Builds argv for `worktrees:switch` from the OpenTUI switch form. */
export declare function WorktreeStackKit_buildOpenTuiSwitchArgv(model: WorktreeStackKit_UiSwitchFormModel): string[];
/** Splits comma/newline separated UI path buffers into trimmed non-empty path tokens. */
export declare function WorktreeStackKit_splitUiPathLines(rawValue: string): string[];
/** Builds the `--source-workspace` / `--worktree` argv fragments consumed by sync commands. */
export declare function WorktreeStackKit_buildOpenTuiSyncArgv(options: {
    sourceWorkspace: string;
    worktreeLines: string;
}): string[];
