/**
 * @fileoverview Config-driven zsh alias rendering and installation for prepared worktree slots.
 *
 * Flow: discovered worktrees + project render config -> alias file render -> optional shell-config
 * source block. The package stays product-neutral; root config supplies names, markers, and paths.
 *
 * @testing Node test runner (tsx): cd packages/worktree-kit && npx tsx --test src/zsh-aliases-integration.unit.test.ts
 *
 * @see scripts/worktree-stack/integrations/zsh-aliases.ts - Root npm-script entrypoint that resolves consumer paths then forwards argv plus `WorktreeStackKit_ZshAliasesCliConfig` into `WorktreeStackKit_runZshAliasesCli` owned here.
 * @see worktrees.config.ts - Workspace adapter that exports the render markers, default paths, and usage command lines typed as `WorktreeStackKit_ZshAliasesCliConfig` / `WorktreeStackKit_ZshAliasesRenderConfig` for that script wiring.
 * @see packages/worktree-kit/src/zsh-aliases-integration.unit.test.ts - Jest regression coverage for metadata scanning, generated zsh helpers, managed `~/.zshrc` splice behavior, and CLI flag parsing implemented in this file.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import fs from "node:fs";
import path from "node:path";
import { worktreeStackInfo, worktreeStackShellQuote, } from "@gg-utils/worktree-core/foundation";
/** Signals malformed argv or invalid flag values for the zsh-alias integration CLI. */
export class WorktreeStackKit_ZshAliasesCliUsageError extends Error {
}
/** Narrows untrusted JSON values to non-array records before reading metadata fields. */
function WorktreeStackKit_isZshAliasRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Escapes regex metacharacters so literal markers can be embedded in `RegExp` sources. */
function WorktreeStackKit_escapeZshAliasRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
/** Builds the primary `apN` zsh function name for a numbered worktree slot. */
function WorktreeStackKit_slotAliasName(slot) {
    return `ap${slot}`;
}
/** Builds the zero-padded `ap0N` function name for single-digit slots. */
function WorktreeStackKit_slotAliasNamePadded(slot) {
    return `ap${String(slot).padStart(2, "0")}`;
}
/** Produces a human-readable label listing both short and padded aliases when they differ. */
function WorktreeStackKit_aliasNamesLabel(slot) {
    const aliasName = WorktreeStackKit_slotAliasName(slot);
    const paddedAliasName = WorktreeStackKit_slotAliasNamePadded(slot);
    return aliasName === paddedAliasName ? aliasName : `${aliasName} / ${paddedAliasName}`;
}
/** Normalizes thrown values into a single-line stderr message with a `[worktree]` prefix. */
function WorktreeStackKit_formatZshAliasesCliErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith("[worktree] ")
        ? message
        : `[worktree] ERROR: ${message}`;
}
/** Parses a positive integer slot count for alias generation. */
function WorktreeStackKit_parseZshAliasMaxSlot(value) {
    if (!/^\d+$/u.test(value)) {
        throw new WorktreeStackKit_ZshAliasesCliUsageError("--max-slot must be a positive integer.");
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new WorktreeStackKit_ZshAliasesCliUsageError("--max-slot must be a positive integer.");
    }
    return parsed;
}
/** Scans `worktreesBase` for prepared worktrees and returns stable metadata rows. */
export function WorktreeStackKit_readZshAliasEntries(worktreesBase) {
    if (!fs.existsSync(worktreesBase) || !fs.statSync(worktreesBase).isDirectory()) {
        return [];
    }
    const candidateEntries = [];
    for (const directoryEntry of fs.readdirSync(worktreesBase, { withFileTypes: true })) {
        if (!directoryEntry.isDirectory()) {
            continue;
        }
        const worktreePath = path.join(worktreesBase, directoryEntry.name);
        const metadataPath = path.join(worktreePath, ".tmp", "worktree-stack", "metadata.json");
        if (!fs.existsSync(metadataPath)) {
            continue;
        }
        let parsedMetadata;
        try {
            parsedMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        }
        catch {
            console.warn(`[worktree] Skipping ${metadataPath}: invalid JSON`);
            continue;
        }
        if (!WorktreeStackKit_isZshAliasRecord(parsedMetadata)) {
            continue;
        }
        const slot = parsedMetadata.slot;
        if (typeof slot !== "number" || !Number.isInteger(slot) || slot < 1) {
            continue;
        }
        candidateEntries.push({
            createdAt: typeof parsedMetadata.createdAt === "string" ? parsedMetadata.createdAt : "",
            slot,
            stackName: typeof parsedMetadata.stackName === "string"
                ? parsedMetadata.stackName
                : directoryEntry.name,
            worktreePath,
        });
    }
    candidateEntries.sort((left, right) => {
        if (left.slot !== right.slot) {
            return left.slot - right.slot;
        }
        return right.createdAt.localeCompare(left.createdAt);
    });
    return candidateEntries;
}
/** Renders the `.zsh` helper functions and `apN` aliases for configured slot coverage. */
export function WorktreeStackKit_renderZshAliasesFileContent(options) {
    const slotMap = new Map();
    for (const entry of options.entries) {
        if (!slotMap.has(entry.slot)) {
            slotMap.set(entry.slot, entry);
        }
    }
    const highestExistingSlot = options.entries.reduce((maxSlot, entry) => Math.max(maxSlot, entry.slot), 0);
    const slotLimit = Math.max(options.minimumSlotCount, highestExistingSlot);
    const cdFunctionName = `${options.renderConfig.shellFunctionPrefix}_cd`;
    const missingFunctionName = `${options.renderConfig.shellFunctionPrefix}_missing`;
    const lines = [];
    lines.push(`# Generated by ${options.renderConfig.generatorPath}`);
    lines.push(`# Repo root: ${options.rootDir}`);
    lines.push(`# Worktrees base: ${options.worktreesBase}`);
    lines.push(`# Generated file: ${options.aliasesFile}`);
    lines.push("");
    lines.push(`${cdFunctionName}() {`);
    lines.push("  local target_path=\"$1\"");
    lines.push("  if [[ ! -d \"$target_path\" ]]; then");
    lines.push(`    echo "[${options.renderConfig.messagePrefix}] ` +
        `Worktree path is missing: $target_path" >&2`);
    lines.push("    return 1");
    lines.push("  fi");
    lines.push("  cd \"$target_path\"");
    lines.push("}");
    lines.push("");
    lines.push(`${missingFunctionName}() {`);
    lines.push("  local slot_number=\"$1\"");
    lines.push(`  echo "[${options.renderConfig.messagePrefix}] No worktree is currently ` +
        `registered for slot ${"$"}{slot_number} under ${options.worktreesBase}." >&2`);
    lines.push("  return 1");
    lines.push("}");
    lines.push("");
    for (let slot = 1; slot <= slotLimit; slot += 1) {
        const entry = slotMap.get(slot);
        const aliasName = WorktreeStackKit_slotAliasName(slot);
        const paddedAliasName = WorktreeStackKit_slotAliasNamePadded(slot);
        const namesLabel = WorktreeStackKit_aliasNamesLabel(slot);
        if (entry) {
            lines.push(`# ${namesLabel} -> ${entry.stackName} (${entry.worktreePath})`);
            lines.push(`${aliasName}() { ${cdFunctionName} ` +
                `${worktreeStackShellQuote(entry.worktreePath)}; }`);
        }
        else {
            lines.push(`# ${namesLabel} -> unassigned`);
            lines.push(`${aliasName}() { ${missingFunctionName} ${slot}; }`);
        }
        if (aliasName !== paddedAliasName) {
            lines.push(`${paddedAliasName}() { ${aliasName} "$@"; }`);
        }
        lines.push("");
    }
    lines.push("apslots() {");
    lines.push("  cat <<'EOF'");
    if (slotMap.size === 0) {
        lines.push("No worktree slots are currently registered.");
    }
    else {
        const sortedSlots = [...slotMap.entries()].sort((left, right) => left[0] - right[0]);
        for (const [slot, entry] of sortedSlots) {
            lines.push(`${WorktreeStackKit_aliasNamesLabel(slot)} -> ${entry.worktreePath} ` +
                `(${entry.stackName})`);
        }
    }
    lines.push("EOF");
    lines.push("}");
    lines.push("");
    return `${lines.join("\n")}\n`;
}
/** Splices or replaces the managed marker block that sources `aliasesFile` inside shell config. */
export function WorktreeStackKit_updateManagedZshrcContent(options) {
    const block = `${options.renderConfig.beginMarker}
if [ -f ${JSON.stringify(options.aliasesFile)} ]; then
  source ${JSON.stringify(options.aliasesFile)}
fi
${options.renderConfig.endMarker}`;
    const blockPattern = new RegExp(`${WorktreeStackKit_escapeZshAliasRegex(options.renderConfig.beginMarker)}` +
        `[\\s\\S]*?${WorktreeStackKit_escapeZshAliasRegex(options.renderConfig.endMarker)}`, "m");
    if (blockPattern.test(options.currentContent)) {
        return options.currentContent.replace(blockPattern, block);
    }
    const trimmedContent = options.currentContent.replace(/\s*$/u, "");
    return trimmedContent.length > 0 ? `${trimmedContent}\n\n${block}\n` : `${block}\n`;
}
/** Persists `content` to `filePath` via a sibling temp file and an atomic rename. */
function WorktreeStackKit_writeZshAliasesFileAtomically(filePath, content) {
    const directoryPath = path.dirname(filePath);
    fs.mkdirSync(directoryPath, { recursive: true });
    const tempPath = path.join(directoryPath, `worktree-slot-aliases.${process.pid}.${Date.now()}.tmp`);
    fs.writeFileSync(tempPath, content, "utf8");
    fs.renameSync(tempPath, filePath);
}
/** Regenerates the aliases file and optionally patches `zshrcPath` to source it. */
export function WorktreeStackKit_runZshAliases(options) {
    const aliasEntries = WorktreeStackKit_readZshAliasEntries(options.worktreesBase);
    const aliasesContent = WorktreeStackKit_renderZshAliasesFileContent({
        aliasesFile: options.aliasesFile,
        entries: aliasEntries,
        minimumSlotCount: options.maxSlot,
        renderConfig: options.renderConfig,
        rootDir: options.rootDir,
        worktreesBase: options.worktreesBase,
    });
    WorktreeStackKit_writeZshAliasesFileAtomically(options.aliasesFile, aliasesContent);
    if (options.action === "install") {
        fs.mkdirSync(path.dirname(options.zshrcPath), { recursive: true });
        const currentContent = fs.existsSync(options.zshrcPath)
            ? fs.readFileSync(options.zshrcPath, "utf8")
            : "";
        fs.writeFileSync(options.zshrcPath, WorktreeStackKit_updateManagedZshrcContent({
            aliasesFile: options.aliasesFile,
            currentContent,
            renderConfig: options.renderConfig,
        }), "utf8");
    }
    if (!options.quiet) {
        worktreeStackInfo(`Rendered zsh slot aliases: ${options.aliasesFile}`);
        if (options.action === "install") {
            worktreeStackInfo(`Ensured ~/.zshrc sources the managed aliases block: ${options.zshrcPath}`);
            worktreeStackInfo(`Reload your shell with: source ${options.zshrcPath}`);
        }
    }
}
/** Prints zsh-alias integration CLI usage and flag documentation to stdout. */
export function WorktreeStackKit_printZshAliasesUsage(config) {
    const usageLines = config.usageCommandLines.map((line) => `  ${line}`).join("\n");
    console.log(`Usage:
${usageLines}

Options:
  --install                  Render aliases and ensure ~/.zshrc sources them (default)
  --render-only              Render aliases file only, do not edit ~/.zshrc
  --worktrees-base <path>    Parent folder containing worktree directories
  --zshrc <path>             zshrc path to patch (default: ~/.zshrc)
  --aliases-file <path>      Generated zsh aliases file path
  --max-slot <number>        Minimum number of apN functions to generate
  --quiet                    Reduce informational output
  --help                     Show this help`);
}
/** Parses argv into `WorktreeStackKit_ZshAliasesOptions`. */
export function WorktreeStackKit_parseZshAliasesCliArgs(argv, config) {
    const options = {
        action: "install",
        aliasesFile: config.defaultAliasesFile,
        maxSlot: config.defaultMaxSlot,
        quiet: false,
        renderConfig: config.renderConfig,
        rootDir: config.defaultRootDir,
        worktreesBase: config.defaultWorktreesBase,
        zshrcPath: config.defaultZshrcPath,
    };
    for (let index = 0; index < argv.length;) {
        const argument = argv[index];
        switch (argument) {
            case "--install":
                options.action = "install";
                index += 1;
                break;
            case "--render-only":
                options.action = "render";
                index += 1;
                break;
            case "--worktrees-base": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_ZshAliasesCliUsageError("Missing value for --worktrees-base");
                }
                options.worktreesBase = path.resolve(value);
                index += 2;
                break;
            }
            case "--zshrc": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_ZshAliasesCliUsageError("Missing value for --zshrc");
                }
                options.zshrcPath = path.resolve(value);
                index += 2;
                break;
            }
            case "--aliases-file": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_ZshAliasesCliUsageError("Missing value for --aliases-file");
                }
                options.aliasesFile = path.resolve(value);
                index += 2;
                break;
            }
            case "--max-slot": {
                const value = argv[index + 1];
                if (!value) {
                    throw new WorktreeStackKit_ZshAliasesCliUsageError("Missing value for --max-slot");
                }
                options.maxSlot = WorktreeStackKit_parseZshAliasMaxSlot(value);
                index += 2;
                break;
            }
            case "--quiet":
                options.quiet = true;
                index += 1;
                break;
            case "--help":
            case "-h":
                WorktreeStackKit_printZshAliasesUsage(config);
                process.exit(0);
            default:
                throw new WorktreeStackKit_ZshAliasesCliUsageError(`Unknown argument: ${argument}`);
        }
    }
    return options;
}
/** CLI entrypoint that parses argv then delegates to `WorktreeStackKit_runZshAliases`. */
export function WorktreeStackKit_runZshAliasesCli(argv, config) {
    try {
        WorktreeStackKit_runZshAliases(WorktreeStackKit_parseZshAliasesCliArgs(argv, config));
        return 0;
    }
    catch (error) {
        console.error(WorktreeStackKit_formatZshAliasesCliErrorMessage(error));
        if (error instanceof WorktreeStackKit_ZshAliasesCliUsageError) {
            WorktreeStackKit_printZshAliasesUsage(config);
        }
        return 1;
    }
}
