/**
 * @fileoverview Node test regression coverage for the classic worktree-stack interactive flow
 * dispatch helpers (`WorktreeStackKit_runInteractiveMain`, pool preview, and bound runners).
 *
 * This file owns fake-session-driven assertions that menu selections reach the configured
 * `executionHooks.runCommand` preview path without executing real npm scripts.
 * Flow: build fake session + test config -> invoke interactive entry -> assert captured specs and session copy.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/interactive-flows.unit.test.ts
 * @testing Node test runner unit: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including this file).
 *
 * @see packages/worktree-kit/src/interactive-flows.ts - Runtime module under test that binds menu-driven classic interactive flows to configured npm script specs and session I/O.
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Command-spec types consumed when building fake captured `WorktreeStackKit_UiCommandSpec` arrays asserted against dispatch output.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WorktreeStackKit_bindInteractiveFlowRunners,
  WorktreeStackKit_runInteractiveMain,
  WorktreeStackKit_runInteractivePool,
  type WorktreeStackKit_InteractiveFlowSession,
  type WorktreeStackKit_InteractiveFlowsConfig,
} from "./interactive-flows.js";
import type { WorktreeStackKit_UiCommandSpec } from "./ui-command-catalog.js";

class FakeInteractiveFlowSession
  implements WorktreeStackKit_InteractiveFlowSession
{
  readonly commands: string[] = [];
  readonly successes: string[] = [];

  constructor(
    private readonly menuSelections: number[],
    private readonly requiredAnswers: string[] = [],
  ) {}

  clearScreen(): void {}
  pauseForCommand(): void {}
  printCommand(command: string): void {
    this.commands.push(command);
  }
  printHeader(_title: string, _context: string): void {}
  printKicker(_text: string): void {}
  printMenuItem(_index: number, _label: string, _description: string): void {}
  printMicrocopy(_text: string): void {}
  printNote(_text: string): void {}
  printPanelTitle(_title: string, _description: string): void {}
  printSectionBreak(): void {}
  printSuccess(text: string): void {
    this.successes.push(text);
  }
  async promptMenuSelection(_options: {
    max: number;
    prompt: string;
  }): Promise<number> {
    const nextSelection = this.menuSelections.shift();
    if (nextSelection === undefined) {
      throw new Error("Missing fake menu selection");
    }
    return nextSelection;
  }
  async promptPositiveIntegerWithDefault(
    _prompt: string,
    defaultValue: number,
  ): Promise<number> {
    return defaultValue;
  }
  async promptRequired(_prompt: string): Promise<string> {
    const answer = this.requiredAnswers.shift();
    if (answer === undefined) {
      throw new Error("Missing fake required answer");
    }
    return answer;
  }
  async promptWithDefault(
    _prompt: string,
    defaultValue: string,
  ): Promise<string> {
    return defaultValue;
  }
  async promptYesNo(
    _prompt: string,
    defaultAnswer: "n" | "y",
  ): Promise<boolean> {
    return defaultAnswer === "y";
  }
  resumeAfterCommand(): void {}
}

function buildTestConfig(
  capturedSpecs: WorktreeStackKit_UiCommandSpec[],
): WorktreeStackKit_InteractiveFlowsConfig {
  return {
    commands: {
      createScriptPath: "commands/create.ts",
      destroyScriptPath: "commands/destroy.ts",
      healthcheckScript: "router:healthcheck",
      mergeScriptPath: "commands/merge.ts",
      realmListScript: "realm:list",
      realmPoolGuideScript: "realm:pool:guide",
      realmPoolListScript: "realm:pool:list",
      realmPoolNextScript: "realm:pool:next",
      realmPoolPrepareScript: "realm:pool:prepare",
      realmPruneScript: "realm:prune",
      routerStatusScript: "router:status",
      startScriptPath: "commands/start.ts",
      updateFromMainScriptPath: "commands/update-from-main.ts",
    },
    defaultWorktreesBase: "/tmp/worktrees",
    executionHooks: {
      commandPreview: (spec) =>
        spec.kind === "npm" ? spec.script : spec.scriptPath,
      runCommand: (spec) => {
        capturedSpecs.push(spec);
      },
    },
    repoRoot: "/repo",
  };
}

test("WorktreeStackKit_runInteractiveMain exits without running commands", async () => {
  const capturedSpecs: WorktreeStackKit_UiCommandSpec[] = [];
  const session = new FakeInteractiveFlowSession([11]);

  await WorktreeStackKit_runInteractiveMain({
    config: buildTestConfig(capturedSpecs),
    session,
  });

  assert.deepEqual(capturedSpecs, []);
  assert.deepEqual(session.successes, ["Leaving the worktree console."]);
});

test("WorktreeStackKit_runInteractiveMain dispatches configured npm scripts", async () => {
  const capturedSpecs: WorktreeStackKit_UiCommandSpec[] = [];
  const session = new FakeInteractiveFlowSession([6, 11]);

  await WorktreeStackKit_runInteractiveMain({
    config: buildTestConfig(capturedSpecs),
    session,
  });

  assert.deepEqual(capturedSpecs, [
    { args: [], kind: "npm", script: "realm:list" },
  ]);
  assert.deepEqual(session.commands, ["realm:list"]);
});

test("WorktreeStackKit_runInteractivePool previews the next realm through configured script", async () => {
  const capturedSpecs: WorktreeStackKit_UiCommandSpec[] = [];
  const session = new FakeInteractiveFlowSession([4, 5], ["stack-a"]);

  await WorktreeStackKit_runInteractivePool({
    config: buildTestConfig(capturedSpecs),
    session,
  });

  assert.deepEqual(capturedSpecs, [
    {
      args: ["--stack-name", "stack-a"],
      kind: "npm",
      script: "realm:pool:next",
    },
  ]);
  assert.deepEqual(session.successes, [
    "Returning to the main worktree console.",
  ]);
});

test("WorktreeStackKit_bindInteractiveFlowRunners reuses the bound config", async () => {
  const capturedSpecs: WorktreeStackKit_UiCommandSpec[] = [];
  const session = new FakeInteractiveFlowSession([6, 11]);
  const runners = WorktreeStackKit_bindInteractiveFlowRunners({
    config: buildTestConfig(capturedSpecs),
  });

  await runners.main(session);

  assert.deepEqual(capturedSpecs, [
    { args: [], kind: "npm", script: "realm:list" },
  ]);
  assert.deepEqual(session.commands, ["realm:list"]);
});
