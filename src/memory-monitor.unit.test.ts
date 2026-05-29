/**
 * @fileoverview Node test coverage for package-owned worktree memory monitor parsing and rendering helpers.
 *
 * @testing Package: `npm run worktree-kit:test`.
 *
 * @see ./memory-monitor.ts - Module under test: argv parser, field helpers, and snapshot renderer.
 * @documentation reviewed=2026-04-12 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  memoryMonitorCommandIsCandidate,
  memoryMonitorRenderSnapshot,
  memoryMonitorSanitizeField,
  memoryMonitorTruncateField,
  WorktreeStackKit_parseMemoryMonitorArgsResult,
  type MemoryMonitor_CatalogEntry,
  type MemoryMonitor_ProcessRow,
} from "./memory-monitor.js";

const memoryMonitorTestDefaultLogDir = "/tmp/worktree-memory";

function memoryMonitorParseArgsResult(argv: readonly string[]) {
  return WorktreeStackKit_parseMemoryMonitorArgsResult({
    argv,
    defaultLogDir: memoryMonitorTestDefaultLogDir,
  });
}

describe("WorktreeStackKit_parseMemoryMonitorArgsResult", () => {
  it("parses defaults", () => {
    const parsed = memoryMonitorParseArgsResult([]);
    assert.equal(parsed.kind, "ok");
    if (parsed.kind === "ok") {
      assert.equal(parsed.options.discoveryMode, "registered");
      assert.equal(parsed.options.intervalSeconds, 10);
      assert.match(parsed.options.logDir, /worktree-memory$/u);
      assert.equal(parsed.options.sampleLimit, 0);
      assert.equal(parsed.options.topProcessesPerWorktree, 5);
    }
  });

  it("parses --once as sample limit 1", () => {
    const parsed = memoryMonitorParseArgsResult(["--once"]);
    assert.equal(parsed.kind, "ok");
    if (parsed.kind === "ok") {
      assert.equal(parsed.options.sampleLimit, 1);
    }
  });

  it("parses --prepared-only", () => {
    const parsed = memoryMonitorParseArgsResult(["--prepared-only"]);
    assert.equal(parsed.kind, "ok");
    if (parsed.kind === "ok") {
      assert.equal(parsed.options.discoveryMode, "prepared-only");
    }
  });

  it("parses --samples and --interval-seconds", () => {
    const parsed = memoryMonitorParseArgsResult([
      "--samples",
      "3",
      "--interval-seconds",
      "2",
    ]);
    assert.equal(parsed.kind, "ok");
    if (parsed.kind === "ok") {
      assert.equal(parsed.options.sampleLimit, 3);
      assert.equal(parsed.options.intervalSeconds, 2);
    }
  });

  it("returns error for invalid integer flag", () => {
    const parsed = memoryMonitorParseArgsResult(["--samples", "0"]);
    assert.deepEqual(parsed, {
      kind: "error",
      message: "--samples must be a positive integer. Received: 0",
      printUsage: false,
    });
  });
});

describe("memoryMonitorSanitizeField / memoryMonitorTruncateField", () => {
  it("replaces tabs and newlines with spaces", () => {
    assert.equal(memoryMonitorSanitizeField("a\tb\rc\nd"), "a b c d");
  });

  it("truncates long fields with ellipsis", () => {
    assert.equal(memoryMonitorTruncateField("abcdefghijkl", 10), "abcdefg...");
  });
});

describe("memoryMonitorCommandIsCandidate", () => {
  it("matches node-style commands", () => {
    assert.equal(
      memoryMonitorCommandIsCandidate("/usr/bin/node --inspect server.js"),
      true,
    );
    assert.equal(memoryMonitorCommandIsCandidate("npm run test"), true);
    assert.equal(memoryMonitorCommandIsCandidate("/bin/sh -c echo"), false);
  });
});

describe("memoryMonitorRenderSnapshot", () => {
  it("matches golden snapshot lines for a fixed catalog and rows", () => {
    const catalog: MemoryMonitor_CatalogEntry[] = [
      { branch: "main", label: "wt-a", path: "/tmp/wt-a" },
      { branch: "dev", label: "wt-b", path: "/tmp/wt-b" },
    ];
    const processRows: MemoryMonitor_ProcessRow[] = [
      {
        branch: "main",
        command: "node server.js",
        cpu: "1.5",
        cwd: "/tmp/wt-a/proj",
        label: "wt-a",
        mem: "2.0",
        path: "/tmp/wt-a",
        pid: "100",
        ppid: "1",
        rssMb: 48,
      },
      {
        branch: "main",
        command: "node worker.js",
        cpu: "0.5",
        cwd: "/tmp/wt-a/other",
        label: "wt-a",
        mem: "1.0",
        path: "/tmp/wt-a",
        pid: "101",
        ppid: "100",
        rssMb: 12,
      },
      {
        branch: "dev",
        command: "npm test",
        cpu: "3.0",
        cwd: "/tmp/wt-b",
        label: "wt-b",
        mem: "4.0",
        path: "/tmp/wt-b",
        pid: "200",
        ppid: "1",
        rssMb: 100,
      },
    ];

    const text = memoryMonitorRenderSnapshot({
      catalog,
      intervalSeconds: 10,
      processRows,
      snapshotTimestamp: "2026-04-12 12:00:00",
      topProcessesPerWorktree: 5,
    });

    const expected =
      [
        "=== Snapshot 2026-04-12 12:00:00 ===",
        "CATALOG | worktrees=2 | matched_processes=3 | interval_seconds=10 | top_processes_per_worktree=5",
        "WORKTREE | label=wt-a | branch=main | path=/tmp/wt-a",
        "SUMMARY | label=wt-a | processes=2 | total_rss_mb=60 | total_cpu=2.0 | total_mem_pct=3.0",
        "PROCESS | label=wt-a | pid=100 | ppid=1 | rss_mb=48 | cpu=1.5% | mem=2.0% | cwd=/tmp/wt-a/proj | command=node server.js",
        "PROCESS | label=wt-a | pid=101 | ppid=100 | rss_mb=12 | cpu=0.5% | mem=1.0% | cwd=/tmp/wt-a/other | command=node worker.js",
        "WORKTREE | label=wt-b | branch=dev | path=/tmp/wt-b",
        "SUMMARY | label=wt-b | processes=1 | total_rss_mb=100 | total_cpu=3.0 | total_mem_pct=4.0",
        "PROCESS | label=wt-b | pid=200 | ppid=1 | rss_mb=100 | cpu=3.0% | mem=4.0% | cwd=/tmp/wt-b | command=npm test",
        "",
      ].join("\n") + "\n";

    assert.equal(text, expected);
  });

  it("limits PROCESS lines per worktree", () => {
    const catalog: MemoryMonitor_CatalogEntry[] = [
      { branch: "main", label: "only", path: "/x" },
    ];
    const rows: MemoryMonitor_ProcessRow[] = [
      {
        branch: "main",
        command: "node a",
        cpu: "1",
        cwd: "/x",
        label: "only",
        mem: "1",
        path: "/x",
        pid: "1",
        ppid: "0",
        rssMb: 30,
      },
      {
        branch: "main",
        command: "node b",
        cpu: "1",
        cwd: "/x",
        label: "only",
        mem: "1",
        path: "/x",
        pid: "2",
        ppid: "0",
        rssMb: 20,
      },
      {
        branch: "main",
        command: "node c",
        cpu: "1",
        cwd: "/x",
        label: "only",
        mem: "1",
        path: "/x",
        pid: "3",
        ppid: "0",
        rssMb: 10,
      },
    ];
    const text = memoryMonitorRenderSnapshot({
      catalog,
      intervalSeconds: 10,
      processRows: rows,
      snapshotTimestamp: "t",
      topProcessesPerWorktree: 2,
    });
    const processLines = text.split("\n").filter((line) => line.startsWith("PROCESS "));
    assert.equal(processLines.length, 2);
  });
});
