/**
 * @fileoverview Config-driven preflight and generated-artifact validation for worktree creation.
 *
 * Flow: create context + project validation config -> host/repo checks, branch validation, identity
 * collision checks, port listener warnings, and generated artifact assertions.
 *
 * @testing Node test runner unit: cd packages/worktree-kit && npm run test -- src/create-preflight-validation.unit.test.ts
 *
 * @see packages/worktree-kit/src/configured-create-command.ts - Configured create flow that sequences these preflight checks before provisioning a prepared worktree path.
 * @see packages/worktree-kit/src/create-preflight-validation.unit.test.ts - Node test runner module that asserts target-location and generated-artifact validation behavior owned here.
 * @see packages/worktree-core/src/worktree-discovery.ts - Core discovery helpers that list registered worktrees and read JSON metadata fields this module uses for slot and realm collision checks.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackError, worktreeStackPrintKv, worktreeStackRequireCommand, worktreeStackRequireDirectory, worktreeStackRequireFile, worktreeStackRunCommand, worktreeStackRunGit, worktreeStackWarn, } from "@gg-utils/worktree-core/foundation";
import { worktreeStackListRegisteredWorktrees, worktreeStackReadJsonField, } from "@gg-utils/worktree-core/worktree-discovery";
/** Returns the lsof output for a given TCP port if a process is listening. */
export function WorktreeStackKit_createPortListenerSummary(port) {
    const result = worktreeStackRunCommand("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
        allowFailure: true,
    });
    return result.stdout.trim();
}
/** Checks host commands, required files/directories, and primary env presence. */
export function WorktreeStackKit_requireCreatePrerequisites(options) {
    const { config, context } = options;
    context.currentStep = "preflight";
    for (const commandName of config.requiredCommandNames) {
        worktreeStackRequireCommand(commandName);
    }
    for (const requiredFile of config.requiredFiles) {
        worktreeStackRequireFile(requiredFile.filePath, requiredFile.description);
    }
    for (const requiredDirectory of config.requiredDirectories) {
        worktreeStackRequireDirectory(requiredDirectory.directoryPath, requiredDirectory.description);
    }
    if (!fs.existsSync(context.primaryWorkspaceEnvFile)) {
        worktreeStackWarn(config.primaryEnvMissingWarning);
        worktreeStackPrintKv(config.primaryEnvMissingExpectedFileLabel, context.primaryWorkspaceEnvFile);
    }
}
/** Verifies the configured base branch exists locally or as an origin remote ref. */
export function WorktreeStackKit_validateCreateBaseBranchExists(context) {
    context.currentStep = "validate-base-branch";
    const hasLocal = worktreeStackRunGit(context.rootDir, ["rev-parse", "--verify", "--quiet", context.options.baseBranch], {
        allowFailure: true,
        stdio: "ignore",
    }).status === 0;
    if (hasLocal) {
        return;
    }
    const hasRemote = worktreeStackRunGit(context.rootDir, [
        "rev-parse",
        "--verify",
        "--quiet",
        `origin/${context.options.baseBranch}`,
    ], {
        allowFailure: true,
        stdio: "ignore",
    }).status === 0;
    if (hasRemote) {
        return;
    }
    worktreeStackError(`Base branch was not found locally or on origin: ${context.options.baseBranch}`);
}
/** Ensures the worktrees base exists and target path is either absent or a Git worktree. */
export function WorktreeStackKit_validateCreateTargetLocation(context) {
    context.currentStep = "validate-target-location";
    fs.mkdirSync(context.options.worktreesBase, { recursive: true });
    if (!context.worktreePath || !fs.existsSync(context.worktreePath)) {
        return;
    }
    const gitMarkerPath = path.join(context.worktreePath, ".git");
    if (fs.existsSync(gitMarkerPath)) {
        return;
    }
    worktreeStackError(`Target path already exists but is not a Git worktree: ${context.worktreePath}`);
}
/** Rejects slot or realm collisions with other registered prepared worktrees. */
export function WorktreeStackKit_validateUniqueCreateWorktreeIdentity(options) {
    const { config, context } = options;
    context.currentStep = "validate-worktree-identity";
    for (const candidatePath of worktreeStackListRegisteredWorktrees(context.rootDir)) {
        if (!candidatePath ||
            candidatePath === context.rootDir ||
            candidatePath === context.worktreePath) {
            continue;
        }
        const metadataPath = path.join(candidatePath, config.metadataRelativePath);
        if (!fs.existsSync(metadataPath)) {
            continue;
        }
        const candidateSlot = worktreeStackReadJsonField(metadataPath, config.slotMetadataField);
        const candidateRealm = worktreeStackReadJsonField(metadataPath, config.realmMetadataField);
        if (candidateSlot === String(context.options.slot)) {
            worktreeStackError(`Slot ${String(context.options.slot)} is already used by worktree: ${candidatePath}`);
        }
        if (candidateRealm === context.realmSlug) {
            worktreeStackError(`Realm slug '${context.realmSlug}' is already used by worktree: ${candidatePath}`);
        }
    }
}
/** Emits best-effort lsof warnings when derived slot ports already have listeners. */
export function WorktreeStackKit_warnIfCreatePortsAreBusy(options) {
    options.context.currentStep = "port-preflight";
    for (const port of options.ports) {
        const result = worktreeStackRunCommand("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
            allowFailure: true,
            stdio: "ignore",
        });
        if (result.status === 0) {
            worktreeStackWarn(`Derived port ${String(port)} is already listening. The selected slot may collide with a running process.`);
            const summary = WorktreeStackKit_createPortListenerSummary(port);
            if (summary.length > 0) {
                console.error(summary);
            }
        }
    }
}
/** Asserts that configured generated artifacts exist under the target worktree. */
export function WorktreeStackKit_validateGeneratedCreateArtifacts(options) {
    const { config, context } = options;
    context.currentStep = "validate-generated-artifacts";
    for (const requirement of config.generatedArtifactRequirements) {
        worktreeStackRequireFile(path.join(context.worktreePath, requirement.relativePath), requirement.description);
    }
}
