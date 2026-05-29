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

import {
  WorktreeStackKit_buildUiCreateArgs,
  WorktreeStackKit_buildUiDestroyArgs,
  WorktreeStackKit_buildUiMergeArgs,
  WorktreeStackKit_buildUiPoolNextArgs,
  WorktreeStackKit_buildUiStartArgs,
  WorktreeStackKit_buildUiUpdateFromMainArgs,
  WorktreeStackKit_formatUiCommandPreview,
  WorktreeStackKit_runUiCommand,
  type WorktreeStackKit_UiCommandSpec,
  type WorktreeStackKit_UiExecutionMode,
  type WorktreeStackKit_UiUpdateMode,
} from "./ui-command-catalog.js";
import {
  WorktreeStackKit_collectInteractiveKnownWorktrees,
  WorktreeStackKit_collectInteractiveUsedSlots,
  WorktreeStackKit_pickNextInteractiveSlot,
  WorktreeStackKit_resolveExistingInteractivePath,
  type WorktreeStackKit_InteractiveKnownWorktree,
} from "./interactive-worktrees.js";

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
  promptPositiveIntegerWithDefault(
    prompt: string,
    defaultValue: number,
  ): Promise<number>;
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
export type WorktreeStackKit_BoundInteractiveFlowRunner = (
  session: WorktreeStackKit_InteractiveFlowSession,
) => Promise<void>;

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

