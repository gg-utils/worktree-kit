/**
 * @fileoverview Package-owned Ink renderer for worktree action option panels.
 *
 * This component is product-neutral terminal UI: it renders reusable worktree action toggles and
 * selectors from action definitions and option state, while root script adapters still own launch,
 * inventory loading, subprocess execution, and project-specific command construction.
 *
 * @testing Package: `npm run worktree-kit:test`.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Defines WorktreeStackKit_InkUiActionDefinition and WorktreeStackKit_InkUiActionOptionState contracts whose fields this panel renders as Ink toggles and selectors.
 * @see packages/worktree-kit/src/ink-shell.tsx - Interactive Ink shell that mounts this panel beside the plan preview so operators can flip action-scoped options while navigating the stack UI.
 * @see packages/worktree-kit/src/ink-action-options-panel.unit.test.ts - Node test runner coverage that invokes the panel with representative actionDefinition ids and asserts React.isValidElement on returned trees.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import React from "react";
import { Box, Text } from "ink";
import type {
  WorktreeStackKit_InkUiActionDefinition,
  WorktreeStackKit_InkUiActionOptionState,
} from "./ink-ui-contracts.js";

/** Color tone semantics for worktree Ink option badges. */
type WorktreeStackKit_InkActionOptionsTone =
  | "ready"
  | "blocked"
  | "staged"
  | "editing"
  | "warning"
  | "destructive"
  | "info"
  | "muted";

/** A single value/label choice displayed by the option selector primitive. */
type WorktreeStackKit_InkActionOptionsChoice = {
  readonly label: string;
  readonly value: string;
};

/** Maps package-owned option tones to Ink color tokens. */
function WorktreeStackKit_getInkActionOptionsToneColor(
  tone: WorktreeStackKit_InkActionOptionsTone,
): "green" | "yellow" | "red" | "cyan" | "gray" {
  switch (tone) {
    case "ready":
      return "green";
    case "blocked":
    case "warning":
      return "yellow";
    case "staged":
    case "editing":
    case "info":
      return "cyan";
    case "destructive":
      return "red";
    case "muted":
      return "gray";
  }
}

/** Renders a compact tone-colored option badge. */
function WorktreeStackKit_InkActionOptionsBadge({
  label,
  tone,
}: {
  label: string;
  tone: WorktreeStackKit_InkActionOptionsTone;
}): React.ReactNode {
  return (
    <Text color={WorktreeStackKit_getInkActionOptionsToneColor(tone)}>
      [{label}]
    </Text>
  );
}

/** Renders a boolean action option with active/inactive chips. */
function WorktreeStackKit_InkActionOptionToggle({
  label,
  shortcut,
  value,
  activeTone = "ready",
  inactiveTone = "muted",
}: {
  label: string;
  shortcut: string;
  value: boolean;
  activeTone?: WorktreeStackKit_InkActionOptionsTone;
  inactiveTone?: WorktreeStackKit_InkActionOptionsTone;
}): React.ReactNode {
  return (
    <Box>
      <Text>{label}: </Text>
      <WorktreeStackKit_InkActionOptionsBadge
        label="yes"
        tone={value ? activeTone : "muted"}
      />
      <Text color="gray"> / </Text>
      <WorktreeStackKit_InkActionOptionsBadge
        label="no"
        tone={value ? "muted" : inactiveTone}
      />
      <Text color="gray"> ({shortcut})</Text>
    </Box>
  );
}

