/**
 * @fileoverview Package-owned inventory discovery for worktree Ink UI shells.
 *
 * This module owns product-neutral parsing, artifact coercion, issue derivation, health summary,
 * and inventory assembly for worktree-style Ink consoles. Project adapters provide checkout
 * identity resolution so package code does not import root scripts or project config.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Ink UI contracts for inventory rows, issues, health summaries, and realm metadata that this module fills from git porcelain and local-edge artifacts.
 * @see scripts/worktree-stack/ui/cli-ink/load-discovery.ts - Root Ink CLI adapter that imports {@link WorktreeStackKit_loadInkInventory} from the package subpath and supplies project-root checkout identity for the interactive inventory shell.
 * @see packages/worktree-kit/src/ink-inventory-discovery.unit.test.ts - Node unit tests that stub git, filesystem, and registry collaborators to assert parsing, issue derivation, and {@link WorktreeStackKit_loadInkInventory} assembly owned here.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const LOCAL_EDGE_ENV_FILE_NAME = ".env.local-edge";
export function WorktreeStackKit_createNodeInkDiscoveryDependencies(options) {
    return {
        /**
         * Lists git worktrees as porcelain text from `projectRoot`.
         *
         * @remarks
         * I/O: Spawns `git worktree list --porcelain` with cwd `projectRoot`.
         */
        async listGitWorktrees(projectRoot) {
            const result = await execFileAsync("git", ["worktree", "list", "--porcelain"], {
                cwd: projectRoot,
                encoding: "utf8",
            });
            return result.stdout;
        },
        /**
         * Reads a UTF-8 text file (injectable for tests).
         */
        async readTextFile(path) {
            return readFile(path, "utf8");
        },
        pathExists: existsSync,
        /**
         * Resolves canonical workspace path and checkout kind from local-edge contracts.
         */
        resolveCheckoutIdentity(projectRoot) {
            return options.resolveCheckoutIdentity(projectRoot);
        },
        /**
         * Loads realm rows from the local-edge generated registry using env-driven paths.
         *
         * @remarks
         * I/O: Reads `.env.local-edge` and `realms.json`; returns `[]` when the registry file is absent.
         */
        async readRealmRecords(projectRoot) {
            const envFilePath = join(projectRoot, LOCAL_EDGE_ENV_FILE_NAME);
            const envFileRaw = existsSync(envFilePath)
                ? await readFile(envFilePath, "utf8")
                : "";
            const envVars = parseEnvFile(envFileRaw);
            const generatedDir = envVars.LOCAL_EDGE_GENERATED_DIR ??
                join(projectRoot, ".tmp", "local-edge");
            const registryFilePath = join(generatedDir, "registry", "realms.json");
            if (!existsSync(registryFilePath)) {
                return [];
            }
            const raw = await readFile(registryFilePath, "utf8");
            const parsed = parseJsonRecord(raw);
            const realms = isRecord(parsed.realms) ? parsed.realms : {};
            return Object.entries(realms).flatMap(([realmSlug, value]) => {
                if (!isRecord(value)) {
                    return [];
                }
                const branches = isRecord(value.branches) ? value.branches : {};
                return [
                    {
                        realmSlug,
                        status: typeof value.status === "string" ? value.status : "unknown",
                        workspacePath: typeof value.workspacePath === "string"
                            ? value.workspacePath
                            : "",
                        primaryMethod: typeof value.primaryMethod === "string"
                            ? value.primaryMethod
                            : "unknown",
                        rootBranch: asString(branches.rootBranch),
                        submoduleBranch: asString(branches.submoduleBranch),
                    },
                ];
            });
        },
        /**
         * Loads the last healthcheck artifact or returns null when the file is missing.
         *
         * @remarks
         * I/O: Reads `logs/local-edge/artifacts/healthcheck-last-run.json`. ENOENT yields null; other read errors propagate.
         */
        async readHealthArtifact(projectRoot) {
            const artifactPath = join(projectRoot, "logs", "local-edge", "artifacts", "healthcheck-last-run.json");
            try {
                const raw = await readFile(artifactPath, "utf8");
                const parsed = parseJsonRecord(raw);
                const probes = Array.isArray(parsed.probes) ? parsed.probes : [];
                return {
                    runAt: typeof parsed.runAt === "string" ? parsed.runAt : null,
                    method: typeof parsed.method === "string" ? parsed.method : null,
                    probes: probes.map((probe) => {
                        const record = isRecord(probe) ? probe : {};
                        return {
                            realmSlug: typeof record.realmSlug === "string" ? record.realmSlug : "",
                            healthy: record.healthy === true,
                            statusCode: typeof record.statusCode === "number"
                                ? record.statusCode
                                : null,
                            failureDomain: typeof record.failureDomain === "string"
                                ? record.failureDomain
                                : null,
                            surface: typeof record.surface === "string" ? record.surface : null,
                        };
                    }),
                };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (message.includes("ENOENT")) {
                    return null;
                }
                throw error;
            }
        },
    };
}
/**
 * Narrows a value to a plain object record (excludes arrays).
 */
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Parses JSON into a plain object record, falling back to an empty record for other JSON values. */
function parseJsonRecord(raw) {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
}
/**
 * Returns the value when it is a string; otherwise null.
 */
