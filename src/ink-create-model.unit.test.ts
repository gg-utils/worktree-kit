/**
 * @fileoverview Verifies stable defaults, section ordering, field lookup helpers, and boolean
 * metadata for the reusable Ink worktree create/switch form catalogs.
 *
 * This file owns Node `node:test` regression coverage for the catalog module consumed by Ink shells
 * and reducers when rendering create/switch flows.
 * Flow: import catalogs and helpers -> assert initial drafts -> assert section/field identity and
 * lookup indices -> assert boolean field classification.
 *
 * @testing Node test runner unit: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/ink-create-model.ts - Ink create/switch field catalogs, draft factories, and lookup helpers whose stable ordering and defaults are asserted here.
 * @see packages/worktree-kit/src/ink-reducer.ts - Ink reducer that seeds interactive state from the create draft defaults and field ids covered by this suite.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKTREE_STACK_KIT_INK_CREATE_FIELDS,
  WORKTREE_STACK_KIT_INK_CREATE_SECTIONS,
  WORKTREE_STACK_KIT_INK_SWITCH_FIELDS,
  WorktreeStackKit_createInitialInkCreateDraft,
  WorktreeStackKit_createInitialInkSwitchDraft,
  WorktreeStackKit_getInkCreateField,
  WorktreeStackKit_getInkCreateFieldIndex,
  WorktreeStackKit_getInkCreateFieldsForSection,
  WorktreeStackKit_getInkCreateSectionForField,
  WorktreeStackKit_getInkSwitchFieldIndex,
  WorktreeStackKit_isInkCreateBooleanField,
  WorktreeStackKit_isInkSwitchBooleanField,
} from "./ink-create-model.js";

test("WorktreeStackKit_createInitialInkCreateDraft returns stable defaults", () => {
  assert.deepEqual(WorktreeStackKit_createInitialInkCreateDraft(), {
    baseBranch: "",
    branchPrefix: "",
    copyEnvFromMain: false,
    followUpStart: false,
    followUpStartOpenWindsurf: false,
    installPreferOnline: false,
    installSkipExisting: true,
    metadataSource: "",
    openWindsurf: false,
    realmSlug: "",
    rootBranch: "",
    runInstall: true,
    slotInput: "",
    stackName: "",
    submoduleBranch: "",
    worktreePathOverride: "",
    worktreesBase: "",
  });
});

test("create catalog keeps identity section and field lookup order stable", () => {
  assert.equal(WORKTREE_STACK_KIT_INK_CREATE_SECTIONS[0]?.id, "identity");
  assert.equal(WORKTREE_STACK_KIT_INK_CREATE_FIELDS[0]?.id, "branchPrefix");
  assert.equal(WorktreeStackKit_getInkCreateField(1)?.id, "stackName");
  assert.equal(WorktreeStackKit_getInkCreateFieldIndex("slotInput"), 2);
  assert.equal(
    WorktreeStackKit_getInkCreateSectionForField("rootBranch")?.id,
    "branches",
  );
  assert.deepEqual(
    WorktreeStackKit_getInkCreateFieldsForSection("launch").map(
      (field) => field.id,
    ),
    ["openWindsurf", "followUpStart", "followUpStartOpenWindsurf"],
  );
});

test("create catalog identifies boolean fields", () => {
  assert.equal(WorktreeStackKit_isInkCreateBooleanField("runInstall"), true);
  assert.equal(WorktreeStackKit_isInkCreateBooleanField("stackName"), false);
});

test("switch catalog defaults and text-only field metadata are stable", () => {
  assert.deepEqual(WorktreeStackKit_createInitialInkSwitchDraft(), {
    branchPrefix: "",
    environmentFilter: "",
    stackName: "",
  });
  assert.equal(WORKTREE_STACK_KIT_INK_SWITCH_FIELDS[0]?.id, "branchPrefix");
  assert.equal(WorktreeStackKit_getInkSwitchFieldIndex("environmentFilter"), 2);
  assert.equal(WorktreeStackKit_isInkSwitchBooleanField("stackName"), false);
});
