/**
 * @fileoverview Reusable argv parser and help text for worktree Ink launchers.
 *
 * Flow: forwarded CLI argv -> structured launch target or help request. View components and
 * project adapters own rendering, inventory resolution, and command execution; this package owns
 * documented flag aliases and draft-prefill normalization.
 *
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute packages/worktree-kit unit tests via tsx --test (including ink-launch-options.unit.test.ts).
 *
 * @see packages/worktree-kit/src/ink-entrypoint.ts - Ink CLI entrypoint that calls WorktreeStackKit_parseInkLaunchOptions and WorktreeStackKit_getInkHelpText before routing help versus launch into the Ink renderer.
 * @see packages/worktree-kit/src/ink-launch-options.unit.test.ts - Node test module covering argv parsing, action-id alias normalization, mutually exclusive worktree selectors, and inferred default actions owned by this parser contract.
 * @see scripts/worktree-stack/ui/cli-ink/launch-options-core.ts - Script-layer compatibility re-export that preserves historical imports while delegating argv parsing and help text to this package-owned surface.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

/** Supported Ink UI action IDs. */
export type WorktreeStackKit_InkActionId =
  | "create"
  | "switch"
  | "repair"
  | "sync-local-files"
  | "platform-bootstrap"
  | "start"
  | "destroy"
  | "update-from-main"
  | "merge"
  | "list-active-realms"
  | "router-status"
  | "healthcheck"
  | "realm-pool-list"
  | "realm-pool-guide"
  | "realm-pool-prepare"
  | "realm-pool-next"
  | "realm-prune-stale"
  | "checkout-state-check";

/** Create draft fields that can be prefilled by launcher argv. */
export type WorktreeStackKit_InkCreateDraft = {
  branchPrefix: string;
  stackName: string;
  slotInput: string;
  baseBranch: string;
  rootBranch: string;
  submoduleBranch: string;
  worktreesBase: string;
  realmSlug: string;
  worktreePathOverride: string;
  metadataSource: string;
  copyEnvFromMain: boolean;
  runInstall: boolean;
  installSkipExisting: boolean;
  installPreferOnline: boolean;
  openWindsurf: boolean;
  followUpStart: boolean;
  followUpStartOpenWindsurf: boolean;
};

/** Switch draft fields that can be prefilled by launcher argv. */
export type WorktreeStackKit_InkSwitchDraft = {
  environmentFilter: string;
  selectedWorktreePath: string;
};

/** Optional argv-derived focus for which Ink action, worktree, and drafts should load first. */
export type WorktreeStackKit_InkLaunchTarget = {
  actionId: WorktreeStackKit_InkActionId | null;
  createDraftOverrides: Partial<WorktreeStackKit_InkCreateDraft>;
  poolNextStackName: string | null;
  stackName: string | null;
  stateCheckFetch: boolean | null;
  switchDraftOverrides: Partial<WorktreeStackKit_InkSwitchDraft>;
  worktreePath: string | null;
};

/** Result of parsing launcher argv into structured launch intent. */
export type WorktreeStackKit_InkLaunchOptionsParseResult = {
  readonly helpRequested: boolean;
  readonly target: WorktreeStackKit_InkLaunchTarget | null;
};

const WORKTREE_STACK_KIT_INK_HELP_TEXT = `Usage: npm run worktrees:cli:ink -- [options]

Options:
  --action <action-id>                     Start on a specific worktree Ink action.
  --worktree <path>                        Focus a specific worktree record by path.
  --stack <stack-name>                     Focus a specific managed worktree by stack name.
  --interactive                            Enter interactive picker mode for switch.
  --environment <realm-slug>               Filter worktrees by realm/environment.
  --create-stack-name <name>               Prefill the create stack name.
  --create-slot <n>                        Prefill the create slot.
  --create-base-branch <branch>            Prefill the create base branch.
  --create-root-branch <branch>            Prefill the create root branch.
  --create-submodule-branch <branch>       Prefill the create submodule branch.
  --create-worktrees-base <path>           Prefill the create worktrees base.
  --create-realm <slug>                    Prefill explicit realm slug for create.
  --create-worktree-path <path>            Prefill worktree path override for create.
  --create-metadata-source <path>         Prefill metadata source path for create.
  --create-copy-env-from-main              Enable legacy copy env from main during create.
  --create-no-copy-env-from-main           Disable create env copy from main.
  --create-no-install                      Disable dependency install during create.
  --create-install-prefer-online           Prefer online install mode during create.
  --create-open-windsurf                   Opt into post-create Windsurf open.
  --create-no-open-windsurf                Compatibility flag; post-create Windsurf open is disabled by default.
  --create-follow-up-start                 Queue a follow-up start after resolved create.
  --create-follow-up-start-open-windsurf   Opt into Windsurf open for follow-up start.
  --create-follow-up-start-no-open-windsurf
                                          Compatibility flag; follow-up Windsurf open is disabled by default.
  --pool-next-stack-name <name>            Prefill stack name for realm-pool-next.
  --state-check-fetch                      Run checkout-state-check with --fetch.
  --help                                   Show this help output.
`;

