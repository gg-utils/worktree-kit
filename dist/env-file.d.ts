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
export type WorktreeStackKit_MachineRootFromEnvFileOptions = {
    envFile: string;
    fallbackRelativePath: string;
    generatedDirEnvKey: string;
    generatedDirLeafName: string;
    workspaceFallback: string;
};
export type WorktreeStackKit_SyncSharedEnvKeysConfig = {
    envFileName: string;
    generatedDirEnvKey: string;
    generatedDirLeafName: string;
    machineRootFallbackRelativePath: string;
    normalizedPathKeys: readonly string[];
    sharedKeys: readonly string[];
};
export type WorktreeStackKit_SyncSharedEnvKeysOptions = {
    config: WorktreeStackKit_SyncSharedEnvKeysConfig;
    log?: (message: string) => void;
    sourceWorkspacePath: string;
    targetWorkspacePath: string;
};
/** Loads a `.env`-style file into a key/value map for workspace mutations. */
export declare function WorktreeStackKit_readEnvMap(filePath: string): Map<string, string>;
/** Re-serializes a `.env` document with updated values while preserving comments and shape. */
export declare function WorktreeStackKit_writeEnvMap(filePath: string, valuesByKey: Map<string, string>): void;
/** Reads a single env value as a string, returning empty string if missing. */
export declare function WorktreeStackKit_readSimpleEnvValue(filePath: string, key: string): string;
/** Sets one key-value pair in an env file, preserving existing entries. */
export declare function WorktreeStackKit_setEnvValue(filePath: string, key: string, value: string): void;
/** Reads one key from an env file using the same parser as the bulk map helpers. */
export declare function WorktreeStackKit_getEnvValue(filePath: string, key: string): string;
/** Normalizes duplicate key entries in an env file by re-serializing it. */
export declare function WorktreeStackKit_normalizeEnvFileDuplicateKeys(filePath: string): void;
/** Resolves a reference seed file, preferring `.env.template` over `.env.example`. */
export declare function WorktreeStackKit_resolveReferenceEnvSeedFile(serviceRoot: string): string;
/** Merges keys present in a reference env into a target env when the target key is missing. */
export declare function WorktreeStackKit_mergeMissingEnvValuesFromReference(targetEnv: string, referenceEnv: string): void;
/** Merges keys from reference env into target env when the target key is missing or blank. */
export declare function WorktreeStackKit_mergeMissingOrBlankEnvValuesFromReference(targetEnv: string, referenceEnv: string): void;
/** Replaces the port in a URL string, returning a default HTTP URL if parsing fails. */
export declare function WorktreeStackKit_replaceUrlPort(rawUrl: string, port: number, defaultHost: string): string;
/** Extracts the host from a URL string, falling back to `defaultHost` when parsing fails. */
export declare function WorktreeStackKit_extractUrlHost(rawUrl: string, defaultHost: string): string;
/** Replaces the port in a comma-separated URL list. */
export declare function WorktreeStackKit_replaceOriginListPorts(rawList: string, port: number, defaultHost: string, defaultScheme: string): string;
/** Rewrites legacy generated artifact paths under a workspace-local machine root. */
export declare function WorktreeStackKit_normalizeOptionalArtifactPath(rawPath: string, machineRoot?: string): string;
/** Resolves the workspace runtime machine root from a configured generated-dir env value. */
export declare function WorktreeStackKit_machineRootFromEnvFile(options: WorktreeStackKit_MachineRootFromEnvFileOptions): string;
/** Syncs a configured allowlist of shared env keys from one workspace into another. */
export declare function WorktreeStackKit_syncSharedEnvKeys(options: WorktreeStackKit_SyncSharedEnvKeysOptions): void;
//# sourceMappingURL=env-file.d.ts.map