function asString(value) {
    return typeof value === "string" ? value : null;
}
/**
 * Returns the value when it is a number; otherwise null.
 */
function asNumber(value) {
    return typeof value === "number" ? value : null;
}
/**
 * Parses minimal `KEY=VALUE` lines from a `.env`-style string into a record.
 *
 * @remarks
 * Skips blank lines, `#` comments, and lines without `=`.
 */
function parseEnvFile(raw) {
    return Object.fromEntries(raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#") && line.includes("="))
        .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
    }));
}
/**
 * Keeps only string-valued entries from an unknown object-shaped value.
 */
function asStringRecord(value) {
    if (!isRecord(value)) {
        return {};
    }
    return Object.fromEntries(Object.entries(value).filter((entry) => {
        return typeof entry[1] === "string";
    }));
}
/**
 * Keeps only number-valued entries from an unknown object-shaped value.
 */
function asNumberRecord(value) {
    if (!isRecord(value)) {
        return {};
    }
    return Object.fromEntries(Object.entries(value).filter((entry) => {
        return typeof entry[1] === "number";
    }));
}
/**
 * Parses `git worktree list --porcelain` stdout into structured path/branch/detached records.
 */
export function WorktreeStackKit_parseInkGitWorktreeList(output) {
    const blocks = output
        .trim()
        .split(/\n\s*\n/g)
        .map((block) => block.trim())
        .filter((block) => block.length > 0);
    return blocks.flatMap((block) => {
        const lines = block.split("\n");
        let worktreePath = null;
        let head = null;
        let branchRef = null;
        let detached = false;
        for (const line of lines) {
            if (line.startsWith("worktree ")) {
                worktreePath = line.slice("worktree ".length);
                continue;
            }
            if (line.startsWith("HEAD ")) {
                head = line.slice("HEAD ".length);
                continue;
            }
            if (line.startsWith("branch ")) {
                branchRef = line.slice("branch ".length);
                continue;
            }
            if (line === "detached") {
                detached = true;
            }
        }
        if (!worktreePath) {
            return [];
        }
        return [
            {
                worktreePath,
                head,
                branchRef,
                detached,
            },
        ];
    });
}
/**
 * Detects ephemeral merge worktrees materialized under `.tmp/worktree-stack/merge`.
 */
function isTemporaryMergeWorktree(worktreePath) {
    return worktreePath.includes(join(".tmp", "worktree-stack", "merge"));
}
/**
 * Maps raw `metadata.json` text into the Ink metadata contract.
 *
 * @remarks
 * Best-effort coercion; the original parsed object is retained under `raw`.
 */
function mapMetadata(raw) {
    const parsed = parseJsonRecord(raw);
    return {
        stackName: asString(parsed.stackName),
        realmSlug: asString(parsed.realmSlug),
        rootBranch: asString(parsed.rootBranch),
        submoduleBranch: asString(parsed.submoduleBranch),
        baseBranch: asString(parsed.baseBranch),
        workspaceType: asString(parsed.workspaceType),
        slot: asNumber(parsed.slot),
        createdAt: asString(parsed.createdAt),
        ports: asNumberRecord(parsed.ports),
        raw: parsed,
    };
}
/**
 * Maps raw handbook JSON text into the Ink handbook info contract.
 *
 * @remarks
 * Best-effort coercion; the original parsed object is retained under `raw`.
 */
function mapHandbook(raw) {
    const parsed = parseJsonRecord(raw);
    return {
        stackName: asString(parsed.stackName),
        realmSlug: asString(parsed.realmSlug),
        authHost: asString(parsed.authHost),
        generatedAt: asString(parsed.generatedAt),
        commands: asStringRecord(parsed.commands),
        hosts: asStringRecord(parsed.hosts),
        raw: parsed,
    };
}
/**
 * Builds a per-realm health summary by filtering artifact probes for `realmSlug`.
 */
