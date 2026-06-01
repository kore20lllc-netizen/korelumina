import fs from "node:fs";
import path from "node:path";

import type { DraftPatch, DraftSnapshot, FixDraft } from "./types.js";

export type ApplyDraftResult = {
  applied: number;
  skipped: number;
  files: string[];
  errors: string[];
  snapshots: DraftSnapshot[];
};

function ensureInsideProject(projectPath: string, file: string): string {
  const fullPath = path.resolve(path.join(projectPath, file));
  const relative = path.relative(projectPath, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`unsafe_patch_path:${file}`);
  }

  return fullPath;
}

function readFileIfExists(fullPath: string): {
  existedBefore: boolean;
  content: string;
} {
  if (!fs.existsSync(fullPath)) {
    return {
      existedBefore: false,
      content: "",
    };
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    throw new Error(`patch_target_not_file:${fullPath}`);
  }

  return {
    existedBefore: true,
    content: fs.readFileSync(fullPath, "utf8"),
  };
}

function applyPatch(
  projectPath: string,
  patch: DraftPatch,
): DraftSnapshot | null {
  const fullPath = ensureInsideProject(projectPath, patch.file);
  const beforeState = readFileIfExists(fullPath);

  if (patch.type === "delete-file") {
    if (!beforeState.existedBefore) return null;

    fs.unlinkSync(fullPath);

    return {
      file: patch.file,
      existedBefore: true,
      before: beforeState.content,
      after: "",
    };
  }

  if (patch.type === "create-file") {
    if (beforeState.existedBefore) return null;

    fs.mkdirSync(path.dirname(fullPath), {
      recursive: true,
    });

    fs.writeFileSync(fullPath, patch.content, "utf8");

    return {
      file: patch.file,
      existedBefore: false,
      before: "",
      after: patch.content,
    };
  }

  if (!beforeState.existedBefore) return null;

  if (!beforeState.content.includes(patch.find)) return null;

  const after = beforeState.content.split(patch.find).join(patch.replace);

  if (after === beforeState.content) return null;

  fs.writeFileSync(fullPath, after, "utf8");

  return {
    file: patch.file,
    existedBefore: true,
    before: beforeState.content,
    after,
  };
}

export function applyDraft(projectPath: string, draft: FixDraft): ApplyDraftResult {
  const result: ApplyDraftResult = {
    applied: 0,
    skipped: 0,
    files: [],
    errors: [],
    snapshots: [],
  };

  for (const patch of draft.patches) {
    try {
      const snapshot = applyPatch(projectPath, patch);

      if (!snapshot) {
        result.skipped += 1;
        continue;
      }

      result.applied += 1;
      result.files.push(patch.file);
      result.snapshots.push(snapshot);
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  result.files = Array.from(new Set(result.files));

  return result;
}
