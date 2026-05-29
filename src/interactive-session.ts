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

import readline from "node:readline/promises";

/**
 * Named ANSI foreground colors supported by session styling helpers.
 *
 * @remarks
 * Kept narrow so `decorate` cannot receive arbitrary strings at compile time.
 */
type WorktreeInteractive_ColorName =
  | "blue"
  | "cyan"
  | "green"
  | "magenta"
  | "red"
  | "yellow";

const WORKTREE_INTERACTIVE_COLOR_CODES: Record<
  WorktreeInteractive_ColorName | "bold" | "reset",
  string
> = {
  blue: "\u001B[34m",
  bold: "\u001B[1m",
  cyan: "\u001B[36m",
  green: "\u001B[32m",
  magenta: "\u001B[35m",
  red: "\u001B[31m",
  reset: "\u001B[0m",
  yellow: "\u001B[33m",
};

/** Thrown when the operator aborts an interactive prompt via Ctrl+C or equivalent. */
export class WorktreeInteractiveCancelledError extends Error {
  /**
   * Constructs the stable cancellation sentinel used across interactive prompts.
   *
   * @remarks
   * Message is fixed so callers can branch on `instanceof` without parsing text.
   */
  constructor() {
    super("Interactive flow cancelled.");
  }
}

/** Stateful readline-backed terminal session with styled output helpers for worktree flows. */
export class WorktreeInteractiveSession {
  private cancelled = false;

