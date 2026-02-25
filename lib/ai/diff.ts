import fs from "fs";
import path from "path";

export type DiffFile = {
  path: string;   // relative to project root, e.g. "src/foo.ts"
  content: string;
};

export type DiffResult = {
  path: string;
  beforeExists: boolean;
  beforeSize: number;
  afterSize: number;
  unified: string;        // unified diff (best effort)
  truncated: boolean;     // true if we fell back due to size/complexity
};

function readTextIfExists(fullPath: string): string | null {
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

function splitLines(s: string): string[] {
  // Keep stable line splitting across platforms
  return s.replace(/\r\n/g, "\n").split("\n");
}

/**
 * LCS-based diff on lines. Bounded for safety.
 * If too large, fallback to a simple before/after summary.
 */
function unifiedDiffLcs(pathLabel: string, before: string, after: string): { text: string; truncated: boolean } {
  const a = splitLines(before);
  const b = splitLines(after);

  // Bound complexity (n*m). If too big, bail.
  const n = a.length;
  const m = b.length;
  const limit = 200_000; // ~ reasonable for server runtime
  if (n * m > limit) {
    return {
      text:
        `--- a/${pathLabel}\n` +
        `+++ b/${pathLabel}\n` +
        `@@ (diff omitted: file too large/complex) @@\n`,
      truncated: true,
    };
  }

  // DP for LCS lengths
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Reconstruct edit script
  type Op = { kind: " " | "-" | "+"; line: string };
  const ops: Op[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: " ", line: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: "-", line: a[i] });
      i++;
    } else {
      ops.push({ kind: "+", line: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ kind: "-", line: a[i++] });
  }
  while (j < m) {
    ops.push({ kind: "+", line: b[j++] });
  }

  // Single hunk output (v1). Good enough for preview.
  const removed = ops.filter(o => o.kind === "-").length;
  const added = ops.filter(o => o.kind === "+").length;

  const header =
    `--- a/${pathLabel}\n` +
    `+++ b/${pathLabel}\n` +
    `@@ -1,${n} +1,${m} @@\n`;

  const body = ops.map(o => `${o.kind}${o.line}`).join("\n") + "\n";

  // If too noisy, we still allow it, but mark truncated when massive output
  const text = header + body;
  const truncated = text.length > 200_000;

  return truncated
    ? {
        text:
          `--- a/${pathLabel}\n` +
          `+++ b/${pathLabel}\n` +
          `@@ (diff omitted: output too large) @@\n`,
        truncated: true,
      }
    : { text, truncated: false };
}

export function generateDiffPreview(projectRoot: string, files: DiffFile[]): DiffResult[] {
  const out: DiffResult[] = [];

  for (const f of files) {
    const fullPath = path.join(projectRoot, f.path);
    const beforeText = readTextIfExists(fullPath);
    const before = beforeText ?? "";
    const after = f.content ?? "";

    const { text, truncated } = unifiedDiffLcs(f.path, before, after);

    out.push({
      path: f.path,
      beforeExists: beforeText !== null,
      beforeSize: Buffer.byteLength(before, "utf8"),
      afterSize: Buffer.byteLength(after, "utf8"),
      unified: text,
      truncated,
    });
  }

  return out;
}
