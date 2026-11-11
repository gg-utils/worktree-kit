/**
 * @fileoverview Verifies Ink worktree launch-target resolution for stack-name matching, relative
 * worktree path normalization, global versus record-scoped actions, and action-options patches.
 *
 * This file owns Node test assertions for `WorktreeStackKit_resolveInkLaunchTarget` and for the
 * resolver factory that translates UI inventory into the launch inventory consumed by resolution.
 * Flow: build fixtures -> resolve launch target -> assert screen, selection indices, notices, and patches.
 *
 * @testing Node.js test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/ink-launch-resolution.ts - Launch-target resolver and inventory builder whose matching rules, path handling, and screen transitions are exercised by these tests.
 * @see packages/worktree-kit/src/ink-launch-options.ts - Create-draft and launch-option shapes supplied as resolver inputs and compared against resolved `createDraft` and patch outputs here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - UI inventory contract mirrored when `WorktreeStackKit_createInkLaunchTargetResolver` folds Ink UI records into the normalized inventory asserted alongside resolution.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { WorktreeStackKit_InkCreateDraft } from "./ink-launch-options.js";
import type { WorktreeStackKit_InkUiInventory } from "./ink-ui-contracts.js";
import {
  WorktreeStackKit_createInkLaunchInventory,
  WorktreeStackKit_createInkLaunchTargetResolver,
  WorktreeStackKit_resolveInkLaunchTarget,
  type WorktreeStackKit_InkLaunchActionDefinition,
  type WorktreeStackKit_InkLaunchInventory,
} from "./ink-launch-resolution.js";

const WORKTREE_STACK_KIT_TEST_ACTIONS: readonly WorktreeStackKit_InkLaunchActionDefinition[] = [
  { id: "start", label: "Start", scope: "record" },
  { id: "repair", label: "Repair", scope: "global" },
  { id: "realm-pool-next", label: "Pool next", scope: "global" },
  { id: "checkout-state-check", label: "State check", scope: "global" },
];

function createInitialCreateDraft(): WorktreeStackKit_InkCreateDraft {
  return {
    baseBranch: "main",
    branchPrefix: "topic/",
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
    worktreesBase: "../worktrees",
  };
}

function createInventory(): WorktreeStackKit_InkLaunchInventory {
  return {
    projectRoot: "/repo/worktrees/current-stack",
    records: [
      {
        stackNameCandidates: ["current-stack"],
        worktreePath: "/repo/worktrees/current-stack",
      },
      {
        stackNameCandidates: ["follow-up", "Follow Up"],
        worktreePath: "/repo/worktrees/follow-up",
      },
    ],
  };
}

function createUiInventory(): WorktreeStackKit_InkUiInventory {
  return {
    globalIssues: [],
    loadedAt: "2026-05-21T00:00:00.000Z",
    projectRoot: "/repo/worktrees/current-stack",
    records: [
      {
        branchRef: "refs/heads/topic/follow-up",
        checkoutKind: "prepared-worktree",
        currentCheckout: false,
        detached: false,
        handbook: {
          authHost: null,
          commands: {},
          generatedAt: null,
          hosts: {},
          raw: {},
          realmSlug: "worktree-02",
          stackName: "Follow Up",
        },
        handbookMarkdownExists: true,
        handbookMarkdownPath: "/repo/worktrees/follow-up/WORKTREE.local.md",
        head: "abc123",
        healthSummary: null,
        issues: [],
        label: "follow-up",
        metadata: {
          baseBranch: "main",
          createdAt: "2026-05-21T00:00:00.000Z",
          ports: {},
          raw: {},
          realmSlug: "worktree-02",
          rootBranch: "topic/follow-up",
          slot: 2,
          stackName: "follow-up",
          submoduleBranch: "topic/follow-up",
          workspaceType: "worktree",
        },
        onboardingMarkdownExists: true,
        onboardingMarkdownPath: "/repo/worktrees/follow-up/WORKTREE.readme.md",
        realmRecord: null,
        temporaryMerge: false,
        worktreePath: "/repo/worktrees/follow-up",
      },
    ],
    summary: {
      activeRealms: 0,
      brokenRecords: 0,
      detachedRecords: 0,
      healthRunAt: null,
      healthyRealms: 0,
      inactiveRealms: 0,
      managedRecords: 1,
      staleRealms: 0,
      totalRecords: 1,
      unhealthyRealms: 0,
    },
  };
}

void test("WorktreeStackKit_resolveInkLaunchTarget returns shell defaults without a target", () => {
  assert.deepEqual(
    WorktreeStackKit_resolveInkLaunchTarget({
      actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
      initialCreateDraft: createInitialCreateDraft(),
      inventory: createInventory(),
      target: null,
    }),
    {
      actionOptionsPatch: null,
      createDraft: createInitialCreateDraft(),
      noticeMessage: null,
      screen: "shell",
      selectedActionIndex: 0,
      selectedIndex: 0,
    },
  );
});

void test("WorktreeStackKit_resolveInkLaunchTarget selects record actions by stack name", () => {
  const resolved = WorktreeStackKit_resolveInkLaunchTarget({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    initialCreateDraft: createInitialCreateDraft(),
    inventory: createInventory(),
    target: {
      actionId: "start",
      createDraftOverrides: {},
      poolNextStackName: null,
      stackName: "FOLLOW-UP",
      stateCheckFetch: null,
      switchDraftOverrides: {},
      worktreePath: null,
    },
  });

  assert.equal(resolved.selectedIndex, 1);
  assert.equal(resolved.selectedActionIndex, 0);
  assert.equal(resolved.screen, "action-editor");
  assert.equal(resolved.noticeMessage, null);
});

void test("WorktreeStackKit_createInkLaunchTargetResolver binds UI inventory translation", () => {
  const resolveLaunchTarget = WorktreeStackKit_createInkLaunchTargetResolver({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    createInitialCreateDraft,
  });

  const resolved = resolveLaunchTarget(createUiInventory(), {
    actionId: "start",
    createDraftOverrides: {},
    poolNextStackName: null,
    stackName: "follow up",
    stateCheckFetch: null,
    switchDraftOverrides: {},
    worktreePath: null,
  });

  assert.equal(resolved.selectedIndex, 0);
  assert.equal(resolved.screen, "action-editor");
  assert.deepEqual(WorktreeStackKit_createInkLaunchInventory(createUiInventory()), {
    projectRoot: "/repo/worktrees/current-stack",
    records: [
      {
        stackNameCandidates: ["follow-up", "Follow Up"],
        worktreePath: "/repo/worktrees/follow-up",
      },
    ],
  });
});

void test("WorktreeStackKit_resolveInkLaunchTarget resolves relative worktree paths", () => {
  const resolved = WorktreeStackKit_resolveInkLaunchTarget({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    initialCreateDraft: createInitialCreateDraft(),
    inventory: createInventory(),
    target: {
      actionId: "start",
      createDraftOverrides: {},
      poolNextStackName: null,
      stackName: null,
      stateCheckFetch: null,
      switchDraftOverrides: {},
      worktreePath: "../follow-up",
    },
  });

  assert.equal(resolved.selectedIndex, 1);
  assert.equal(resolved.screen, "action-editor");
});

void test("WorktreeStackKit_resolveInkLaunchTarget keeps shell for missing record target", () => {
  const resolved = WorktreeStackKit_resolveInkLaunchTarget({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    initialCreateDraft: createInitialCreateDraft(),
    inventory: createInventory(),
    target: {
      actionId: "start",
      createDraftOverrides: {},
      poolNextStackName: null,
      stackName: "missing",
      stateCheckFetch: null,
      switchDraftOverrides: {},
      worktreePath: null,
    },
  });

  assert.equal(resolved.selectedIndex, 0);
  assert.equal(resolved.screen, "shell");
  assert.match(resolved.noticeMessage ?? "", /missing/);
});

void test("WorktreeStackKit_resolveInkLaunchTarget ignores record selectors for global actions", () => {
  const resolved = WorktreeStackKit_resolveInkLaunchTarget({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    initialCreateDraft: createInitialCreateDraft(),
    inventory: createInventory(),
    target: {
      actionId: "repair",
      createDraftOverrides: {},
      poolNextStackName: null,
      stackName: "follow-up",
      stateCheckFetch: null,
      switchDraftOverrides: {},
      worktreePath: null,
    },
  });

  assert.equal(resolved.selectedIndex, 1);
  assert.equal(resolved.selectedActionIndex, 1);
  assert.equal(resolved.screen, "action-editor");
  assert.match(resolved.noticeMessage ?? "", /global/);
});

void test("WorktreeStackKit_resolveInkLaunchTarget emits action option patches", () => {
  const poolResolved = WorktreeStackKit_resolveInkLaunchTarget({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    initialCreateDraft: createInitialCreateDraft(),
    inventory: createInventory(),
    target: {
      actionId: "realm-pool-next",
      createDraftOverrides: {},
      poolNextStackName: "next-stack",
      stackName: null,
      stateCheckFetch: null,
      switchDraftOverrides: {},
      worktreePath: null,
    },
  });
  assert.equal(poolResolved.actionOptionsPatch?.poolNextStackName, "next-stack");

  const stateResolved = WorktreeStackKit_resolveInkLaunchTarget({
    actionDefinitions: WORKTREE_STACK_KIT_TEST_ACTIONS,
    initialCreateDraft: createInitialCreateDraft(),
    inventory: createInventory(),
    target: {
      actionId: "checkout-state-check",
      createDraftOverrides: {},
      poolNextStackName: null,
      stackName: null,
      stateCheckFetch: true,
      switchDraftOverrides: {},
      worktreePath: null,
    },
  });
  assert.equal(stateResolved.actionOptionsPatch?.stateCheckFetch, true);
});