/** Resolves CLI `--action` tokens to canonical worktree Ink action IDs. */
export function WorktreeStackKit_normalizeInkActionId(
  value: string,
): WorktreeStackKit_InkActionId | null {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "start":
    case "start-worktree":
      return "start";
    case "destroy":
    case "destroy-worktree":
      return "destroy";
    case "update":
    case "update-from-main":
      return "update-from-main";
    case "merge":
    case "merge-to-main":
      return "merge";
    case "create":
    case "create-worktree":
      return "create";
    case "switch":
    case "switch-worktree":
      return "switch";
    case "repair":
    case "repair-worktrees":
      return "repair";
    case "sync-local-files":
    case "sync-local":
    case "sync":
      return "sync-local-files";
    case "platform-bootstrap":
    case "bootstrap":
    case "platform-install":
      return "platform-bootstrap";
    case "list-active-realms":
    case "realms":
      return "list-active-realms";
    case "router-status":
    case "status":
      return "router-status";
    case "healthcheck":
      return "healthcheck";
    case "realm-pool-list":
    case "pool-list":
    case "realm-pool-list-status":
      return "realm-pool-list";
    case "realm-pool-guide":
    case "pool-guide":
      return "realm-pool-guide";
    case "realm-pool-prepare":
    case "pool-prepare":
      return "realm-pool-prepare";
    case "realm-pool-next":
    case "pool-next":
      return "realm-pool-next";
    case "realm-prune-stale":
    case "realm-prune":
    case "prune-stale-realms":
      return "realm-prune-stale";
    case "checkout-state-check":
    case "state-check":
    case "worktrees-state-check":
      return "checkout-state-check";
    default:
      return null;
  }
}

/** Mutable argv scan state shared by per-flag handlers. */
type WorktreeStackKit_InkLaunchParseContext = {
  readonly argv: readonly string[];
  index: number;
  readonly interactiveHolder: { current: boolean };
  readonly target: WorktreeStackKit_InkLaunchTarget;
};

/** Returns the argv fragment after `argv[index]`, throwing when the flag is missing its value. */
function WorktreeStackKit_requireNextInkArgvValue(options: {
  readonly argv: readonly string[];
  readonly flagName: string;
  readonly index: number;
}): string {
  const nextValue = options.argv[options.index + 1];
  if (nextValue === undefined || nextValue.length === 0) {
    throw new Error(`${options.flagName} requires a value.`);
  }
  return nextValue;
}

/** Create-draft fields populated from argv string flags. */
type WorktreeStackKit_InkCreateDraftStringKey =
  | "stackName"
  | "slotInput"
  | "baseBranch"
  | "rootBranch"
  | "submoduleBranch"
  | "worktreesBase"
  | "realmSlug"
  | "worktreePathOverride"
  | "metadataSource";

/** Writes a string create-draft override from the next argv token after `ctx.index`. */
function WorktreeStackKit_applyInkCreateStringOverride(options: {
  readonly ctx: WorktreeStackKit_InkLaunchParseContext;
  readonly flagName: string;
  readonly key: WorktreeStackKit_InkCreateDraftStringKey;
}): number {
  const nextValue = WorktreeStackKit_requireNextInkArgvValue({
    argv: options.ctx.argv,
    flagName: options.flagName,
    index: options.ctx.index,
  });
  options.ctx.target.createDraftOverrides[options.key] = nextValue;
  return 1;
}