/** Renders an enum-like action option with the active choice highlighted. */
function WorktreeStackKit_InkActionOptionSelector({
  label,
  shortcut,
  value,
  choices,
  activeTone = "ready",
}: {
  label: string;
  shortcut: string;
  value: string;
  choices: readonly WorktreeStackKit_InkActionOptionsChoice[];
  activeTone?: WorktreeStackKit_InkActionOptionsTone;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text>
        {label} <Text color="gray">({shortcut})</Text>
      </Text>
      <Box>
        {choices.map((choice, index) => (
          <React.Fragment key={choice.value}>
            {index > 0 ? <Text color="gray"> / </Text> : null}
            <WorktreeStackKit_InkActionOptionsBadge
              label={choice.label}
              tone={choice.value === value ? activeTone : "muted"}
            />
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Action-specific toggles and selectors shown beside the plan preview.
 */
export function WorktreeStackKit_InkActionOptionsPanel({
  actionDefinition,
  actionOptions,
  poolNextStackEditMode,
}: {
  actionDefinition: WorktreeStackKit_InkUiActionDefinition;
  actionOptions: WorktreeStackKit_InkUiActionOptionState;
  poolNextStackEditMode: boolean;
}): React.ReactNode {
  if (actionDefinition.id === "start") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionToggle
          label="Open in Windsurf after start"
          shortcut="space"
          value={actionOptions.openWindsurfOnStart}
        />
      </Box>
    );
  }

  if (actionDefinition.id === "destroy") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionToggle
          label="Run git prune after delete"
          shortcut="space"
          value={actionOptions.pruneAfterDestroy}
        />
      </Box>
    );
  }

  if (actionDefinition.id === "update-from-main") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionSelector
          label="Mode"
          shortcut="space"
          value={actionOptions.updateFromMainExecutionMode}
          choices={[
            { value: "plan", label: "Plan only" },
            { value: "push", label: "Push changes" },
          ]}
          activeTone={
            actionOptions.updateFromMainExecutionMode === "push"
              ? "warning"
              : "ready"
          }
        />
        <WorktreeStackKit_InkActionOptionSelector
          label="Target"
          shortcut="m"
          value={actionOptions.updateFromMainMode}
          choices={[
            { value: "live-worktree", label: "Live worktree" },
            { value: "temp-worktree", label: "New temp worktree" },
          ]}
          activeTone={
            actionOptions.updateFromMainMode === "live-worktree"
              ? "ready"
              : "warning"
          }
        />
      </Box>
    );
  }

  if (actionDefinition.id === "merge") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionSelector
          label="Mode"
          shortcut="space"
          value={actionOptions.mergeExecutionMode}
          choices={[
            { value: "plan", label: "Plan only" },
            { value: "push", label: "Push changes" },
          ]}
          activeTone={
            actionOptions.mergeExecutionMode === "push" ? "warning" : "ready"
          }
        />
      </Box>
    );
  }

  if (actionDefinition.id === "repair") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionToggle
          label="Dry run"
          shortcut="space"
          value={actionOptions.repairDryRun}
          activeTone="warning"
          inactiveTone="ready"
        />
        <WorktreeStackKit_InkActionOptionToggle
          label="Include package .env files"
          shortcut="i"
          value={actionOptions.repairIncludePackageEnv}
        />
        <WorktreeStackKit_InkActionOptionToggle
          label="Legacy .env mode"
          shortcut="l"
          value={actionOptions.repairLegacyPackageEnvAlias}
          activeTone="warning"
        />
        <WorktreeStackKit_InkActionOptionSelector
          label="Scope"
          shortcut="t"
          value={actionOptions.repairScope}
          choices={[
            { value: "selected-record", label: "Selected only" },
            { value: "all-prepared", label: "All worktrees" },
          ]}
          activeTone="info"
        />
      </Box>
    );
  }

  if (actionDefinition.id === "sync-local-files") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionSelector
          label="Scope"
          shortcut="t"
          value={actionOptions.syncScope}
          choices={[
            { value: "selected-record", label: "Selected + root" },
            { value: "all-discovered", label: "All worktrees" },
          ]}
          activeTone="info"
        />
        <Text color="gray">Source: discovery project root</Text>
      </Box>
    );
  }

  if (actionDefinition.id === "platform-bootstrap") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Notes</Text>
        <Text color="gray">
          Runs npm run platform:install (takes several minutes)
        </Text>
      </Box>
    );
  }

  if (actionDefinition.id === "realm-pool-next") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Stack Name</Text>
        <Text>
          Value:{" "}
          <Text color={poolNextStackEditMode ? "yellow" : "cyan"}>
            {actionOptions.poolNextStackName.length > 0
              ? actionOptions.poolNextStackName
              : "(empty)"}
          </Text>
        </Text>
        <Text color="gray">
          {poolNextStackEditMode
            ? "Type to edit, Backspace to delete, Enter when done"
            : "Press E to edit the stack name"}
        </Text>
      </Box>
    );
  }

  if (actionDefinition.id === "checkout-state-check") {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Options</Text>
        <WorktreeStackKit_InkActionOptionToggle
          label="Refresh origin refs first"
          shortcut="space"
          value={actionOptions.stateCheckFetch}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>Options</Text>
      <Text color="gray">No additional options</Text>
    </Box>
  );
}
