/**
 * @fileoverview Reusable OpenTUI action-scroll worktree-pick planning helpers.
 *
 * Package-owned worktree-pick panels consume these helpers for record-scoped pick visibility,
 * option construction, and tab-select selection plans after script adapters translate rich project
 * discovery records into minimal option rows.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - OpenTUI shell contracts for nav tabs, flow/phase tokens, and select-option rows that this module composes when building tab-select payloads and continue transitions.
 * @see packages/worktree-kit/src/opentui-worktree-pick-panel.tsx - OpenTUI worktree-pick panel that calls the visibility, option-builder, and selection-plan helpers exported here to drive record-scoped pick UX.
 * @see packages/worktree-kit/src/opentui-action-scroll-worktree-pick.unit.test.ts - Node `node:test` suite that locks the visibility matrix, option lists, and selection-plan branches owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import {
  WorktreeStackKit_openTuiNavTabs,
  type WorktreeStackKit_OpenTuiFlow,
  type WorktreeStackKit_OpenTuiPhase,
  type WorktreeStackKit_OpenTuiSelectOption,
} from "./opentui-shell-contracts.js";

/** Minimal record row consumed by package-owned worktree-pick option builders. */
export type WorktreeStackKit_OpenTuiWorktreePickRecordOption = {
  readonly description: string;
  readonly name: string;
};

/** Pure selection plan emitted by the populated worktree-pick tab-select. */
export type WorktreeStackKit_OpenTuiWorktreePickSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | { readonly type: "continue"; readonly nextPhase: WorktreeStackKit_OpenTuiPhase }
  | { readonly recordPickIndex: -1; readonly type: "manual" }
  | { readonly recordPickIndex: number; readonly type: "record" };

/** Pure selection plan emitted by the empty worktree-pick/manual-path tab-select. */
export type WorktreeStackKit_OpenTuiEmptyWorktreePickSelectionPlan =
  | { readonly type: "ignore" }
  | { readonly type: "menu" }
  | { readonly type: "quit" }
  | {
      readonly nextPhase: WorktreeStackKit_OpenTuiPhase;
      readonly recordPickIndex: -1;
      readonly type: "continue";
    };

const WORKTREE_STACK_KIT_OPENTUI_RECORD_SCOPED_PICK_FLOWS: ReadonlySet<
  WorktreeStackKit_OpenTuiFlow
> = new Set(["start", "destroy", "updateFromMain", "merge"]);

/** Whether the shared worktree-pick panel should render for the current flow/phase. */
export function WorktreeStackKit_shouldShowOpenTuiWorktreePick(options: {
  readonly flow: WorktreeStackKit_OpenTuiFlow;
  readonly phase: WorktreeStackKit_OpenTuiPhase;
}): boolean {
  return (
    options.phase === "pick" &&
    WORKTREE_STACK_KIT_OPENTUI_RECORD_SCOPED_PICK_FLOWS.has(options.flow)
  );
}

/** Builds tab-select options for a populated worktree-pick list. */
export function WorktreeStackKit_buildOpenTuiWorktreePickOptions(options: {
  readonly records: readonly WorktreeStackKit_OpenTuiWorktreePickRecordOption[];
}): WorktreeStackKit_OpenTuiSelectOption[] {
  return [
    ...options.records.map((record, index) => ({
      description: record.description,
      name: record.name,
      value: String(index),
    })),
    {
      description: "Type path on next screen",
      name: "Manual path",
      value: "manual",
    },
    {
      description: "Continue with selection",
      name: "Continue",
      value: "next",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Builds tab-select options for an empty worktree-pick/manual-path screen. */
export function WorktreeStackKit_buildOpenTuiEmptyWorktreePickOptions(): (
  WorktreeStackKit_OpenTuiSelectOption[]
) {
  return [
    {
      description: "Configure flags",
      name: "Continue",
      value: "next",
    },
    ...WorktreeStackKit_openTuiNavTabs({ includeMenuBack: true }),
  ];
}

/** Plans state transitions for a populated worktree-pick selection. */
export function WorktreeStackKit_planOpenTuiWorktreePickSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiWorktreePickSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "next":
      return { nextPhase: "form", type: "continue" };
    case "manual":
      return { recordPickIndex: -1, type: "manual" };
    default:
      if (/^\d+$/u.test(options.optionValue ?? "")) {
        return {
          recordPickIndex: Number.parseInt(options.optionValue ?? "0", 10),
          type: "record",
        };
      }
      return { type: "ignore" };
  }
}

/** Plans state transitions for an empty worktree-pick/manual-path selection. */
export function WorktreeStackKit_planOpenTuiEmptyWorktreePickSelection(options: {
  readonly optionValue: string | undefined;
}): WorktreeStackKit_OpenTuiEmptyWorktreePickSelectionPlan {
  switch (options.optionValue) {
    case "menu":
      return { type: "menu" };
    case "quit":
      return { type: "quit" };
    case "next":
      return { nextPhase: "form", recordPickIndex: -1, type: "continue" };
    default:
      return { type: "ignore" };
  }
}