/** Handler for a single known Ink launcher flag. */
type WorktreeStackKit_InkLaunchOptionHandler = (
  ctx: WorktreeStackKit_InkLaunchParseContext,
) => number;

const WORKTREE_STACK_KIT_INK_LAUNCH_OPTION_HANDLERS: Record<
  string,
  WorktreeStackKit_InkLaunchOptionHandler
> = {
  "--action": (ctx) => {
    const nextValue = WorktreeStackKit_requireNextInkArgvValue({
      argv: ctx.argv,
      flagName: "--action",
      index: ctx.index,
    });
    const actionId = WorktreeStackKit_normalizeInkActionId(nextValue);
    if (actionId === null) {
      throw new Error(`Unsupported worktree Ink action '${nextValue}'.`);
    }
    ctx.target.actionId = actionId;
    return 1;
  },
  "--worktree": (ctx) => {
    const nextValue = WorktreeStackKit_requireNextInkArgvValue({
      argv: ctx.argv,
      flagName: "--worktree",
      index: ctx.index,
    });
    if (ctx.target.stackName !== null) {
      throw new Error("Use only one of --worktree or --stack.");
    }
    ctx.target.worktreePath = nextValue;
    return 1;
  },
  "--stack": (ctx) => {
    const nextValue = WorktreeStackKit_requireNextInkArgvValue({
      argv: ctx.argv,
      flagName: "--stack",
      index: ctx.index,
    });
    if (ctx.target.worktreePath !== null) {
      throw new Error("Use only one of --worktree or --stack.");
    }
    ctx.target.stackName = nextValue;
    return 1;
  },
  "--create-stack-name": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-stack-name",
      key: "stackName",
    }),
  "--create-slot": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-slot",
      key: "slotInput",
    }),
  "--create-base-branch": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-base-branch",
      key: "baseBranch",
    }),
  "--create-root-branch": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-root-branch",
      key: "rootBranch",
    }),
  "--create-submodule-branch": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-submodule-branch",
      key: "submoduleBranch",
    }),
  "--create-worktrees-base": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-worktrees-base",
      key: "worktreesBase",
    }),
  "--create-realm": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-realm",
      key: "realmSlug",
    }),
  "--create-worktree-path": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-worktree-path",
      key: "worktreePathOverride",
    }),
  "--create-metadata-source": (ctx) =>
    WorktreeStackKit_applyInkCreateStringOverride({
      ctx,
      flagName: "--create-metadata-source",
      key: "metadataSource",
    }),
  "--create-copy-env-from-main": (ctx) => {
    ctx.target.createDraftOverrides.copyEnvFromMain = true;
    return 0;
  },
  "--create-no-copy-env-from-main": (ctx) => {
    ctx.target.createDraftOverrides.copyEnvFromMain = false;
    return 0;
  },
  "--create-no-install": (ctx) => {
    ctx.target.createDraftOverrides.runInstall = false;
    ctx.target.createDraftOverrides.installSkipExisting = false;
    ctx.target.createDraftOverrides.installPreferOnline = false;
    return 0;
  },
  "--create-install-prefer-online": (ctx) => {
    ctx.target.createDraftOverrides.installPreferOnline = true;
    return 0;
  },
  "--create-open-windsurf": (ctx) => {
    ctx.target.createDraftOverrides.openWindsurf = true;
    return 0;
  },
  "--create-no-open-windsurf": (ctx) => {
    ctx.target.createDraftOverrides.openWindsurf = false;
    return 0;
  },
  "--create-follow-up-start": (ctx) => {
    ctx.target.createDraftOverrides.followUpStart = true;
    return 0;
  },
  "--create-follow-up-start-open-windsurf": (ctx) => {
    ctx.target.createDraftOverrides.followUpStart = true;
    ctx.target.createDraftOverrides.followUpStartOpenWindsurf = true;
    return 0;
  },
  "--create-follow-up-start-no-open-windsurf": (ctx) => {
    ctx.target.createDraftOverrides.followUpStart = true;
    ctx.target.createDraftOverrides.followUpStartOpenWindsurf = false;
    return 0;
  },
  "--pool-next-stack-name": (ctx) => {
    const nextValue = WorktreeStackKit_requireNextInkArgvValue({
      argv: ctx.argv,
      flagName: "--pool-next-stack-name",
      index: ctx.index,
    });
    ctx.target.poolNextStackName = nextValue;
    return 1;
  },
  "--state-check-fetch": (ctx) => {
    ctx.target.stateCheckFetch = true;
    return 0;
  },
  "--interactive": (ctx) => {
    ctx.interactiveHolder.current = true;
    return 0;
  },
  "--environment": (ctx) => {
    const nextValue = WorktreeStackKit_requireNextInkArgvValue({
      argv: ctx.argv,
      flagName: "--environment",
      index: ctx.index,
    });
    ctx.target.switchDraftOverrides.environmentFilter = nextValue;
    return 1;
  },
};

