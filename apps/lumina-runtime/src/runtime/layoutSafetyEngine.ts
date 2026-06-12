import fs from "node:fs";
import path from "node:path";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASELINE_MARKER = "/* lumina:baseline */";
const ENGINE_VERSION = "1.0.0";

const BASELINE_CSS = `${BASELINE_MARKER}
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

body {
  min-height: 100vh;
}

img,
video,
canvas,
svg,
iframe {
  max-width: 100%;
  display: block;
}

input,
textarea,
select,
button {
  font: inherit;
}

pre,
code {
  overflow-x: auto;
}
`;

const VIEWPORT_META = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';

const CSS_CANDIDATES = [
  "src/index.css",
  "src/app.css",
  "src/globals.css",
  "src/global.css",
  "app/globals.css",
  "styles/globals.css",
  "styles/index.css",
];

const HTML_CANDIDATES = [
  "index.html",
  "public/index.html",
];

// Fixed pixel widths wider than the largest common mobile frame (430px)
// on absolute/fixed positioned decorative elements that cause overflow
const OVERFLOW_WIDTH_PATTERN = /w-\[([0-9]+)px\]/g;
const OVERFLOW_THRESHOLD_PX = 375;

// ─── Types ────────────────────────────────────────────────────────────────────

export type RepairAction = {
  pass: string;
  file: string;
  description: string;
  severity: "info" | "warning" | "fixed";
};

export type SafetyEngineReport = {
  projectId: string;
  engineVersion: string;
  ranAt: number;
  repairs: RepairAction[];
  warnings: RepairAction[];
  totalFixed: number;
  totalWarnings: number;
};

// ─── Pass 1: Normalize CSS @import order ────────────────────────────────────

function normalizeCSSImportOrder(
  projectPath: string,
  repairs: RepairAction[],
): void {
  for (const candidate of CSS_CANDIDATES) {
    const filePath = path.join(projectPath, candidate);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    const importLines: string[] = [];
    const otherLines: string[] = [];
    let hasOutOfOrderImport = false;
    let seenNonImport = false;

    for (const line of lines) {
      const trimmed = line.trimStart();
      const isImport =
        trimmed.startsWith("@import") || trimmed.startsWith("@charset");

      if (isImport) {
        importLines.push(line);
        if (seenNonImport) hasOutOfOrderImport = true;
      } else {
        otherLines.push(line);
        if (trimmed.length > 0 && !trimmed.startsWith("/*")) {
          seenNonImport = true;
        }
      }
    }

    if (!hasOutOfOrderImport) continue;

    const patched =
      importLines.join("\n") + "\n\n" + otherLines.join("\n");

    fs.writeFileSync(filePath, patched, "utf8");

    repairs.push({
      pass: "normalizeCSSImportOrder",
      file: candidate,
      description: `Moved ${importLines.length} @import statement(s) to top of file to satisfy CSS spec.`,
      severity: "fixed",
    });

    console.log(
      `[lumina/safety] fixed @import order in: ${candidate}`,
    );
    return;
  }
}

// ─── Pass 2: Inject baseline CSS ─────────────────────────────────────────────

function injectBaselineCSS(
  projectPath: string,
  repairs: RepairAction[],
): void {
  for (const candidate of CSS_CANDIDATES) {
    const filePath = path.join(projectPath, candidate);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes(BASELINE_MARKER)) {
      repairs.push({
        pass: "injectBaselineCSS",
        file: candidate,
        description: "Baseline already present — skipped.",
        severity: "info",
      });
      console.log(`[lumina/safety] baseline already present: ${candidate}`);
      return;
    }

    const lines = content.split("\n");
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (
        trimmed.startsWith("@import") ||
        trimmed.startsWith("@charset")
      ) {
        lastImportIndex = i;
      }
    }

    let patched: string;
    if (lastImportIndex === -1) {
      patched = BASELINE_CSS + "\n" + content;
    } else {
      const before = lines.slice(0, lastImportIndex + 1).join("\n");
      const after = lines.slice(lastImportIndex + 1).join("\n");
      patched = before + "\n\n" + BASELINE_CSS + "\n" + after;
    }

    fs.writeFileSync(filePath, patched, "utf8");

    repairs.push({
      pass: "injectBaselineCSS",
      file: candidate,
      description:
        "Injected KoreLumina layout baseline (box-sizing, overflow-x, viewport normalization).",
      severity: "fixed",
    });

    console.log(`[lumina/safety] injected baseline CSS into: ${candidate}`);
    return;
  }

  // No CSS file found — create one
  const fallbackPath = path.join(projectPath, "src", "index.css");
  const srcDir = path.join(projectPath, "src");

  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  fs.writeFileSync(fallbackPath, BASELINE_CSS, "utf8");

  repairs.push({
    pass: "injectBaselineCSS",
    file: "src/index.css",
    description: "No CSS entry found — created src/index.css with baseline.",
    severity: "fixed",
  });

  console.log(`[lumina/safety] created baseline CSS at: src/index.css`);
}

// ─── Pass 3: Ensure viewport meta ────────────────────────────────────────────

function ensureViewportMeta(
  projectPath: string,
  repairs: RepairAction[],
): void {
  for (const candidate of HTML_CANDIDATES) {
    const filePath = path.join(projectPath, candidate);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes('name="viewport"')) return;

    const patched = content.replace(
      /<head([^>]*)>/i,
      `<head$1>\n    ${VIEWPORT_META}`,
    );

    if (patched !== content) {
      fs.writeFileSync(filePath, patched, "utf8");

      repairs.push({
        pass: "ensureViewportMeta",
        file: candidate,
        description:
          "Injected missing viewport meta tag for correct mobile scaling.",
        severity: "fixed",
      });

      console.log(
        `[lumina/safety] injected viewport meta into: ${candidate}`,
      );
    }

    return;
  }
}

