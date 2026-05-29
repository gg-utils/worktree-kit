/**
 * @fileoverview Antigravity/Gemini workspace registration helpers for prepared worktree paths.
 *
 * Flow: action + worktree path + label -> projects.json mutation -> saved workspace roots. The
 * package stays product-neutral; root adapters only preserve command surfaces.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see scripts/worktree-stack/integrations/antigravity-project.ts - Root tsx entrypoint that forwards argv to WorktreeStackKit_runAntigravityProjectCli from this module so historical script paths stay stable.
 * @see packages/worktree-kit/src/antigravity-project-integration.unit.test.ts - Jest regression coverage for projects.json mutation, Antigravity path resolution, and CLI argv parsing owned by this module.
 * @see docs/COMMANDS.md - Platform command catalog that documents npm worktrees:antigravity:* wiring operators use alongside this integration.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Registry mutation requested by the Antigravity integration CLI. */
export type WorktreeStackKit_AntigravityProjectAction = "register" | "unregister";
/** Resolved filesystem locations for Antigravity/Gemini `projects.json` state. */
export type WorktreeStackKit_AntigravityProjectPaths = {
    antigravityHomeDir: string;
    projectsPath: string;
};
/** Options for mutating Antigravity workspace metadata outside the argv parser. */
export type WorktreeStackKit_AntigravityProjectOptions = {
    action: WorktreeStackKit_AntigravityProjectAction;
    env?: NodeJS.ProcessEnv;
    homeDir?: string;
    label: string;
    worktreePath: string;
};
/** Normalized argv payload after CLI parsing succeeds. */
export type WorktreeStackKit_AntigravityProjectCliOptions = {
    action: WorktreeStackKit_AntigravityProjectAction;
    label: string;
    worktreePath: string;
};
/** Signals argv/help failures so callers can print usage without masking runtime errors. */
export declare class WorktreeStackKit_AntigravityProjectCliUsageError extends Error {
}
/** Canonicalizes user-supplied worktree paths before Antigravity state writes. */
export declare function WorktreeStackKit_normalizeAntigravityWorktreePath(worktreePath: string): string;
/** Resolves `ANTIGRAVITY_HOME` / `GEMINI_HOME` plus the `projects.json` file location. */
export declare function WorktreeStackKit_resolveAntigravityProjectPaths(env?: NodeJS.ProcessEnv, homeDir?: string): WorktreeStackKit_AntigravityProjectPaths;
/** Returns the next `projects.json` object with the worktree path added or removed. */
export declare function WorktreeStackKit_updateAntigravityProjectsState(options: {
    action: WorktreeStackKit_AntigravityProjectAction;
    label: string;
    projectsState: Record<string, unknown>;
    worktreePath: string;
}): Record<string, unknown>;
/** Applies register/unregister mutations to Antigravity/Gemini `projects.json` on disk. */
export declare function WorktreeStackKit_runAntigravityProjectMutation(options: WorktreeStackKit_AntigravityProjectOptions): void;
/** Prints Antigravity integration CLI usage and behavior notes to stdout. */
export declare function WorktreeStackKit_printAntigravityProjectUsage(): void;
/** Parses integration argv into structured options. */
export declare function WorktreeStackKit_parseAntigravityProjectCliArgs(argv: readonly string[]): WorktreeStackKit_AntigravityProjectCliOptions;
/** CLI entrypoint that wires parsing to Antigravity/Gemini project-state mutation. */
export declare function WorktreeStackKit_runAntigravityProjectCli(argv: readonly string[], env?: NodeJS.ProcessEnv, homeDir?: string): number;
//# sourceMappingURL=antigravity-project-integration.d.ts.map