/** Returns the static help string describing Ink CLI flags for worktree-stack operations. */
export function WorktreeStackKit_getInkHelpText(): string {
  return WORKTREE_STACK_KIT_INK_HELP_TEXT;
}

/** Builds an empty mutable launch target for argv parsing. */
function WorktreeStackKit_createEmptyInkLaunchTarget(): WorktreeStackKit_InkLaunchTarget {
  return {
    actionId: null,
    createDraftOverrides: {},
    poolNextStackName: null,
    stackName: null,
    stateCheckFetch: null,
    switchDraftOverrides: {},
    worktreePath: null,
  };
}

/** Returns true when parsing produced no actionable launch target. */
function WorktreeStackKit_inkLaunchTargetIsEmpty(options: {
  readonly interactive: boolean;
  readonly target: WorktreeStackKit_InkLaunchTarget;
}): boolean {
  return (
    options.target.actionId === null &&
    options.target.worktreePath === null &&
    options.target.stackName === null &&
    Object.keys(options.target.createDraftOverrides).length === 0 &&
    Object.keys(options.target.switchDraftOverrides).length === 0 &&
    options.target.poolNextStackName === null &&
    options.target.stateCheckFetch === null &&
    !options.interactive
  );
}

/** Applies inferred default action IDs after argv scanning completes. */
function WorktreeStackKit_applyInferredInkActionId(options: {
  readonly interactive: boolean;
  readonly target: WorktreeStackKit_InkLaunchTarget;
}): void {
  if (
    options.target.actionId === null &&
    Object.keys(options.target.createDraftOverrides).length > 0
  ) {
    options.target.actionId = "create";
  }

  if (
    options.target.actionId === null &&
    options.target.poolNextStackName !== null
  ) {
    options.target.actionId = "realm-pool-next";
  }

  if (
    options.target.actionId === null &&
    options.target.stateCheckFetch === true
  ) {
    options.target.actionId = "checkout-state-check";
  }

  if (options.interactive && options.target.actionId === null) {
    options.target.actionId = "switch";
  }
}

/** Parses Ink launcher argv into either a help request or a structured launch target. */
export function WorktreeStackKit_parseInkLaunchOptions(
  argv: readonly string[],
): WorktreeStackKit_InkLaunchOptionsParseResult {
  const interactiveHolder = { current: false };
  const target = WorktreeStackKit_createEmptyInkLaunchTarget();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--help") {
      return { helpRequested: true, target: null };
    }
    if (current === undefined) {
      continue;
    }

    const handler = WORKTREE_STACK_KIT_INK_LAUNCH_OPTION_HANDLERS[current];
    if (handler === undefined) {
      throw new Error(`Unknown worktree Ink option '${current}'.`);
    }

    const parseContext: WorktreeStackKit_InkLaunchParseContext = {
      argv,
      index,
      interactiveHolder,
      target,
    };
    index += handler(parseContext);
  }

  const interactive = interactiveHolder.current;
  if (WorktreeStackKit_inkLaunchTargetIsEmpty({ interactive, target })) {
    return { helpRequested: false, target: null };
  }

  WorktreeStackKit_applyInferredInkActionId({ interactive, target });
  return { helpRequested: false, target };
}