function buildHealthSummary(artifact, realmSlug) {
    if (!artifact || !realmSlug) {
        return null;
    }
    const probes = artifact.probes.filter((probe) => probe.realmSlug === realmSlug);
    if (probes.length === 0) {
        return null;
    }
    const healthyProbeCount = probes.filter((probe) => probe.healthy).length;
    const failingProbeCount = probes.length - healthyProbeCount;
    const firstFailure = probes.find((probe) => !probe.healthy);
    return {
        runAt: artifact.runAt,
        method: artifact.method,
        healthyProbeCount,
        failingProbeCount,
        totalProbeCount: probes.length,
        sampleFailure: firstFailure
            ? [
                firstFailure.surface ?? "unknown-surface",
                firstFailure.failureDomain ?? "unknown-domain",
                firstFailure.statusCode ? `status ${firstFailure.statusCode}` : null,
            ]
                .filter((value) => value !== null)
                .join(" | ")
            : null,
    };
}
/**
 * Short display label for a worktree path (basename, falling back to the full path).
 */
function buildRecordLabel(worktreePath) {
    const label = basename(worktreePath);
    return label.length > 0 ? label : worktreePath;
}
/**
 * Reads a JSON artifact via injectable I/O and maps parse/read failures into Ink issues.
 *
 * @remarks
 * Missing files return `{ value: null, issue: null }`. Other failures yield a warning issue and null value.
 */
async function readJsonArtifact(artifactPath, mapper, dependencies) {
    try {
        if (!dependencies.pathExists(artifactPath)) {
            return {
                value: null,
                issue: null,
            };
        }
        const raw = await dependencies.readTextFile(artifactPath);
        return {
            value: mapper(raw),
            issue: null,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            value: null,
            issue: {
                code: "artifact-read-failed",
                severity: "warning",
                message: `${artifactPath}: ${message}`,
            },
        };
    }
}
/**
 * Derives user-visible issues for one git worktree from metadata, handbook, and health inputs.
 */
function buildRecordIssues(options) {
    const issues = [];
    const { entry } = options;
    const isCanonicalRootWorkspace = options.checkoutKind === "canonical-root-workspace";
    if (entry.detached) {
        issues.push({
            code: "detached-worktree",
            severity: isTemporaryMergeWorktree(entry.worktreePath)
                ? "info"
                : "warning",
            message: isTemporaryMergeWorktree(entry.worktreePath)
                ? "Temporary detached merge worktree."
                : "Detached worktree without an attached branch.",
        });
    }
    if (isTemporaryMergeWorktree(entry.worktreePath)) {
        issues.push({
            code: "temporary-merge-worktree",
            severity: "info",
            message: "Discovery includes a temporary merge worktree.",
        });
    }
    if (!options.metadata && !isCanonicalRootWorkspace) {
        issues.push({
            code: "metadata-missing",
            severity: options.metadataExists ? "warning" : "info",
            message: options.metadataExists
                ? "Metadata artifact exists but could not be parsed."
                : "No worktree-stack metadata artifact found.",
        });
    }
    if (!options.handbook && !isCanonicalRootWorkspace) {
        issues.push({
            code: "handbook-json-missing",
            severity: options.handbookExists ? "warning" : "info",
            message: options.handbookExists
                ? "Handbook JSON exists but could not be parsed."
                : "No worktree handbook JSON artifact found.",
        });
    }
    if (isCanonicalRootWorkspace) {
        const missingRootCompanions = [
            !options.handbookMarkdownExists ? "WORKTREE.local.md" : null,
            !options.onboardingMarkdownExists ? "WORKTREE.readme.md" : null,
        ].filter((value) => value !== null);
        if (missingRootCompanions.length > 0) {
            issues.push({
                code: "root-context-missing",
                severity: "info",
                message: `Canonical root companions are missing (${missingRootCompanions.join(", ")}). Refresh them with 'npm run local:edge:root:context:refresh' or 'npm run local'.`,
            });
        }
    }
    else if (!options.handbookMarkdownExists) {
        issues.push({
            code: "handbook-markdown-missing",
            severity: "info",
            message: "WORKTREE.local.md is missing.",
        });
    }
    if (options.metadata?.realmSlug && !options.realmRecord) {
        issues.push({
            code: "realm-not-registered",
            severity: "info",
            message: `Realm '${options.metadata.realmSlug}' is not present in the local-edge registry.`,
        });
    }
    if (options.healthSummary && options.healthSummary.failingProbeCount > 0) {
        issues.push({
            code: "realm-health-failing",
            severity: "warning",
            message: `Healthcheck reports ${options.healthSummary.failingProbeCount} failing probe(s).`,
        });
    }
    return issues;
}
/**
 * Aggregates inventory-level counters and health timestamps across discovered records.
 */
