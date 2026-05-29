/**
 * @fileoverview Regression tests for OpenTUI maintenance action-scroll planner helpers covering
 * repair, sync-local-files, and bootstrap panel visibility, option catalogs, boolean selection
 * plans, maintenance form navigation, TSX preview routing, and bootstrap seed text formatters.
 *
 * This file owns Node `node:test` assertions for the pure `WorktreeStackKit_*` helpers in
 * `opentui-action-scroll-maintenance-plans` that keep maintenance OpenTUI flows deterministic without
 * touching subprocess dispatch.
 * Flow: assert phase-gated panel visibility -> assert stable option labels and values -> assert
 * selection plans -> assert bootstrap form and preview strings built from seed facts.
 *
 * @testing Node test: cd packages/worktree-kit && npm run test -- src/opentui-action-scroll-maintenance-plans.unit.test.ts
 * @testing Node test: from the repository root, run npm run worktree-kit:test to execute all packages/worktree-kit unit tests when validating broader worktree-kit changes alongside this module.
 *
 * @see packages/worktree-kit/src/opentui-action-scroll-maintenance-plans.ts - Pure planner, formatter, and selection-contract module whose repair/sync/bootstrap maintenance behavior is asserted here.
 * @see packages/worktree-kit/src/opentui-maintenance-panels.tsx - Maintenance panels that import these helpers to render repair, sync-local-files, and bootstrap forms and previews aligned with the contracts verified in this file.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI app controller that consumes bootstrap preview formatting from this module so runtime copy and preview chrome stay consistent with the seed-fact assertions exercised here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_buildOpenTuiBootstrapFormOptions,
  WorktreeStackKit_buildOpenTuiRepairDryRunOptions,
  WorktreeStackKit_buildOpenTuiRepairFormOptions,
  WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions,
  WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions,
  WorktreeStackKit_buildOpenTuiSyncFormOptions,
  WorktreeStackKit_buildOpenTuiTsxPreviewOptions,
  WorktreeStackKit_formatOpenTuiBootstrapFormText,
  WorktreeStackKit_formatOpenTuiBootstrapPreviewText,
  WorktreeStackKit_planOpenTuiMaintenanceFormSelection,
  WorktreeStackKit_planOpenTuiRepairBooleanSelection,
  WorktreeStackKit_planOpenTuiTsxPreviewSelection,
  WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel,
  WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel,
  WorktreeStackKit_shouldShowOpenTuiRepairFormPanel,
  WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel,
  WorktreeStackKit_shouldShowOpenTuiSyncFormPanel,
  WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel,
} from "./opentui-action-scroll-maintenance-plans.js";

test("OpenTUI maintenance visibility helpers match repair, sync, and bootstrap phases", () => {
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiRepairFormPanel({
      flow: "repair",
      phase: "form",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiRepairPreviewPanel({
      flow: "repair",
      phase: "preview",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiSyncFormPanel({
      flow: "sync",
      phase: "form",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiSyncPreviewPanel({
      flow: "sync",
      phase: "preview",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiBootstrapFormPanel({
      flow: "bootstrap",
      phase: "form",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiBootstrapPreviewPanel({
      flow: "bootstrap",
      phase: "preview",
    }),
    true,
  );
  assert.equal(
    WorktreeStackKit_shouldShowOpenTuiRepairFormPanel({
      flow: "sync",
      phase: "form",
    }),
    false,
  );
});

test("OpenTUI maintenance option builders keep stable labels", () => {
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiRepairIncludePackageEnvOptions(),
    [
      { description: "Include package .env", name: "yes", value: "yes" },
      { description: "Skip package .env", name: "no", value: "no" },
    ],
  );
  assert.equal(
    WorktreeStackKit_buildOpenTuiRepairLegacyMissingOnlyOptions()[0]
      ?.description,
    "Use legacy missing-only mode",
  );
  assert.equal(
    WorktreeStackKit_buildOpenTuiRepairDryRunOptions()[0]?.description,
    "Run with --dry-run flag",
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiRepairFormOptions().map(
      (option) => option.value,
    ),
    ["next", "menu", "quit"],
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiSyncFormOptions().map(
      (option) => option.value,
    ),
    ["next", "menu", "quit"],
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiBootstrapFormOptions().map(
      (option) => option.value,
    ),
    ["next", "menu", "quit"],
  );
  assert.deepEqual(
    WorktreeStackKit_buildOpenTuiTsxPreviewOptions().map(
      (option) => option.value,
    ),
    ["run", "back"],
  );
});

test("OpenTUI maintenance selection planners map select values to side-effect plans", () => {
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiRepairBooleanSelection({
      field: "dryRun",
      optionValue: "yes",
    }),
    { field: "dryRun", type: "set-boolean", value: true },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiRepairBooleanSelection({
      field: "includePackageEnv",
      optionValue: "no",
    }),
    { field: "includePackageEnv", type: "set-boolean", value: false },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
      optionValue: "next",
    }),
    { type: "preview" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMaintenanceFormSelection({
      optionValue: "menu",
    }),
    { type: "menu" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiTsxPreviewSelection({ optionValue: "run" }),
    { type: "run" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiTsxPreviewSelection({ optionValue: "back" }),
    { nextPhase: "form", type: "back" },
  );
});

test("OpenTUI bootstrap formatter uses explicit seed facts", () => {
  assert.equal(
    WorktreeStackKit_formatOpenTuiBootstrapFormText({
      installDescription: "Runs configured install steps.",
      seedFacts: {
        localLogicalEnvironmentFilePath: "/repo/local-env-seed.env",
        localLogicalEnvironmentPresent: true,
      },
    }),
    [
      "Local logical env seed present: yes",
      "/repo/local-env-seed.env",
      "",
      "Runs configured install steps.",
    ].join("\n"),
  );
  assert.equal(
    WorktreeStackKit_formatOpenTuiBootstrapPreviewText({
      npmInstallCommand: "npm run platform:install",
      seedFacts: {
        localLogicalEnvironmentFilePath: "/repo/local-env-seed.env",
        localLogicalEnvironmentPresent: false,
      },
      tsxInstallCommand:
        "npx tsx /repo/scripts/platform/commands/install-all.ts",
    }),
    [
      "npm run platform:install",
      "npx tsx /repo/scripts/platform/commands/install-all.ts",
      "",
      "Local bootstrap seed:",
      "  /repo/local-env-seed.env",
      "  present: no",
    ].join("\n"),
  );
});
