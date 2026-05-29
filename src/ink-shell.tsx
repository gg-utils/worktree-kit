/**
 * @fileoverview Package-owned Ink shell renderer for worktree inventory, action overview, and inline editors.
 *
 * Root adapters provide project action catalogs, create-resolution config, inventory loading, and
 * subprocess side effects. This package renderer owns the reusable React/Ink shell layout and keeps
 * script folders focused on configuration/adapters.
 *
 * @testing Node.js test runner: npm run worktree-kit:test from the repository root; that script runs tsx --test over packages/worktree-kit/src, matching every path ending in .unit.test.ts under src, including src/ink-shell.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-app.tsx - Ink app controller that mounts this shell renderer inside reducer-driven session, keyboard routing, and fullscreen handoffs for worktree-stack CLIs.
 * @see packages/worktree-kit/src/ink-shell-view-model.ts - Pure view-model builders supplying header summaries, record rows, legend lines, overview stats, and combined issue rows consumed by this layout.
 * @see packages/worktree-kit/src/ink-shell.unit.test.ts - Node test module asserting bound-shell factory wiring and React element-shape coverage for exports owned by this renderer.
 * @see scripts/worktree-stack/ui/cli-ink/cli-ink-app-shell-views.tsx - Worktree-stack CLI Ink views that import the published `@gg-utils/worktree-kit/ink-shell` entrypoint alongside other shell slices.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import React, { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import {
  WorktreeStackKit_buildInkShellActionListModel,
  WorktreeStackKit_buildInkShellCombinedIssuesModel,
  WorktreeStackKit_buildInkShellDetailModel,
  WorktreeStackKit_buildInkShellHeaderSummary,
  WorktreeStackKit_buildInkShellLegendLines,
  WorktreeStackKit_buildInkShellOverviewModel,
  WorktreeStackKit_buildInkShellRecordRows,
  WorktreeStackKit_getInkShellSelectedRecord,
} from "./ink-shell-view-model.js";
import {
  WorktreeStackKit_buildInkFullscreenActionEditorModel,
  WorktreeStackKit_buildInkFullscreenCreateEditorModel,
} from "./ink-fullscreen-view-model.js";
import { WorktreeStackKit_InkActionOptionsPanel } from "./ink-action-options-panel.js";
import { WorktreeStackKit_renderInkIssueLine } from "./ink-issue-line.js";
import type { WorktreeStackKit_InkCreateResolutionConfig } from "./ink-create-resolution.js";
import type {
  WorktreeStackKit_InkUiActionDefinition,
  WorktreeStackKit_InkUiActionOptionState,
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiCreateDraft,
  WorktreeStackKit_InkUiCreateInteractionMode,
  WorktreeStackKit_InkUiCreateRegion,
  WorktreeStackKit_InkUiFocusedColumn,
  WorktreeStackKit_InkUiInventory,
  WorktreeStackKit_InkUiRecord,
} from "./ink-ui-contracts.js";

export { WorktreeStackKit_getInkShellSelectedRecord } from "./ink-shell-view-model.js";

/** Props required by the package-owned Ink shell renderer. */
export type WorktreeStackKit_InkShellProps = {
  inventory: WorktreeStackKit_InkUiInventory;
  selectedIndex: number;
  selectedActionIndex: number;
  focusedColumn: WorktreeStackKit_InkUiFocusedColumn;
  actionPlans: WorktreeStackKit_InkUiActionRequestPlan[];
  actionOptions: WorktreeStackKit_InkUiActionOptionState;
  poolNextStackEditMode: boolean;
  noticeMessage?: string | null;
  createDraft: WorktreeStackKit_InkUiCreateDraft;
  createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
  createRegion: WorktreeStackKit_InkUiCreateRegion;
  selectedCreateSectionIndex: number;
  selectedCreateFieldIndex: number;
  actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[];
  resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
  appName?: string;
  description?: string;
};

/** Props retained by shell adapters after action/config dependencies are bound once. */
export type WorktreeStackKit_BoundInkShellProps = Omit<
  WorktreeStackKit_InkShellProps,
  "actionDefinitions" | "resolutionConfig"