/** Collects a validated prepared-worktree path from known worktrees or a manual path entry. */
async function WorktreeStackKit_chooseInteractiveExistingPath(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<string> {
  const worktrees =
    options.config.executionHooks?.collectKnownWorktrees?.() ??
    WorktreeStackKit_collectInteractiveKnownWorktrees(options.config.repoRoot);
  const resolveExistingPath =
    options.config.executionHooks?.resolveExistingPath ??
    WorktreeStackKit_resolveExistingInteractivePath;

  if (worktrees.length === 0) {
    const manualPath = await options.session.promptRequired(
      "No known worktrees found. Enter worktree path",
    );
    return resolveExistingPath(manualPath);
  }

  options.session.printPanelTitle(
    "Available Worktrees",
    "Pick an existing prepared worktree or enter a path manually.",
  );
  worktrees.forEach((worktree, index) => {
    options.session.printMenuItem(index + 1, worktree.summary, worktree.path);
  });
  const manualIndex = worktrees.length + 1;
  options.session.printMenuItem(
    manualIndex,
    "Enter a path manually",
    "Use an absolute or relative worktree path",
  );

  const selectedIndex = await options.session.promptMenuSelection({
    max: manualIndex,
    prompt: `Choose a worktree [1-${manualIndex}]: `,
  });

  if (selectedIndex === manualIndex) {
    const manualPath = await options.session.promptRequired(
      "Enter worktree path",
    );
    return resolveExistingPath(manualPath);
  }

  const selectedWorktree = worktrees[selectedIndex - 1];
  if (selectedWorktree === undefined) {
    throw new Error(
      `Selected worktree index is out of bounds: ${String(selectedIndex)}`,
    );
  }

  return selectedWorktree.path;
}

/** Prompts for refresh-from-main dirty-worktree semantics. */
async function WorktreeStackKit_promptInteractiveUpdateMode(
  session: WorktreeStackKit_InteractiveFlowSession,
): Promise<WorktreeStackKit_UiUpdateMode> {
  session.printSectionBreak();
  session.printKicker("  Refresh Mode");
  session.printNote(
    "live-worktree updates the selected checked-out branches in place and refuses dirty repos.",
  );
  session.printNote(
    "pushed-only leaves the open files untouched and refreshes only the published branch tips.",
  );
  session.printMenuItem(
    1,
    "live-worktree",
    "Use only when the root repo and required submodules are clean",
  );
  session.printMenuItem(
    2,
    "pushed-only",
    "Use when local worktree files are dirty but pushed branch tips should catch up",
  );

  const selected = await session.promptMenuSelection({
    max: 2,
    prompt: "Choose refresh mode [1-2]: ",
  });
  return selected === 1 ? "live-worktree" : "pushed-only";
}

/** Maps a yes/no confirmation into plan-only versus push-and-execute semantics. */
async function WorktreeStackKit_promptInteractiveExecutionMode(options: {
  readonly executePrompt: string;
  readonly session: WorktreeStackKit_InteractiveFlowSession;
}): Promise<WorktreeStackKit_UiExecutionMode> {
  return (await options.session.promptYesNo(options.executePrompt, "n"))
    ? "push"
    : "plan";
}

/** Shows the resolved command preview, pauses the TUI, and runs the backing script or npm task. */
async function WorktreeStackKit_executeInteractiveCommand(options: {
  readonly config: WorktreeStackKit_InteractiveFlowsConfig;
  readonly session: WorktreeStackKit_InteractiveFlowSession;
  readonly spec: WorktreeStackKit_UiCommandSpec;
}): Promise<void> {
  const commandPreview =
    options.config.executionHooks?.commandPreview?.(options.spec) ??
    WorktreeStackKit_formatUiCommandPreview({
      repoRoot: options.config.repoRoot,
      spec: options.spec,
    });
  options.session.printCommand(commandPreview);
  options.session.pauseForCommand();
  try {
    if (options.config.executionHooks?.runCommand !== undefined) {
      options.config.executionHooks.runCommand(options.spec);
    } else {
      WorktreeStackKit_runUiCommand({
        repoRoot: options.config.repoRoot,
        spec: options.spec,
      });
    }
  } finally {
    options.session.resumeAfterCommand();
  }
}

/** Guided prompts that collect create parameters then run the configured create command. */
export async function WorktreeStackKit_runInteractiveCreate(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  session.printHeader("WORKTREE CONSOLE", "CREATE");
  session.printPanelTitle(
    "Create Worktree",
    "Prepare a new Git worktree, branch layout, local handbook, and realm-ready metadata.",
  );

  session.printKicker("  Identity");
  session.printNote(
    "Stack name becomes the branch suffix and realm slug seed.",
  );
  session.printNote(
    "The actual worktree folder is created as YYMMDD<realm-token>-<STACK-NAME>, for example 260310WT03-CLI-INK-EXPERIMENT.",
  );
  const stackName = await session.promptRequired("Stack name");

  const knownWorktrees =
    config.executionHooks?.collectKnownWorktrees?.() ??
    WorktreeStackKit_collectInteractiveKnownWorktrees(config.repoRoot);
  const autoSlot = WorktreeStackKit_pickNextInteractiveSlot(
    WorktreeStackKit_collectInteractiveUsedSlots(knownWorktrees),
  );
  session.printSectionBreak();
  session.printKicker("  Ports");
  session.printNote(
    "Slot controls the deterministic port bundle for this worktree.",
  );
  session.printNote(
    "The interactive flow auto-picks the first free slot to avoid collisions.",
  );
  let slot = autoSlot;
  if (
    await session.promptYesNo(`Override the suggested slot ${autoSlot}?`, "n")
  ) {
    slot = await session.promptPositiveIntegerWithDefault(
      "Slot number",
      autoSlot,
    );
  }

  session.printSectionBreak();
  session.printKicker("  Branching");
  session.printNote(
    "Base branch is the starting branch in the root repository before the new worktree branch is created.",
  );
  const baseBranch = await session.promptWithDefault("Base branch", "main");

  let rootBranch = `codex/${stackName}`;
  let submoduleBranch = `codex/${stackName}`;
  session.printNote(
    `Default branches are root='${rootBranch}' and submodules='${submoduleBranch}'.`,
  );
  session.printNote(
    "Change these only when you intentionally want a different Git branch layout.",
  );
  if (
    await session.promptYesNo(
      "Override the default root/submodule branch names?",
      "n",
    )
  ) {
    rootBranch = await session.promptWithDefault("Root branch", rootBranch);
    submoduleBranch = await session.promptWithDefault(
      "Submodule branch",
      submoduleBranch,
    );
  }

  session.printSectionBreak();
  session.printKicker("  Location");
  session.printNote(
    "Worktrees base is the parent folder where sibling worktree directories will be created.",
  );
  const worktreesBase = await session.promptWithDefault(
    "Worktrees base",
    config.defaultWorktreesBase,
  );

  session.printSectionBreak();
  session.printKicker("  Environment");
  session.printNote(
    "Copy env files reuses your current main-workspace local configuration and secrets when matching .env files exist.",
  );
  session.printNote(
    "Choose 'no' if you want to seed the worktree manually instead of inheriting local settings.",
  );
  const copyEnvFromMain = await session.promptYesNo(
    "Copy env files from main repo when available?",
    "y",
  );

  session.printSectionBreak();
  session.printKicker("  Install");
  session.printNote(
    "Install dependencies runs npm install in the root and runtime app submodules after the worktree is created.",
  );
  session.printNote(
    "This is now the default so an auto-started worktree is actually runnable.",
  );
  const installDependencies = await session.promptYesNo(
    "Install dependencies after setup?",
    "y",
  );
  let installSkipExisting = false;
  let installPreferOnline = false;
  if (installDependencies) {
    session.printNote(
      "Skip existing node_modules avoids reinstalling packages where dependencies are already present.",
    );
    installSkipExisting = await session.promptYesNo(
      "Skip installs where node_modules already exists?",
      "y",
    );
    session.printNote(
      "Prefer online installs favors fresh package resolution. Default behavior prefers local cache for speed.",
    );
    installPreferOnline = await session.promptYesNo(
      "Prefer online installs instead of prefer-offline?",
      "n",
    );
  }

  session.printSectionBreak();
  session.printKicker("  Editor");
  session.printNote("Windsurf Next launch is opt-in for the new worktree.");
  const openWindsurf = await session.promptYesNo(
    "Open the worktree in Windsurf Next?",
    "n",
  );

  session.printSectionBreak();
  session.printKicker("  Runtime");
  session.printNote(
    "Create now prepares the worktree first and can optionally hand off straight into the canonical start flow.",
  );
  session.printNote(
    "Starting in this terminal keeps logs, errors, and Ctrl-C behavior in the same place.",
  );
  let startMode: "iterm" | "none" | "terminal" = "none";
  if (
    await session.promptYesNo(
      "Start the worktree immediately after creation?",
      "y",
    )
  ) {
    if (
      await session.promptYesNo(
        "Open the runtime in a new iTerm window instead of this terminal?",
        "n",
      )
    ) {
      startMode = "iterm";
    } else {
      startMode = "terminal";
    }
  }

  await WorktreeStackKit_executeInteractiveCommand({
    config,
    session,
    spec: {
      args: WorktreeStackKit_buildUiCreateArgs({
        baseBranch,
        copyEnvFromMain,
        installDependencies,
        installPreferOnline,
        installSkipExisting,
        openWindsurf,
        rootBranch,
        slot,
        stackName,
        startMode,
        submoduleBranch,
        worktreesBase,
      }),
      kind: "tsx",
      scriptPath: config.commands.createScriptPath,
    },
  });
}

/** Prompts for an existing worktree path and optional editor open, then runs start. */
export async function WorktreeStackKit_runInteractiveStart(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  session.printHeader("WORKTREE CONSOLE", "START");
  session.printPanelTitle(
    "Start Worktree",
    "Validate metadata, register the realm, refresh shared router artifacts, and start the runtime.",
  );
  session.printNote(
    "Start validates the prepared metadata, registers the realm, refreshes shared router artifacts, and runs the worktree behind the router.",
  );
  const worktreePath =
    await WorktreeStackKit_chooseInteractiveExistingPath(options);

  session.printSectionBreak();
  session.printKicker("  Editor");
  session.printNote(
    "Start can optionally open the selected worktree in Windsurf Next before handing off to the runtime.",
  );
  const openWindsurf = await session.promptYesNo(
    "Open the selected worktree in Windsurf Next?",
    "n",
  );

  await WorktreeStackKit_executeInteractiveCommand({
    config,
    session,
    spec: {
      args: WorktreeStackKit_buildUiStartArgs({ openWindsurf, worktreePath }),
      kind: "tsx",
      scriptPath: config.commands.startScriptPath,
    },
  });
}

/** Collects refresh mode, target branch, and execution mode before running update-from-main. */
export async function WorktreeStackKit_runInteractiveUpdateFromMain(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  session.printHeader("WORKTREE CONSOLE", "UPDATE FROM MAIN");
  session.printPanelTitle(
    "Update Worktree From Main",
    "Merge origin/main into the prepared worktree branches without rebasing them.",
  );
  session.printNote(
    "Required app submodules refresh first and the root repo refreshes last.",
  );
  session.printNote(
    "Validation proves origin/main becomes an ancestor of the refreshed worktree branches.",
  );
  const worktreePath =
    await WorktreeStackKit_chooseInteractiveExistingPath(options);
  const mode = await WorktreeStackKit_promptInteractiveUpdateMode(session);

  session.printSectionBreak();
  session.printKicker("  Target");
  session.printNote(
    "The default source branch is origin/main across the root repo and required app submodules.",
  );
  const targetBranch = await session.promptWithDefault("Target branch", "main");

  session.printSectionBreak();
  session.printKicker("  Execution");
  session.printNote(
    "Preview prints the exact update plan only. Push executes the refresh and pushes the updated worktree branches.",
  );
  const executionMode = await WorktreeStackKit_promptInteractiveExecutionMode({
    executePrompt: "Execute the refresh and push updated worktree branches?",
    session,
  });

  await WorktreeStackKit_executeInteractiveCommand({
    config,
    session,
    spec: {
      args: WorktreeStackKit_buildUiUpdateFromMainArgs({
        executionMode,
        mode,
        targetBranch,
        worktreePath,
      }),
      kind: "tsx",
      scriptPath: config.commands.updateFromMainScriptPath,
    },
  });
}

/** Orchestrates merge-to-main prompts then runs the configured merge command. */
export async function WorktreeStackKit_runInteractiveMerge(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  session.printHeader("WORKTREE CONSOLE", "MERGE");
  session.printPanelTitle(
    "Merge Worktree Domain",
    "Merge the worktree root branch and required app submodule branches into their counterpart main branches.",
  );
  session.printNote(
    "Merge uses temporary detached Git worktrees, so it does not mutate the currently open worktree or your currently open main checkout.",
  );
  session.printNote(
    "Submodules are merged first and the root repo is merged last.",
  );
  const worktreePath =
    await WorktreeStackKit_chooseInteractiveExistingPath(options);

  session.printSectionBreak();
  session.printKicker("  Target");
  session.printNote(
    "The default target branch is main for the root repo and all required app submodules.",
  );
  const targetBranch = await session.promptWithDefault("Target branch", "main");

  session.printSectionBreak();
  session.printKicker("  Execution");
  session.printNote(
    "Preview prints the exact merge plan only. Push executes the merges and pushes to the target remote branch.",
  );
  const executionMode = await WorktreeStackKit_promptInteractiveExecutionMode({
    executePrompt: `Execute the merge and push to origin/${targetBranch}?`,
    session,
  });

  await WorktreeStackKit_executeInteractiveCommand({
    config,
    session,
    spec: {
      args: WorktreeStackKit_buildUiMergeArgs({
        executionMode,
        targetBranch,
        worktreePath,
      }),
      kind: "tsx",
      scriptPath: config.commands.mergeScriptPath,
    },
  });
}

/** Confirms prune behavior and executes destroy for the selected worktree path. */
export async function WorktreeStackKit_runInteractiveDestroy(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  session.printHeader("WORKTREE CONSOLE", "DESTROY");
  session.printPanelTitle(
    "Destroy Worktree",
    "Unregister the realm, clean generated state, and remove the Git worktree safely.",
  );
  session.printNote(
    "Destroy unregisters the realm, removes generated worktree artifacts, and then removes the Git worktree.",
  );
  const worktreePath =
    await WorktreeStackKit_chooseInteractiveExistingPath(options);

  session.printSectionBreak();
  session.printKicker("  Cleanup");
  session.printNote(
    "Git worktree prune removes stale Git metadata entries after deletion. It is usually safe and recommended.",
  );
  const prune = await session.promptYesNo(
    "Run git worktree prune after removal?",
    "y",
  );

  await WorktreeStackKit_executeInteractiveCommand({
    config,
    session,
    spec: {
      args: WorktreeStackKit_buildUiDestroyArgs({ prune, worktreePath }),
      kind: "tsx",
      scriptPath: config.commands.destroyScriptPath,
    },
  });
}

/** Nested menu driving configured realm pool npm scripts until the operator backs out. */
export async function WorktreeStackKit_runInteractivePool(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  for (;;) {
    session.clearScreen();
    session.printHeader("WORKTREE CONSOLE", "REALM POOL");
    session.printPanelTitle(
      "Worktree Realm Pool",
      "Inspect reusable realm names and pre-render shared TLS coverage for faster worktree setup.",
    );
    session.printMenuItem(
      1,
      "List pool status",
      "Show configured pool realms and assignment state",
    );
    session.printMenuItem(
      2,
      "Print setup guide",
      "Explain how pooled realm names are intended to be used",
    );
    session.printMenuItem(
      3,
      "Prepare pool",
      "Print guide and render TLS coverage for pooled realms",
    );
    session.printMenuItem(
      4,
      "Preview next realm",
      "See which pooled realm a stack name would receive next",
    );
    session.printSectionBreak();
    session.printMenuItem(5, "Back", "Return to the main worktree console");
    session.printMicrocopy(
      "  Pool realms let you pre-approve reusable auth callback URLs once instead of per branch.",
    );
    session.printMicrocopy("");

    const action = await session.promptMenuSelection({
      max: 5,
      prompt: "Choose an action [1-5]: ",
    });

    if (action === 5) {
      session.printSuccess("Returning to the main worktree console.");
      return;
    }

    if (action === 4) {
      const stackName = await session.promptRequired("Stack name to preview");
      await WorktreeStackKit_executeInteractiveCommand({
        config,
        session,
        spec: {
          args: WorktreeStackKit_buildUiPoolNextArgs(stackName),
          kind: "npm",
          script: config.commands.realmPoolNextScript,
        },
      });
      continue;
    }

    const scriptByAction = new Map<number, string>([
      [1, config.commands.realmPoolListScript],
      [2, config.commands.realmPoolGuideScript],
      [3, config.commands.realmPoolPrepareScript],
    ]);
    const script = scriptByAction.get(action);
    if (script === undefined) {
      throw new Error(`Unknown pool action: ${String(action)}`);
    }

    await WorktreeStackKit_executeInteractiveCommand({
      config,
      session,
      spec: {
        args: [],
        kind: "npm",
        script,
      },
    });
  }
}

/** Top-level interactive router that renders the main menu and dispatches lifecycle flows. */
export async function WorktreeStackKit_runInteractiveMain(
  options: WorktreeStackKit_RunInteractiveFlowOptions,
): Promise<void> {
  const { config, session } = options;
  for (;;) {
    session.clearScreen();
    session.printHeader("WORKTREE CONSOLE", "MAIN MENU");
    session.printPanelTitle(
      "Worktree Console",
      "Interactive control for creating, running, and cleaning up prepared worktrees.",
    );
    session.printKicker("  Lifecycle");
    session.printMenuItem(
      1,
      "Create worktree",
      "Prepare Git worktree, metadata, handbook, and env wiring",
    );
    session.printMenuItem(
      2,
      "Start worktree",
      "Register realm and run the worktree behind the shared router",
    );
    session.printMenuItem(
      3,
      "Update from main",
      "Refresh the worktree root and app branches from main without rebasing",
    );
    session.printMenuItem(
      4,
      "Merge worktree",
      "Merge the worktree root and app branches into their counterpart main branches",
    );
    session.printMenuItem(
      5,
      "Destroy worktree",
      "Unregister realm and remove the worktree safely",
    );
    session.printSectionBreak();
    session.printKicker("  Control Plane");
    session.printMenuItem(
      6,
      "List active realms",
      "Show the registry-backed realms currently known to the router",
    );
    session.printMenuItem(
      7,
      "Manage realm pool",
      "Inspect or prepare reusable predeclared realm names",
    );
    session.printMenuItem(
      8,
      "Shared router status",
      "Check whether the shared router is up",
    );
    session.printMenuItem(
      9,
      "Router healthcheck",
      "Probe registered realm hostnames through the shared router",
    );
    session.printMenuItem(
      10,
      "Prune stale realms",
      "Remove dead registry entries for missing workspaces",
    );
    session.printSectionBreak();
    session.printMenuItem(11, "Exit", "Leave the console");
    session.printMicrocopy(
      "  Tip: editor launch is opt-in for create and start.",
    );
    session.printMicrocopy("");

    const action = await session.promptMenuSelection({
      max: 11,
      prompt: "Choose an action [1-11]: ",
    });

    switch (action) {
      case 1:
        await WorktreeStackKit_runInteractiveCreate(options);
        break;
      case 2:
        await WorktreeStackKit_runInteractiveStart(options);
        break;
      case 3:
        await WorktreeStackKit_runInteractiveUpdateFromMain(options);
        break;
      case 4:
        await WorktreeStackKit_runInteractiveMerge(options);
        break;
      case 5:
        await WorktreeStackKit_runInteractiveDestroy(options);
        break;
      case 6:
        await WorktreeStackKit_executeInteractiveCommand({
          config,
          session,
          spec: {
            args: [],
            kind: "npm",
            script: config.commands.realmListScript,
          },
        });
        break;
      case 7:
        await WorktreeStackKit_runInteractivePool(options);
        break;
      case 8:
        await WorktreeStackKit_executeInteractiveCommand({
          config,
          session,
          spec: {
            args: [],
            kind: "npm",
            script: config.commands.routerStatusScript,
          },
        });
        break;
      case 9:
        await WorktreeStackKit_executeInteractiveCommand({
          config,
          session,
          spec: {
            args: [],
            kind: "npm",
            script: config.commands.healthcheckScript,
          },
        });
        break;
      case 10:
        await WorktreeStackKit_executeInteractiveCommand({
          config,
          session,
          spec: {
            args: [],
            kind: "npm",
            script: config.commands.realmPruneScript,
          },
        });
        break;
      case 11:
        session.printSuccess("Leaving the worktree console.");
        return;
      default:
        throw new Error(`Unknown action: ${String(action)}`);
    }
  }
}

function WorktreeStackKit_bindInteractiveFlowRunner(
  config: WorktreeStackKit_InteractiveFlowsConfig,
  runner: (
    options: WorktreeStackKit_RunInteractiveFlowOptions,
  ) => Promise<void>,
): WorktreeStackKit_BoundInteractiveFlowRunner {
  return async (session) => {
    await runner({ config, session });
  };
}

/**
 * Binds all classic interactive flow runners to one config for tiny script adapters.
 *
 * @remarks
 * The returned functions still receive the runtime session from the root launcher, while command
 * paths, npm script names, repo root, and default worktree base stay fixed to the adapter config.
 */
export function WorktreeStackKit_bindInteractiveFlowRunners(
  options: WorktreeStackKit_BindInteractiveFlowRunnersOptions,
): WorktreeStackKit_BoundInteractiveFlowRunners {
  const { config } = options;

  return {
    create: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractiveCreate,
    ),
    destroy: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractiveDestroy,
    ),
    main: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractiveMain,
    ),
    merge: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractiveMerge,
    ),
    pool: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractivePool,
    ),
    start: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractiveStart,
    ),
    updateFromMain: WorktreeStackKit_bindInteractiveFlowRunner(
      config,
      WorktreeStackKit_runInteractiveUpdateFromMain,
    ),
  };
}
