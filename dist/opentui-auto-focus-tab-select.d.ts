/**
 * @fileoverview Package-owned OpenTUI `<tab-select>` wrapper that applies explicit focus on mount for keyboard-first CLIs.
 *
 * Domain OpenTUI shells use this wrapper when the renderer runs with `useMouse: false`; this module owns only the mount-time
 * focus bridge, while host adapters own command catalogs, option wiring, and selection callbacks.
 * Flow: mount -> `useEffect` reads the `TabSelectRenderable` ref -> calls `focus()` when not already focused -> forwards remaining props to `<tab-select>`.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
 *
 * export function Example() {
 *   return (
 *     <WorktreeStackKit_OpenTuiAutoFocusTabSelect
 *       onSelect={() => {}}
 *       options={[{ label: "Option A", value: "a" }]}
 *     />
 *   );
 * }
 * ```
 *
 * @testing CLI: cd packages/worktree-kit && npm run test
 *
 * @see packages/worktree-kit/src/opentui-layout-test-harness.tsx - Package-owned layout smoke harness that mounts this wrapper next to reusable tab-select fixtures so renderer regressions surface early.
 * @see packages/worktree-kit/src/opentui-create-wizard-panels.tsx - Create-wizard OpenTUI panels that embed this wrapper for keyboard-first select controls in production-ish flows.
 * @see docs/COMMANDS.md - Platform commands listing for the OpenTUI worktree console entrypoint used when manually exercising keyboard navigation after renderer changes.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** @jsxImportSource @opentui/react */
import type { TabSelectProps } from "@opentui/react";
/**
 * OpenTUI `<tab-select>` wrapper that focuses the underlying `TabSelectRenderable` once after mount.
 *
 * @remarks
 * OpenTUI v0.1.90 only applies auto-focus after mouse events; keyboard-first CLIs therefore need an explicit `focus()` call so `<tab-select>` receives arrow keys when mouse handling is disabled.
 *
 * @example
 * ```typescript
 * import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
 *
 * export function Example() {
 *   return (
 *     <WorktreeStackKit_OpenTuiAutoFocusTabSelect
 *       onSelect={() => {}}
 *       options={[{ label: "Option A", value: "a" }]}
 *     />
 *   );
 * }
 * ```
 */
export declare function WorktreeStackKit_OpenTuiAutoFocusTabSelect(props: TabSelectProps): import("react").ReactNode;
