/**
 * @fileoverview Package-owned reducer and initial state factory for reusable worktree Ink UI shells.
 *
 * The reducer wires package-owned full-state helper transitions into the complete Ink UI contract.
 * Script adapters keep historical export names only; command planning, inventory loading, and process
 * side effects remain outside this pure state machine.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/ink-reducer.unit.test.ts
 * @testing Node test runner: from the repository root, run npm run worktree-kit:test to execute every packages/worktree-kit src/*.unit.test.ts file via tsx --test, including ink-reducer.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-reducer-helpers.ts - Pure transition helpers and default action-option factories that implement each branch this reducer's switch delegates to.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Canonical Ink UI state, action union, and inventory contracts that define reducer inputs and returned snapshots.
 * @see packages/worktree-kit/src/ink-app.tsx - Ink shell component that dispatches bridge and keyboard events through this reducer during interactive worktree flows.
 * @see packages/worktree-kit/src/ink-reducer.unit.test.ts - Node test runner regression coverage for default initial state, load-error transitions, and focused action-option toggles owned by this reducer.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { WorktreeStackKit_InkUiAction, WorktreeStackKit_InkUiState } from "./ink-ui-contracts.js";
/** Factory for the default Ink UI state prior to inventory load or user input. */
export declare function WorktreeStackKit_createInitialInkState(): WorktreeStackKit_InkUiState;
/** Pure reducer translating bridge/user events into the next Ink session snapshot. */
export declare function WorktreeStackKit_inkReducer(state: WorktreeStackKit_InkUiState, action: WorktreeStackKit_InkUiAction): WorktreeStackKit_InkUiState;
