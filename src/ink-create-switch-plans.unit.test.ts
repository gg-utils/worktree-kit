/**
 * @fileoverview Verifies Ink create/switch plan builders: argv assembly for workspace create and
 * switch npm scripts, slot-derived port summary lines, validation blocking when draft fields are
 * incomplete, and adapter-safe builder wiring from config plus draft resolution.
 *
 * This file owns Node `node:test` regression coverage for the pure plan helpers in
 * `ink-create-switch-plans.ts`, using deterministic config and in-memory Ink UI fixtures.
 * Flow: build fixtures -> invoke plan builders -> assert argv, summaries, issues, and bound
 * builder outputs.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-create-switch-plans.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-create-switch-plans.ts - Plan builders under test that translate Ink drafts, inventory selection, and config into npm `run` argv tuples and human-readable summaries for create and switch flows.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI draft, inventory, and record contract shapes used by the local fixture builders feeding the plan assertions in this suite.
 * @see packages/worktree-kit/src/ink-create-resolution.ts - Create-draft resolution types imported here so resolved-draft fixtures stay aligned with the resolution pipeline feeding real Ink create flows.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_buildInkCreatePlan,
  WorktreeStackKit_buildInkSwitchInteractivePlan,
  WorktreeStackKit_buildInkSwitchPlan,
  WorktreeStackKit_createInkCreateSwitchPlanBuilders,
  type WorktreeStackKit_InkCreateSwitchPlanConfig,
} from "./ink-create-switch-plans.js";
import type { WorktreeStackKit_InkResolvedCreateDraft } from "./ink-create-resolution.js";
import type {
  WorktreeStackKit_InkUiCreateRequestContext,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";

const config: WorktreeStackKit_InkCreateSwitchPlanConfig = {
  commandName: "tool",
  copy: {
    editorOpenSummaryLabel: "Open editor",
    envCopySummaryLabel: "Copy env",
    startEnvironmentSummaryLabel: "Start runtime",
  },
  defaultBranchPrefix: "agent",
  deriveSlotPortPreview(slot) {
    return [
      { label: "api", value: 8000 + slot },
      { label: "ui", value: 3000 + slot },
    ];
  },
  flags: {
    copyEnvFromMain: "--copy-env",
    createBaseBranch: "--base",
    createInstall: "--install",
    createInstallPreferOnline: "--prefer-online",
    createInstallSkipExisting: "--skip-existing",
    createMetadataSource: "--metadata-source",
    createName: "--name",
    createNoInstall: "--no-install",
    createOpenEditor: "--open-editor",
    createPrefix: "--prefix",
    createRealm: "--realm",
    createRootBranch: "--root-branch",
    createSlot: "--slot",
    createSubmoduleBranch: "--submodule-branch",
    createWorktreePath: "--worktree-path",
    createWorktreesBase: "--worktrees-base",
    switchName: "--name",
    switchPrefix: "--prefix",
    switchSlot: "--slot",
  },
  scripts: {
    create: "workspace:create",
    switch: "workspace:switch",
  },
};

const resolvedDraft: WorktreeStackKit_InkResolvedCreateDraft = {
  baseBranch: "stable",
  branchPrefix: "agent",
  copyEnvFromMain: true,
  followUpStart: true,
  followUpStartOpenWindsurf: false,
  installPreferOnline: true,
  installSkipExisting: true,
  metadataSource: "seed",
  openWindsurf: true,
  predictedWorktreePath: "/workspace/worktrees/example",
  realmSlug: "realm-01",
  rootBranch: "agent/example",
  runInstall: true,
  slot: 2,
  slotInput: "2",
  stackName: "example",
  submoduleBranch: "agent/example",
  worktreePathOverride: "",
  worktreesBase: "/workspace/worktrees",
};

const createContext: WorktreeStackKit_InkUiCreateRequestContext = {
  baseBranch: "stable",
  branchPrefix: "agent",
  followUpStart: true,
  followUpStartOpenWindsurf: false,
  metadataSource: "seed",
  predictedWorktreePath: "/workspace/worktrees/example",
  realmSlug: "realm-01",
  rootBranch: "agent/example",
  slot: 2,
  stackName: "example",
  submoduleBranch: "agent/example",
  worktreePathOverride: "",
  worktreesBase: "/workspace/worktrees",
};

function createInventory(): WorktreeStackKit_InkUiInventory {
  return {
    globalIssues: [],
    loadedAt: "2026-05-21T00:00:00.000Z",
    projectRoot: "/workspace/root",
    records: [],
    summary: {
      activeRealms: 0,
      brokenRecords: 0,
      detachedRecords: 0,
      healthRunAt: null,
      healthyRealms: 0,
      inactiveRealms: 0,
      managedRecords: 0,
      staleRealms: 0,
      totalRecords: 0,
      unhealthyRealms: 0,
    },
  };
}

function createRecord(): WorktreeStackKit_InkUiRecord {
  return {
    branchRef: "refs/heads/agent/example",
    checkoutKind: "prepared-worktree",
    currentCheckout: false,
    detached: false,
    handbook: null,
    handbookMarkdownExists: true,
    handbookMarkdownPath: "/workspace/example/WORKTREE.local.md",
    head: "abc123",
    healthSummary: null,
    issues: [],
    label: "example",
    metadata: {
      baseBranch: "stable",
      createdAt: "2026-05-21T00:00:00.000Z",
      ports: {},
      raw: {},
      realmSlug: "realm-01",
      rootBranch: "agent/example",
      slot: 2,
      stackName: "example",
      submoduleBranch: "agent/example",
      workspaceType: "worktree",
    },
    onboardingMarkdownExists: true,
    onboardingMarkdownPath: "/workspace/example/WORKTREE.readme.md",
    realmRecord: null,
    temporaryMerge: false,
    worktreePath: "/workspace/example",
  };
}

describe("WorktreeStackKit Ink create/switch plans", () => {
  it("builds create argv and slot-port summary from explicit config", () => {
    const plan = WorktreeStackKit_buildInkCreatePlan({
      config,
      createContext,
      resolvedDraft,
    });

    assert.deepEqual(plan.request?.args, [
      "run",
      "workspace:create",
      "--",
      "--name",
      "example",
      "--slot",
      "2",
      "--base",
      "stable",
      "--root-branch",
      "agent/example",
      "--submodule-branch",
      "agent/example",
      "--worktrees-base",
      "/workspace/worktrees",
      "--realm",
      "realm-01",
      "--metadata-source",
      "seed",
      "--copy-env",
      "--install",
      "--skip-existing",
      "--prefer-online",
      "--open-editor",
    ]);
    assert.equal(plan.summaryLines.at(-1), "Ports: api 8002, ui 3002");
  });

  it("blocks create when mandatory draft fields are missing", () => {
    const plan = WorktreeStackKit_buildInkCreatePlan({
      config,
      createContext: null,
      resolvedDraft: {
        ...resolvedDraft,
        slot: null,
        stackName: "",
      },
    });

    assert.equal(plan.request, null);
    assert.deepEqual(
      plan.issues.map((issue) => issue.code),
      ["missing-stack-name", "invalid-slot"],
    );
  });

  it("builds direct and selected-record switch requests", () => {
    const directPlan = WorktreeStackKit_buildInkSwitchPlan({
      config,
      createDraft: {
        baseBranch: "",
        branchPrefix: "",
        copyEnvFromMain: false,
        followUpStart: false,
        followUpStartOpenWindsurf: false,
        installPreferOnline: false,
        installSkipExisting: false,
        metadataSource: "",
        openWindsurf: false,
        realmSlug: "",
        rootBranch: "",
        runInstall: true,
        slotInput: "3",
        stackName: "example",
        submoduleBranch: "",
        worktreePathOverride: "",
        worktreesBase: "",
      },
    });
    assert.deepEqual(directPlan.request?.args, [
      "run",
      "workspace:switch",
      "--",
      "--prefix",
      "agent",
      "--name",
      "example",
      "--slot",
      "3",
    ]);

    const interactivePlan = WorktreeStackKit_buildInkSwitchInteractivePlan({
      config,
      inventory: createInventory(),
      selectedRecord: createRecord(),
      switchDraft: {
        branchPrefix: "",
        environmentFilter: "realm-01",
        stackName: "",
      },
    });
    assert.deepEqual(interactivePlan.request?.args, [
      "run",
      "workspace:switch",
      "--",
      "--prefix",
      "agent",
      "--name",
      "example",
    ]);
    assert.equal(interactivePlan.switchContext?.environmentFilter, "realm-01");
  });

  it("binds config and draft resolution into an adapter-safe builder set", () => {
    const builders = WorktreeStackKit_createInkCreateSwitchPlanBuilders({
      buildCreateContext: () => createContext,
      config,
      resolveCreateDraft: () => resolvedDraft,
    });

    const plan = builders.buildCreatePlan(createInventory(), {
      baseBranch: "",
      branchPrefix: "",
      copyEnvFromMain: false,
      followUpStart: false,
      followUpStartOpenWindsurf: false,
      installPreferOnline: false,
      installSkipExisting: false,
      metadataSource: "",
      openWindsurf: false,
      realmSlug: "",
      rootBranch: "",
      runInstall: false,
      slotInput: "",
      stackName: "",
      submoduleBranch: "",
      worktreePathOverride: "",
      worktreesBase: "",
    });

    assert.deepEqual(plan.request?.args.slice(0, 5), [
      "run",
      "workspace:create",
      "--",
      "--name",
      "example",
    ]);
    assert.equal(plan.summaryLines.at(-1), "Ports: api 8002, ui 3002");
  });
});
