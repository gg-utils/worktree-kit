/**
 * @fileoverview Compatibility runner for legacy worktree dev command aliases.
 *
 * Flow: legacy argv -> configured warning lines -> configured canonical start command. Project
 * adapters supply the concrete command path while the package owns warning/delegation behavior.
 *
 * @testing CLI: cd packages/worktree-kit && npm run test -- src/dev-compatibility.unit.test.ts
 *
 * @see packages/worktree-kit/src/dev-compatibility.unit.test.ts - Node test runner regressions that verify configured warning lines emit and forwarded argv reach the injected start runner unchanged.
 * @see scripts/worktree-stack/integrations/dev.ts - Legacy dev integration entrypoint that imports WorktreeStackKit_runDevCompatibilityCli and binds project adapter config from worktrees.config.ts.
 * @see docs/COMMANDS.md - Platform commands reference that documents how worktrees:dev compatibility aliases delegate through @gg-utils/worktree-kit/dev-compatibility into canonical start flows.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Command spec used to forward legacy dev invocations to the canonical start flow. */
export type WorktreeStackKit_DevCompatibilityCommandSpec = {
    args: readonly string[];
    command: string;
    cwd: string;
};
/** Project-supplied compatibility warning text plus canonical start command target. */
export type WorktreeStackKit_DevCompatibilityConfig = {
    startCommand: WorktreeStackKit_DevCompatibilityCommandSpec;
    warningLines: readonly string[];
};
/** Injectable collaborators for warning output and start-command delegation. */
export type WorktreeStackKit_DevCompatibilityRuntime = {
    emitLine: (line: string) => void;
    runStartCommand: (forwardedArgs: readonly string[]) => number;
};
/** Options for the pure/injectable dev-compatibility runner. */
export type WorktreeStackKit_RunDevCompatibilityOptions = {
    forwardedArgs: readonly string[];
    runtime: WorktreeStackKit_DevCompatibilityRuntime;
    warningLines: readonly string[];
};
/** Prints compatibility warnings then forwards argv to the injected start runner. */
export declare function WorktreeStackKit_runDevCompatibility(options: WorktreeStackKit_RunDevCompatibilityOptions): number;
/** Spawns the configured canonical start command with forwarded legacy argv. */
export declare function WorktreeStackKit_runDevCompatibilityStartCommand(options: {
    config: WorktreeStackKit_DevCompatibilityConfig;
    forwardedArgs: readonly string[];
}): number;
/** Direct CLI entrypoint wiring console output to the configured canonical start command. */
export declare function WorktreeStackKit_runDevCompatibilityCli(options: {
    argv: readonly string[];
    config: WorktreeStackKit_DevCompatibilityConfig;
}): number;
//# sourceMappingURL=dev-compatibility.d.ts.map