/**
 * @fileoverview Package-owned OpenTUI layout smoke harness for manual split-panel renderer checks plus host-supplied renderer bootstrap.
 *
 * This module owns the reusable worktree-option fixture, tab-select wiring, split-panel bodies, and the async `createRoot` mount path while root scripts only supply the OpenTUI renderer factory and the `showWorktreesHeading` toggle used by the alternate layout smoke entrypoint.
 * Flow: host `createRenderer` resolves a renderer -> dynamic `import("@opentui/react")` obtains `createRoot` -> `createRoot(renderer)` renders `WorktreeStackKit_OpenTuiLayoutTestHarnessApp`.
 *
 * @testing CLI: cd packages/worktree-kit && npm run test
 * @testing CLI: bun run ./scripts/worktree-stack/ui/cli-opentui/test-layout.tsx
 *
 * @see packages/worktree-kit/src/opentui-auto-focus-tab-select.tsx - Keyboard-first tab-select wrapper embedded in both harness layouts when smoke-testing renderer focus next to the split-panel body.
 * @see scripts/worktree-stack/ui/cli-opentui/test-layout.tsx - Thin launcher that wires `openTuiCreateScriptRenderer` into `WorktreeStackKit_runOpenTuiLayoutTestHarness` for the default manual smoke entrypoint.
 * @see packages/worktree-kit/src/index.ts - Package barrel re-exporting this module for `@gg-utils/worktree-kit/opentui-layout-test-harness` deep imports consumed by workspace OpenTUI scripts.
 * @see packages/worktree-kit/src/opentui-layout-test-harness.unit.test.ts - Node test coverage asserting valid React elements for both heading modes and a callable bootstrap export.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */

import type {
  createRoot as WorktreeStackKit_openTuiCreateRoot,
} from "@opentui/react";
import { useState } from "react";

import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";

type WorktreeStackKit_OpenTuiLayoutTestHarnessRenderer = Parameters<
  typeof WorktreeStackKit_openTuiCreateRoot
>[0];

/** Host adapter contract for creating an OpenTUI renderer in a CLI process. */
export type WorktreeStackKit_OpenTuiLayoutTestHarnessCreateRenderer =
  () => Promise<WorktreeStackKit_OpenTuiLayoutTestHarnessRenderer>;

/** Display options for the package-owned layout smoke harness component. */
export interface WorktreeStackKit_OpenTuiLayoutTestHarnessAppProps {
  readonly showWorktreesHeading: boolean;
}

/** Runtime options for booting the layout smoke harness with a host renderer factory. */
export interface WorktreeStackKit_OpenTuiLayoutTestHarnessOptions
  extends WorktreeStackKit_OpenTuiLayoutTestHarnessAppProps {
  readonly createRenderer: WorktreeStackKit_OpenTuiLayoutTestHarnessCreateRenderer;
}

const WORKTREE_STACK_KIT_OPEN_TUI_LAYOUT_OPTIONS = [
  { description: "First worktree", name: "Worktree A", value: "worktree-a" },
  { description: "Second worktree", name: "Worktree B", value: "worktree-b" },
];

/** Root harness component for manual OpenTUI split-panel layout verification. */
export function WorktreeStackKit_OpenTuiLayoutTestHarnessApp(
  props: WorktreeStackKit_OpenTuiLayoutTestHarnessAppProps,
) {
  const [selected, setSelected] = useState("");

  if (props.showWorktreesHeading) {
    return (
      <box style={{ flexDirection: "row", flexGrow: 1, padding: 1 }}>
        <box style={{ width: 30, padding: 1, flexDirection: "column" }}>
          <text>Worktrees</text>
          <WorktreeStackKit_OpenTuiAutoFocusTabSelect
            options={WORKTREE_STACK_KIT_OPEN_TUI_LAYOUT_OPTIONS}
            onSelect={(_index, option) => {
              setSelected(option ? `${option.name} submitted` : "");
            }}
          />
        </box>
        <box style={{ flexGrow: 1, padding: 1, flexDirection: "column" }}>
          <text>Detail Panel</text>
          <text>Selection: {selected}</text>
        </box>
      </box>
    );
  }

  return (
    <box style={{ flexDirection: "row", flexGrow: 1, height: "100%" }}>
      <box style={{ width: 30, padding: 1 }}>
        <WorktreeStackKit_OpenTuiAutoFocusTabSelect
          options={WORKTREE_STACK_KIT_OPEN_TUI_LAYOUT_OPTIONS}
          onSelect={(_index, option) => {
            setSelected(option ? `${option.name} submitted` : "");
          }}
        />
      </box>
      <box style={{ flexGrow: 1, padding: 1 }}>
        <text>Detail Panel</text>
        <text>Selection: {selected}</text>
      </box>
    </box>
  );
}

/** Boots the layout smoke harness using a host-owned OpenTUI renderer factory. */
export async function WorktreeStackKit_runOpenTuiLayoutTestHarness(
  options: WorktreeStackKit_OpenTuiLayoutTestHarnessOptions,
): Promise<void> {
  const renderer = await options.createRenderer();
  const { createRoot } = await import("@opentui/react");
  createRoot(renderer).render(
    <WorktreeStackKit_OpenTuiLayoutTestHarnessApp
      showWorktreesHeading={options.showWorktreesHeading}
    />,
  );
}