>;

/** Function component returned by the package-owned bound shell factory. */
export type WorktreeStackKit_BoundInkShellComponent = (
  props: WorktreeStackKit_BoundInkShellProps,
) => React.ReactNode;

/** Options for creating a project-configured Ink shell component. */
export type WorktreeStackKit_CreateBoundInkShellOptions = {
  readonly actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[];
  readonly resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
};

type WorktreeStackKit_InkShellTone =
  | "blocked"
  | "destructive"
  | "editing"
  | "info"
  | "muted"
  | "ready"
  | "warning";

/** Returns stdout dimensions for responsive package-owned Ink shell layouts. */
function WorktreeStackKit_useInkShellStdoutDimensions(): [number, number] {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState<[number, number]>([
    stdout.columns ?? 80,
    stdout.rows ?? 24,
  ]);

  useEffect(() => {
    const onResize = () => {
      setDimensions([stdout.columns ?? 80, stdout.rows ?? 24]);
    };
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return dimensions;
}

/** Maps shell badge tones to Ink colors. */
function WorktreeStackKit_getInkShellToneColor(
  tone: WorktreeStackKit_InkShellTone,
): "cyan" | "gray" | "green" | "red" | "yellow" {
  switch (tone) {
    case "ready":
      return "green";
    case "blocked":
    case "warning":
      return "yellow";
    case "editing":
    case "info":
      return "cyan";
    case "destructive":
      return "red";
    case "muted":
      return "gray";
  }
}

/** Renders a compact shell status badge. */
function InkStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: WorktreeStackKit_InkShellTone;
}): React.ReactNode {
  return (
    <Text color={WorktreeStackKit_getInkShellToneColor(tone)}>[{label}]</Text>
  );
}

/** Renders yes/no chips for create boolean fields. */
function InkBooleanChips({ value }: { value: boolean }): React.ReactNode {
  return (
    <Box>
      <InkStatusBadge label="yes" tone={value ? "ready" : "muted"} />
      <Text color="gray"> </Text>
      <InkStatusBadge label="no" tone={value ? "muted" : "warning"} />
    </Box>
  );
}

/** Renders a package-owned shell screen header. */
function InkScreenHeader({
  appName,
  description,
  notice,
  summary,
}: {
  appName: string;
  description?: string;
  notice?: string | null;
  summary?: React.ReactNode;
}): React.ReactNode {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">
        {appName}
      </Text>
      {description ? <Text color="gray">{description}</Text> : null}
      {summary ? <Box>{summary}</Box> : null}
      {notice ? <Text color="yellow">{notice}</Text> : null}
    </Box>
  );
}

/** Named shell panel with optional subtitle and badge. */
function InkPanel({
  title,
  subtitle,
  badgeLabel,
  badgeTone,
  children,
}: {
  title: string;
  subtitle?: string;
  badgeLabel?: string | null;
  badgeTone?: WorktreeStackKit_InkShellTone;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>{title}</Text>
        {badgeLabel && badgeTone ? (
          <>
            <Text> </Text>
            <InkStatusBadge label={badgeLabel} tone={badgeTone} />
          </>
        ) : null}
      </Box>
      {subtitle ? <Text color="gray">{subtitle}</Text> : null}
      {children}
    </Box>
  );
}

/** A titled section inside a shell panel. */
function InkPanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <Box marginTop={1} flexDirection="column">
      <Text bold>{title}</Text>
      {children}
    </Box>
  );
}

/** Renders a command preview block. */
function InkCommandPreview({
  commandLine,
}: {
  commandLine: string;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text bold>Command</Text>
      <Text wrap="wrap">{commandLine}</Text>
    </Box>
  );
}

