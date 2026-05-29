/**
 * @fileoverview Reusable OpenTUI create-preview resolver.
 *
 * Root adapters provide project-specific port derivation, realm assignment, and environment copy;
 * this package owns the product-neutral preview branching shared by OpenTUI create flows:
 * validate slot-derived ports, honor explicit worktree paths, normalize realm assignments, build
 * default folder names, and parse realm-assignment JSON without importing root scripts or configs.
 *
 * @example
 * ```typescript
 * const previewer = WorktreeStackKit_createOpenTuiCreatePreviewer({
 *   deriveSlotPorts: (slot) => ({ api: 8000 + slot }),
 *   envSummaryMessages: { defaultPath: "copy env", explicitPath: "copy env manually" },
 *   resolveDefaultWorktreesBase: (repoRoot) => `${repoRoot}/worktrees`,
 *   resolveRealmAssignment: () => ({ assignment: { realmSlug: "worktree-01" }, ok: true }),
 * });
 * const preview = previewer.previewCreate({
 *   repoRoot: "/repo",
 *   requestedRealmSlug: "",
 *   slot: 1,
 *   stackName: "Demo",
 *   worktreePathOverride: "",
 *   worktreesBase: previewer.defaultWorktreesBase("/repo"),
 * });
 * ```
 *
 * @testing Jest unit: cd packages/worktree-kit && npm run test -- src/opentui-create-preview.unit.test.ts
 *
 * @see packages/worktree-kit/src/opentui-create-preview.unit.test.ts - Jest regression coverage for realm JSON parsing, realm-pool resolver wiring, explicit-path vs default-path previews, and port derivation contracts asserted against this module.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI app controller that imports create-preview formatting helpers and result types while orchestrating the worktree-create wizard flow in the kit shell.
 * @see scripts/worktree-stack/ui/cli-opentui/lib/create-preview.ts - Root CLI adapter that binds project slot ports, env copy messaging, and realm-pool subprocess paths into the kit create-preview factory exported here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import path from "node:path";

import type {
  WorktreeStack_CommandResult,
  WorktreeStack_RunCommandOptions,
} from "@gg-utils/worktree-core/foundation";
import {
  worktreeStackBuildFolderName,
  worktreeStackFormatFolderDateToken,
} from "@gg-utils/worktree-core/worktree-discovery";

/** Copy shown for explicit/default create-preview branches. */
export type WorktreeStackKit_OpenTuiCreatePreviewEnvSummaryMessages = {
  readonly defaultPath: string;
  readonly explicitPath: string;
};

/** Realm assignment produced by a project adapter, usually from a realm-pool command. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignment = {
  readonly realmAssignmentSource?: string;
  readonly realmSlug: string;
};

/** Result returned by project adapters that resolve create-preview realm assignments. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignmentResult =
  | {
      readonly assignment: WorktreeStackKit_OpenTuiCreateRealmAssignment;
      readonly ok: true;
    }
  | {
      readonly errorMessage: string;
      readonly ok: false;
    };

/** Input needed to resolve a project-specific realm assignment for create preview. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignmentRequest = {
  readonly repoRoot: string;
  readonly requestedRealmSlug: string;
  readonly stackName: string;
};

/** Synchronous command runner contract used by realm-pool preview adapters. */
export type WorktreeStackKit_OpenTuiCreateRealmAssignmentCommandRunner = (
  command: string,
  args: readonly string[],
  options: WorktreeStack_RunCommandOptions,
) => WorktreeStack_CommandResult;

export type WorktreeStackKit_CreateOpenTuiRealmPoolAssignmentResolverOptions = {
  readonly getBaseEnv: () => NodeJS.ProcessEnv;
  readonly projectRootEnvKey: string;
  readonly realmPoolPreviewScriptPath: string;
  readonly runCommand: WorktreeStackKit_OpenTuiCreateRealmAssignmentCommandRunner;
};

/** Successful create-preview result containing the resolved worktree path, ports, and metadata. */
export type WorktreeStackKit_OpenTuiCreatePreviewOk<TPorts> = {
  readonly envSummary: string;
  readonly folderName: string;
  readonly ok: true;
  readonly ports: TPorts;
  readonly realmAssignmentSource: string;
  readonly realmSlug: string;
  readonly worktreePath: string;
};

/** Failed create-preview result containing a displayable error message. */
export type WorktreeStackKit_OpenTuiCreatePreviewErr = {
  readonly errorMessage: string;
  readonly ok: false;
};

