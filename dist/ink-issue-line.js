import { jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Package-owned Ink renderer for worktree inventory and action-plan issue lines.
 *
 * The renderer maps product-neutral issue severities onto terminal colors without importing root
 * script helpers, letting script-side shells compose package-owned issue rows directly.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see packages/worktree-kit/src/ink-ui-contracts.ts - Defines WorktreeStackKit_InkUiIssue severities and messages that this renderer maps to Ink Text colors.
 * @see packages/worktree-kit/src/ink-fullscreen-screens.tsx - Fullscreen Ink panels that compose WorktreeStackKit_renderInkIssueLine into inventory and plan issue lists.
 * @see packages/worktree-kit/src/ink-issue-line.unit.test.ts - Node test runner coverage asserting severity-to-color branches for the exported renderer.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import React from "react";
import { Text } from "ink";
/** Render a single inventory or plan issue as colored Ink text. */
export function WorktreeStackKit_renderInkIssueLine(issue) {
    const color = issue.severity === "error"
        ? "red"
        : issue.severity === "warning"
            ? "yellow"
            : "gray";
    return (_jsxs(Text, { color: color, children: ["- ", issue.message] }, `${issue.code}:${issue.message}`));
}
