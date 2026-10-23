import fs from "node:fs";

import { fileSystem } from "@korelumina/platform-sdk";

import { patchProblem, resolveInsideProject } from "./patchSafety.js";
import type { DraftPatch, DraftSnapshot, FixDraft } from "./types.js";

export type ApplyDraftResult = {
  applied: number;
  skipped: number;
  files: string[];
  errors: string[];
  snapshots: DraftSnapshot[];
  refused: boolean;
};

/*
 * MS-2026-0011: a draft is applied whole or not at all. Every patch is
 * checked against the project as it is now before anything is written;
 * if one no longer fits (the file changed, the text moved, a link
 * appeared) nothing is written and the reasons come back.
 */
function applyPatch(projectPath: string, patch: DraftPatch): DraftSnapshot {
  const full = resolveInsideProject(projectPath, patch.file);

  if (patch.type === "create-file") {
    fileSystem.ensureParent(full);
    fileSystem.writeTextAtomic(full, patch.content);
    return { file: patch.file, existedBefore: false, before: "", after: patch.content };
  }

  const before = fs.readFileSync(full, "utf8");

  if (patch.type === "delete-file") {
    fileSystem.remove(full);
    return { file: patch.file, existedBefore: true, before, after: "" };
  }

  const index = before.indexOf(patch.find);
  const after = before.slice(0, index) + patch.replace + before.slice(index + patch.find.length);
  fileSystem.writeTextAtomic(full, after);
  return { file: patch.file, existedBefore: true, before, after };
}

export function applyDraft(projectPath: string, draft: FixDraft): ApplyDraftResult {
  const result: ApplyDraftResult = {
    applied: 0,
    skipped: 0,
    files: [],
    errors: [],
    snapshots: [],
    refused: false,
  };

  const seen = new Set<string>();
  for (const patch of draft.patches) {
    if (seen.has(patch.file)) {
      result.errors.push(`file_patched_twice:${patch.file}`);
    }
    seen.add(patch.file);
    const problem = patchProblem(projectPath, patch);
    if (problem) result.errors.push(problem);
  }

  if (result.errors.length > 0 || draft.patches.length === 0) {
    if (draft.patches.length === 0) result.errors.push("draft_has_no_patches");
    result.refused = true;
    result.skipped = draft.patches.length;
    return result;
  }

  for (const patch of draft.patches) {
    try {
      result.snapshots.push(applyPatch(projectPath, patch));
      result.applied += 1;
      result.files.push(patch.file);
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.skipped += 1;
    }
  }

  return result;
}
