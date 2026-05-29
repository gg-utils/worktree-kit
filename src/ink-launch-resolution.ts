/**
 * @fileoverview Reusable resolution of parsed worktree Ink launch targets.
 *
 * Flow: project UI loads an inventory and static action catalog, package logic resolves the initial
 * selected record/action, create draft, screen, notice, and action-option patch. The package also
 * owns translation from its richer Ink UI inventory into the small launch inventory contract.
 *
 * @testing Node test runner: cd packages/worktree-kit && npm run test -- src/ink-launch-resolution.unit.test.ts
 *
 * @see packages/worktree-kit/src/ink-launch-options.ts - Parsed argv launch contract and action identifiers that this module maps to catalog indices, screens, and option patches.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Rich Ink UI inventory records that `WorktreeStackKit_createInkLaunchInventory` collapses into the minimal path and stack-name candidates matched here.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink shell that wires project inventory and parsed launch targets into `WorktreeStackKit_resolveInkLaunchTarget` when bootstrapping the interactive UI.
 * @see packages/worktree-kit/src/ink-launch-resolution.unit.test.ts - Node `node:test` regression module asserting stack and path resolution, global versus record action scoping, and argv-derived option patches.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import path from "node:path";

import type {
  WorktreeStackKit_InkActionId,
  WorktreeStackKit_InkCreateDraft,
  WorktreeStackKit_InkLaunchTarget,
} from "./ink-launch-options.js";
import type { WorktreeStackKit_InkUiInventory } from "./ink-ui-contracts.js";

/** Scope category needed to decide whether a worktree selector should affect the launch. */
export type WorktreeStackKit_InkLaunchActionScope = "record" | "global";

/** Minimal action-catalog entry consumed by launch-target resolution. */
export type WorktreeStackKit_InkLaunchActionDefinition = {
  readonly id: WorktreeStackKit_InkActionId;
  readonly label: string;
  readonly scope: WorktreeStackKit_InkLaunchActionScope;
};

/** Minimal inventory record consumed by launch-target resolution. */
export type WorktreeStackKit_InkLaunchInventoryRecord = {
  readonly stackNameCandidates: readonly string[];
  readonly worktreePath: string;
};

/** Minimal inventory consumed by launch-target resolution. */
export type WorktreeStackKit_InkLaunchInventory = {
  readonly projectRoot: string;
  readonly records: readonly WorktreeStackKit_InkLaunchInventoryRecord[];
};

/** Action-option fields currently prefilled by launcher argv. */
export type WorktreeStackKit_InkLaunchActionOptionsPatch = {
  readonly poolNextStackName?: string;
  readonly stateCheckFetch?: boolean;
};

/** Normalized Ink bootstrap selection derived from argv plus optional launch overrides. */
export type WorktreeStackKit_InkResolvedLaunchTarget = {
  readonly actionOptionsPatch: WorktreeStackKit_InkLaunchActionOptionsPatch | null;
  readonly createDraft: WorktreeStackKit_InkCreateDraft;
  readonly noticeMessage: string | null;
  readonly screen: "shell" | "action-editor";
  readonly selectedActionIndex: number;
  readonly selectedIndex: number;
};

/** Input for resolving one parsed Ink launch target against a project-supplied inventory. */
export type WorktreeStackKit_ResolveInkLaunchTarget_Options = {
  readonly actionDefinitions: readonly WorktreeStackKit_InkLaunchActionDefinition[];
  readonly initialCreateDraft: WorktreeStackKit_InkCreateDraft;
  readonly inventory: WorktreeStackKit_InkLaunchInventory;
  readonly target: WorktreeStackKit_InkLaunchTarget | null;
};

export type WorktreeStackKit_CreateInkLaunchTargetResolverOptions = {
  readonly actionDefinitions: readonly WorktreeStackKit_InkLaunchActionDefinition[];
  readonly createInitialCreateDraft: () => WorktreeStackKit_InkCreateDraft;
};

/** Normalizes stack-name strings for case-insensitive equality checks. */
function WorktreeStackKit_normalizeInkLaunchValue(value: string): string {
  return value.trim().toLowerCase();
}

