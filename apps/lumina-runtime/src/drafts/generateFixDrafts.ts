import fs from "node:fs";
import path from "node:path";

import type { FixPlan } from "../autofix/types.js";
import type { DraftPatch } from "./types.js";

function fileExists(projectPath: string, file: string): boolean {
  const fullPath = path.join(projectPath, file);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
}

function build100vwPatches(projectPath: string, file: string): DraftPatch[] {
  if (!fileExists(projectPath, file)) return [];

  return [
    {
      type: "replace-text",
      file,
      find: "100vw",
      replace: "100%",
      diffPreview: [
        `--- ${file}`,
        `+++ ${file}`,
        "@@",
        "- 100vw",
        "+ 100%",
      ].join("\n"),
    },
    {
      type: "replace-text",
      file,
      find: "w-screen",
      replace: "w-full max-w-full",
      diffPreview: [
        `--- ${file}`,
        `+++ ${file}`,
        "@@",
        "- w-screen",
        "+ w-full max-w-full",
      ].join("\n"),
    },
  ];
}

function buildLockfilePatches(projectPath: string): DraftPatch[] {
  const patches: DraftPatch[] = [];

  for (const file of ["package-lock.json"]) {
    if (!fileExists(projectPath, file)) continue;

    patches.push({
      type: "delete-file",
      file,
      diffPreview: [
        `--- ${file}`,
        "+++ /dev/null",
        "@@",
        "- remove non-canonical npm lockfile; bun remains canonical",
      ].join("\n"),
    });
  }

  return patches;
}

function buildFaviconPatch(projectPath: string): DraftPatch[] {
  const file = "public/favicon.ico";

  if (fileExists(projectPath, file)) return [];

  return [
    {
      type: "create-file",
      file,
      content: "KORELUMINA_FAVICON_PLACEHOLDER\n",
      diffPreview: [
        `+++ ${file}`,
        "@@",
        "+ KoreLumina favicon placeholder",
      ].join("\n"),
    },
  ];
}

export function generateDraftPatches(projectPath: string, plan: FixPlan): DraftPatch[] {
  const patches: DraftPatch[] = [];

  for (const fix of plan.fixes) {
    if (!fix.autoFixable) continue;

    if (fix.findingId === "multiple-lockfiles") {
      patches.push(...buildLockfilePatches(projectPath));
      continue;
    }

    if (fix.findingId.startsWith("layout-100vw:")) {
      const file = fix.files[0];
      if (!file) continue;
      patches.push(...build100vwPatches(projectPath, file));
      continue;
    }

    if (fix.findingId === "missing-favicon") {
      patches.push(...buildFaviconPatch(projectPath));
      continue;
    }
  }

  return patches;
}
