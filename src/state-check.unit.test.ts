/**
 * @fileoverview Verifies argv parsing, git output parsers, submodule status cells, and matrix row
 * builders for the config-driven worktree state-check runner.
 *
 * This file owns Node `node:test` regression coverage for pure helpers and the `--help` path on
 * `WorktreeStackKit_runStateCheckCommand` imported from `state-check.ts`, using synthetic command
 * results instead of live git subprocesses.
 * Flow: build `WorktreeStateCheck_CommandResult` fixtures -> assert parsers, formatters, and row
 * projections stay aligned with the printed matrix contract.
 *
 * @testing Node.js test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/state-check.unit.test.ts
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root (package script runs tsx --test over worktree-kit unit tests, including this file).
 *
 * @see packages/worktree-kit/src/state-check.ts - State-check runner module whose `WorktreeStateCheck_*` parsers, formatters, and `WorktreeStackKit_runStateCheckCommand` entrypoint are exercised here with injected stdout and stderr fixtures.
 * @see scripts/worktree-stack/commands/state-check.ts - Local-edge CLI adapter that resolves checkout context and forwards argv into `WorktreeStackKit_runStateCheckCommand`, providing the integration surface adjacent to these unit assertions.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_runStateCheckCommand,
  WorktreeStateCheck_buildRootRowFromState,
  WorktreeStateCheck_formatRevListResult,
  WorktreeStateCheck_parseArgs,
  WorktreeStateCheck_parseAheadBehind,
  WorktreeStateCheck_parseStatusV2,
  WorktreeStateCheck_parseSubmoduleStatusOutput,
  WorktreeStateCheck_resolveSubmoduleStatusFromState,
  type WorktreeStackKit_StateCheckConfig,
  type WorktreeStateCheck_CommandResult,
  type WorktreeStateCheck_RepoState,
} from "./state-check.js";

function createCommandResult(options: {
  ok: boolean;
  stderr?: string;
  stdout?: string;
}): WorktreeStateCheck_CommandResult {
  return {
    ok: options.ok,
    status: options.ok ? 0 : 1,
    stderr: options.stderr ?? "",
    stdout: options.stdout ?? "",
  };
}

function createConfig(): WorktreeStackKit_StateCheckConfig {
  return {
    canonicalRootBranch: "main",
    developmentBranch: "development",
    repoRoot: "/workspace/root",
    resolveContext: () => ({
      checkoutType: "canonical-root-workspace",
      expectedRootBranch: "main",
      expectedSubmoduleBranch: "main",
      metadataError: null,
      metadataPath: null,
      metadataState: "absent",
    }),
    usageCommand: "state-check [--fetch]",
  };
}

test("WorktreeStateCheck_parseArgs parses fetch and help flags", () => {
  assert.deepEqual(WorktreeStateCheck_parseArgs(["--fetch"]), {
    fetch: true,
    help: false,
  });
  assert.deepEqual(WorktreeStateCheck_parseArgs(["--help"]), {
    fetch: false,
    help: true,
  });
});

test("WorktreeStateCheck_parseStatusV2 extracts branch and dirtiness", () => {
  assert.deepEqual(
    WorktreeStateCheck_parseStatusV2(
      createCommandResult({
        ok: true,
        stdout: "# branch.head feature/demo\n1 .M N... file.txt\n",
      }),
    ),
    { branch: "feature/demo", dirty: true },
  );
  assert.deepEqual(
    WorktreeStateCheck_parseStatusV2(
      createCommandResult({ ok: true, stdout: "# branch.head (detached)\n" }),
    ),
    { branch: "DETACHED", dirty: false },
  );
});

test("WorktreeStateCheck_formatRevListResult maps counts and missing refs", () => {
  assert.deepEqual(WorktreeStateCheck_parseAheadBehind("2\t3\n"), {
    ahead: 2,
    behind: 3,
  });
  assert.equal(
    WorktreeStateCheck_formatRevListResult(
      createCommandResult({ ok: true, stdout: "2 3\n" }),
    ),
    "a2/b3",
  );
  assert.equal(
    WorktreeStateCheck_formatRevListResult(
      createCommandResult({ ok: false, stderr: "bad revision" }),
    ),
    "MISSING",
  );
});

test("WorktreeStateCheck_parseSubmoduleStatusOutput records path prefixes", () => {
  assert.deepEqual(
    WorktreeStateCheck_parseSubmoduleStatusOutput(
      createCommandResult({
        ok: true,
        stdout:
          " 123456 packages/one (heads/main)\n+abcdef packages/two (heads/main)\n",
      }),
    ),
    new Map([
      ["packages/one", " "],
      ["packages/two", "+"],
    ]),
  );
});

test("WorktreeStateCheck_resolveSubmoduleStatusFromState formats status cells", () => {
  const cleanState: WorktreeStateCheck_RepoState = {
    actualCheckout: "main",
    isDirty: false,
    vsOriginCurrent: "a0/b0",
    vsOriginDevelopment: "a1/b2",
    vsOriginMain: "a0/b0",
  };

  assert.equal(
    WorktreeStateCheck_resolveSubmoduleStatusFromState(" ", cleanState),
    "OK",
  );
  assert.equal(
    WorktreeStateCheck_resolveSubmoduleStatusFromState("+", cleanState),
    "POINTER MISMATCH",
  );
  assert.equal(
    WorktreeStateCheck_resolveSubmoduleStatusFromState("-", cleanState),
    "NOT INIT",
  );
});

test("WorktreeStateCheck_buildRootRowFromState applies expected checkout context", () => {
  assert.deepEqual(
    WorktreeStateCheck_buildRootRowFromState(
      {
        actualCheckout: "main",
        isDirty: false,
        vsOriginCurrent: "a0/b0",
        vsOriginDevelopment: "a1/b2",
        vsOriginMain: "a0/b0",
      },
      createConfig().resolveContext("/workspace/root"),
    ),
    {
      actualCheckout: "main",
      configuredBranch: "N/A",
      expectedCheckout: "main",
      kind: "root",
      repo: ".",
      status: "OK",
      vsOriginCurrent: "a0/b0",
      vsOriginDevelopment: "a1/b2",
      vsOriginMain: "a0/b0",
    },
  );
});

test("WorktreeStackKit_runStateCheckCommand prints configured help", async () => {
  const originalLog = console.log;
  const lines: string[] = [];
  try {
    console.log = (message?: unknown) => {
      lines.push(String(message ?? ""));
    };
    assert.equal(
      await WorktreeStackKit_runStateCheckCommand({
        argv: ["--help"],
        config: createConfig(),
      }),
      0,
    );
  } finally {
    console.log = originalLog;
  }

  assert.match(lines.join("\n"), /Usage: state-check \[--fetch\]/u);
});
