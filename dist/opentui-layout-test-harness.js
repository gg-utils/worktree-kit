import { jsx as _jsx, jsxs as _jsxs } from "@opentui/react/jsx-runtime";
import { useState } from "react";
import { WorktreeStackKit_OpenTuiAutoFocusTabSelect } from "./opentui-auto-focus-tab-select.js";
const WORKTREE_STACK_KIT_OPEN_TUI_LAYOUT_OPTIONS = [
    { description: "First worktree", name: "Worktree A", value: "worktree-a" },
    { description: "Second worktree", name: "Worktree B", value: "worktree-b" },
];
/** Root harness component for manual OpenTUI split-panel layout verification. */
export function WorktreeStackKit_OpenTuiLayoutTestHarnessApp(props) {
    const [selected, setSelected] = useState("");
    if (props.showWorktreesHeading) {
        return (_jsxs("box", { style: { flexDirection: "row", flexGrow: 1, padding: 1 }, children: [_jsxs("box", { style: { width: 30, padding: 1, flexDirection: "column" }, children: [_jsx("text", { children: "Worktrees" }), _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { options: WORKTREE_STACK_KIT_OPEN_TUI_LAYOUT_OPTIONS, onSelect: (_index, option) => {
                                setSelected(option ? `${option.name} submitted` : "");
                            } })] }), _jsxs("box", { style: { flexGrow: 1, padding: 1, flexDirection: "column" }, children: [_jsx("text", { children: "Detail Panel" }), _jsxs("text", { children: ["Selection: ", selected] })] })] }));
    }
    return (_jsxs("box", { style: { flexDirection: "row", flexGrow: 1, height: "100%" }, children: [_jsx("box", { style: { width: 30, padding: 1 }, children: _jsx(WorktreeStackKit_OpenTuiAutoFocusTabSelect, { options: WORKTREE_STACK_KIT_OPEN_TUI_LAYOUT_OPTIONS, onSelect: (_index, option) => {
                        setSelected(option ? `${option.name} submitted` : "");
                    } }) }), _jsxs("box", { style: { flexGrow: 1, padding: 1 }, children: [_jsx("text", { children: "Detail Panel" }), _jsxs("text", { children: ["Selection: ", selected] })] })] }));
}
/** Boots the layout smoke harness using a host-owned OpenTUI renderer factory. */
export async function WorktreeStackKit_runOpenTuiLayoutTestHarness(options) {
    const renderer = await options.createRenderer();
    const { createRoot } = await import("@opentui/react");
    createRoot(renderer).render(_jsx(WorktreeStackKit_OpenTuiLayoutTestHarnessApp, { showWorktreesHeading: options.showWorktreesHeading }));
}
//# sourceMappingURL=opentui-layout-test-harness.js.map