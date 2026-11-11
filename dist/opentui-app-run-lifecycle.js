/**
 * @fileoverview Reusable OpenTUI command-run lifecycle sequencing.
 *
 * Script adapters own the actual subprocess implementation and React state setters. This package
 * owns the product-neutral sequence around every terminal command run: cancel previous work,
 * reset stale artifacts, stream output chunks, mark running/result phases, clear cancel handles,
 * and normalize thrown errors into the run-result panel contract.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/opentui-shell-contracts.ts - Shell phase contract (`running` vs `result`) that setPhase updates while this module sequences each command run.
 * @see packages/worktree-kit/src/opentui-app-controller.ts - OpenTUI app controller that wires script-owned startRun adapters and React callbacks into WorktreeStackKit_runOpenTuiCommandWithLifecycle for npm and TSX maintenance commands.
 * @see packages/worktree-kit/src/opentui-child-process.ts - Spawn helpers that emit streamed stdout/stderr chunks and return cancelable or direct promises matching the startRun contract consumed here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
function WorktreeStackKit_isOpenTuiCancelableRun(value) {
    return "cancel" in value && "promise" in value;
}
function WorktreeStackKit_errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
/** Formats the run-panel label for npm-script executions. */
export function WorktreeStackKit_formatOpenTuiNpmRunLabel(npmScript) {
    return `npm run ${npmScript}`;
}
/** Runs a script-owned command adapter while applying OpenTUI run-panel state transitions. */
export async function WorktreeStackKit_runOpenTuiCommandWithLifecycle(options) {
    const { callbacks } = options;
    callbacks.cancelCurrentRun();
    callbacks.setCancelRun(null);
    callbacks.resetRunArtifacts();
    callbacks.setPhase("running");
    callbacks.setRunScript(options.commandLabel);
    try {
        const startResult = options.startRun({
            onStderrChunk: callbacks.appendRunStderr,
            onStdoutChunk: callbacks.appendRunStdout,
        });
        const result = await WorktreeStackKit_resolveOpenTuiRunStartResult({
            callbacks,
            startResult,
        });
        callbacks.setRunStatus(result.status);
        callbacks.setPhase("result");
    }
    catch (error) {
        callbacks.setCancelRun(null);
        callbacks.setRunStderr(WorktreeStackKit_errorMessage(error));
        callbacks.setRunStatus(1);
        callbacks.setPhase("result");
    }
}
async function WorktreeStackKit_resolveOpenTuiRunStartResult(options) {
    if (WorktreeStackKit_isOpenTuiCancelableRun(options.startResult)) {
        options.callbacks.setCancelRun(options.startResult.cancel);
        const result = await options.startResult.promise;
        options.callbacks.setCancelRun(null);
        return result;
    }
    const result = await options.startResult;
    options.callbacks.setCancelRun(null);
    return result;
}