/** Renders keyboard shortcut legend lines. */
function InkLegend({
  lines,
  title = "Keys",
}: {
  lines: readonly string[];
  title?: string | null;
}): React.ReactNode {
  return (
    <Box marginTop={1} flexDirection="column" gap={0}>
      {title ? (
        <Box marginBottom={1}>
          <Text bold>{title}</Text>
        </Box>
      ) : null}
      {lines.map((line, lineIndex) => {
        const hasPrefix = line.startsWith("Keys: ");
        const cleanLine = hasPrefix ? line.slice(6).trim() : line.trim();

        if (!cleanLine.includes(" | ") && !hasPrefix) {
          return (
            <Text key={lineIndex} color="gray">
              {line}
            </Text>
          );
        }

        const segments = cleanLine.split(" | ");
        return (
          <Box flexDirection="row" flexWrap="wrap" key={lineIndex}>
            {segments.map((segment, segmentIndex) => {
              const trimmed = segment.trim();
              if (!trimmed) {
                return null;
              }
              const firstSpace = trimmed.indexOf(" ");
              const keyCombo =
                firstSpace > -1 ? trimmed.slice(0, firstSpace) : trimmed;
              const description =
                firstSpace > -1 ? trimmed.slice(firstSpace + 1) : "";

              return (
                <Box key={segmentIndex} marginBottom={1} marginRight={3}>
                  <Text color="black" backgroundColor="white" bold>
                    {` ${keyCombo} `}
                  </Text>
                  {description ? (
                    <Text color="gray"> {description}</Text>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Resolve the selected worktree record from a numeric list index.
 */
export function WorktreeStackKit_getInkShellSelectedRecordFromInventory(
  inventory: WorktreeStackKit_InkUiInventory,
  selectedIndex: number,
): WorktreeStackKit_InkUiRecord | null {
  return WorktreeStackKit_getInkShellSelectedRecord({
    records: inventory.records,
    selectedIndex,
  });
}

/**
 * Shell header with optional notice and inventory summary counts.
 */
function Header({
  inventory,
  noticeMessage,
  appName,
  description,
}: {
  inventory: WorktreeStackKit_InkUiInventory;
  noticeMessage: string | null;
  appName: string;
  description: string;
}): React.ReactNode {
  return (
    <InkScreenHeader
      appName={appName}
      description={description}
      notice={noticeMessage}
      summary={
        <Text>
          {WorktreeStackKit_buildInkShellHeaderSummary({
            summary: inventory.summary,
          })}
        </Text>
      }
    />
  );
}

/**
 * Left-column worktree table with per-record status and branch labels.
 */
function RecordList({
  inventory,
  selectedIndex,
}: {
  inventory: WorktreeStackKit_InkUiInventory;
  selectedIndex: number;
}): React.ReactNode {
  const rows = WorktreeStackKit_buildInkShellRecordRows({
    records: inventory.records,
    selectedIndex,
  });

  return (
    <InkPanel title="Worktrees" subtitle="Select a worktree to manage">
      <Box
        flexDirection="row"
        borderBottom={false}
        paddingBottom={1}
        paddingLeft={2}
      >
        <Box width="40%">
          <Text bold color="cyan">
            Name
          </Text>
        </Box>
        <Box width="20%">
          <Text bold color="cyan">
            Status
          </Text>
        </Box>
        <Box width="40%">
          <Text bold color="cyan">
            Branch
          </Text>
        </Box>
      </Box>
      {rows.length > 0 ? (
        rows.map((row) => (
          <Box flexDirection="row" key={row.key} paddingBottom={0}>
            <Box width="40%">
              <Text color={row.labelTone ?? undefined} wrap="truncate-end">
                {row.marker}
                {row.label}
              </Text>
            </Box>
            <Box width="20%">
              <Text color={row.statusTone} wrap="truncate-end">
                {row.statusLabel}
              </Text>
            </Box>
            <Box width="40%">
              <Text
                dimColor={row.dimBranch}
                color={row.branchTone ?? undefined}
                wrap="truncate-end"
              >
                {row.branchLabel}
              </Text>
            </Box>
          </Box>
        ))
      ) : (
        <Text color="yellow">No git worktrees were discovered.</Text>
      )}
    </InkPanel>
  );
}

/**
 * Embedded action picker with readiness badges for the overview column.
 */
function ActionList({
  actionDefinitions,
  actionPlans,
  selectedActionIndex,
}: {
  actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[];
  actionPlans: WorktreeStackKit_InkUiActionRequestPlan[];
  selectedActionIndex: number;
}): React.ReactNode {
  const actionListModel = WorktreeStackKit_buildInkShellActionListModel({
    actionDefinitions,
    actionPlans,
    selectedActionIndex,
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>Actions</Text>
      <Box>
        <Text color={actionListModel.detailSelected ? "cyan" : undefined}>
          {actionListModel.detailSelected ? ">" : " "} Detail
        </Text>
      </Box>
      {actionListModel.rows.map((row) => (
        <Box key={row.key}>
          <Text color={row.selected ? "cyan" : undefined}>
            {row.marker} {row.label}{" "}
          </Text>
          <InkStatusBadge label={row.statusLabel} tone={row.statusTone} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Right-column metadata for the selected worktree or an empty-state prompt.
 */
function DetailPanel({
  record,
}: {
  record: WorktreeStackKit_InkUiRecord | null;
}): React.ReactNode {
  const detailModel = WorktreeStackKit_buildInkShellDetailModel({ record });

  if (detailModel.empty) {
    return (
      <InkPanel title="Details">
        <Text color="yellow">{detailModel.prompt}</Text>
      </InkPanel>
    );
  }

  return (
    <InkPanel
      title="Details"
      badgeLabel={detailModel.badgeLabel}
      badgeTone={detailModel.badgeTone ?? undefined}
    >
      {detailModel.rows.map((row) => (
        <Text key={row.key}>{row.text}</Text>
      ))}
      <InkPanelSection title="Issues">
        {detailModel.issueRows.length > 0 ? (
          detailModel.issueRows.map((issue) => (
            <Text color={issue.tone} key={issue.key}>
              {issue.icon} {issue.message}
            </Text>
          ))
        ) : (
          <Text color="gray">{detailModel.noIssuesText}</Text>
        )}
      </InkPanelSection>
    </InkPanel>
  );
}

/**
 * Overview stats, global issues, and embedded action list for the shell column.
 */
function SummaryPanel({
  inventory,
  actionDefinitions,
  actionPlans,
  selectedActionIndex,
}: {
  inventory: WorktreeStackKit_InkUiInventory;
  actionDefinitions: readonly WorktreeStackKit_InkUiActionDefinition[];
  actionPlans: WorktreeStackKit_InkUiActionRequestPlan[];
  selectedActionIndex: number;
}): React.ReactNode {
  const overviewModel = WorktreeStackKit_buildInkShellOverviewModel({
    actionPlan: actionPlans[selectedActionIndex],
    inventory,
  });

  return (
    <InkPanel
      title="Overview"
      badgeLabel={overviewModel.badgeLabel}
      badgeTone={overviewModel.badgeTone ?? undefined}
    >
      {overviewModel.statLines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
      <InkPanelSection title="Issues">
        {overviewModel.globalIssueRows.length > 0 ? (
          overviewModel.globalIssueRows.map((issue) => (
            <Text color={issue.tone} key={issue.key}>
              {issue.icon} {issue.message}
            </Text>
          ))
        ) : (
          <Text color="gray">{overviewModel.noGlobalIssuesText}</Text>
        )}
      </InkPanelSection>
      <InkPanelSection title="Getting Started">
        {overviewModel.gettingStartedLines.map((line) => (
          <Text color="gray" key={line}>
            {line}
          </Text>
        ))}
      </InkPanelSection>
      <ActionList
        actionDefinitions={actionDefinitions}
        actionPlans={actionPlans}
        selectedActionIndex={selectedActionIndex}
      />
    </InkPanel>
  );
}

/**
 * Deep preview of the selected action plan, issues, toggles, and CLI preview.
 */
function ActionPreviewPanel({
  actionDefinition,
  actionPlan,
  actionOptions,
  poolNextStackEditMode,
  selectedRecord,
}: {
  actionDefinition: WorktreeStackKit_InkUiActionDefinition;
  actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  actionOptions: WorktreeStackKit_InkUiActionOptionState;
  poolNextStackEditMode: boolean;
  selectedRecord: WorktreeStackKit_InkUiRecord | null;
}): React.ReactNode {
  const actionPreviewModel =
    WorktreeStackKit_buildInkFullscreenActionEditorModel({
      actionDefinition,
      actionPlan,
    });

  return (
    <InkPanel
      title={actionDefinition.label}
      badgeLabel={actionPreviewModel.header.badgeLabel}
      badgeTone={actionPreviewModel.header.badgeTone}
    >
      <Text>{actionDefinition.description}</Text>
      <Text>
        Scope: <Text color="cyan">{actionDefinition.scope}</Text>
      </Text>
      {actionDefinition.scope === "record" && selectedRecord ? (
        <Text>Target: {selectedRecord.worktreePath}</Text>
      ) : null}
      <WorktreeStackKit_InkActionOptionsPanel
        actionDefinition={actionDefinition}
        actionOptions={actionOptions}
        poolNextStackEditMode={poolNextStackEditMode}
      />
      <InkPanelSection title="Plan Summary">
        {actionPreviewModel.summaryLines.length > 0 ? (
          actionPreviewModel.summaryLines.map((line) => (
            <Text key={line}>- {line}</Text>
          ))
        ) : (
          <Text color="gray">No plan summary lines.</Text>
        )}
      </InkPanelSection>
      <InkPanelSection title="Issues">
        {actionPreviewModel.preflightIssues.length > 0 ? (
          actionPreviewModel.preflightIssues.map(
            WorktreeStackKit_renderInkIssueLine,
          )
        ) : (
          <Text color="gray">{actionPreviewModel.noIssuesText}</Text>
        )}
      </InkPanelSection>
      {actionPlan.request ? (
        <InkPanelSection title="Command Preview">
          <InkCommandPreview commandLine={actionPreviewModel.commandPreview} />
        </InkPanelSection>
      ) : null}
    </InkPanel>
  );
}

/**
 * Combined global and selected-record issue panel for the records column.
 */
function CombinedIssuesPanel({
  inventory,
  selectedRecord,
}: {
  inventory: WorktreeStackKit_InkUiInventory;
  selectedRecord: WorktreeStackKit_InkUiRecord | null;
}): React.ReactNode {
  const issueModel = WorktreeStackKit_buildInkShellCombinedIssuesModel({
    globalIssues: inventory.globalIssues,
    selectedRecord,
  });

  if (!issueModel.visible) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      borderStyle="round"
      borderColor="red"
      paddingX={1}
    >
      <Text bold color="red">
        ⚠ Issues ({issueModel.count})
      </Text>
      {issueModel.rows.map((issue) => (
        <Text color={issue.tone} key={issue.key} wrap="truncate-end">
          {issue.icon} {issue.message}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Primary two-column Ink shell listing worktrees, actions, and contextual detail panels.
 */
export function WorktreeStackKit_InkShell({
  inventory,
  selectedIndex,
  selectedActionIndex,
  focusedColumn,
  actionPlans,
  actionOptions,
  poolNextStackEditMode,
  noticeMessage,
  createDraft,
  createInteractionMode,
  createRegion,
  selectedCreateSectionIndex,
  selectedCreateFieldIndex,
  actionDefinitions,
  resolutionConfig,
  appName = "Worktree Manager",
  description = "Manage git worktrees and local development environments",
}: WorktreeStackKit_InkShellProps): React.ReactNode {
  const [, rows] = WorktreeStackKit_useInkShellStdoutDimensions();
  const selectedRecord =
    WorktreeStackKit_getInkShellSelectedRecordFromInventory(
      inventory,
      selectedIndex,
    );
  const selectedAction =
    selectedActionIndex >= 0
      ? (actionDefinitions[selectedActionIndex] ?? null)
      : null;
  const selectedPlan =
    selectedActionIndex >= 0
      ? (actionPlans[selectedActionIndex] ?? null)
      : null;

  const isEditorFocused = focusedColumn === "editor";

  const legendLines = WorktreeStackKit_buildInkShellLegendLines({
    createInteractionMode,
    focusedColumn,
    selectedActionId: selectedAction?.id ?? null,
  });

  return (
    <Box flexDirection="column" minHeight={rows}>
      <Header
        inventory={inventory}
        noticeMessage={noticeMessage ?? null}
        appName={appName}
        description={description}
      />
      <Box flexGrow={1}>
        <Box
          width={46}
          flexDirection="column"
          borderStyle="round"
          borderColor={focusedColumn === "records" ? "cyan" : "gray"}
          paddingX={1}
        >
          <Text bold color={focusedColumn === "records" ? "cyan" : "gray"}>
            Worktrees {focusedColumn === "records" ? "◂" : ""}
          </Text>
          <RecordList inventory={inventory} selectedIndex={selectedIndex} />
          <CombinedIssuesPanel
            inventory={inventory}
            selectedRecord={selectedRecord}
          />
        </Box>
        <Box
          width={42}
          flexDirection="column"
          borderStyle="round"
          borderColor={focusedColumn === "actions" ? "cyan" : "gray"}
          paddingX={1}
        >
          <Text bold color={focusedColumn === "actions" ? "cyan" : "gray"}>
            Actions {focusedColumn === "actions" ? "▸" : ""}
          </Text>
          <SummaryPanel
            inventory={inventory}
            actionDefinitions={actionDefinitions}
            actionPlans={actionPlans}
            selectedActionIndex={selectedActionIndex}
          />
        </Box>
        <Box
          flexGrow={1}
          flexDirection="column"
          borderStyle="round"
          borderColor={isEditorFocused ? "cyan" : "gray"}
          paddingX={1}
        >
          {isEditorFocused && selectedAction && selectedPlan ? (
            <InlineActionEditor
              actionDefinition={selectedAction}
              actionPlan={selectedPlan}
              actionOptions={actionOptions}
              poolNextStackEditMode={poolNextStackEditMode}
              inventory={inventory}
              createDraft={createDraft}
              createInteractionMode={createInteractionMode}
              createRegion={createRegion}
              selectedCreateSectionIndex={selectedCreateSectionIndex}
              selectedCreateFieldIndex={selectedCreateFieldIndex}
              resolutionConfig={resolutionConfig}
            />
          ) : selectedAction && selectedPlan ? (
            <ActionPreviewPanel
              actionDefinition={selectedAction}
              actionPlan={selectedPlan}
              actionOptions={actionOptions}
              poolNextStackEditMode={poolNextStackEditMode}
              selectedRecord={selectedRecord}
            />
          ) : (
            <DetailPanel record={selectedRecord} />
          )}
        </Box>
      </Box>
      <InkLegend lines={legendLines} />
    </Box>
  );
}

/**
 * Creates a shell component with project action definitions and create-resolution config bound.
 */
export function WorktreeStackKit_createBoundInkShell({
  actionDefinitions,
  resolutionConfig,
}: WorktreeStackKit_CreateBoundInkShellOptions): WorktreeStackKit_BoundInkShellComponent {
  return function WorktreeStackKit_BoundInkShell(
    props: WorktreeStackKit_BoundInkShellProps,
  ): React.ReactNode {
    return (
      <WorktreeStackKit_InkShell
        {...props}
        actionDefinitions={actionDefinitions}
        resolutionConfig={resolutionConfig}
      />
    );
  };
}

/**
 * Full-height create wizard or generic option editor in the shell editor column.
 */
function InlineActionEditor({
  actionDefinition,
  actionPlan,
  actionOptions,
  poolNextStackEditMode,
  inventory,
  createDraft,
  createInteractionMode,
  createRegion,
  selectedCreateSectionIndex,
  selectedCreateFieldIndex,
  resolutionConfig,
}: {
  actionDefinition: WorktreeStackKit_InkUiActionDefinition;
  actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  actionOptions: WorktreeStackKit_InkUiActionOptionState;
  poolNextStackEditMode: boolean;
  inventory: WorktreeStackKit_InkUiInventory;
  createDraft: WorktreeStackKit_InkUiCreateDraft;
  createInteractionMode: WorktreeStackKit_InkUiCreateInteractionMode;
  createRegion: WorktreeStackKit_InkUiCreateRegion;
  selectedCreateSectionIndex: number;
  selectedCreateFieldIndex: number;
  resolutionConfig: WorktreeStackKit_InkCreateResolutionConfig;
}): React.ReactNode {
  if (actionDefinition.id === "create") {
    const createModel = WorktreeStackKit_buildInkFullscreenCreateEditorModel({
      actionPlan,
      createDraft,
      createInteractionMode,
      createRegion,
      inventory,
      resolutionConfig,
      selectedCreateFieldIndex,
      selectedCreateSectionIndex,
    });

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Create worktree{" "}
          <InkStatusBadge
            label={createModel.header.badgeLabel}
            tone={createModel.header.badgeTone}
          />
        </Text>
        <Box flexDirection="column" marginTop={1}>
          <Text bold color={createRegion === "sections" ? "cyan" : "gray"}>
            Sections
          </Text>
          {createModel.sectionRows.map((section) => (
            <Text key={section.id} color={section.tone ?? undefined}>
              {section.marker} {section.label}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text bold color={createRegion === "fields" ? "cyan" : "gray"}>
            Fields
          </Text>
          {createModel.fieldRows.map((field) => (
            <Box key={field.id}>
              <Text color={field.tone ?? undefined}>
                {field.marker} {field.label}:{" "}
                {!field.isBoolean
                  ? field.displayValue.length > 0
                    ? field.displayValue
                    : "(empty)"
                  : ""}
              </Text>
              {field.isBoolean ? (
                <InkBooleanChips value={field.booleanValue ?? false} />
              ) : null}
              {field.editing ? (
                <>
                  <Text> </Text>
                  <InkStatusBadge label="editing" tone="editing" />
                </>
              ) : null}
            </Box>
          ))}
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text bold color={createRegion === "preview" ? "cyan" : "gray"}>
            Preview{" "}
            <InkStatusBadge
              label={createModel.previewBadgeLabel}
              tone={createModel.previewBadgeTone}
            />
          </Text>
          {createModel.previewRows.map((row) => (
            <Text key={row.key}>
              {row.label}: {row.value}
            </Text>
          ))}
        </Box>
        {actionPlan.request ? (
          <InkPanelSection title="Command Preview">
            <InkCommandPreview commandLine={createModel.commandPreview} />
          </InkPanelSection>
        ) : null}
      </Box>
    );
  }

  // Generic action editor (non-create)
  const actionEditorModel =
    WorktreeStackKit_buildInkFullscreenActionEditorModel({
      actionDefinition,
      actionPlan,
    });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {actionDefinition.label}{" "}
        <InkStatusBadge
          label={actionEditorModel.header.badgeLabel}
          tone={actionEditorModel.header.badgeTone}
        />
      </Text>
      <InkPanelSection title="Target">
        <Text>{actionEditorModel.targetText}</Text>
      </InkPanelSection>
      <WorktreeStackKit_InkActionOptionsPanel
        actionDefinition={actionDefinition}
        actionOptions={actionOptions}
        poolNextStackEditMode={poolNextStackEditMode}
      />
      {actionPlan.request ? (
        <InkPanelSection title="Command Preview">
          <InkCommandPreview commandLine={actionEditorModel.commandPreview} />
        </InkPanelSection>
      ) : null}
      <InkPanelSection title="Preflight Notes">
        {actionEditorModel.summaryLines.map((line) => (
          <Text key={line}>- {line}</Text>
        ))}
        {actionEditorModel.preflightIssues.length > 0 ? (
          actionEditorModel.preflightIssues.map(
            WorktreeStackKit_renderInkIssueLine,
          )
        ) : (
          <Text color="gray">{actionEditorModel.noIssuesText}</Text>
        )}
      </InkPanelSection>
    </Box>
  );
}
