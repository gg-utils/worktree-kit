/**
 * @fileoverview Package-owned Bun/Ink launcher control flow for worktree CLI entrypoints.
 *
 * Flow: argv + stdio facts -> help/error/launch request -> alternate-screen Ink render. Root
 * adapters supply terminal-size measurement and the configured app component; this package owns
 * launch parsing, TTY guards, keyboard-mode selection, stdout dimension fallback, and render
 * cleanup sequencing.
 *
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (includes ink-entrypoint.unit.test.ts).
 *
 * @see packages/worktree-kit/src/ink-launch-options.ts - Parses argv into help/target flags and supplies help text that this entrypoint consumes before Ink render.
 * @see scripts/worktree-stack/ui/cli-ink/index.mts - Root worktree-stack Ink CLI that wires stdio, cwd, env, terminal-size measurement, and the Ink app component into `WorktreeStackKit_runInkEntrypoint`.
 * @see packages/worktree-kit/src/ink-entrypoint.unit.test.ts - Node test module asserting help, TTY-guard errors, and launch request shapes for `WorktreeStackKit_resolveInkEntrypointRequest`.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import { type WorktreeStackKit_InkLaunchTarget } from "./ink-launch-options.js";
/** Terminal dimensions from the host-specific measurement adapter. */
export type WorktreeStackKit_InkTerminalSize = {
    readonly columns: number;
    readonly rows: number;
};
/** Host callback used to measure terminal dimensions when stdout reports zero. */
export type WorktreeStackKit_InkTerminalSizeMeasurer = () => WorktreeStackKit_InkTerminalSize;
/** Component shape rendered by the worktree Ink entrypoint. */
export type WorktreeStackKit_InkEntrypointAppComponent = React.ComponentType<{
    readonly launchTarget: WorktreeStackKit_InkLaunchTarget | null;
    readonly projectRoot: string;
}>;
/** Parsed entrypoint action before rendering or exiting. */
export type WorktreeStackKit_InkEntrypointRequest = {
    readonly exitCode: 1;
    readonly kind: "worktree-stack-ink-entrypoint-request-error";
    readonly message: string;
} | {
    readonly exitCode: 0;
    readonly helpText: string;
    readonly kind: "worktree-stack-ink-entrypoint-request-help";
} | {
    readonly kind: "worktree-stack-ink-entrypoint-request-launch";
    readonly launchTarget: WorktreeStackKit_InkLaunchTarget | null;
};
/** Options needed to parse an Ink entrypoint request without touching terminal streams. */
export type WorktreeStackKit_ResolveInkEntrypointRequestOptions = {
    readonly argv: readonly string[];
    readonly stdinIsTty: boolean;
    readonly stdoutIsTty: boolean;
};
/** Options for resolving render-safe stdout dimensions. */
export type WorktreeStackKit_ResolveInkStdoutForRenderOptions = {
    readonly measureTerminalSize: WorktreeStackKit_InkTerminalSizeMeasurer;
    readonly stdout: NodeJS.WriteStream;
};
/** Runtime options for the package-owned worktree Ink entrypoint. */
export type WorktreeStackKit_RunInkEntrypointOptions = {
    readonly appComponent: WorktreeStackKit_InkEntrypointAppComponent;
    readonly argv: readonly string[];
    readonly cwd: string;
    readonly env: NodeJS.ProcessEnv;
    readonly measureTerminalSize: WorktreeStackKit_InkTerminalSizeMeasurer;
    readonly stderr: NodeJS.WriteStream;
    readonly stdin: NodeJS.ReadStream;
    readonly stdout: NodeJS.WriteStream;
};
/** Resolves whether the entrypoint should print help, fail early, or render Ink. */
export declare function WorktreeStackKit_resolveInkEntrypointRequest({ argv, stdinIsTty, stdoutIsTty, }: WorktreeStackKit_ResolveInkEntrypointRequestOptions): WorktreeStackKit_InkEntrypointRequest;
/** Maps the opt-in environment flag to Ink's kitty keyboard mode. */
export declare function WorktreeStackKit_resolveInkKittyKeyboardMode(env: NodeJS.ProcessEnv): "auto" | "disabled";
/** Returns stdout with measured dimensions when the host TTY reports missing/zero values. */
export declare function WorktreeStackKit_resolveInkStdoutForRender({ measureTerminalSize, stdout, }: WorktreeStackKit_ResolveInkStdoutForRenderOptions): NodeJS.WriteStream;
/** Runs the worktree Ink entrypoint and returns the process exit code to expose. */
export declare function WorktreeStackKit_runInkEntrypoint({ appComponent, argv, cwd, env, measureTerminalSize, stderr, stdin, stdout, }: WorktreeStackKit_RunInkEntrypointOptions): Promise<number>;
