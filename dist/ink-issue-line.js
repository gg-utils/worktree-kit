import { jsxs as _jsxs } from "react/jsx-runtime";
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
//# sourceMappingURL=ink-issue-line.js.map