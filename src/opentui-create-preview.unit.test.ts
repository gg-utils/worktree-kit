/**
 * @fileoverview Verifies OpenTUI create-preview helpers: realm-pool command wiring, explicit-path vs
 * default-path previews, previewer adapter binding, preview text formatting, port derivation failures, and realm JSON parsing.
 *
 * This file owns Node test regression coverage for the pure create-preview contract in worktree-kit used by OpenTUI create flows.
 * Flow: stub command runner or realm resolver -> call preview/parser/formatter -> assert derived paths, ports, env summaries, and error envelopes.
 *
 * @testing Node test unit: npx tsx --test packages/worktree-kit/src/opentui-create-preview.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-create-preview.ts - Product-neutral create-preview resolver, realm-pool subprocess adapter, preview text builder, and JSON parser contracts asserted here.
 * @see scripts/worktree-stack/ui/cli-opentui/lib/create-preview.ts - Root CLI adapter that binds slot ports, env messaging, and realm-pool paths into the kit factory exercised indirectly by these unit scenarios.
 *
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_createOpenTuiCreatePreviewer,
  WorktreeStackKit_createOpenTuiRealmPoolAssignmentResolver,
  WorktreeStackKit_formatOpenTuiCreatePreviewText,
  WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson,
  WorktreeStackKit_previewOpenTuiCreate,
  type WorktreeStackKit_OpenTuiCreateRealmAssignmentCommandRunner,
} from "./opentui-create-preview.js";

const TEST_ENV_SUMMARIES = {
  defaultPath: "default env summary",
  explicitPath: "explicit env summary",
};

void test("OpenTUI create realm-pool resolver shells through configured command facts", () => {
  let capturedCommand:
    | {
        readonly args: readonly string[];
        readonly command: string;
        readonly cwd: string | undefined;
        readonly env: NodeJS.ProcessEnv | undefined;
      }
    | null = null;
  const runCommand: WorktreeStackKit_OpenTuiCreateRealmAssignmentCommandRunner =
    (command, args, options) => {
      capturedCommand = {
        args: [...args],
        command,
        cwd: options.cwd,
        env: options.env,
      };
      return {
        status: 0,
        stderr: "",
        stdout:
          '{"realmSlug":"worktree-02","realmAssignmentSource":"realm-pool"}',
      };
    };

  const resolveRealmAssignment =
    WorktreeStackKit_createOpenTuiRealmPoolAssignmentResolver({
      getBaseEnv: () => ({ KEEP_ME: "yes" }),
      projectRootEnvKey: "PROJECT_ROOT",
      realmPoolPreviewScriptPath: "scripts/realm-pool.ts",
      runCommand,
    });

  assert.deepEqual(
    resolveRealmAssignment({
      repoRoot: "/repo",
      requestedRealmSlug: " worktree-02 ",
      stackName: "Demo Stack",
    }),
    {
      assignment: {
        realmAssignmentSource: "realm-pool",
        realmSlug: "worktree-02",
      },
      ok: true,
    },
  );
  assert.deepEqual(capturedCommand, {
    args: [
      "tsx",
      "/repo/scripts/realm-pool.ts",
      "--stack-name",
      "Demo Stack",
      "--realm",
      "worktree-02",
    ],
    command: "npx",
    cwd: "/repo",
    env: {
      KEEP_ME: "yes",
      PROJECT_ROOT: "/repo",
    },
  });
});

void test("OpenTUI create realm-pool resolver returns command failures", () => {
  const resolveRealmAssignment =
    WorktreeStackKit_createOpenTuiRealmPoolAssignmentResolver({
      getBaseEnv: () => ({}),
      projectRootEnvKey: "PROJECT_ROOT",
      realmPoolPreviewScriptPath: "scripts/realm-pool.ts",
      runCommand: () => ({
        status: 7,
        stderr: "boom",
        stdout: "fallback",
      }),
    });

  assert.deepEqual(
    resolveRealmAssignment({
      repoRoot: "/repo",
      requestedRealmSlug: "",
      stackName: "Demo Stack",
    }),
    {
      errorMessage: "realm-pool failed (7):\nboom",
      ok: false,
    },
  );
});

void test("OpenTUI create preview uses explicit paths without resolving a realm", () => {
  let realmResolutionCount = 0;
  const result = WorktreeStackKit_previewOpenTuiCreate({
    deriveSlotPorts: (slot) => ({ api: 8000 + slot, ui: 3000 + slot }),
    envSummaryMessages: TEST_ENV_SUMMARIES,
    requestedRealmSlug: "",
    resolveRealmAssignment: () => {
      realmResolutionCount += 1;
      return {
        assignment: { realmSlug: "unused" },
        ok: true,
      };
    },
    slot: 2,
    stackName: "Demo",
    worktreePathOverride: "/tmp/worktrees/demo",
    worktreesBase: "/tmp/worktrees",
  });

  assert.equal(realmResolutionCount, 0);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.envSummary, TEST_ENV_SUMMARIES.explicitPath);
    assert.equal(result.folderName, "demo");
    assert.deepEqual(result.ports, { api: 8002, ui: 3002 });
    assert.equal(result.realmAssignmentSource, "explicit-path");
  }
});

void test("OpenTUI create preview resolves default folder and realm assignment", () => {
  const result = WorktreeStackKit_previewOpenTuiCreate({
    dateToken: "260521",
    deriveSlotPorts: (slot) => ({ api: 8000 + slot }),
    envSummaryMessages: TEST_ENV_SUMMARIES,
    requestedRealmSlug: "worktree-3",
    resolveRealmAssignment: ({ requestedRealmSlug, stackName }) => ({
      assignment: {
        realmAssignmentSource: `${stackName}-source`,
        realmSlug: requestedRealmSlug,
      },
      ok: true,
    }),
    slot: 7,
    stackName: "Stack Name",
    worktreePathOverride: "",
    worktreesBase: "/tmp/worktrees",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.envSummary, TEST_ENV_SUMMARIES.defaultPath);
    assert.equal(result.folderName, "260521WT03-STACK-NAME");
    assert.deepEqual(result.ports, { api: 8007 });
    assert.equal(result.realmAssignmentSource, "Stack Name-source");
    assert.equal(result.realmSlug, "worktree-3");
    assert.equal(result.worktreePath, "/tmp/worktrees/260521WT03-STACK-NAME");
  }
});

void test("OpenTUI create previewer binds configured defaults for adapters", () => {
  const previewer = WorktreeStackKit_createOpenTuiCreatePreviewer({
    deriveSlotPorts: (slot) => ({ api: 8000 + slot }),
    envSummaryMessages: TEST_ENV_SUMMARIES,
    resolveDefaultWorktreesBase: (repoRoot) => `${repoRoot}/worktrees`,
    resolveRealmAssignment: ({ requestedRealmSlug, stackName }) => ({
      assignment: {
        realmAssignmentSource: `${stackName}-source`,
        realmSlug: requestedRealmSlug,
      },
      ok: true,
    }),
  });

  assert.equal(previewer.defaultWorktreesBase("/repo"), "/repo/worktrees");
  assert.deepEqual(
    previewer.previewCreate({
      dateToken: "260521",
      repoRoot: "/repo",
      requestedRealmSlug: "worktree-1",
      slot: 4,
      stackName: "Demo",
      worktreePathOverride: "",
      worktreesBase: "/repo/worktrees",
    }),
    {
      envSummary: TEST_ENV_SUMMARIES.defaultPath,
      folderName: "260521WT01-DEMO",
      ok: true,
      ports: { api: 8004 },
      realmAssignmentSource: "Demo-source",
      realmSlug: "worktree-1",
      worktreePath: "/repo/worktrees/260521WT01-DEMO",
    },
  );
});

void test("OpenTUI create preview formatter uses configured port labels", () => {
  assert.equal(
    WorktreeStackKit_formatOpenTuiCreatePreviewText({
      commandPreview: "npx tsx create.ts --name demo",
      portSummaryItems: [
        { key: "api", label: "api" },
        { key: "admin", label: "admin" },
      ],
      preview: {
        envSummary: "env summary",
        folderName: "260521WT03-DEMO",
        ok: true,
        ports: { admin: 8103, api: 8003 },
        realmAssignmentSource: "pool",
        realmSlug: "worktree-3",
        worktreePath: "/tmp/worktrees/260521WT03-DEMO",
      },
    }),
    [
      "npx tsx create.ts --name demo",
      "",
      "Derived preview:",
      "  worktree path: /tmp/worktrees/260521WT03-DEMO",
      "  realm slug: worktree-3 (source=pool)",
      "  folder: 260521WT03-DEMO",
      "  ports: api=8003 admin=8103",
      "",
      "env summary",
    ].join("\n"),
  );
});

void test("OpenTUI create preview returns port derivation errors", () => {
  const result = WorktreeStackKit_previewOpenTuiCreate({
    deriveSlotPorts: () => {
      throw new Error("bad slot");
    },
    envSummaryMessages: TEST_ENV_SUMMARIES,
    requestedRealmSlug: "",
    resolveRealmAssignment: () => ({
      assignment: { realmSlug: "unused" },
      ok: true,
    }),
    slot: 0,
    stackName: "Demo",
    worktreePathOverride: "/tmp/worktrees/demo",
    worktreesBase: "/tmp/worktrees",
  });

  assert.deepEqual(result, { errorMessage: "bad slot", ok: false });
});

void test("OpenTUI create realm assignment parser validates JSON shape", () => {
  assert.deepEqual(
    WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson(
      '{"realmSlug":"demo","realmAssignmentSource":"pool"}',
    ),
    {
      assignment: {
        realmAssignmentSource: "pool",
        realmSlug: "demo",
      },
      ok: true,
    },
  );

  const invalidJson =
    WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson("{");
  assert.equal(invalidJson.ok, false);
  if (!invalidJson.ok) {
    assert.match(invalidJson.errorMessage, /non-JSON/u);
  }

  const nonObject =
    WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson("[]");
  assert.equal(nonObject.ok, false);
  if (!nonObject.ok) {
    assert.match(nonObject.errorMessage, /non-object JSON/u);
  }
});