function buildSummary(records, healthArtifact) {
    return {
        totalRecords: records.length,
        managedRecords: records.filter((record) => record.metadata !== null).length,
        brokenRecords: records.filter((record) => {
            return record.issues.some((issue) => issue.severity === "warning" || issue.severity === "error");
        }).length,
        detachedRecords: records.filter((record) => record.detached).length,
        activeRealms: records.filter((record) => record.realmRecord?.status === "active").length,
        inactiveRealms: records.filter((record) => record.realmRecord?.status === "inactive").length,
        staleRealms: records.filter((record) => record.realmRecord?.status === "stale").length,
        healthyRealms: records.filter((record) => record.healthSummary?.failingProbeCount === 0).length,
        unhealthyRealms: records.filter((record) => {
            return (record.healthSummary?.failingProbeCount ?? 0) > 0;
        }).length,
        healthRunAt: healthArtifact?.runAt ?? null,
    };
}
/**
 * Builds the full Ink inventory model for `projectRoot`, including git worktrees and realm health.
 *
 * @remarks
 * I/O: Reads multiple metadata files and may shell out to git unless dependencies are stubbed.
 */
export async function WorktreeStackKit_loadInkInventory(options) {
    const dependencies = options.dependencies;
    const globalIssues = [];
    const currentCheckoutIdentity = dependencies.resolveCheckoutIdentity(options.projectRoot);
    const gitOutput = await dependencies.listGitWorktrees(options.projectRoot);
    const entries = WorktreeStackKit_parseInkGitWorktreeList(gitOutput);
    let realmRecords = [];
    try {
        realmRecords = await dependencies.readRealmRecords(options.projectRoot);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        globalIssues.push({
            code: "realm-registry-read-failed",
            severity: "warning",
            message,
        });
    }
    let healthArtifact = null;
    try {
        healthArtifact = await dependencies.readHealthArtifact(options.projectRoot);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        globalIssues.push({
            code: "health-artifact-read-failed",
            severity: "warning",
            message,
        });
    }
    const records = await Promise.all(entries.map(async (entry) => {
        const metadataPath = join(entry.worktreePath, ".tmp", "worktree-stack", "metadata.json");
        const handbookJsonPath = join(entry.worktreePath, ".tmp", "worktree-stack", "worktree-info.json");
        const handbookMarkdownPath = join(entry.worktreePath, "WORKTREE.local.md");
        const onboardingMarkdownPath = join(entry.worktreePath, "WORKTREE.readme.md");
        const metadataExists = dependencies.pathExists(metadataPath);
        const handbookExists = dependencies.pathExists(handbookJsonPath);
        const handbookMarkdownExists = dependencies.pathExists(handbookMarkdownPath);
        const onboardingMarkdownExists = dependencies.pathExists(onboardingMarkdownPath);
        const checkoutKind = entry.worktreePath ===
            currentCheckoutIdentity.canonicalRootWorkspacePath
            ? "canonical-root-workspace"
            : metadataExists
                ? "prepared-worktree"
                : "unmanaged-checkout";
        const metadataResult = await readJsonArtifact(metadataPath, mapMetadata, dependencies);
        const handbookResult = await readJsonArtifact(handbookJsonPath, mapHandbook, dependencies);
        const realmSlug = metadataResult.value?.realmSlug ??
            handbookResult.value?.realmSlug ??
            null;
        const realmRecord = realmSlug
            ? (realmRecords.find((record) => record.realmSlug === realmSlug) ??
                null)
            : (realmRecords.find((record) => record.workspacePath === entry.worktreePath) ?? null);
        const healthSummary = buildHealthSummary(healthArtifact, realmSlug);
        const issues = buildRecordIssues({
            entry,
            checkoutKind,
            metadata: metadataResult.value,
            metadataExists,
            handbook: handbookResult.value,
            handbookExists,
            handbookMarkdownExists,
            onboardingMarkdownExists,
            realmRecord,
            healthSummary,
        });
        if (metadataResult.issue) {
            issues.push(metadataResult.issue);
        }
        if (handbookResult.issue) {
            issues.push(handbookResult.issue);
        }
        return {
            worktreePath: entry.worktreePath,
            label: buildRecordLabel(entry.worktreePath),
            head: entry.head,
            branchRef: entry.branchRef,
            detached: entry.detached,
            temporaryMerge: isTemporaryMergeWorktree(entry.worktreePath),
            currentCheckout: entry.worktreePath === options.projectRoot,
            checkoutKind,
            handbookMarkdownPath,
            handbookMarkdownExists,
            onboardingMarkdownPath,
            onboardingMarkdownExists,
            metadata: metadataResult.value,
            handbook: handbookResult.value,
            realmRecord,
            healthSummary,
            issues,
        };
    }));
    records.sort((left, right) => {
        if (left.currentCheckout !== right.currentCheckout) {
            return left.currentCheckout ? -1 : 1;
        }
        if (left.temporaryMerge !== right.temporaryMerge) {
            return left.temporaryMerge ? 1 : -1;
        }
        return left.label.localeCompare(right.label);
    });
    return {
        projectRoot: options.projectRoot,
        loadedAt: new Date().toISOString(),
        records,
        summary: buildSummary(records, healthArtifact),
        globalIssues,
    };
}
