/**
 * @fileoverview Reusable create/switch form catalogs for worktree Ink UIs.
 *
 * Form schema, default drafts, and field/section lookup helpers are product-neutral. Project UI
 * adapters own inventory-derived defaults, filesystem previews, and command argv construction.
 *
 * @testing Node test: npm run worktree-kit:test
 *
 * @see packages/worktree-kit/src/ink-launch-options.ts - Launcher argv draft types (`WorktreeStackKit_InkCreateDraft`) that `WorktreeStackKit_createInitialInkCreateDraft` materializes for UI and argv hydration.
 * @see packages/worktree-kit/src/ink-reducer.ts - Ink reducer that seeds interactive state from the initial create draft and consults the field catalogs while handling keyboard-driven edits.
 * @see packages/worktree-kit/src/ink-create-model.unit.test.ts - Node regression tests for section/field catalogs, lookup helpers, and default draft shapes owned by this module.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Ordered Ink create wizard sections shown in the left column. */
export const WORKTREE_STACK_KIT_INK_CREATE_SECTIONS = [
    {
        id: "identity",
        label: "Identity & Location",
        description: "Name, port slot, and folder location",
    },
    {
        id: "branches",
        label: "Git Branches",
        description: "Customize branch names or use defaults",
    },
    {
        id: "provisioning",
        label: "Dependencies",
        description: "Install and environment options",
    },
    {
        id: "launch",
        label: "Post-Create",
        description: "Auto-open tools and start environment",
    },
];
/** Flat field catalog driving prompts, validation, and argv translation for create. */
export const WORKTREE_STACK_KIT_INK_CREATE_FIELDS = [
    {
        id: "branchPrefix",
        sectionId: "identity",
        label: "Branch Prefix",
        kind: "text",
        description: "Git branch prefix (e.g., codex, claude). Default: codex",
    },
    {
        id: "stackName",
        sectionId: "identity",
        label: "Stack Name",
        kind: "text",
        description: "Short identifier for this work (used in branches and folder names)",
    },
    {
        id: "slotInput",
        sectionId: "identity",
        label: "Port Slot",
        kind: "text",
        description: "Leave blank to auto-assign the next available port",
    },
    {
        id: "worktreesBase",
        sectionId: "identity",
        label: "Parent Folder",
        kind: "text",
        description: "Where to create the new worktree folder",
    },
    {
        id: "realmSlug",
        sectionId: "identity",
        label: "Realm (optional)",
        kind: "text",
        description: "Custom realm name, or leave blank for auto-assignment",
    },
    {
        id: "worktreePathOverride",
        sectionId: "identity",
        label: "Custom Path (optional)",
        kind: "text",
        description: "Override the default worktree location",
    },
    {
        id: "metadataSource",
        sectionId: "identity",
        label: "Source Tag (optional)",
        kind: "text",
        description: "Optional source label for generated worktree metadata",
    },
    {
        id: "baseBranch",
        sectionId: "branches",
        label: "Base Branch",
        kind: "text",
        description: "Branch to create the new worktree from",
    },
    {
        id: "rootBranch",
        sectionId: "branches",
        label: "Root Repo Branch",
        kind: "text",
        description: "Default: {prefix}/{stack}",
    },
    {
        id: "submoduleBranch",
        sectionId: "branches",
        label: "Submodule Branch",
        kind: "text",
        description: "Default: {prefix}/{stack}",
    },
    {
        id: "copyEnvFromMain",
        sectionId: "provisioning",
        label: "Copy .env From Main (legacy)",
        kind: "boolean",
        description: "Deprecated legacy env copy; prefer configured env materialization",
    },
    {
        id: "runInstall",
        sectionId: "provisioning",
        label: "Install Dependencies",
        kind: "boolean",
        description: "Run dependency installation after setup",
    },
    {
        id: "installSkipExisting",
        sectionId: "provisioning",
        label: "Skip Existing Packages",
        kind: "boolean",
        description: "Skip packages already present on disk",
    },
    {
        id: "installPreferOnline",
        sectionId: "provisioning",
        label: "Prefer Online Packages",
        kind: "boolean",
        description: "Use network resolution instead of cache-first installation",
    },
    {
        id: "openWindsurf",
        sectionId: "launch",
        label: "Open in Windsurf",
        kind: "boolean",
        description: "Opt into launching Windsurf when done",
    },
    {
        id: "followUpStart",
        sectionId: "launch",
        label: "Start Environment",
        kind: "boolean",
        description: "Auto-start the local environment after creation",
    },
    {
        id: "followUpStartOpenWindsurf",
        sectionId: "launch",
        label: "Also Open Windsurf",
        kind: "boolean",
        description: "Opt into launching Windsurf when starting environment",
    },
];
/** Ordered switch wizard sections. */
export const WORKTREE_STACK_KIT_INK_SWITCH_SECTIONS = [
    {
        id: "identity",
        label: "Identity",
        description: "Branch prefix and stack name",
    },
    {
        id: "filter",
        label: "Filter",
        description: "Environment/realm filtering",
    },
];
/** Flat catalog of switch fields used for prompts and argv translation. */
export const WORKTREE_STACK_KIT_INK_SWITCH_FIELDS = [
    {
        id: "branchPrefix",
        sectionId: "identity",
        label: "Branch Prefix",
        kind: "text",
        description: "Git branch prefix (e.g., codex, claude). Default: codex",
    },
    {
        id: "stackName",
        sectionId: "identity",
        label: "Stack Name",
        kind: "text",
        description: "Short identifier for the worktree",
    },
    {
        id: "environmentFilter",
        sectionId: "filter",
        label: "Environment Filter",
        kind: "text",
        description: "Filter worktrees by realm slug (e.g., worktree-01)",
    },
];
/** Default create draft before user edits or argv hydration. */
export function WorktreeStackKit_createInitialInkCreateDraft() {
    return {
        branchPrefix: "",
        stackName: "",
        slotInput: "",
        baseBranch: "",
        rootBranch: "",
        submoduleBranch: "",
        worktreesBase: "",
        realmSlug: "",
        worktreePathOverride: "",
        metadataSource: "",
        copyEnvFromMain: false,
        runInstall: true,
        installSkipExisting: true,
        installPreferOnline: false,
        openWindsurf: false,
        followUpStart: false,
        followUpStartOpenWindsurf: false,
    };
}
/** Returns the create field definition at `index` or `null` when out of range. */
export function WorktreeStackKit_getInkCreateField(index) {
    return WORKTREE_STACK_KIT_INK_CREATE_FIELDS[index] ?? null;
}
/** Index of `fieldId` inside `WORKTREE_STACK_KIT_INK_CREATE_FIELDS` (or `-1` when unknown). */
export function WorktreeStackKit_getInkCreateFieldIndex(fieldId) {
    return WORKTREE_STACK_KIT_INK_CREATE_FIELDS.findIndex((field) => field.id === fieldId);
}
/** Returns the create section definition at `index` or `null` when out of range. */
export function WorktreeStackKit_getInkCreateSection(index) {
    return WORKTREE_STACK_KIT_INK_CREATE_SECTIONS[index] ?? null;
}
/** Index of `sectionId` inside `WORKTREE_STACK_KIT_INK_CREATE_SECTIONS` (or `-1`). */
export function WorktreeStackKit_getInkCreateSectionIndex(sectionId) {
    return WORKTREE_STACK_KIT_INK_CREATE_SECTIONS.findIndex((section) => section.id === sectionId);
}
/** Resolves the parent section for a field id, or `null` when the field is missing. */
export function WorktreeStackKit_getInkCreateSectionForField(fieldId) {
    const field = WORKTREE_STACK_KIT_INK_CREATE_FIELDS.find((item) => item.id === fieldId);
    if (!field) {
        return null;
    }
    return (WORKTREE_STACK_KIT_INK_CREATE_SECTIONS.find((section) => section.id === field.sectionId) ?? null);
}
/** Lists all field definitions belonging to a section id. */
export function WorktreeStackKit_getInkCreateFieldsForSection(sectionId) {
    return WORKTREE_STACK_KIT_INK_CREATE_FIELDS.filter((field) => field.sectionId === sectionId);
}
/** Returns whether `fieldId` refers to a boolean toggle in the create form schema. */
export function WorktreeStackKit_isInkCreateBooleanField(fieldId) {
    return WORKTREE_STACK_KIT_INK_CREATE_FIELDS.some((field) => field.id === fieldId && field.kind === "boolean");
}
/** Default switch draft prior to user edits. */
export function WorktreeStackKit_createInitialInkSwitchDraft() {
    return {
        branchPrefix: "",
        stackName: "",
        environmentFilter: "",
    };
}
/** Returns the switch field at `index` or `null` when out of range. */
export function WorktreeStackKit_getInkSwitchField(index) {
    return WORKTREE_STACK_KIT_INK_SWITCH_FIELDS[index] ?? null;
}
/** Index of `fieldId` inside `WORKTREE_STACK_KIT_INK_SWITCH_FIELDS` (or `-1`). */
export function WorktreeStackKit_getInkSwitchFieldIndex(fieldId) {
    return WORKTREE_STACK_KIT_INK_SWITCH_FIELDS.findIndex((field) => field.id === fieldId);
}
/** Returns the switch section at `index` or `null` when out of range. */
export function WorktreeStackKit_getInkSwitchSection(index) {
    return WORKTREE_STACK_KIT_INK_SWITCH_SECTIONS[index] ?? null;
}
/** Index of `sectionId` inside `WORKTREE_STACK_KIT_INK_SWITCH_SECTIONS` (or `-1`). */
export function WorktreeStackKit_getInkSwitchSectionIndex(sectionId) {
    return WORKTREE_STACK_KIT_INK_SWITCH_SECTIONS.findIndex((section) => section.id === sectionId);
}
/** Lists switch fields that belong to `sectionId`. */
export function WorktreeStackKit_getInkSwitchFieldsForSection(sectionId) {
    return WORKTREE_STACK_KIT_INK_SWITCH_FIELDS.filter((field) => field.sectionId === sectionId);
}
/** Returns whether `fieldId` refers to a boolean switch field. */
export function WorktreeStackKit_isInkSwitchBooleanField(fieldId) {
    return WORKTREE_STACK_KIT_INK_SWITCH_FIELDS.some((field) => field.id === fieldId && field.kind === "boolean");
}
//# sourceMappingURL=ink-create-model.js.map