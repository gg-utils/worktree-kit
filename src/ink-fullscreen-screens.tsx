/**
 * @fileoverview Package-owned Ink full-screen renderers for worktree review/session/result flows.
 *
 * The screens compose package-owned full-screen view models, issue rendering, status badges, command
 * previews, output capture blocks, and terminal sizing. Root launchers still own inventory loading,
 * reducer wiring, config loading, and subprocess side effects.
 *
 * @testing Node test: npm run worktree-kit:test from the repository root runs packages/worktree-kit unit tests including ink-fullscreen-screens.unit.test.ts.
 *
 * @see packages/worktree-kit/src/ink-fullscreen-view-model.ts - View-model builders that normalize headers, legends, command previews, and section copy these Ink screens render.
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Action plan, session line, and result model contracts passed into the exported review, session, and result screen components.
 * @see packages/worktree-kit/src/ink-issue-line.tsx - Issue-line renderer embedded in the review and result issue panels owned by this module.
 * @see packages/worktree-kit/src/ink-display-view-model.ts - Session output color mapping applied when rendering captured lines inside session and result output blocks here.
 * @see packages/worktree-kit/src/ink-fullscreen-screens.unit.test.ts - Node:test coverage that imports these screens and asserts stable element wiring against fixture contracts.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import React, { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import {
  WorktreeStackKit_buildInkFullscreenResultModel,
  WorktreeStackKit_buildInkFullscreenReviewModel,
  WorktreeStackKit_buildInkFullscreenSessionModel,
  type WorktreeStackKit_InkFullscreenBadgeTone,
} from "./ink-fullscreen-view-model.js";
import { WorktreeStackKit_getInkSessionOutputColor } from "./ink-display-view-model.js";
import { WorktreeStackKit_renderInkIssueLine } from "./ink-issue-line.js";
import type {
  WorktreeStackKit_InkUiActionRequestPlan,
  WorktreeStackKit_InkUiResultModel,
  WorktreeStackKit_InkUiSessionLine,
  WorktreeStackKit_InkUiSessionModel,
} from "./ink-ui-contracts.js";

/** Returns stdout dimensions for responsive package-owned Ink layouts. */
function WorktreeStackKit_useInkStdoutDimensions(): [number, number] {
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

/** Maps badge tones emitted by full-screen view models to Ink colors. */
function WorktreeStackKit_getInkFullscreenBadgeColor(
  tone: WorktreeStackKit_InkFullscreenBadgeTone,
): "green" | "yellow" | "red" | "cyan" | "gray" {
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
  }
}

/** Renders a compact tone-colored badge. */
function WorktreeStackKit_InkFullscreenStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: WorktreeStackKit_InkFullscreenBadgeTone;
}): React.ReactNode {
  return (
    <Text color={WorktreeStackKit_getInkFullscreenBadgeColor(tone)}>
      [{label}]
    </Text>
  );
}

/** Top-of-screen package-owned header for worktree Ink full-screen flows. */
function WorktreeStackKit_InkFullscreenHeader({
  appName,
  title,
  description,
  summary,
  badgeLabel,
  badgeTone,
}: {
  appName: string;
  title?: string;
  description?: string;
  summary?: React.ReactNode;
  badgeLabel?: string | null;
  badgeTone?: WorktreeStackKit_InkFullscreenBadgeTone;
}): React.ReactNode {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="green">
        {appName}
      </Text>
      {title || badgeLabel ? (
        <Box>
          {title ? <Text bold>{title}</Text> : null}
          {title && badgeLabel ? <Text> </Text> : null}
          {badgeLabel && badgeTone ? (
            <WorktreeStackKit_InkFullscreenStatusBadge
              label={badgeLabel}
              tone={badgeTone}
            />
          ) : null}
        </Box>
      ) : null}
      {description ? <Text color="gray">{description}</Text> : null}
      {summary ? <Box>{summary}</Box> : null}
    </Box>
  );
}

