/**
 * @fileoverview Config-driven slot-to-port derivation for prepared worktree stacks.
 *
 * This file owns the typed port-definition contract and `WorktreeStackKit_deriveSlotPortMap`, which maps
 * configured base ports plus a positive stack slot into concrete listen ports for collocated services.
 * Flow: positive slot + explicit port base definitions -> derived port map.
 *
 * @testing Node test runner: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/index.ts - Kit barrel re-exports this module so `@gg-utils/worktree-kit` and deep `./slot-ports` imports share one public surface.
 * @see packages/worktree-kit/src/slot-ports.unit.test.ts - Node:test unit file that locks slot offset math and non-positive slot rejection for `WorktreeStackKit_deriveSlotPortMap`.
 * @see worktrees.config.ts - Root worktree-stack adapter imports `@gg-utils/worktree-kit/slot-ports` when materializing per-slot port assignments for prepared stacks.
 * @see scripts/checks/worktree-package-boundary.ts - CI package-boundary checker that references the `./slot-ports` export path to keep kit subpath wiring discoverable.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** One named port whose final value is `basePort + slot`. */
export type WorktreeStackKit_SlotPortDefinition<PortKey extends string> = {
    basePort: number;
    key: PortKey;
};
/** Options for config-driven prepared-worktree port derivation. */
export type WorktreeStackKit_DeriveSlotPortMapOptions<PortKey extends string> = {
    portDefinitions: readonly WorktreeStackKit_SlotPortDefinition<PortKey>[];
    slot: number;
};
/** Derives a map of configured port keys to their slot-shifted port values. */
export declare function WorktreeStackKit_deriveSlotPortMap<PortKey extends string>(options: WorktreeStackKit_DeriveSlotPortMapOptions<PortKey>): Map<PortKey, number>;
//# sourceMappingURL=slot-ports.d.ts.map