/** Union of create-preview success and failure results. */
export type WorktreeStackKit_OpenTuiCreatePreview<TPorts> =
  | WorktreeStackKit_OpenTuiCreatePreviewOk<TPorts>
  | WorktreeStackKit_OpenTuiCreatePreviewErr;

export type WorktreeStackKit_OpenTuiCreatePreviewOptions = {
  readonly dateToken?: string;
  readonly repoRoot: string;
  readonly requestedRealmSlug: string;
  readonly slot: number;
  readonly stackName: string;
  readonly worktreePathOverride: string;
  readonly worktreesBase: string;
};

export type WorktreeStackKit_CreateOpenTuiCreatePreviewerOptions<TPorts> = {
  readonly deriveSlotPorts: (slot: number) => TPorts;
  readonly envSummaryMessages: WorktreeStackKit_OpenTuiCreatePreviewEnvSummaryMessages;
  readonly resolveDefaultWorktreesBase: (repoRoot: string) => string;
  readonly resolveRealmAssignment: (
    options: WorktreeStackKit_OpenTuiCreateRealmAssignmentRequest,
  ) => WorktreeStackKit_OpenTuiCreateRealmAssignmentResult;
};

export type WorktreeStackKit_OpenTuiCreatePreviewer<TPorts> = {
  readonly defaultWorktreesBase: (repoRoot: string) => string;
  readonly previewCreate: (
    options: WorktreeStackKit_OpenTuiCreatePreviewOptions,
  ) => WorktreeStackKit_OpenTuiCreatePreview<TPorts>;
};

/** Port key/label pair used to make project-specific port bundles displayable. */
export type WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem<
  TPorts extends Readonly<Record<string, number>>,
> = {
  readonly key: keyof TPorts & string;
  readonly label: string;
};

function WorktreeStackKit_unknownToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function WorktreeStackKit_isJsonObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses the JSON shape returned by a project realm-assignment command. */
export function WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson(
  stdout: string,
): WorktreeStackKit_OpenTuiCreateRealmAssignmentResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    return {
      errorMessage:
        `realm-pool returned non-JSON (${WorktreeStackKit_unknownToMessage(error)}):\n` +
        stdout,
      ok: false,
    };
  }

  if (!WorktreeStackKit_isJsonObject(parsed)) {
    return {
      errorMessage: `realm-pool returned non-object JSON:\n${stdout}`,
      ok: false,
    };
  }

  const realmSlug =
    typeof parsed.realmSlug === "string" ? parsed.realmSlug : "";
  const realmAssignmentSource =
    typeof parsed.realmAssignmentSource === "string"
      ? parsed.realmAssignmentSource
      : undefined;

  return {
    assignment: {
      ...(realmAssignmentSource === undefined ? {} : { realmAssignmentSource }),
      realmSlug,
    },
    ok: true,
  };
}

/** Builds a resolver that shells out to a project realm-pool preview command. */
export function WorktreeStackKit_createOpenTuiRealmPoolAssignmentResolver(
  options: WorktreeStackKit_CreateOpenTuiRealmPoolAssignmentResolverOptions,
): (
  request: WorktreeStackKit_OpenTuiCreateRealmAssignmentRequest,
) => WorktreeStackKit_OpenTuiCreateRealmAssignmentResult {
  return (request) => {
    const args = [
      "tsx",
      path.join(request.repoRoot, options.realmPoolPreviewScriptPath),
      "--stack-name",
      request.stackName,
    ];
    const requestedRealmSlug = request.requestedRealmSlug.trim();
    if (requestedRealmSlug.length > 0) {
      args.push("--realm", requestedRealmSlug);
    }

    const poolResult = options.runCommand("npx", args, {
      allowFailure: true,
      cwd: request.repoRoot,
      env: {
        ...options.getBaseEnv(),
        [options.projectRootEnvKey]: request.repoRoot,
      },
    });

    if (poolResult.status !== 0) {
      return {
        errorMessage:
          `realm-pool failed (${String(poolResult.status)}):\n` +
          (poolResult.stderr || poolResult.stdout),
        ok: false,
      };
    }

    return WorktreeStackKit_parseOpenTuiCreateRealmAssignmentJson(
      poolResult.stdout,
    );
  };
}

