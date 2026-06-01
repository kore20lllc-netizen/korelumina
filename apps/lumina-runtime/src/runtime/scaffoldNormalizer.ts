import fs from "node:fs";
import path from "node:path";

const BASELINE_MARKER = "/* lumina:baseline */";

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

function injectBaselineCSS(projectPath: string): void {
  for (const candidate of CSS_CANDIDATES) {
    const filePath = path.join(projectPath, candidate);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes(BASELINE_MARKER)) {
      console.log(`[lumina/scaffold] baseline already present: ${candidate}`);
      return;
    }

    // Split into lines and find the last @import / @charset line
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
      // No @import lines — safe to prepend
      patched = BASELINE_CSS + "\n" + content;
    } else {
      // Insert baseline AFTER the last @import block
      const before = lines.slice(0, lastImportIndex + 1).join("\n");
      const after = lines.slice(lastImportIndex + 1).join("\n");
      patched = before + "\n\n" + BASELINE_CSS + "\n" + after;
    }

    fs.writeFileSync(filePath, patched, "utf8");
    console.log(`[lumina/scaffold] injected baseline CSS into: ${candidate}`);
    return;
  }

  // No CSS file found — create src/index.css with baseline
  const fallbackPath = path.join(projectPath, "src", "index.css");
  const srcDir = path.join(projectPath, "src");
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  fs.writeFileSync(fallbackPath, BASELINE_CSS, "utf8");
  console.log(`[lumina/scaffold] created baseline CSS at: src/index.css`);
}

function ensureViewportMeta(projectPath: string): void {
  for (const candidate of HTML_CANDIDATES) {
    const filePath = path.join(projectPath, candidate);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes('name="viewport"')) {
      return;
    }

    const patched = content.replace(
      /<head([^>]*)>/i,
      `<head$1>\n    ${VIEWPORT_META}`,
    );

    if (patched !== content) {
      fs.writeFileSync(filePath, patched, "utf8");
      console.log(`[lumina/scaffold] injected viewport meta into: ${candidate}`);
    }

    return;
  }
}

export function normalizeProjectScaffold(projectPath: string): void {
  try {
    injectBaselineCSS(projectPath);
    ensureViewportMeta(projectPath);
  } catch (error) {
    // Never block a project boot over scaffold normalization
    console.warn(
      `[lumina/scaffold] normalization warning (non-fatal):`,
      error instanceof Error ? error.message : error,
    );
  }
}
