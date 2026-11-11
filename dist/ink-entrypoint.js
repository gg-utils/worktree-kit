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
import { render as renderInk } from "ink";
import { WorktreeStackKit_getInkHelpText, WorktreeStackKit_parseInkLaunchOptions, } from "./ink-launch-options.js";
const WORKTREE_STACK_KIT_INK_ALTERNATE_SCREEN_ENTER = "\x1b[?1049h";
const WORKTREE_STACK_KIT_INK_ALTERNATE_SCREEN_EXIT = "\x1b[?1049l";
/** Resolves whether the entrypoint should print help, fail early, or render Ink. */
export function WorktreeStackKit_resolveInkEntrypointRequest({ argv, stdinIsTty, stdoutIsTty, }) {
    try {
        const parsedOptions = WorktreeStackKit_parseInkLaunchOptions([...argv]);
        if (parsedOptions.helpRequested) {
            return {
                exitCode: 0,
                helpText: WorktreeStackKit_getInkHelpText(),
                kind: "worktree-stack-ink-entrypoint-request-help",
            };
        }
        if (!stdoutIsTty || !stdinIsTty) {
            return {
                exitCode: 1,
                kind: "worktree-stack-ink-entrypoint-request-error",
                message: "worktrees:cli:ink requires an interactive TTY.",
            };
        }
        return {
            kind: "worktree-stack-ink-entrypoint-request-launch",
            launchTarget: parsedOptions.target,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            exitCode: 1,
            kind: "worktree-stack-ink-entrypoint-request-error",
            message,
        };
    }
}
/** Maps the opt-in environment flag to Ink's kitty keyboard mode. */
export function WorktreeStackKit_resolveInkKittyKeyboardMode(env) {
    return env.WORKTREE_INK_KITTY_KEYBOARD === "1" ? "auto" : "disabled";
}
/** Returns stdout with measured dimensions when the host TTY reports missing/zero values. */
export function WorktreeStackKit_resolveInkStdoutForRender({ measureTerminalSize, stdout, }) {
    if (!stdout.isTTY) {
        return stdout;
    }
    let measured;
    try {
        measured = measureTerminalSize();
    }
    catch {
        measured = { columns: 80, rows: 24 };
    }
    const rows = typeof stdout.rows === "number" && stdout.rows > 0
        ? stdout.rows
        : measured.rows;
    const columns = typeof stdout.columns === "number" && stdout.columns > 0
        ? stdout.columns
        : measured.columns;
    if (stdout.rows === rows && stdout.columns === columns) {
        return stdout;
    }
    return new Proxy(stdout, {
        get(target, prop, receiver) {
            if (prop === "rows") {
                return rows;
            }
            if (prop === "columns") {
                return columns;
            }
            return Reflect.get(target, prop, receiver);
        },
    });
}
/** Runs the worktree Ink entrypoint and returns the process exit code to expose. */
export async function WorktreeStackKit_runInkEntrypoint({ appComponent, argv, cwd, env, measureTerminalSize, stderr, stdin, stdout, }) {
    const request = WorktreeStackKit_resolveInkEntrypointRequest({
        argv,
        stdinIsTty: Boolean(stdin.isTTY),
        stdoutIsTty: Boolean(stdout.isTTY),
    });
    if (request.kind === "worktree-stack-ink-entrypoint-request-error") {
        stderr.write(`${request.message}\n`);
        return request.exitCode;
    }
    if (request.kind === "worktree-stack-ink-entrypoint-request-help") {
        stdout.write(`${request.helpText}\n`);
        return request.exitCode;
    }
    stdout.write(WORKTREE_STACK_KIT_INK_ALTERNATE_SCREEN_ENTER);
    try {
        const { waitUntilExit } = renderInk(React.createElement(appComponent, {
            launchTarget: request.launchTarget,
            projectRoot: cwd,
        }), {
            kittyKeyboard: {
                mode: WorktreeStackKit_resolveInkKittyKeyboardMode(env),
            },
            stdout: WorktreeStackKit_resolveInkStdoutForRender({
                measureTerminalSize,
                stdout,
            }),
        });
        await waitUntilExit();
    }
    finally {
        stdout.write(WORKTREE_STACK_KIT_INK_ALTERNATE_SCREEN_EXIT);
    }
    return 0;
}
