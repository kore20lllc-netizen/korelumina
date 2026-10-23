import fs from "node:fs";

import { fileSystem } from "@korelumina/platform-sdk";

import { resolveInsideProject } from "./patchSafety.js";
import type { DraftSnapshot, FixDraft } from "./types.js";

export type RevertDraftResult = {
  reverted: number;
  skipped: number;
  files: string[];
  errors: string[];
  refused: boolean;
};

/*
 * MS-2026-0011: undoing a draft never overwrites work done after it. Each
 * file must still be exactly as the draft left it; if any changed since,
 * nothing is reverted and the changed files are named.
 */
function currentContent(full: string): string | null {
  try {
    return fs.lstatSync(full).isFile() ? fs.readFileSync(full, "utf8") : null;
  } catch {
    return null;
  }
}

function stillAsApplied(projectPath: string, snapshot: DraftSnapshot): string | null {
  try {
    const full = resolveInsideProject(projectPath, snapshot.file);
    const current = currentContent(full);
    const deletedByDraft = snapshot.existedBefore && snapshot.after === "" && current === null;
    if (deletedByDraft) return null;
    return current === snapshot.after ? null : `changed_since_apply:${snapshot.file}`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function revertDraft(projectPath: string, draft: FixDraft): RevertDraftResult {
  const result: RevertDraftResult = {
    reverted: 0,
    skipped: 0,
    files: [],
    errors: [],
    refused: false,
  };
  const snapshots = draft.snapshots ?? [];

  for (const snapshot of snapshots) {
    const problem = stillAsApplied(projectPath, snapshot);
    if (problem) result.errors.push(problem);
  }

  if (result.errors.length > 0) {
    result.refused = true;
    result.skipped = snapshots.length;
    return result;
  }

  for (const snapshot of [...snapshots].reverse()) {
    try {
      const full = resolveInsideProject(projectPath, snapshot.file);
      if (!snapshot.existedBefore) {
        fileSystem.remove(full);
      } else {
        fileSystem.ensureParent(full);
        fileSystem.writeTextAtomic(full, snapshot.before);
      }
      result.reverted += 1;
      result.files.push(snapshot.file);
    } catch (error) {
      result.skipped += 1;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return result;
}