  private readonly interface = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });

  private readonly styleEnabled =
    process.stdout.isTTY &&
    process.stderr.isTTY &&
    process.env.NO_COLOR === undefined;

  /**
   * Binds readline to stderr and arms SIGINT so prompts can surface cancellation consistently.
   *
   * @remarks
   * I/O: stdin/stdout ownership is unchanged; prompts render on stderr like other session output.
   */
  constructor() {
    this.interface.on("SIGINT", () => {
      this.cancelled = true;
      this.interface.close();
    });
  }

  /**
   * Releases the readline interface and stdin listeners.
   *
   * @remarks
   * Safe to call more than once; subsequent writes should not assume an open session.
   */
  close(): void {
    this.interface.close();
  }

  /**
   * Clears the terminal viewport when stdout is a TTY.
   *
   * @remarks
   * I/O: emits a full reset sequence on stderr; no-op when not a TTY.
   */
  clearScreen(): void {
    if (process.stdout.isTTY) {
      process.stderr.write("\u001Bc");
    }
  }

  /**
   * Renders the magenta-bordered banner line for the active flow family and focus label.
   *
   * @remarks
   * Width follows `frameWidth` so headers align with panels and menus in the same session.
   */
  printHeader(family: string, focus: string): void {
    const width = this.frameWidth();
    this.writeLine("");
    this.writeLine(this.decorate("magenta", "=".repeat(width), true));
    this.writeLine(
      this.decorate(
        "magenta",
        `WORKTREE STACK // ${family} // ${focus}`.padEnd(width, " "),
        true,
      ),
    );
    this.writeLine(this.decorate("magenta", "=".repeat(width), true));
  }

  /**
   * Draws a cyan panel frame with optional subtitle microcopy inside the box.
   *
   * @remarks
   * Subtitle lines truncate to the inner width to keep borders rectangular on narrow terminals.
   */
  printPanelTitle(title: string, subtitle = ""): void {
    const width = this.frameWidth();
    const innerWidth = Math.max(20, width - 4);
    this.writeLine("");
    this.writeLine(this.decorate("cyan", `+${"-".repeat(width - 2)}+`, true));
    this.writeLine(
      this.decorate("cyan", `| ${this.padRight(title, innerWidth)} |`, true),
    );
    if (subtitle.length > 0) {
      this.writeLine(
        this.decorate(
          "blue",
          `| ${this.padRight(this.truncate(subtitle, innerWidth), innerWidth)} |`,
        ),
      );
    }
    this.writeLine(this.decorate("cyan", `+${"-".repeat(width - 2)}+`, true));
  }

  /**
   * Prints a numbered menu row with aligned label and description columns.
   *
   * @remarks
   * When styling is disabled, emits plain text so logs and CI captures stay readable.
   */
  printMenuItem(
    number: string | number,
    label: string,
    description: string,
  ): void {
    const width = this.frameWidth();
    const innerWidth = Math.max(20, width - 8);
    const labelWidth = Math.min(26, Math.max(10, Math.floor(innerWidth / 2)));
    const descriptionWidth = Math.max(10, innerWidth - labelWidth - 3);
    const numberText = String(number).padStart(2, " ");
    const labelText = this.padRight(
      this.truncate(label, labelWidth),
      labelWidth,
    );
    const descriptionText = this.padRight(
      this.truncate(description, descriptionWidth),
      descriptionWidth,
    );
    const line = `  ${numberText}  ${labelText}  ${descriptionText}`;
    if (!this.styleEnabled) {
      this.writeLine(line);
      return;
    }
    this.writeLine(
      [
        "  ",
        this.decorate("magenta", numberText, true),
        "  ",
        this.decorate("cyan", labelText, true),
        "  ",
        this.decorate("blue", descriptionText),
      ].join(""),
    );
  }

  /**
   * Emphasized magenta one-liner for transitions or call-to-action lines.
   */
  printKicker(text: string): void {
    this.writeLine(this.decorate("magenta", text, true));
  }

  /**
   * Secondary blue guidance line beneath headers or panels.
   */
  printMicrocopy(text: string): void {
    this.writeLine(this.decorate("blue", text));
  }

  /**
   * Visual separator between major sections within the same screen.
   */
  printSectionBreak(): void {
    this.writeLine(this.decorate("cyan", `  ${".".repeat(18)}`));
  }

  /**
   * Bulleted note rendered in blue with a leading bullet glyph.
   */
  printNote(text: string): void {
    this.writeLine(this.decorate("blue", `  • ${text}`));
  }

  /**
   * Positive-outcome line styled in bold green.
   */
  printSuccess(text: string): void {
    this.writeLine(this.decorate("green", text, true));
  }

  /**
   * Non-fatal advisory line styled in bold yellow.
   */
  printWarning(text: string): void {
    this.writeLine(this.decorate("yellow", text, true));
  }

  /**
   * Validation or failure feedback styled in bold red without throwing.
   */
  printError(text: string): void {
    this.writeLine(this.decorate("red", text, true));
  }

  /**
   * Highlights a shell command the operator should run outside the menu.
   */
  printCommand(text: string): void {
    this.writeLine(this.decorate("yellow", `Command: ${text}`, true));
  }

  /**
   * Prompts for a single-line answer using readline, honoring cancellation state.
   *
   * @remarks
   * I/O: question text is yellow on stderr; trims leading/trailing whitespace from answers.
   *
   * @throws WorktreeInteractiveCancelledError When SIGINT fires or the interface closes mid-prompt.
   */
  async promptReadLine(promptText: string): Promise<string> {
    try {
      const answer = await this.interface.question(
        this.decorate("yellow", promptText, true),
      );
      if (this.cancelled) {
        throw new WorktreeInteractiveCancelledError();
      }
      return answer.trim();
    } catch (error) {
      if (this.cancelled) {
        throw new WorktreeInteractiveCancelledError();
      }
      throw error;
    }
  }

  /**
   * Prompts for text, returning `defaultValue` when the operator accepts the empty default.
   *
   * @remarks
   * Reuses `promptReadLine`, so cancellation semantics match other prompts.
   */
  async promptWithDefault(
    promptText: string,
    defaultValue: string,
  ): Promise<string> {
    const answer = await this.promptReadLine(
      `${promptText} [${defaultValue}]: `,
    );
    return answer.length > 0 ? answer : defaultValue;
  }

  /**
   * Loops until a non-empty trimmed answer is provided, surfacing validation errors inline.
   *
   * @remarks
   * Blocking: awaits readline each iteration; safe for human-paced CLI use only.
   */
  async promptRequired(promptText: string): Promise<string> {
    for (;;) {
      const answer = await this.promptReadLine(`${promptText}: `);
      if (answer.length > 0) {
        return answer;
      }
      this.printError("A value is required.");
    }
  }

  /**
   * Parses decimal integers until a value greater than zero is entered or defaulted.
   *
   * @remarks
   * Uses `parseInt` base 10; rejects floats, zero, negatives, and non-numeric input with retries.
   */
  async promptPositiveIntegerWithDefault(
    promptText: string,
    defaultValue: number,
  ): Promise<number> {
    for (;;) {
      const answer = await this.promptWithDefault(
        promptText,
        String(defaultValue),
      );
      const parsed = Number.parseInt(answer, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
      this.printError("Enter a positive integer.");
    }
  }

  /**
   * Collects a yes/no answer with a highlighted default suffix and tolerant synonyms.
   *
   * @remarks
   * Empty input commits to `defaultValue`; `yes`/`no` spellings are accepted case-insensitively.
   */
  async promptYesNo(
    promptText: string,
    defaultValue: "n" | "y",
  ): Promise<boolean> {
    const defaultSuffix = defaultValue === "y" ? "Y/n" : "y/N";
    for (;;) {
      const answer = await this.promptReadLine(
        `${promptText} [${defaultSuffix}]: `,
      );
      if (answer.length === 0) {
        return defaultValue === "y";
      }
      const lowered = answer.toLowerCase();
      if (lowered === "y" || lowered === "yes") {
        return true;
      }
      if (lowered === "n" || lowered === "no") {
        return false;
      }
      this.printError("Answer y or n.");
    }
  }

  /**
   * Validates a 1-based menu index against `options.max`, retrying until in range.
   *
   * @remarks
   * Returns the selected display number, not a zero-based array index.
   */
  async promptMenuSelection(options: {
    max: number;
    prompt: string;
  }): Promise<number> {
    for (;;) {
      const answer = await this.promptReadLine(options.prompt);
      const selectedIndex = Number.parseInt(answer, 10);
      if (
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 1 &&
        selectedIndex <= options.max
      ) {
        return selectedIndex;
      }
      this.printError("Choose a valid number.");
    }
  }

  /**
   * Pauses readline input while an external subprocess owns the TTY.
   *
   * @remarks
   * Pair with `resumeAfterCommand` to avoid stdin races with child shells.
   */
  pauseForCommand(): void {
    this.interface.pause();
  }

  /**
   * Resumes readline after an external command relinquishes stdin.
   */
  resumeAfterCommand(): void {
    this.interface.resume();
  }

  /**
   * Chooses a stable frame width between sensible minimums and a hard cap.
   *
   * @remarks
   * Uses stdout column count when available so layouts respect narrow terminals.
   */
  private frameWidth(): number {
    const terminalWidth =
      typeof process.stdout.columns === "number" && process.stdout.columns >= 72
        ? process.stdout.columns
        : 118;
    return terminalWidth > 124 ? 124 : terminalWidth;
  }

  /**
   * Truncates text to `width` characters, preserving an ellipsis tail when space allows.
   *
   * @remarks
   * PURITY: no I/O; returns empty string when `width` is non-positive.
   */
  private truncate(text: string, width: number): string {
    if (width <= 0) {
      return "";
    }
    if (text.length <= width) {
      return text;
    }
    if (width <= 3) {
      return text.slice(0, width);
    }
    return `${text.slice(0, width - 3)}...`;
  }

  /**
   * Pads `text` on the right to exactly `width` using spaces.
   *
   * @remarks
   * PURITY: delegates to `String.prototype.padEnd`.
   */
  private padRight(text: string, width: number): string {
    return text.padEnd(width, " ");
  }

  /**
   * Wraps `text` with ANSI color (and optional bold) when styling is enabled.
   *
   * @remarks
   * Returns plain `text` when `NO_COLOR` is set or stdout/stderr are not both TTYs.
   */
  private decorate(
    colorName: WorktreeInteractive_ColorName,
    text: string,
    bold = false,
  ): string {
    if (!this.styleEnabled) {
      return text;
    }
    const colorCodes = [WORKTREE_INTERACTIVE_COLOR_CODES[colorName]];
    if (bold) {
      colorCodes.push(WORKTREE_INTERACTIVE_COLOR_CODES.bold);
    }
    return `${colorCodes.join("")}${text}${WORKTREE_INTERACTIVE_COLOR_CODES.reset}`;
  }

  /**
   * Writes a single line to stderr with a trailing newline.
   *
   * @remarks
   * I/O: synchronous `process.stderr.write` for immediate menu rendering.
   */
  private writeLine(line: string): void {
    process.stderr.write(`${line}\n`);
  }
}

/**
 * Validates that stdin/stdout are TTYs before launching interactive menus.
 *
 * @throws {Error} When stdin or stdout is not a TTY, which would break readline prompting.
 */
export function worktreeInteractiveEnsureInteractiveStdio(): void {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "worktree cli-interactive requires an interactive TTY on stdin/stdout.",
    );
  }
}

/**
 * Boots a `WorktreeInteractiveSession`, runs the provided flow, and maps cancellation to exit code 130.
 *
 * @remarks
 * I/O: Always closes the readline interface in `finally` to release stdin listeners.
 */
export async function worktreeInteractiveRunEntryPoint(
  run: (session: WorktreeInteractiveSession) => Promise<void>,
): Promise<void> {
  worktreeInteractiveEnsureInteractiveStdio();
  const session = new WorktreeInteractiveSession();
  try {
    await run(session);
  } catch (error) {
    if (error instanceof WorktreeInteractiveCancelledError) {
      session.printWarning("Cancelled.");
      process.exitCode = 130;
      return;
    }
    throw error;
  } finally {
    session.close();
  }
}
