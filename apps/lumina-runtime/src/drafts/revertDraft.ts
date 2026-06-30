import path from "node:path";

import {
  fileSystem,
} from "@korelumina/platform-sdk";

import type { FixDraft } from "./types.js";

export type RevertDraftResult = {
  reverted: number;
  skipped: number;
  files: string[];
  errors: string[];
};

function ensureInsideProject(projectPath: string, file: string): string {
  const fullPath = path.resolve(path.join(projectPath, file));
  const relative = path.relative(projectPath, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`unsafe_revert_path:${file}`);
  }

  return fullPath;
}

export function revertDraft(projectPath: string, draft: FixDraft): RevertDraftResult {
  const result: RevertDraftResult = {
    reverted: 0,
    skipped: 0,
    files: [],
    errors: [],
  };

  const snapshots = draft.snapshots ?? [];

  for (const snapshot of [...snapshots].reverse()) {
    try {
      const fullPath = ensureInsideProject(projectPath, snapshot.file);

      if (!snapshot.existedBefore) {
        if (fileSystem.exists(fullPath)) {
          fileSystem.remove(fullPath);
          result.reverted += 1;
          result.files.push(snapshot.file);
        } else {
          result.skipped += 1;
        }

        continue;
      }

      fileSystem.ensureParent(fullPath);

      fileSystem.writeTextAtomic(fullPath, snapshot.before);
      result.reverted += 1;
      result.files.push(snapshot.file);
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
