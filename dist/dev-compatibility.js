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
import { spawnSync } from "node:child_process";
/** Prints compatibility warnings then forwards argv to the injected start runner. */
export function WorktreeStackKit_runDevCompatibility(options) {
    for (const line of options.warningLines) {
        options.runtime.emitLine(line);
    }
    return options.runtime.runStartCommand(options.forwardedArgs);
}
/** Spawns the configured canonical start command with forwarded legacy argv. */
export function WorktreeStackKit_runDevCompatibilityStartCommand(options) {
    const result = spawnSync(options.config.startCommand.command, [...options.config.startCommand.args, ...options.forwardedArgs], {
        cwd: options.config.startCommand.cwd,
        stdio: "inherit",
    });
    if (result.error) {
        console.error(result.error.message);
    }
    return result.status ?? 1;
}
/** Direct CLI entrypoint wiring console output to the configured canonical start command. */
export function WorktreeStackKit_runDevCompatibilityCli(options) {
    return WorktreeStackKit_runDevCompatibility({
        forwardedArgs: options.argv,
        runtime: {
            emitLine: (line) => {
                console.log(line);
            },
            runStartCommand: (forwardedArgs) => WorktreeStackKit_runDevCompatibilityStartCommand({
                config: options.config,
                forwardedArgs,
            }),
        },
        warningLines: options.config.warningLines,
    });
}
//# sourceMappingURL=dev-compatibility.js.map