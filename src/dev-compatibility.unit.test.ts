/**
 * @fileoverview Unit tests for the injectable legacy worktree dev compatibility runner.
 *
 * This file owns regression coverage for `WorktreeStackKit_runDevCompatibility`, asserting warning
 * emission order and unchanged argv forwarding into the injected start command.
 * Flow: stub runtime -> invoke runner -> assert emitted warnings and forwarded argv snapshots.
 *
 * @example
 * ```typescript
 * import assert from "node:assert/strict";
 * import { it } from "node:test";
 *
 * import { WorktreeStackKit_runDevCompatibility } from "./dev-compatibility.js";
 *
 * it("prints the compatibility warning and forwards arguments unchanged", () => {
 *   const exitCode = WorktreeStackKit_runDevCompatibility({
 *     forwardedArgs: ["--help"],
 *     runtime: { emitLine: () => {}, runStartCommand: () => 0 },
 *     warningLines: ["[warn] worktrees:dev is a compatibility alias."],
 *   });
 *   assert.equal(exitCode, 0);
 * });
 * ```
 *
 * @testing Node.js test runner: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/dev-compatibility.unit.test.ts
 * @testing Node.js test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/dev-compatibility.ts - Injectable compatibility runner under test that prints configured warning lines then delegates argv to the start command hook.
 * @see scripts/worktree-stack/integrations/dev.ts - Worktree-stack integration entrypoint that wires WorktreeStackKit_runDevCompatibilityCli to the real start command for legacy dev aliases.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { WorktreeStackKit_runDevCompatibility } from "./dev-compatibility.js";

const warningLines = [
  "[warn] worktrees:dev is a compatibility alias.",
  "[warn] Use worktrees:start instead.",
] as const;

describe("WorktreeStackKit_runDevCompatibility", () => {
  it("prints the compatibility warning and forwards arguments unchanged", () => {
    const emittedLines: string[] = [];
    const forwardedCalls: string[][] = [];

    const exitCode = WorktreeStackKit_runDevCompatibility({
      forwardedArgs: ["--help", "--worktree", "/tmp/example-worktree"],
      runtime: {
        emitLine: (line) => {
          emittedLines.push(line);
        },
        runStartCommand: (forwardedArgs) => {
          forwardedCalls.push([...forwardedArgs]);
          return 0;
        },
      },
      warningLines,
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(emittedLines, [...warningLines]);
    assert.deepEqual(forwardedCalls, [
      ["--help", "--worktree", "/tmp/example-worktree"],
    ]);
  });
});
