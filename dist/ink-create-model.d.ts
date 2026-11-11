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
import type { WorktreeStackKit_InkCreateDraft } from "./ink-launch-options.js";
/** Field IDs for the create form. */
export type WorktreeStackKit_InkCreateFieldId = "branchPrefix" | "stackName" | "slotInput" | "baseBranch" | "rootBranch" | "submoduleBranch" | "worktreesBase" | "realmSlug" | "worktreePathOverride" | "metadataSource" | "copyEnvFromMain" | "runInstall" | "installSkipExisting" | "installPreferOnline" | "openWindsurf" | "followUpStart" | "followUpStartOpenWindsurf";
/** Section IDs for the create form. */
export type WorktreeStackKit_InkCreateSectionId = "identity" | "branches" | "provisioning" | "launch";
/** Metadata describing one editable create-form control in the Ink UI. */
export type WorktreeStackKit_InkCreateField = {
    readonly description: string;
    readonly id: WorktreeStackKit_InkCreateFieldId;
    readonly kind: "text" | "boolean";
    readonly label: string;
    readonly sectionId: WorktreeStackKit_InkCreateSectionId;
};
/** Grouping header for related create fields shown in the section navigator. */
export type WorktreeStackKit_InkCreateSection = {
    readonly description: string;
    readonly id: WorktreeStackKit_InkCreateSectionId;
    readonly label: string;
};
/** Field IDs for the switch form. */
export type WorktreeStackKit_InkSwitchFieldId = "branchPrefix" | "stackName" | "environmentFilter";
/** Section IDs for the switch form. */
export type WorktreeStackKit_InkSwitchSectionId = "identity" | "filter";
/** Draft fields for the worktree switch form. */
export type WorktreeStackKit_InkSwitchFormDraft = {
    readonly branchPrefix: string;
    readonly environmentFilter: string;
    readonly stackName: string;
};
/** Metadata for one switch-form control in the Ink UI. */
export type WorktreeStackKit_InkSwitchField = {
    readonly description: string;
    readonly id: WorktreeStackKit_InkSwitchFieldId;
    readonly kind: "text" | "boolean";
    readonly label: string;
    readonly sectionId: WorktreeStackKit_InkSwitchSectionId;
};
/** Section grouping for switch-form navigation. */
export type WorktreeStackKit_InkSwitchSection = {
    readonly description: string;
    readonly id: WorktreeStackKit_InkSwitchSectionId;
    readonly label: string;
};
/** Ordered Ink create wizard sections shown in the left column. */
export declare const WORKTREE_STACK_KIT_INK_CREATE_SECTIONS: readonly WorktreeStackKit_InkCreateSection[];
/** Flat field catalog driving prompts, validation, and argv translation for create. */
export declare const WORKTREE_STACK_KIT_INK_CREATE_FIELDS: readonly WorktreeStackKit_InkCreateField[];
/** Ordered switch wizard sections. */
export declare const WORKTREE_STACK_KIT_INK_SWITCH_SECTIONS: readonly WorktreeStackKit_InkSwitchSection[];
/** Flat catalog of switch fields used for prompts and argv translation. */
export declare const WORKTREE_STACK_KIT_INK_SWITCH_FIELDS: readonly WorktreeStackKit_InkSwitchField[];
/** Default create draft before user edits or argv hydration. */
export declare function WorktreeStackKit_createInitialInkCreateDraft(): WorktreeStackKit_InkCreateDraft;
/** Returns the create field definition at `index` or `null` when out of range. */
export declare function WorktreeStackKit_getInkCreateField(index: number): WorktreeStackKit_InkCreateField | null;
/** Index of `fieldId` inside `WORKTREE_STACK_KIT_INK_CREATE_FIELDS` (or `-1` when unknown). */
export declare function WorktreeStackKit_getInkCreateFieldIndex(fieldId: WorktreeStackKit_InkCreateFieldId): number;
/** Returns the create section definition at `index` or `null` when out of range. */
export declare function WorktreeStackKit_getInkCreateSection(index: number): WorktreeStackKit_InkCreateSection | null;
/** Index of `sectionId` inside `WORKTREE_STACK_KIT_INK_CREATE_SECTIONS` (or `-1`). */
export declare function WorktreeStackKit_getInkCreateSectionIndex(sectionId: WorktreeStackKit_InkCreateSectionId): number;
/** Resolves the parent section for a field id, or `null` when the field is missing. */
export declare function WorktreeStackKit_getInkCreateSectionForField(fieldId: WorktreeStackKit_InkCreateFieldId): WorktreeStackKit_InkCreateSection | null;
/** Lists all field definitions belonging to a section id. */
export declare function WorktreeStackKit_getInkCreateFieldsForSection(sectionId: WorktreeStackKit_InkCreateSectionId): readonly WorktreeStackKit_InkCreateField[];
/** Returns whether `fieldId` refers to a boolean toggle in the create form schema. */
export declare function WorktreeStackKit_isInkCreateBooleanField(fieldId: WorktreeStackKit_InkCreateFieldId): boolean;
/** Default switch draft prior to user edits. */
export declare function WorktreeStackKit_createInitialInkSwitchDraft(): WorktreeStackKit_InkSwitchFormDraft;
/** Returns the switch field at `index` or `null` when out of range. */
export declare function WorktreeStackKit_getInkSwitchField(index: number): WorktreeStackKit_InkSwitchField | null;
/** Index of `fieldId` inside `WORKTREE_STACK_KIT_INK_SWITCH_FIELDS` (or `-1`). */
export declare function WorktreeStackKit_getInkSwitchFieldIndex(fieldId: WorktreeStackKit_InkSwitchFieldId): number;
/** Returns the switch section at `index` or `null` when out of range. */
export declare function WorktreeStackKit_getInkSwitchSection(index: number): WorktreeStackKit_InkSwitchSection | null;
/** Index of `sectionId` inside `WORKTREE_STACK_KIT_INK_SWITCH_SECTIONS` (or `-1`). */
export declare function WorktreeStackKit_getInkSwitchSectionIndex(sectionId: WorktreeStackKit_InkSwitchSectionId): number;
/** Lists switch fields that belong to `sectionId`. */
export declare function WorktreeStackKit_getInkSwitchFieldsForSection(sectionId: WorktreeStackKit_InkSwitchSectionId): readonly WorktreeStackKit_InkSwitchField[];
/** Returns whether `fieldId` refers to a boolean switch field. */
export declare function WorktreeStackKit_isInkSwitchBooleanField(fieldId: WorktreeStackKit_InkSwitchFieldId): boolean;