// ─── Pass 4: Fix oversized absolute decorations ───────────────────────────────

function fixOversizedAbsoluteDecorations(
  projectPath: string,
  repairs: RepairAction[],
): void {
  const srcDir = path.join(projectPath, "src");
  if (!fs.existsSync(srcDir)) return;

  const tsxFiles = walkTSX(srcDir);

  for (const filePath of tsxFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(projectPath, filePath);

    // Check if file has oversized absolute elements
    const hasAbsolute = /\babsolute\b/.test(content);
    if (!hasAbsolute) continue;

    // Find oversized fixed-width classes
    let hasOversized = false;
    let match: RegExpExecArray | null;
    const pattern = new RegExp(OVERFLOW_WIDTH_PATTERN.source, "g");

    while ((match = pattern.exec(content)) !== null) {
      const px = parseInt(match[1], 10);
      if (px > OVERFLOW_THRESHOLD_PX) {
        hasOversized = true;
        break;
      }
    }

    if (!hasOversized) continue;

    // Add overflow-hidden to section/div wrappers that contain
    // absolute children but are missing overflow-hidden
    const patched = content.replace(
      /(<(?:section|div)\b[^>]*\brelative\b[^>]*className="[^"]*?)(")/g,
      (match, before, quote) => {
        if (before.includes("overflow-hidden")) return match;
        return before + " overflow-hidden" + quote;
      },
    );

    if (patched !== content) {
      fs.writeFileSync(filePath, patched, "utf8");

      repairs.push({
        pass: "fixOversizedAbsoluteDecorations",
        file: relPath,
        description:
          `Added overflow-hidden to relative containers with oversized (>${OVERFLOW_THRESHOLD_PX}px) absolute children to prevent horizontal scroll bleed.`,
        severity: "fixed",
      });

      console.log(
        `[lumina/safety] fixed overflow in: ${relPath}`,
      );
    }
  }
}

// ─── Pass 5: Detect unfixable issues and emit warnings ───────────────────────

function detectUnfixableIssues(
  projectPath: string,
  warnings: RepairAction[],
): void {
  const srcDir = path.join(projectPath, "src");
  if (!fs.existsSync(srcDir)) return;

  const tsxFiles = walkTSX(srcDir);

  for (const filePath of tsxFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(projectPath, filePath);

    // Warn about fixed positioning with explicit widths that may bleed
    if (
      /\bfixed\b/.test(content) &&
      /w-\[([0-9]{4,})px\]/.test(content)
    ) {
      warnings.push({
        pass: "detectUnfixableIssues",
        file: relPath,
        description:
          "Fixed-position element with large explicit width detected — may cause layout overflow on narrow viewports. Review manually.",
        severity: "warning",
      });
    }

    // Warn about inline styles with vw/px widths on positioned elements
    if (
      /style=\{[^}]*width[^}]*(?:vw|px)[^}]*\}/.test(content) &&
      /\b(?:absolute|fixed)\b/.test(content)
    ) {
      warnings.push({
        pass: "detectUnfixableIssues",
        file: relPath,
        description:
          "Inline style width on absolute/fixed element detected — cannot be auto-patched. Review for mobile overflow.",
        severity: "warning",
      });
    }
  }
}

// ─── Utility: walk TSX/JSX files ─────────────────────────────────────────────

function walkTSX(dir: string): string[] {
  const results: string[] = [];

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (item.name === "node_modules") continue;
      if (item.name.startsWith(".")) continue;

      const full = path.join(dir, item.name);

      if (item.isDirectory()) {
        results.push(...walkTSX(full));
      } else if (
        item.isFile() &&
        (item.name.endsWith(".tsx") || item.name.endsWith(".jsx"))
      ) {
        results.push(full);
      }
    }
  } catch {
    // non-fatal: skip unreadable directories
  }

  return results;
}

// ─── Main engine entry ────────────────────────────────────────────────────────

export function runLayoutSafetyEngine(
  projectId: string,
  projectPath: string,
): SafetyEngineReport {
  const repairs: RepairAction[] = [];
  const warnings: RepairAction[] = [];

  const passes = [
    () => normalizeCSSImportOrder(projectPath, repairs),
    () => injectBaselineCSS(projectPath, repairs),
    () => ensureViewportMeta(projectPath, repairs),
    () => fixOversizedAbsoluteDecorations(projectPath, repairs),
    () => detectUnfixableIssues(projectPath, warnings),
  ];

  for (const pass of passes) {
    try {
      pass();
    } catch (error) {
      // Each pass is isolated — a failure in one never blocks the others
      warnings.push({
        pass: "engine",
        file: "unknown",
        description: `Pass failed (non-fatal): ${
          error instanceof Error ? error.message : String(error)
        }`,
        severity: "warning",
      });
    }
  }

  const report: SafetyEngineReport = {
    projectId,
    engineVersion: ENGINE_VERSION,
    ranAt: Date.now(),
    repairs: repairs.filter((r) => r.severity === "fixed"),
    warnings: [...repairs.filter((r) => r.severity === "info"), ...warnings],
    totalFixed: repairs.filter((r) => r.severity === "fixed").length,
    totalWarnings: warnings.length,
  };

  if (report.totalFixed > 0) {
    console.log(
      `[lumina/safety] ${report.totalFixed} repair(s) applied to ${projectId}`,
    );
  }

  if (report.totalWarnings > 0) {
    console.log(
      `[lumina/safety] ${report.totalWarnings} warning(s) for ${projectId} — review recommended`,
    );
  }

  return report;
}
