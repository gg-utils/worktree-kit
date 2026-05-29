/**
 * @fileoverview Product-neutral env-file helpers used by config-driven worktree workflows.
 *
 * Flow: parse env documents -> merge managed values -> normalize runtime artifact paths -> write
 * workspace-local env files. Project-specific key names, env filenames, and shared-key allowlists
 * come from explicit project adapters rather than this package.
 *
 * @testing Node.js test runner unit: npm run worktree-kit:test from the repo root (runs the package test script, including packages/worktree-kit/src/env-file.unit.test.ts).
 *
 * @see packages/worktree-kit/src/env-file.unit.test.ts - Node:test regression module that exercises read/merge/render, URL helpers, machine-root resolution, and cross-workspace shared-key sync for this surface.
 * @see packages/worktree-kit/src/create-env-orchestration.ts - Create-flow orchestration that composes these env-file helpers when provisioning workspace and package `.env*` trees during worktree setup.
 * @see packages/env-materialize-core/src/env-document.ts - Env document parser and renderer contract used here so `.env` edits preserve comments, ordering, and duplicate-key normalization semantics.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { EnvMaterialize_parseEnvDocument, EnvMaterialize_renderDocument, } from "@gg-utils/env-materialize-core/env-document";
/** Loads a `.env`-style file into a key/value map for workspace mutations. */
export function WorktreeStackKit_readEnvMap(filePath) {
    if (!fs.existsSync(filePath)) {
        return new Map();
    }
    return EnvMaterialize_parseEnvDocument(fs.readFileSync(filePath, "utf8")).valuesByKey;
}
/** Re-serializes a `.env` document with updated values while preserving comments and shape. */
export function WorktreeStackKit_writeEnvMap(filePath, valuesByKey) {
    const existingDocument = fs.existsSync(filePath)
        ? EnvMaterialize_parseEnvDocument(fs.readFileSync(filePath, "utf8"))
        : EnvMaterialize_parseEnvDocument("");
    const rendered = EnvMaterialize_renderDocument({
        document: existingDocument,
        valuesByKey,
    });
    fs.writeFileSync(filePath, rendered, "utf8");
}
/** Reads a single env value as a string, returning empty string if missing. */
export function WorktreeStackKit_readSimpleEnvValue(filePath, key) {
    return WorktreeStackKit_readEnvMap(filePath).get(key) ?? "";
}
/** Sets one key-value pair in an env file, preserving existing entries. */
export function WorktreeStackKit_setEnvValue(filePath, key, value) {
    const valuesByKey = WorktreeStackKit_readEnvMap(filePath);
    valuesByKey.set(key, value);
    WorktreeStackKit_writeEnvMap(filePath, valuesByKey);
}
/** Reads one key from an env file using the same parser as the bulk map helpers. */
export function WorktreeStackKit_getEnvValue(filePath, key) {
    return WorktreeStackKit_readSimpleEnvValue(filePath, key);
}
/** Normalizes duplicate key entries in an env file by re-serializing it. */
export function WorktreeStackKit_normalizeEnvFileDuplicateKeys(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }
    WorktreeStackKit_writeEnvMap(filePath, WorktreeStackKit_readEnvMap(filePath));
}
/** Resolves a reference seed file, preferring `.env.template` over `.env.example`. */
export function WorktreeStackKit_resolveReferenceEnvSeedFile(serviceRoot) {
    const templatePath = path.join(serviceRoot, ".env.template");
    if (fs.existsSync(templatePath)) {
        return templatePath;
    }
    const examplePath = path.join(serviceRoot, ".env.example");
    if (fs.existsSync(examplePath)) {
        return examplePath;
    }
    return "";
}
/** Merges keys present in a reference env into a target env when the target key is missing. */
export function WorktreeStackKit_mergeMissingEnvValuesFromReference(targetEnv, referenceEnv) {
    if (!fs.existsSync(targetEnv) || !fs.existsSync(referenceEnv)) {
        return;
    }
    const targetValues = WorktreeStackKit_readEnvMap(targetEnv);
    const referenceValues = WorktreeStackKit_readEnvMap(referenceEnv);
    for (const [key, value] of referenceValues) {
        if (value.length === 0 || targetValues.has(key)) {
            continue;
        }
        targetValues.set(key, value);
    }
    WorktreeStackKit_writeEnvMap(targetEnv, targetValues);
}
/** Merges keys from reference env into target env when the target key is missing or blank. */
export function WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference(targetEnv, referenceEnv) {
    if (!fs.existsSync(targetEnv) || !fs.existsSync(referenceEnv)) {
        return;
    }
    const targetValues = WorktreeStackKit_readEnvMap(targetEnv);
    const referenceValues = WorktreeStackKit_readEnvMap(referenceEnv);
    for (const [key, value] of referenceValues) {
        if (value.length === 0) {
            continue;
        }
        const currentValue = targetValues.get(key);
        if (typeof currentValue === "string" && currentValue.length > 0) {
            continue;
        }
        targetValues.set(key, value);
    }
    WorktreeStackKit_writeEnvMap(targetEnv, targetValues);
}
/** Replaces the port in a URL string, returning a default HTTP URL if parsing fails. */
export function WorktreeStackKit_replaceUrlPort(rawUrl, port, defaultHost) {
    const match = /^(https?):\/\/([^/:]+)(:\d+)?(.*)$/u.exec(rawUrl);
    if (match?.[1] && match[2]) {
        return `${match[1]}://${match[2]}:${port}${match[4] ?? ""}`;
    }
    return `http://${defaultHost}:${port}`;
}
/** Extracts the host from a URL string, falling back to `defaultHost` when parsing fails. */
export function WorktreeStackKit_extractUrlHost(rawUrl, defaultHost) {
    const match = /^https?:\/\/([^/:]+)(:\d+)?(\/.*)?$/u.exec(rawUrl);
    return match?.[1] ?? defaultHost;
}
/** Replaces the port in a comma-separated URL list. */
export function WorktreeStackKit_replaceOriginListPorts(rawList, port, defaultHost, defaultScheme) {
    if (rawList.length === 0) {
        return `${defaultScheme}://${defaultHost}:${port}`;
    }
    return rawList
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => WorktreeStackKit_replaceUrlPort(item, port, defaultHost))
        .join(",");
}
/** Rewrites legacy generated artifact paths under a workspace-local machine root. */
export function WorktreeStackKit_normalizeOptionalArtifactPath(rawPath, machineRoot) {
    if (rawPath.length === 0 || !machineRoot) {
        return rawPath;
    }
    const legacyRoot = path.join(machineRoot, "generated");
    const legacyPrefix = `${path.join(legacyRoot, "certs")}${path.sep}`;
    if (rawPath.startsWith(legacyPrefix)) {
        return path.join(machineRoot, "certs", rawPath.slice(legacyPrefix.length));
    }
    return rawPath;
}
/** Resolves the workspace runtime machine root from a configured generated-dir env value. */
export function WorktreeStackKit_machineRootFromEnvFile(options) {
    const generatedDir = WorktreeStackKit_readSimpleEnvValue(options.envFile, options.generatedDirEnvKey);
    if (generatedDir.length === 0) {
        return path.join(options.workspaceFallback, options.fallbackRelativePath);
    }
    if (path.basename(generatedDir) === options.generatedDirLeafName) {
        return path.dirname(generatedDir);
    }
    return generatedDir;
}
/** Syncs a configured allowlist of shared env keys from one workspace into another. */
export function WorktreeStackKit_syncSharedEnvKeys(options) {
    const sourceEnvFile = path.join(options.sourceWorkspacePath, options.config.envFileName);
    const targetEnvFile = path.join(options.targetWorkspacePath, options.config.envFileName);
    if (!fs.existsSync(sourceEnvFile) || !fs.existsSync(targetEnvFile)) {
        return;
    }
    const normalizedPathKeys = new Set(options.config.normalizedPathKeys);
    const machineRoot = WorktreeStackKit_machineRootFromEnvFile({
        envFile: targetEnvFile,
        fallbackRelativePath: options.config.machineRootFallbackRelativePath,
        generatedDirEnvKey: options.config.generatedDirEnvKey,
        generatedDirLeafName: options.config.generatedDirLeafName,
        workspaceFallback: options.targetWorkspacePath,
    });
    for (const key of options.config.sharedKeys) {
        let value = WorktreeStackKit_readSimpleEnvValue(sourceEnvFile, key);
        if (value.length === 0) {
            continue;
        }
        if (normalizedPathKeys.has(key)) {
            value = WorktreeStackKit_normalizeOptionalArtifactPath(value, machineRoot);
        }
        WorktreeStackKit_setEnvValue(targetEnvFile, key, value);
    }
    options.log?.(`Synced shared env keys into workspace: ${targetEnvFile}`);
}
//# sourceMappingURL=env-file.js.map