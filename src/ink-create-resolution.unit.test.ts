/**
 * @fileoverview Verifies Ink create-draft resolution: derived slots and branch names, realm-aware
 * defaults, predicted worktree folder paths, argv-ready create-context gating, bound draft
 * resolvers, and matching completed creates back to inventory records.
 *
 * This file owns Node `node:test` regression coverage for the pure helpers in
 * `ink-create-resolution.ts`, using deterministic config and in-memory inventory fixtures.
 * Flow: resolve draft -> assert derived fields -> optionally build create context -> assert
 * post-create record resolution against inventory tuples.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-create-resolution.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-create-resolution.ts - Resolution helpers under test that normalize drafts, predict paths, build create contexts, and match completed worktrees to inventory rows.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Shared Ink UI draft, inventory, and record shapes used by the local fixture builders feeding the assertions in this suite.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  WorktreeStackKit_createInkCreateDraftResolver,
  WorktreeStackKit_createInkCreateContext,
  WorktreeStackKit_resolveCreatedInkRecord,
  WorktreeStackKit_resolveInkCreateDraft,
  type WorktreeStackKit_InkCreateResolutionConfig,
} from "./ink-create-resolution.js";
import type {
  WorktreeStackKit_InkUiCreateDraft,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";

const config: WorktreeStackKit_InkCreateResolutionConfig = {
  defaultBaseBranch: "stable",
  defaultBranchPrefix: "agent",
  defaultWorktreesDirectoryName: "example-worktrees",
  getCurrentDate: () => new Date("2026-05-21T12:00:00.000Z"),
  realmPool: ["realm one", "realm two"],
};

function createDraft(
  overrides: Partial<WorktreeStackKit_InkUiCreateDraft> = {},
): WorktreeStackKit_InkUiCreateDraft {
  return {
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
    ...overrides,
  };
}

function createRecord(
  overrides: Partial<WorktreeStackKit_InkUiRecord> = {},
): WorktreeStackKit_InkUiRecord {
  return {
    branchRef: "refs/heads/agent/example",
    checkoutKind: "prepared-worktree",
    currentCheckout: false,
    detached: false,
    handbook: null,
    handbookMarkdownExists: true,
    handbookMarkdownPath: "/repo/example/WORKTREE.local.md",
    head: "abc123",
    healthSummary: null,
    issues: [],
    label: "example",
    metadata: {
      baseBranch: "stable",
      createdAt: "2026-05-21T00:00:00.000Z",
      ports: {},
      raw: {},
      realmSlug: "realm-one",
      rootBranch: "agent/example",
      slot: 1,
      stackName: "example",
      submoduleBranch: "agent/example",
      workspaceType: "worktree",
    },
    onboardingMarkdownExists: true,
    onboardingMarkdownPath: "/repo/example/WORKTREE.readme.md",
    realmRecord: null,
    temporaryMerge: false,
    worktreePath: "/repo/example",
    ...overrides,
  };
}

function createInventory(
  records: WorktreeStackKit_InkUiRecord[],
): WorktreeStackKit_InkUiInventory {
  return {
    globalIssues: [],
    loadedAt: "2026-05-21T00:00:00.000Z",
    projectRoot: "/repo/root",
    records,
    summary: {
      activeRealms: 0,
      brokenRecords: 0,
      detachedRecords: 0,
      healthRunAt: null,
      healthyRealms: 0,
      inactiveRealms: 0,
      managedRecords: records.length,
      staleRealms: 0,
      totalRecords: records.length,
      unhealthyRealms: 0,
    },
  };
}

describe("WorktreeStackKit Ink create resolution", () => {
  it("resolves defaults, next slot, realm pool, and predicted folder path", () => {
    const resolved = WorktreeStackKit_resolveInkCreateDraft({
      config,
      draft: createDraft({ stackName: "bravo" }),
      inventory: createInventory([createRecord()]),
    });

    assert.equal(resolved.slot, 2);
    assert.equal(resolved.baseBranch, "stable");
    assert.equal(resolved.rootBranch, "agent/bravo");
    assert.equal(resolved.submoduleBranch, "agent/bravo");
    assert.equal(resolved.worktreesBase, "/repo/example-worktrees");
    assert.equal(
      resolved.predictedWorktreePath,
      "/repo/example-worktrees/260521RRT-BRAVO",
    );
  });

  it("builds create context only when mandatory fields are complete", () => {
    const incomplete = WorktreeStackKit_resolveInkCreateDraft({
      config,
      draft: createDraft(),
      inventory: createInventory([]),
    });
    assert.equal(WorktreeStackKit_createInkCreateContext(incomplete), null);

    const complete = WorktreeStackKit_resolveInkCreateDraft({
      config,
      draft: createDraft({ stackName: "charlie" }),
      inventory: createInventory([]),
    });
    assert.equal(
      WorktreeStackKit_createInkCreateContext(complete)?.rootBranch,
      "agent/charlie",
    );
  });

  it("binds configured draft resolution for adapters", () => {
    const resolveDraft = WorktreeStackKit_createInkCreateDraftResolver(
      () => config,
    );
    const resolved = resolveDraft({
      draft: createDraft({ stackName: "delta" }),
      inventory: createInventory([]),
    });

    assert.equal(resolved.baseBranch, "stable");
    assert.equal(resolved.rootBranch, "agent/delta");
  });

  it("matches completed create records by stack, slot, and branch tuple", () => {
    const record = createRecord({
      metadata: {
        ...createRecord().metadata!,
        rootBranch: "agent/bravo",
        slot: 2,
        stackName: "bravo",
        submoduleBranch: "agent/bravo",
      },
      worktreePath: "/repo/bravo",
    });
    const context = WorktreeStackKit_createInkCreateContext(
      WorktreeStackKit_resolveInkCreateDraft({
        config,
        draft: createDraft({ stackName: "bravo" }),
        inventory: createInventory([createRecord()]),
      }),
    );
    assert.notEqual(context, null);
    if (context === null) {
      return;
    }

    const result = WorktreeStackKit_resolveCreatedInkRecord({
      createContext: context,
      inventory: createInventory([record]),
    });
    assert.equal(result.status, "resolved");
    assert.equal(result.matchedRecord?.worktreePath, "/repo/bravo");
  });
});
