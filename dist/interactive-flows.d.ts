/**
 * @fileoverview Reusable classic terminal flow runners for worktree-stack lifecycle menus.
 *
 * Flow: a readline-like session + project-supplied script/config paths -> prompted command specs ->
 * previewed subprocess execution. Project adapters own exact npm script names, command file paths,
 * and root/default worktree paths; this package owns the prompt sequence and dispatch control flow.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/interactive-flows.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute every packages/worktree-kit src/*.unit.test.ts file via tsx --test, including interactive-flows.unit.test.ts.
 * @see packages/worktree-kit/src/ui-command-catalog.ts - Command catalog that builds TSX/npm command specs, formats previews, and runs subprocess dispatch invoked by these flows after prompts resolve.
 * @see packages/worktree-kit/src/interactive-worktrees.ts - Known prepared-worktree discovery, slot picking, and path resolution feeding the path-picker prompts shared across these lifecycle runners.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { type WorktreeStackKit_UiCommandSpec } from "./ui-command-catalog.js";
import { type WorktreeStackKit_InteractiveKnownWorktree } from "./interactive-worktrees.js";
/** Session surface required by package-owned classic terminal flow runners. */
export type WorktreeStackKit_InteractiveFlowSession = {
    clearScreen(): void;
    pauseForCommand(): void;
    printCommand(command: string): void;
    printHeader(title: string, context: string): void;
    printKicker(text: string): void;
    printMenuItem(index: number, label: string, description: string): void;
    printMicrocopy(text: string): void;
    printNote(text: string): void;
    printPanelTitle(title: string, description: string): void;
    printSectionBreak(): void;
    printSuccess(text: string): void;
    promptMenuSelection(options: {
        max: number;
        prompt: string;
    }): Promise<number>;
    promptPositiveIntegerWithDefault(prompt: string, defaultValue: number): Promise<number>;
    promptRequired(prompt: string): Promise<string>;
    promptWithDefault(prompt: string, defaultValue: string): Promise<string>;
    promptYesNo(prompt: string, defaultAnswer: "n" | "y"): Promise<boolean>;
    resumeAfterCommand(): void;
};
/** Command path/script names supplied by the repository adapter. */
export type WorktreeStackKit_InteractiveFlowsCommandConfig = {
    readonly createScriptPath: string;
    readonly destroyScriptPath: string;
    readonly healthcheckScript: string;
    readonly mergeScriptPath: string;
    readonly realmListScript: string;
    readonly realmPoolGuideScript: string;
    readonly realmPoolListScript: string;
    readonly realmPoolNextScript: string;
    readonly realmPoolPrepareScript: string;
    readonly realmPruneScript: string;
    readonly routerStatusScript: string;
    readonly startScriptPath: string;
    readonly updateFromMainScriptPath: string;
};
/** Injectable execution hooks used by tests and nonstandard adapters. */
export type WorktreeStackKit_InteractiveFlowsExecutionHooks = {
    readonly collectKnownWorktrees?: () => WorktreeStackKit_InteractiveKnownWorktree[];
    readonly commandPreview?: (spec: WorktreeStackKit_UiCommandSpec) => string;
    readonly resolveExistingPath?: (inputPath: string) => string;
    readonly runCommand?: (spec: WorktreeStackKit_UiCommandSpec) => void;
};
/** Configuration consumed by package-owned classic terminal flow runners. */
export type WorktreeStackKit_InteractiveFlowsConfig = {
    readonly commands: WorktreeStackKit_InteractiveFlowsCommandConfig;
    readonly defaultWorktreesBase: string;
    readonly executionHooks?: WorktreeStackKit_InteractiveFlowsExecutionHooks;
    readonly repoRoot: string;
};
/** Options common to all exported flow runners. */
export type WorktreeStackKit_RunInteractiveFlowOptions = {
    readonly config: WorktreeStackKit_InteractiveFlowsConfig;
    readonly session: WorktreeStackKit_InteractiveFlowSession;
};
/** Session-only runner shape used by root adapters after config has been bound once. */
export type WorktreeStackKit_BoundInteractiveFlowRunner = (session: WorktreeStackKit_InteractiveFlowSession) => Promise<void>;
/** Named runner map matching the classic numbered worktree interactive entrypoints. */
export type WorktreeStackKit_BoundInteractiveFlowRunners = {
    readonly create: WorktreeStackKit_BoundInteractiveFlowRunner;
    readonly destroy: WorktreeStackKit_BoundInteractiveFlowRunner;
    readonly main: WorktreeStackKit_BoundInteractiveFlowRunner;
    readonly merge: WorktreeStackKit_BoundInteractiveFlowRunner;
    readonly pool: WorktreeStackKit_BoundInteractiveFlowRunner;
    readonly start: WorktreeStackKit_BoundInteractiveFlowRunner;
    readonly updateFromMain: WorktreeStackKit_BoundInteractiveFlowRunner;
};
/** Options for binding package-owned flow runners to one repository-supplied config. */
export type WorktreeStackKit_BindInteractiveFlowRunnersOptions = {
    readonly config: WorktreeStackKit_InteractiveFlowsConfig;
};
/** Guided prompts that collect create parameters then run the configured create command. */
export declare function WorktreeStackKit_runInteractiveCreate(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/** Prompts for an existing worktree path and optional editor open, then runs start. */
export declare function WorktreeStackKit_runInteractiveStart(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/** Collects refresh mode, target branch, and execution mode before running update-from-main. */
export declare function WorktreeStackKit_runInteractiveUpdateFromMain(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/** Orchestrates merge-to-main prompts then runs the configured merge command. */
export declare function WorktreeStackKit_runInteractiveMerge(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/** Confirms prune behavior and executes destroy for the selected worktree path. */
export declare function WorktreeStackKit_runInteractiveDestroy(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/** Nested menu driving configured realm pool npm scripts until the operator backs out. */
export declare function WorktreeStackKit_runInteractivePool(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/** Top-level interactive router that renders the main menu and dispatches lifecycle flows. */
export declare function WorktreeStackKit_runInteractiveMain(options: WorktreeStackKit_RunInteractiveFlowOptions): Promise<void>;
/**
 * Binds all classic interactive flow runners to one config for tiny script adapters.
 *
 * @remarks
 * The returned functions still receive the runtime session from the root launcher, while command
 * paths, npm script names, repo root, and default worktree base stay fixed to the adapter config.
 */
export declare function WorktreeStackKit_bindInteractiveFlowRunners(options: WorktreeStackKit_BindInteractiveFlowRunnersOptions): WorktreeStackKit_BoundInteractiveFlowRunners;
