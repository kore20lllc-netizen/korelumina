import path from "node:path";

import {
  isNodeTestProcess,
  resolveRepositoryRoot,
} from "../../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

/*
 * KO-6 (F-23): executive decisions, approvals, and reasoning are governance
 * records. They belong in the repository's tracked runtime/executive folder
 * whichever directory the Runtime was started from. Before this, they were
 * written relative to the working directory, so starting the Runtime from
 * apps/lumina-runtime put them in an untracked folder.
 *
 * KORELUMINA_EXECUTIVE_ROOT overrides the location. Test processes keep
 * their previous working-directory location so tests never touch the
 * repository's records.
 */
export function resolveExecutiveStorageRoot(): string {
  const configured =
    process.env.KORELUMINA_EXECUTIVE_ROOT?.trim();

  if (configured) {
    return path.resolve(configured);
  }

  if (isNodeTestProcess()) {
    return path.resolve(
      process.cwd(),
      "runtime/executive",
    );
  }

  return path.join(
    resolveRepositoryRoot(),
    "runtime",
    "executive",
  );
}

export function resolveExecutiveStoragePath(
  ...segments: string[]
): string {
  return path.join(
    resolveExecutiveStorageRoot(),
    ...segments,
  );
}
