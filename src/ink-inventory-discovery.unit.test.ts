/**
 * @fileoverview Verifies Ink worktree inventory discovery by asserting `WorktreeStackKit_parseInkGitWorktreeList`
 * and `WorktreeStackKit_loadInkInventory` behavior behind injected filesystem, git, realm, and health dependencies.
 *
 * This file owns Node `node:test` regression coverage for the inventory record shape, issue codes, and summary
 * counters used by the interactive Ink stack when listing prepared worktrees, merge sandboxes, and canonical roots.
 * Flow: build stubbed `WorktreeStackKit_InkDiscoveryDependencies` -> parse porcelain `git worktree list` -> load inventory -> assert records and summaries.
 *
 * @testing Node test: cd packages/worktree-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ink-inventory-discovery.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-inventory-discovery.ts - Inventory loader and git worktree list parser whose merge-root detection, realm joins, health rollups, and issue taxonomy are exercised here.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Realm record contract imported by these tests when stubbing `readRealmRecords` inputs for inventory assembly.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_loadInkInventory,
  WorktreeStackKit_parseInkGitWorktreeList,
  type WorktreeStackKit_InkDiscoveryDependencies,
  type WorktreeStackKit_InkHealthArtifact,
} from "./ink-inventory-discovery.js";
import type { WorktreeStackKit_InkUiRealmRecord } from "./ink-ui-contracts.js";

function createDiscoveryDependencies(options: {
  readonly canonicalRootPath?: string;
  readonly existingPaths: readonly string[];
  readonly files: ReadonlyMap<string, string>;
  readonly gitPorcelain: string;
  readonly healthArtifact: WorktreeStackKit_InkHealthArtifact | null;
  readonly realmRecords: readonly WorktreeStackKit_InkUiRealmRecord[];
}): WorktreeStackKit_InkDiscoveryDependencies {
  const existingPaths = new Set(options.existingPaths);
  return {
    async listGitWorktrees() {
      return options.gitPorcelain;
    },
    async readTextFile(path) {
      const value = options.files.get(path);
      if (value === undefined) {
        throw new Error(`Unexpected path ${path}`);
      }
      return value;
    },
    pathExists(path) {
      return existingPaths.has(path);
    },
    resolveCheckoutIdentity() {
      return {
        canonicalRootWorkspacePath: options.canonicalRootPath ?? "/repo/main",
        checkoutKind: "prepared-worktree",
      };
    },
    async readRealmRecords() {
      return [...options.realmRecords];
    },
    async readHealthArtifact() {
      return options.healthArtifact;
    },
  };
}

void test("WorktreeStackKit_parseInkGitWorktreeList parses branch and detached entries", () => {
  const entries = WorktreeStackKit_parseInkGitWorktreeList(`worktree /repo/main
HEAD abc123
branch refs/heads/main

worktree /repo/.tmp/worktree-stack/merge/root
HEAD def456
detached
`);

  assert.deepEqual(entries, [
    {
      worktreePath: "/repo/main",
      head: "abc123",
      branchRef: "refs/heads/main",
      detached: false,
    },
    {
      worktreePath: "/repo/.tmp/worktree-stack/merge/root",
      head: "def456",
      branchRef: null,
      detached: true,
    },
  ]);
});

void test("WorktreeStackKit_loadInkInventory preserves managed, health, and temporary merge records", async () => {
  const projectRoot = "/repo/worktrees/tooling-console";
  const metadataPath = `${projectRoot}/.tmp/worktree-stack/metadata.json`;
  const handbookJsonPath = `${projectRoot}/.tmp/worktree-stack/worktree-info.json`;
  const handbookMarkdownPath = `${projectRoot}/WORKTREE.local.md`;

  const inventory = await WorktreeStackKit_loadInkInventory({
    projectRoot,
    dependencies: createDiscoveryDependencies({
      existingPaths: [metadataPath, handbookJsonPath, handbookMarkdownPath],
      files: new Map([
        [
          metadataPath,
          JSON.stringify({
            stackName: "tooling-console",
            realmSlug: "workspace-03",
            rootBranch: "agent/tooling-console",
            submoduleBranch: "agent/tooling-console",
            baseBranch: "main",
            workspaceType: "worktree",
            slot: 3,
            createdAt: "2026-03-12T00:00:00.000Z",
            ports: {
              api: 8014,
            },
          }),
        ],
        [
          handbookJsonPath,
          JSON.stringify({
            stackName: "tooling-console",
            realmSlug: "workspace-03",
            authHost: "https://auth.workspace-03.example.test",
            generatedAt: "2026-03-12T00:00:00.000Z",
            commands: {
              start:
                "npm run worktrees:start -- --worktree /repo/worktrees/tooling-console",
            },
            hosts: {
              auth: "https://auth.workspace-03.example.test",
            },
          }),
        ],
      ]),
      gitPorcelain: `worktree ${projectRoot}
HEAD abc123
branch refs/heads/agent/tooling-console

worktree ${projectRoot}/.tmp/worktree-stack/merge/merge-20260312/root
HEAD def456
detached
`,
      healthArtifact: {
        runAt: "2026-03-12T14:13:58.856Z",
        method: "reverse-proxy",
        probes: [
          {
            realmSlug: "workspace-03",
            healthy: false,
            statusCode: 502,
            failureDomain: "application",
            surface: "www",
          },
          {
            realmSlug: "workspace-03",
            healthy: true,
            statusCode: 200,
            failureDomain: "none",
            surface: "auth",
          },
        ],
      },
      realmRecords: [
        {
          realmSlug: "workspace-03",
          status: "inactive",
          workspacePath: projectRoot,
          primaryMethod: "reverse-proxy",
          rootBranch: "agent/tooling-console",
          submoduleBranch: "agent/tooling-console",
        },
      ],
    }),
  });

  assert.equal(inventory.records.length, 2);
  assert.equal(inventory.records[0]?.currentCheckout, true);
  assert.equal(inventory.records[0]?.checkoutKind, "prepared-worktree");
  assert.equal(inventory.records[0]?.metadata?.realmSlug, "workspace-03");
  assert.equal(inventory.records[0]?.realmRecord?.status, "inactive");
  assert.equal(inventory.records[0]?.healthSummary?.failingProbeCount, 1);
  assert.equal(inventory.records[1]?.temporaryMerge, true);
  assert.ok(
    inventory.records[1]?.issues
      .map((issue) => issue.code)
      .includes("temporary-merge-worktree"),
  );
  assert.equal(inventory.summary.totalRecords, 2);
  assert.equal(inventory.summary.inactiveRealms, 1);
  assert.equal(inventory.summary.unhealthyRealms, 1);
});

void test("WorktreeStackKit_loadInkInventory treats canonical root entries as root identity", async () => {
  const projectRoot = "/repo/worktrees/tooling-console";
  const canonicalRootPath = "/repo/main";
  const metadataPath = `${projectRoot}/.tmp/worktree-stack/metadata.json`;
  const handbookJsonPath = `${projectRoot}/.tmp/worktree-stack/worktree-info.json`;
  const handbookMarkdownPath = `${projectRoot}/WORKTREE.local.md`;
  const onboardingMarkdownPath = `${projectRoot}/WORKTREE.readme.md`;

  const inventory = await WorktreeStackKit_loadInkInventory({
    projectRoot,
    dependencies: createDiscoveryDependencies({
      canonicalRootPath,
      existingPaths: [
        metadataPath,
        handbookJsonPath,
        handbookMarkdownPath,
        onboardingMarkdownPath,
      ],
      files: new Map([
        [
          metadataPath,
          JSON.stringify({
            stackName: "tooling-console",
            realmSlug: "workspace-03",
            rootBranch: "agent/tooling-console",
            submoduleBranch: "agent/tooling-console",
            baseBranch: "main",
            workspaceType: "worktree",
            slot: 3,
          }),
        ],
        [
          handbookJsonPath,
          JSON.stringify({
            stackName: "tooling-console",
            realmSlug: "workspace-03",
            authHost: "https://auth.workspace-03.example.test",
            generatedAt: "2026-03-12T00:00:00.000Z",
            commands: {},
            hosts: {},
          }),
        ],
      ]),
      gitPorcelain: `worktree ${projectRoot}
HEAD abc123
branch refs/heads/agent/tooling-console

worktree ${canonicalRootPath}
HEAD fedcba
branch refs/heads/main
`,
      healthArtifact: null,
      realmRecords: [],
    }),
  });

  const rootRecord = inventory.records.find(
    (record) => record.worktreePath === canonicalRootPath,
  );
  const issueCodes = rootRecord?.issues.map((issue) => issue.code) ?? [];

  assert.equal(rootRecord?.checkoutKind, "canonical-root-workspace");
  assert.equal(issueCodes.includes("metadata-missing"), false);
  assert.equal(issueCodes.includes("handbook-json-missing"), false);
  assert.equal(issueCodes.includes("root-context-missing"), true);
});