/** Returns true for nonblank stack-name candidates copied into the launch inventory. */
function WorktreeStackKit_isNonBlankInkLaunchStackNameCandidate(
  value: string | null | undefined,
): value is string {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/** Converts package-owned UI inventory records into the minimal launch-resolution inventory. */
export function WorktreeStackKit_createInkLaunchInventory(
  inventory: WorktreeStackKit_InkUiInventory,
): WorktreeStackKit_InkLaunchInventory {
  return {
    projectRoot: inventory.projectRoot,
    records: inventory.records.map((record) => ({
      stackNameCandidates: [
        record.metadata?.stackName,
        record.handbook?.stackName,
      ].filter(WorktreeStackKit_isNonBlankInkLaunchStackNameCandidate),
      worktreePath: record.worktreePath,
    })),
  };
}

/** Maps CLI launch hints onto initial action-option state for the editor session. */
function WorktreeStackKit_buildInkLaunchActionOptionsPatch(
  launchTarget: WorktreeStackKit_InkLaunchTarget,
): WorktreeStackKit_InkLaunchActionOptionsPatch | null {
  const patch: WorktreeStackKit_InkLaunchActionOptionsPatch = {
    ...(launchTarget.poolNextStackName !== null
      ? { poolNextStackName: launchTarget.poolNextStackName }
      : {}),
    ...(launchTarget.stateCheckFetch === true ? { stateCheckFetch: true } : {}),
  };

  return Object.keys(patch).length > 0 ? patch : null;
}

/** Finds the action index requested by a launch target, falling back to the first action. */
function WorktreeStackKit_resolveInkLaunchActionIndex(options: {
  readonly actionDefinitions: readonly WorktreeStackKit_InkLaunchActionDefinition[];
  readonly actionId: WorktreeStackKit_InkActionId | null;
}): number {
  if (options.actionId === null) {
    return 0;
  }

  const requestedActionIndex = options.actionDefinitions.findIndex(
    (actionDefinition) => actionDefinition.id === options.actionId,
  );
  return requestedActionIndex >= 0 ? requestedActionIndex : 0;
}

/** Applies CLI launch hints to inventory-backed defaults for initial Ink screen state. */
export function WorktreeStackKit_resolveInkLaunchTarget(
  options: WorktreeStackKit_ResolveInkLaunchTarget_Options,
): WorktreeStackKit_InkResolvedLaunchTarget {
  const createDraft = {
    ...options.initialCreateDraft,
    ...(options.target?.createDraftOverrides ?? {}),
  };

  if (!options.target) {
    return {
      actionOptionsPatch: null,
      createDraft,
      noticeMessage: null,
      screen: "shell",
      selectedActionIndex: 0,
      selectedIndex: 0,
    };
  }

  const selectedActionIndex = WorktreeStackKit_resolveInkLaunchActionIndex({
    actionDefinitions: options.actionDefinitions,
    actionId: options.target.actionId,
  });
  const selectedAction = options.actionDefinitions[selectedActionIndex];
  const actionOptionsPatch = WorktreeStackKit_buildInkLaunchActionOptionsPatch(
    options.target,
  );

  let selectedIndex = 0;
  let noticeMessage: string | null = null;
  let matchedRecord = false;

  if (options.target.worktreePath) {
    const requestedPath = path.normalize(
      path.isAbsolute(options.target.worktreePath)
        ? options.target.worktreePath
        : path.resolve(options.inventory.projectRoot, options.target.worktreePath),
    );
    const recordIndex = options.inventory.records.findIndex(
      (record) => path.normalize(record.worktreePath) === requestedPath,
    );
    if (recordIndex >= 0) {
      selectedIndex = recordIndex;
      matchedRecord = true;
    } else {
      noticeMessage =
        `Requested worktree '${options.target.worktreePath}' was not found; ` +
        "showing the default selection.";
    }
  } else if (options.target.stackName) {
    const requestedStackName = WorktreeStackKit_normalizeInkLaunchValue(
      options.target.stackName,
    );
    const recordIndex = options.inventory.records.findIndex((record) =>
      record.stackNameCandidates.some(
        (stackName) =>
          WorktreeStackKit_normalizeInkLaunchValue(stackName) === requestedStackName,
      ),
    );
    if (recordIndex >= 0) {
      selectedIndex = recordIndex;
      matchedRecord = true;
    } else {
      noticeMessage =
        `Requested stack '${options.target.stackName}' was not found; ` +
        "showing the default selection.";
    }
  }

  if (
    selectedAction?.scope === "global" &&
    (options.target.worktreePath || options.target.stackName)
  ) {
    noticeMessage =
      noticeMessage ??
      `The '${selectedAction.label}' action is global; the requested worktree target was ignored.`;
    return {
      actionOptionsPatch,
      createDraft,
      noticeMessage,
      screen: options.target.actionId ? "action-editor" : "shell",
      selectedActionIndex,
      selectedIndex,
    };
  }

  if (
    selectedAction?.scope === "record" &&
    options.target.actionId !== null &&
    (options.target.worktreePath !== null || options.target.stackName !== null) &&
    !matchedRecord
  ) {
    return {
      actionOptionsPatch,
      createDraft,
      noticeMessage,
      screen: "shell",
      selectedActionIndex,
      selectedIndex,
    };
  }

  return {
    actionOptionsPatch,
    createDraft,
    noticeMessage,
    screen: options.target.actionId !== null ? "action-editor" : "shell",
    selectedActionIndex,
    selectedIndex,
  };
}

/** Binds a launcher catalog and draft factory for script adapters. */
export function WorktreeStackKit_createInkLaunchTargetResolver(
  options: WorktreeStackKit_CreateInkLaunchTargetResolverOptions,
): (
  inventory: WorktreeStackKit_InkUiInventory,
  target: WorktreeStackKit_InkLaunchTarget | null,
) => WorktreeStackKit_InkResolvedLaunchTarget {
  return (inventory, target) =>
    WorktreeStackKit_resolveInkLaunchTarget({
      actionDefinitions: options.actionDefinitions,
      initialCreateDraft: options.createInitialCreateDraft(),
      inventory: WorktreeStackKit_createInkLaunchInventory(inventory),
      target,
    });
}