/** Resolves the read-only create preview shared by OpenTUI adapters. */
export function WorktreeStackKit_previewOpenTuiCreate<TPorts>(options: {
  readonly dateToken?: string;
  readonly deriveSlotPorts: (slot: number) => TPorts;
  readonly envSummaryMessages: WorktreeStackKit_OpenTuiCreatePreviewEnvSummaryMessages;
  readonly requestedRealmSlug: string;
  readonly resolveRealmAssignment: (options: {
    readonly requestedRealmSlug: string;
    readonly stackName: string;
  }) => WorktreeStackKit_OpenTuiCreateRealmAssignmentResult;
  readonly slot: number;
  readonly stackName: string;
  readonly worktreePathOverride: string;
  readonly worktreesBase: string;
}): WorktreeStackKit_OpenTuiCreatePreview<TPorts> {
  let ports: TPorts;
  try {
    ports = options.deriveSlotPorts(options.slot);
  } catch (error) {
    return {
      errorMessage: WorktreeStackKit_unknownToMessage(error),
      ok: false,
    };
  }

  if (options.worktreePathOverride.trim().length > 0) {
    const worktreePath = path.resolve(options.worktreePathOverride.trim());
    return {
      envSummary: options.envSummaryMessages.explicitPath,
      folderName: path.basename(worktreePath),
      ok: true,
      ports,
      realmAssignmentSource: "explicit-path",
      realmSlug:
        options.requestedRealmSlug.trim() ||
        "(resolve at run — use --realm if needed)",
      worktreePath,
    };
  }

  const realmAssignmentResult = options.resolveRealmAssignment({
    requestedRealmSlug: options.requestedRealmSlug,
    stackName: options.stackName,
  });
  if (!realmAssignmentResult.ok) {
    return realmAssignmentResult;
  }

  const realmSlug = realmAssignmentResult.assignment.realmSlug
    .trim()
    .toLowerCase();
  if (realmSlug.length === 0) {
    return {
      errorMessage: "realm-pool returned an empty realm slug.",
      ok: false,
    };
  }

  const dateToken =
    options.dateToken?.trim() ||
    process.env.WORKTREE_STACK_DATE_PREFIX ||
    worktreeStackFormatFolderDateToken();
  const folderName = worktreeStackBuildFolderName(
    dateToken,
    realmSlug,
    options.stackName,
  );

  return {
    envSummary: options.envSummaryMessages.defaultPath,
    folderName,
    ok: true,
    ports,
    realmAssignmentSource:
      realmAssignmentResult.assignment.realmAssignmentSource ?? "stack-name",
    realmSlug,
    worktreePath: path.join(path.resolve(options.worktreesBase), folderName),
  };
}

/** Binds project create-preview defaults into a small adapter-facing surface. */
export function WorktreeStackKit_createOpenTuiCreatePreviewer<TPorts>(
  options: WorktreeStackKit_CreateOpenTuiCreatePreviewerOptions<TPorts>,
): WorktreeStackKit_OpenTuiCreatePreviewer<TPorts> {
  return {
    defaultWorktreesBase: options.resolveDefaultWorktreesBase,
    previewCreate: (previewOptions) =>
      WorktreeStackKit_previewOpenTuiCreate({
        dateToken: previewOptions.dateToken,
        deriveSlotPorts: options.deriveSlotPorts,
        envSummaryMessages: options.envSummaryMessages,
        requestedRealmSlug: previewOptions.requestedRealmSlug,
        resolveRealmAssignment: (realmOptions) =>
          options.resolveRealmAssignment({
            ...realmOptions,
            repoRoot: previewOptions.repoRoot,
          }),
        slot: previewOptions.slot,
        stackName: previewOptions.stackName,
        worktreePathOverride: previewOptions.worktreePathOverride,
        worktreesBase: previewOptions.worktreesBase,
      }),
  };
}

/** Formats the create preview body rendered after the form validates. */
export function WorktreeStackKit_formatOpenTuiCreatePreviewText<
  TPorts extends Readonly<Record<string, number>>,
>(options: {
  readonly commandPreview: string;
  readonly portSummaryItems: readonly WorktreeStackKit_OpenTuiCreatePreviewPortSummaryItem<
    TPorts
  >[];
  readonly preview: WorktreeStackKit_OpenTuiCreatePreviewOk<TPorts>;
}): string {
  const portSummary = options.portSummaryItems
    .map((item) => `${item.label}=${String(options.preview.ports[item.key])}`)
    .join(" ");

  return [
    options.commandPreview,
    "",
    "Derived preview:",
    `  worktree path: ${options.preview.worktreePath}`,
    `  realm slug: ${options.preview.realmSlug} (source=${options.preview.realmAssignmentSource})`,
    `  folder: ${options.preview.folderName}`,
    `  ports: ${portSummary}`,
    "",
    options.preview.envSummary,
  ].join("\n");
}