/** A titled section inside a full-screen flow. */
function WorktreeStackKit_InkFullscreenPanelSection({
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

/** Renders a titled command preview block. */
function WorktreeStackKit_InkFullscreenCommandPreview({
  commandLine,
  title = "Command",
}: {
  commandLine: string;
  title?: string;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Text wrap="wrap">{commandLine}</Text>
    </Box>
  );
}

/** Renders keyboard shortcut legend lines. */
function WorktreeStackKit_InkFullscreenLegend({
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

/** Returns the last `count` items from a readonly line collection. */
function WorktreeStackKit_sliceRecentInkOutputLines<T>(
  lines: readonly T[],
  count: number,
): T[] {
  if (lines.length <= count) {
    return [...lines];
  }

  return lines.slice(lines.length - count);
}

/** Renders recent process output with optional source prefixes. */
function WorktreeStackKit_InkFullscreenCapturedOutputBlock({
  lines,
  maxLines,
  bracketSource = false,
}: {
  lines: readonly WorktreeStackKit_InkUiSessionLine[];
  maxLines: number;
  bracketSource?: boolean;
}): React.ReactNode {
  const recent = WorktreeStackKit_sliceRecentInkOutputLines(lines, maxLines);

  return (
    <Box flexDirection="column">
      {recent.map((line, index) => (
        <Text
          color={WorktreeStackKit_getInkSessionOutputColor(line.source)}
          key={`${line.source}:${String(index)}`}
        >
          {bracketSource ? `[${line.source}] ${line.text}` : line.text}
        </Text>
      ))}
    </Box>
  );
}

/** Typed confirmation gate before spawning runtime or task sessions. */
export function WorktreeStackKit_InkReviewScreen({
  actionPlan,
  reviewConfirmationInput,
}: {
  actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  reviewConfirmationInput: string;
}): React.ReactNode {
  const reviewModel = WorktreeStackKit_buildInkFullscreenReviewModel({
    actionPlan,
    reviewConfirmationInput,
  });
  const [, rows] = WorktreeStackKit_useInkStdoutDimensions();

  return (
    <Box flexDirection="column" minHeight={rows}>
      <Box flexGrow={1} flexDirection="column">
        <WorktreeStackKit_InkFullscreenHeader
          appName="Worktree Ink"
          title={reviewModel.header.title}
          badgeLabel={reviewModel.header.badgeLabel}
          badgeTone={reviewModel.header.badgeTone}
        />
        <WorktreeStackKit_InkFullscreenPanelSection title="Command">
          <WorktreeStackKit_InkFullscreenCommandPreview
            commandLine={reviewModel.commandPreview}
          />
        </WorktreeStackKit_InkFullscreenPanelSection>
        <WorktreeStackKit_InkFullscreenPanelSection title="Plan">
          {reviewModel.summaryLines.map((line) => (
            <Text key={line}>- {line}</Text>
          ))}
        </WorktreeStackKit_InkFullscreenPanelSection>
        <WorktreeStackKit_InkFullscreenPanelSection title="Issues">
          {reviewModel.reviewIssues.length > 0 ? (
            reviewModel.reviewIssues.map(WorktreeStackKit_renderInkIssueLine)
          ) : (
            <Text color="gray">{reviewModel.noIssuesText}</Text>
          )}
        </WorktreeStackKit_InkFullscreenPanelSection>
        {reviewModel.destructiveConfirmationText ? (
          <WorktreeStackKit_InkFullscreenPanelSection title="Destructive note">
            <Text>{reviewModel.destructiveConfirmationText}</Text>
          </WorktreeStackKit_InkFullscreenPanelSection>
        ) : null}
        {reviewModel.retainedArtifacts.length > 0 ? (
          <WorktreeStackKit_InkFullscreenPanelSection title="Retained Artifacts">
            {reviewModel.retainedArtifacts.map((artifact) => (
              <Text key={artifact.id}>
                - {artifact.label}: {artifact.path}
              </Text>
            ))}
          </WorktreeStackKit_InkFullscreenPanelSection>
        ) : null}
        {reviewModel.requiredConfirmationToken ? (
          <WorktreeStackKit_InkFullscreenPanelSection title="Confirmation">
            <Text>
              Type `{reviewModel.requiredConfirmationToken}` to unlock execution
              for this action.
            </Text>
            <Text>
              Current input:{" "}
              <Text color={reviewModel.currentInputTone}>
                {reviewModel.currentInputDisplay}
              </Text>
            </Text>
          </WorktreeStackKit_InkFullscreenPanelSection>
        ) : null}
      </Box>
      <WorktreeStackKit_InkFullscreenLegend lines={reviewModel.legendLines} />
    </Box>
  );
}

/** Live child-process output with cancellable session affordances. */
export function WorktreeStackKit_InkSessionScreen({
  actionPlan,
  lines,
  sessionStatus,
  startedAt,
}: {
  actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  lines: readonly WorktreeStackKit_InkUiSessionLine[];
  sessionStatus: WorktreeStackKit_InkUiSessionModel["status"];
  startedAt: string | null;
}): React.ReactNode {
  const sessionModel = WorktreeStackKit_buildInkFullscreenSessionModel({
    actionPlan,
    lines,
    sessionStatus,
    startedAt,
  });
  const [, rows] = WorktreeStackKit_useInkStdoutDimensions();

  return (
    <Box flexDirection="column" minHeight={rows}>
      <Box flexGrow={1} flexDirection="column">
        <WorktreeStackKit_InkFullscreenHeader
          appName="Worktree Ink"
          title={sessionModel.header.title}
          badgeLabel={sessionModel.header.badgeLabel}
          badgeTone={sessionModel.header.badgeTone}
          summary={<Text>{sessionModel.header.summaryText}</Text>}
        />
        <WorktreeStackKit_InkFullscreenPanelSection title="Command">
          <WorktreeStackKit_InkFullscreenCommandPreview
            commandLine={sessionModel.commandPreview}
          />
        </WorktreeStackKit_InkFullscreenPanelSection>
        <WorktreeStackKit_InkFullscreenPanelSection title="Plan">
          {sessionModel.summaryLines.map((line) => (
            <Text key={line}>- {line}</Text>
          ))}
        </WorktreeStackKit_InkFullscreenPanelSection>
        {sessionModel.retainedArtifacts.length > 0 ? (
          <WorktreeStackKit_InkFullscreenPanelSection title="Retained Artifacts">
            {sessionModel.retainedArtifacts.map((artifact) => (
              <Text key={artifact.id}>
                - {artifact.label}: {artifact.path}
              </Text>
            ))}
          </WorktreeStackKit_InkFullscreenPanelSection>
        ) : null}
        <WorktreeStackKit_InkFullscreenPanelSection title="Recent Output">
          {sessionModel.outputLines.length > 0 ? (
            <WorktreeStackKit_InkFullscreenCapturedOutputBlock
              lines={sessionModel.outputLines}
              maxLines={sessionModel.outputMaxLines}
              bracketSource
            />
          ) : (
            <Text color="gray">{sessionModel.waitingOutputText}</Text>
          )}
        </WorktreeStackKit_InkFullscreenPanelSection>
      </Box>
      <WorktreeStackKit_InkFullscreenLegend lines={sessionModel.legendLines} />
    </Box>
  );
}

/** Post-run diagnostics including optional create-resolution handoff UI. */
export function WorktreeStackKit_InkResultScreen({
  actionPlan,
  result,
}: {
  actionPlan: WorktreeStackKit_InkUiActionRequestPlan;
  result: WorktreeStackKit_InkUiResultModel;
}): React.ReactNode {
  const resultModel = WorktreeStackKit_buildInkFullscreenResultModel({
    actionPlan,
    result,
  });
  const [, rows] = WorktreeStackKit_useInkStdoutDimensions();

  return (
    <Box flexDirection="column" minHeight={rows}>
      <Box flexGrow={1} flexDirection="column">
        <WorktreeStackKit_InkFullscreenHeader
          appName="Worktree Ink"
          title={resultModel.header.title}
          badgeLabel={resultModel.header.badgeLabel}
          badgeTone={resultModel.header.badgeTone}
        />
        <Text>{resultModel.message}</Text>
        <WorktreeStackKit_InkFullscreenPanelSection title="Command">
          <WorktreeStackKit_InkFullscreenCommandPreview
            commandLine={resultModel.commandPreview}
          />
        </WorktreeStackKit_InkFullscreenPanelSection>
        <WorktreeStackKit_InkFullscreenPanelSection title="Plan">
          {resultModel.summaryLines.map((line) => (
            <Text key={line}>- {line}</Text>
          ))}
        </WorktreeStackKit_InkFullscreenPanelSection>
        <WorktreeStackKit_InkFullscreenPanelSection title="Issues">
          {resultModel.planningIssues.length > 0 ? (
            resultModel.planningIssues.map(WorktreeStackKit_renderInkIssueLine)
          ) : (
            <Text color="gray">{resultModel.noIssuesText}</Text>
          )}
        </WorktreeStackKit_InkFullscreenPanelSection>
        <WorktreeStackKit_InkFullscreenPanelSection title="Execution">
          {resultModel.executionRows.map((row) => (
            <Text key={row.key}>
              {row.label}: {row.value}
            </Text>
          ))}
        </WorktreeStackKit_InkFullscreenPanelSection>
        {resultModel.createHandoff ? (
          <WorktreeStackKit_InkFullscreenPanelSection title="Create Handoff">
            <WorktreeStackKit_InkFullscreenStatusBadge
              label={resultModel.createHandoff.status}
              tone={resultModel.createHandoff.statusTone}
            />
            <Text>{resultModel.createHandoff.requestedLine}</Text>
            <Text>
              Predicted path: {resultModel.createHandoff.predictedWorktreePath}
            </Text>
            {resultModel.createHandoff.status === "resolved" ? (
              <>
                <Text>
                  Resolved worktree:{" "}
                  {resultModel.createHandoff.matchedWorktreePath ?? "(none)"}
                </Text>
                {resultModel.createHandoff.followUpStartPrompt ? (
                  <Text color="gray">
                    {resultModel.createHandoff.followUpStartPrompt}
                  </Text>
                ) : null}
              </>
            ) : null}
            {resultModel.createHandoff.status === "ambiguous" ? (
              <>
                <Text color="yellow">
                  {resultModel.createHandoff.ambiguousWarningText}
                </Text>
                {resultModel.createHandoff.candidatePaths.map((path) => (
                  <Text key={path}>- Candidate: {path}</Text>
                ))}
              </>
            ) : null}
            {resultModel.createHandoff.status === "not-found" ? (
              <>
                {resultModel.createHandoff.notFoundTextLines.map(
                  (line, index) => (
                    <Text color={index === 0 ? "yellow" : "gray"} key={line}>
                      {line}
                    </Text>
                  ),
                )}
              </>
            ) : null}
          </WorktreeStackKit_InkFullscreenPanelSection>
        ) : null}
        {resultModel.retainedArtifacts.length > 0 ? (
          <WorktreeStackKit_InkFullscreenPanelSection title="Retained Artifacts">
            {resultModel.retainedArtifacts.map((artifact) => (
              <Text key={artifact.id}>
                - {artifact.label}: {artifact.path}
              </Text>
            ))}
          </WorktreeStackKit_InkFullscreenPanelSection>
        ) : null}
        <WorktreeStackKit_InkFullscreenPanelSection title="Recent Output">
          {resultModel.outputLines.length > 0 ? (
            <WorktreeStackKit_InkFullscreenCapturedOutputBlock
              lines={resultModel.outputLines}
              maxLines={resultModel.outputMaxLines}
              bracketSource
            />
          ) : (
            <Text color="gray">
              No process output was captured for this result.
            </Text>
          )}
        </WorktreeStackKit_InkFullscreenPanelSection>
      </Box>
      <WorktreeStackKit_InkFullscreenLegend lines={resultModel.legendLines} />
    </Box>
  );
}
