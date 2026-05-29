/**
 * @fileoverview Verifies the configured prepared-worktree create runner surfaces `--help` usage text
 * without exercising git, filesystem mutations, or full orchestration.
 *
 * This file owns regression coverage for `WorktreeStackKit_runConfiguredCreateCommand` when argv
 * requests help: stubbed adapter config, intercepted `console.log`, and `exitProcess` mapped to a
 * thrown sentinel so Node's test runner can assert exit status 0 and the printed usage line.
 * Flow: build minimal `WorktreeStackKit_ConfiguredCreateCommandConfig` -> invoke runner with `--help` -> capture logs and exit signal.
 *
 * @example
 * ```typescript
 * test("prints help usage", () => {
 *   assert.throws(
 *     () =>
 *       WorktreeStackKit_runConfiguredCreateCommand({
 *         argv: ["--help"],
 *         config: configuredCreateCommandHelpConfig(),
 *         exitProcess: (status) => {
 *           throw new ConfiguredCreateCommandExitSignal(status);
 *         },
 *       }),
 *     (error: unknown) =>
 *       error instanceof ConfiguredCreateCommandExitSignal && error.status === 0,
 *   );
 * });
 * ```
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/configured-create-command.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create runner under test that wires argv, explicit project config, and delegated create steps before printing this module's asserted usage text on `--help`.
 * @see packages/worktree-kit/src/create-command.ts - Generic prepared-worktree create command runner whose sequencing contract the configured runner implements through the stubbed operations map built in tests here.
 * @see packages/worktree-kit/src/create-cli-context.ts - Shared argv parsing and base create-context construction merged by the configured runner before help handling and delegation.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_runConfiguredCreateCommand,
  type WorktreeStackKit_ConfiguredCreateCommandConfig,
} from "./configured-create-command.js";

class ConfiguredCreateCommandExitSignal extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`exit ${String(status)}`);
    this.status = status;
  }
}

function configuredCreateCommandHelpConfig(): WorktreeStackKit_ConfiguredCreateCommandConfig {
  return {
    buildEnvOrchestrationConfig: () => ({
      buildMaterializeArgs: () => [],
      envMaterializeFailureMessage: "materialize failed",
      environment: {},
      localStateSync: {
        configuredSubmodules: {
          appSubmodulePaths: [],
        },
        detectableLocalDirectoryBasenames: [],
        rewriteWorkspacePathFiles: [],
        syncableLocalDirectories: [],
        syncableLocalFiles: [],
      },
      materializeCommand: "node",
      packageEnvFileName: ".env",
      renderRuntimeEnvFile: () => "",
      runtimeEnvFileName: ".env.runtime",
      syncSharedRuntimeEnvKeys: () => undefined,
    }),
    cliContext: {
      branchPrefixDefault: "task",
      datePrefixEnvKey: "DATE_PREFIX",
      defaultBaseBranch: "main",
      defaultMetadataSource: "metadata-source",
      defaultWorktreesDirectoryName: "worktrees",
      environment: {},
      localLogicalEnvironmentRelativePath: "logical.env",
      localStateSourceWorkspacePathEnvKey: "LOCAL_STATE_SOURCE",
      machineRootRelativePath: "machine-root",
      primaryWorkspaceEnvRelativePath: ".env.runtime",
      projectRoot: process.cwd(),
      usageText: "configured create usage",
    },
    derivedPortDebugFields: [],
    derivePorts: () => new Map(),
    initialIntegrationStatuses: [],
    postProvision: {
      buildArtifactCommand: () => ({ args: [], command: "node" }),
      buildGeneratedSyncTargets: () => [],
      buildInstallArgs: () => [],
      buildStartTerminalCommand: () => ({ args: [], command: "node" }),
      installCommand: "npm",
      installSkippedStatus: "skipped",
      installVerifiedStatus: "verified",
      launchEditor: () => undefined,
      launchEditorDisabledMessage: "editor disabled",
      launchEditorStartModeMessage: () => "start mode selected",
      renderSummary: () => "summary",
      resolveCleanlinessTargets: () => [],
      resolveInstallTargets: () => [],
      startInWindow: () => undefined,
      terminalStartMode: "terminal",
      windowStartMode: "iterm",
    },
    preflight: {
      generatedArtifactRequirements: [],
      metadataRelativePath: "metadata.json",
      primaryEnvMissingExpectedFileLabel: "primary-env",
      primaryEnvMissingWarning: "primary env missing",
      realmMetadataField: "realm",
      requiredCommandNames: [],
      requiredDirectories: [],
      requiredFiles: [],
      slotMetadataField: "slot",
    },
    preflightPorts: () => [],
    realmAndGit: {
      allocateRealm: () => ({}),
      configuredSubmodules: {
        appSubmodulePaths: [],
      },
      defaultFallbackBaseBranch: "main",
      defaultRealmAssignmentSource: "default",
      metadataRelativePath: "metadata.json",
      realmAssignmentSourceMetadataField: "realmSource",
      realmMetadataField: "realm",
      remoteName: "origin",
      requiredSubmoduleManifestRelativePaths: [],
      rootBranchMetadataField: "rootBranch",
      stackNameMetadataField: "stackName",
      submoduleBranchMetadataField: "submoduleBranch",
      worktreePathMetadataField: "worktreePath",
    },
    registrationHooks: [],
    serviceRoots: [],
  };
}

test("WorktreeStackKit_runConfiguredCreateCommand prints configured usage for help", () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (message?: unknown) => {
    logs.push(String(message));
  };

  try {
    assert.throws(
      () =>
        WorktreeStackKit_runConfiguredCreateCommand({
          argv: ["--help"],
          config: configuredCreateCommandHelpConfig(),
          exitProcess: (status) => {
            throw new ConfiguredCreateCommandExitSignal(status);
          },
        }),
      (error: unknown) =>
        error instanceof ConfiguredCreateCommandExitSignal &&
        error.status === 0,
    );
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(logs, ["configured create usage"]);
});
