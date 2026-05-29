/**
 * @fileoverview Node test coverage for pure UI command argv builders and preview formatters in
 * `worktree-stack` interactive surfaces.
 *
 * This file owns regression assertions for `WorktreeStackKit_buildUiCreateArgs`,
 * `WorktreeStackKit_formatUiNpmRunCommand`, `WorktreeStackKit_formatUiCommandPreview`,
 * `WorktreeStackKit_buildOpenTuiCreateArgv`, `WorktreeStackKit_buildOpenTuiRepairArgv`, and
 * `WorktreeStackKit_buildOpenTuiSyncArgv`, including trimming, flag selection, shell-safe quoting in
 * previews, and comma/newline splitting for multi-worktree argv expansion.
 * Flow: build representative option payloads -> invoke catalog helpers -> assert argv arrays and preview strings.
 *
 * @testing Node test runner unit: npm run worktree-kit:test from the repository root (executes packages/worktree-kit tests including packages/worktree-kit/src/ui-command-catalog.unit.test.ts).
 *
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Pure argv and preview helpers under test whose spawn-plan mapping and OpenTUI form normalization are asserted here.
 * @see packages/worktree-kit/src/interactive-flows.ts - Numbered/Ink flows that consume the formatted previews and argv shapes verified by these tests after prompts resolve.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI controller wiring that composes the argv builders and npm/tsx preview strings whose edge cases are covered here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiCreateArgv,
  WorktreeStackKit_buildOpenTuiRepairArgv,
  WorktreeStackKit_buildOpenTuiSyncArgv,
  WorktreeStackKit_buildUiCreateArgs,
  WorktreeStackKit_formatUiCommandPreview,
  WorktreeStackKit_formatUiNpmRunCommand,
} from "./ui-command-catalog.js";

test("WorktreeStackKit_buildUiCreateArgs builds interactive create args", () => {
  assert.deepEqual(
    WorktreeStackKit_buildUiCreateArgs({
      baseBranch: "main",
      copyEnvFromMain: true,
      installDependencies: true,
      installPreferOnline: true,
      installSkipExisting: false,
      openWindsurf: true,
      rootBranch: "feature/root",
      slot: 3,
      stackName: "demo",
      startMode: "iterm",
      submoduleBranch: "feature/sub",
      worktreesBase: "/tmp/worktrees",
    }),
    [
      "--name",
      "demo",
      "--slot",
      "3",
      "--base-branch",
      "main",
      "--root-branch",
      "feature/root",
      "--submodule-branch",
      "feature/sub",
      "--worktrees-base",
      "/tmp/worktrees",
      "--copy-env-from-main",
      "--install-prefer-online",
      "--open-windsurf",
      "--start-iterm",
    ],
  );
});

test("WorktreeStackKit_formatUiCommandPreview formats npm and tsx commands", () => {
  assert.equal(
    WorktreeStackKit_formatUiNpmRunCommand({
      forwardedArgs: ["--worktree", "/tmp/my worktree"],
      npmScript: "worktrees:start",
    }),
    "npm run worktrees:start -- --worktree '/tmp/my worktree'",
  );
  assert.equal(
    WorktreeStackKit_formatUiCommandPreview({
      repoRoot: "/repo",
      spec: {
        args: ["--name", "stack a"],
        kind: "tsx",
        scriptPath: "scripts/worktree-stack/commands/create.ts",
      },
    }),
    "npx tsx /repo/scripts/worktree-stack/commands/create.ts --name 'stack a'",
  );
});

test("WorktreeStackKit_buildOpenTuiCreateArgv validates and trims create forms", () => {
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiCreateArgv({
      baseBranch: " main ",
      copyEnvFromMain: false,
      installPreferOffline: false,
      installSkipExisting: true,
      metadataSource: "ui",
      openWindsurf: false,
      realm: "demo-realm",
      rootBranch: "feature/root",
      runInstall: true,
      slot: "4",
      stackName: " demo ",
      startMode: "terminal",
      submoduleBranch: "feature/sub",
      worktreePathOverride: "",
      worktreesBase: "/tmp/worktrees",
    }),
    [
      "--name",
      "demo",
      "--slot",
      "4",
      "--base-branch",
      "main",
      "--root-branch",
      "feature/root",
      "--submodule-branch",
      "feature/sub",
      "--metadata-source",
      "ui",
      "--realm",
      "demo-realm",
      "--worktrees-base",
      "/tmp/worktrees",
      "--install-skip-existing",
      "--install-prefer-online",
      "--start",
    ],
  );
});

test("OpenTUI repair and sync builders split comma and newline path buffers", () => {
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiRepairArgv({
      dryRun: true,
      includePackageEnv: true,
      legacyMissingOnlyAlias: true,
      worktreeLines: "/wt/a, /wt/b\n/wt/c",
    }),
    [
      "--worktree",
      "/wt/a",
      "--worktree",
      "/wt/b",
      "--worktree",
      "/wt/c",
      "--include-package-env",
      "--package-env-mode",
      "missing-only",
      "--dry-run",
    ],
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiSyncArgv({
      sourceWorkspace: " /source ",
      worktreeLines: "/wt/a\n/wt/b",
    }),
    ["--source-workspace", "/source", "--worktree", "/wt/a", "--worktree", "/wt/b"],
  );
});
