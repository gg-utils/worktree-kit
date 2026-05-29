/**
 * @fileoverview Reusable readline-backed terminal session for worktree interactive CLIs.
 *
 * Flow: CLI entrypoint -> interactive stdio guard -> session helpers -> caller-provided prompt
 * flow. Project adapters own menu content and command behavior; this package owns terminal
 * styling, prompt validation, cancellation, and entrypoint cleanup.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/interactive-session.unit.test.ts
 *
 * @see packages/worktree-kit/src/index.ts - Package barrel that re-exports this module alongside other `@gg-utils/worktree-kit` primitives used by project-owned worktree adapters.
 * @see packages/worktree-kit/src/interactive-session.unit.test.ts - Node `node:test` regression module asserting the stable cancellation sentinel and related contracts owned by this session implementation.
 * @see scripts/worktree-stack/ui/cli-interactive/framework.ts - Root worktree-stack interactive CLI layer that imports `@gg-utils/worktree-kit/interactive-session` for readline-backed prompts shared with legacy adapter wiring.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Thrown when the operator aborts an interactive prompt via Ctrl+C or equivalent. */
export declare class WorktreeInteractiveCancelledError extends Error {
    /**
     * Constructs the stable cancellation sentinel used across interactive prompts.
     *
     * @remarks
     * Message is fixed so callers can branch on `instanceof` without parsing text.
     */
    constructor();
}
/** Stateful readline-backed terminal session with styled output helpers for worktree flows. */
export declare class WorktreeInteractiveSession {
    private cancelled;
    private readonly interface;
    private readonly styleEnabled;
    /**
     * Binds readline to stderr and arms SIGINT so prompts can surface cancellation consistently.
     *
     * @remarks
     * I/O: stdin/stdout ownership is unchanged; prompts render on stderr like other session output.
     */
    constructor();
    /**
     * Releases the readline interface and stdin listeners.
     *
     * @remarks
     * Safe to call more than once; subsequent writes should not assume an open session.
     */
    close(): void;
    /**
     * Clears the terminal viewport when stdout is a TTY.
     *
     * @remarks
     * I/O: emits a full reset sequence on stderr; no-op when not a TTY.
     */
    clearScreen(): void;
    /**
     * Renders the magenta-bordered banner line for the active flow family and focus label.
     *
     * @remarks
     * Width follows `frameWidth` so headers align with panels and menus in the same session.
     */
    printHeader(family: string, focus: string): void;
    /**
     * Draws a cyan panel frame with optional subtitle microcopy inside the box.
     *
     * @remarks
     * Subtitle lines truncate to the inner width to keep borders rectangular on narrow terminals.
     */
    printPanelTitle(title: string, subtitle?: string): void;
    /**
     * Prints a numbered menu row with aligned label and description columns.
     *
     * @remarks
     * When styling is disabled, emits plain text so logs and CI captures stay readable.
     */
    printMenuItem(number: string | number, label: string, description: string): void;
    /**
     * Emphasized magenta one-liner for transitions or call-to-action lines.
     */
    printKicker(text: string): void;
    /**
     * Secondary blue guidance line beneath headers or panels.
     */
    printMicrocopy(text: string): void;
    /**
     * Visual separator between major sections within the same screen.
     */
    printSectionBreak(): void;
    /**
     * Bulleted note rendered in blue with a leading bullet glyph.
     */
    printNote(text: string): void;
    /**
     * Positive-outcome line styled in bold green.
     */
    printSuccess(text: string): void;
    /**
     * Non-fatal advisory line styled in bold yellow.
     */
    printWarning(text: string): void;
    /**
     * Validation or failure feedback styled in bold red without throwing.
     */
    printError(text: string): void;
    /**
     * Highlights a shell command the operator should run outside the menu.
     */
    printCommand(text: string): void;
    /**
     * Prompts for a single-line answer using readline, honoring cancellation state.
     *
     * @remarks
     * I/O: question text is yellow on stderr; trims leading/trailing whitespace from answers.
     *
     * @throws WorktreeInteractiveCancelledError When SIGINT fires or the interface closes mid-prompt.
     */
    promptReadLine(promptText: string): Promise<string>;
    /**
     * Prompts for text, returning `defaultValue` when the operator accepts the empty default.
     *
     * @remarks
     * Reuses `promptReadLine`, so cancellation semantics match other prompts.
     */
    promptWithDefault(promptText: string, defaultValue: string): Promise<string>;
    /**
     * Loops until a non-empty trimmed answer is provided, surfacing validation errors inline.
     *
     * @remarks
     * Blocking: awaits readline each iteration; safe for human-paced CLI use only.
     */
    promptRequired(promptText: string): Promise<string>;
    /**
     * Parses decimal integers until a value greater than zero is entered or defaulted.
     *
     * @remarks
     * Uses `parseInt` base 10; rejects floats, zero, negatives, and non-numeric input with retries.
     */
    promptPositiveIntegerWithDefault(promptText: string, defaultValue: number): Promise<number>;
    /**
     * Collects a yes/no answer with a highlighted default suffix and tolerant synonyms.
     *
     * @remarks
     * Empty input commits to `defaultValue`; `yes`/`no` spellings are accepted case-insensitively.
     */
    promptYesNo(promptText: string, defaultValue: "n" | "y"): Promise<boolean>;
    /**
     * Validates a 1-based menu index against `options.max`, retrying until in range.
     *
     * @remarks
     * Returns the selected display number, not a zero-based array index.
     */
    promptMenuSelection(options: {
        max: number;
        prompt: string;
    }): Promise<number>;
    /**
     * Pauses readline input while an external subprocess owns the TTY.
     *
     * @remarks
     * Pair with `resumeAfterCommand` to avoid stdin races with child shells.
     */
    pauseForCommand(): void;
    /**
     * Resumes readline after an external command relinquishes stdin.
     */
    resumeAfterCommand(): void;
    /**
     * Chooses a stable frame width between sensible minimums and a hard cap.
     *
     * @remarks
     * Uses stdout column count when available so layouts respect narrow terminals.
     */
    private frameWidth;
    /**
     * Truncates text to `width` characters, preserving an ellipsis tail when space allows.
     *
     * @remarks
     * PURITY: no I/O; returns empty string when `width` is non-positive.
     */
    private truncate;
    /**
     * Pads `text` on the right to exactly `width` using spaces.
     *
     * @remarks
     * PURITY: delegates to `String.prototype.padEnd`.
     */
    private padRight;
    /**
     * Wraps `text` with ANSI color (and optional bold) when styling is enabled.
     *
     * @remarks
     * Returns plain `text` when `NO_COLOR` is set or stdout/stderr are not both TTYs.
     */
    private decorate;
    /**
     * Writes a single line to stderr with a trailing newline.
     *
     * @remarks
     * I/O: synchronous `process.stderr.write` for immediate menu rendering.
     */
    private writeLine;
}
/**
 * Validates that stdin/stdout are TTYs before launching interactive menus.
 *
 * @throws {Error} When stdin or stdout is not a TTY, which would break readline prompting.
 */
export declare function worktreeInteractiveEnsureInteractiveStdio(): void;
/**
 * Boots a `WorktreeInteractiveSession`, runs the provided flow, and maps cancellation to exit code 130.
 *
 * @remarks
 * I/O: Always closes the readline interface in `finally` to release stdin listeners.
 */
export declare function worktreeInteractiveRunEntryPoint(run: (session: WorktreeInteractiveSession) => Promise<void>): Promise<void>;
//# sourceMappingURL=interactive-session.d.ts.map