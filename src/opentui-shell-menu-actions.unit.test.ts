/**
 * @fileoverview Verifies OpenTUI main-menu option rows, availability-driven disabled states, and
 * guarded action-selection planning for worktree-stack flows in `worktree-kit`.
 *
 * This file owns regression coverage for `WorktreeStackKit_buildOpenTuiMenuOptions`,
 * `WorktreeStackKit_planOpenTuiMenuActionSelection`, and `WorktreeStackKit_applyOpenTuiStrikethrough`
 * against adapter-supplied availability facts.
 * Flow: build availability snapshots -> assert disabled flags and strikethrough labels -> assert
 * planner ignore, flow transitions, and quit routing.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-shell-menu-actions.unit.test.ts
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/opentui-shell-menu-actions.ts - Pure menu catalog, availability gates, strikethrough rendering, and selection plans whose behavior is asserted here.
 * @see packages/worktree-kit/src/opentui-app-shell.tsx - OpenTUI app shell that builds menu rows and routes tab-select values through the planner and builder contracts verified in this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_applyOpenTuiStrikethrough,
  WorktreeStackKit_buildOpenTuiMenuOptions,
  WorktreeStackKit_planOpenTuiMenuActionSelection,
} from "./opentui-shell-menu-actions.js";

test("OpenTUI menu action builder disables rows from availability facts", () => {
  const options = WorktreeStackKit_buildOpenTuiMenuOptions({
    availability: {
      hasRealms: false,
      hasRecords: false,
      hasSelectedRecord: false,
    },
  });

  assert.equal(options.find((option) => option.value === "create")?.disabled, false);
  assert.equal(options.find((option) => option.value === "switch")?.disabled, true);
  assert.equal(options.find((option) => option.value === "repair")?.disabled, true);
  assert.equal(options.find((option) => option.value === "pool")?.disabled, true);
  assert.equal(options.find((option) => option.value === "quit")?.disabled, false);
  assert.equal(
    options.find((option) => option.value === "switch")?.name,
    WorktreeStackKit_applyOpenTuiStrikethrough("Switch (prefix × stack)"),
  );
});

test("OpenTUI menu action planner guards disabled and unknown options", () => {
  const availability = {
    hasRealms: false,
    hasRecords: false,
    hasSelectedRecord: false,
  };

  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMenuActionSelection({
      availability,
      optionValue: "switch",
    }),
    { type: "ignore" },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMenuActionSelection({
      availability,
      optionValue: "unknown",
    }),
    { type: "ignore" },
  );
});

test("OpenTUI menu action planner maps flows to phases", () => {
  const availability = {
    hasRealms: true,
    hasRecords: true,
    hasSelectedRecord: true,
  };

  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMenuActionSelection({
      availability,
      optionValue: "diagnostics",
    }),
    {
      flow: "diagnostics",
      focusedColumn: "detail",
      phase: "submenu",
      resetRunArtifacts: true,
      type: "transition",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMenuActionSelection({
      availability,
      optionValue: "merge",
    }),
    {
      flow: "merge",
      focusedColumn: "detail",
      phase: "pick",
      resetRunArtifacts: true,
      type: "transition",
    },
  );
  assert.deepEqual(
    WorktreeStackKit_planOpenTuiMenuActionSelection({
      availability,
      optionValue: "quit",
    }),
    { type: "quit" },
  );
});
