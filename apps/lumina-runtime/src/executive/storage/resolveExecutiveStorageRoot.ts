import path from "node:path";

import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
  resolveRepositoryRoot,
} from "../../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

/*
 * KO-6 (F-23): executive decisions, approvals, and reasoning are governance
 * records. They belong in the repository's tracked runtime/executive folder
 * whichever directory the Runtime was started from. Before this, they were
 * written relative to the working directory, so starting the Runtime from
 * apps/lumina-runtime put them in an untracked folder.
 *
 * KORELUMINA_EXECUTIVE_ROOT overrides the location. Test processes use a
 * fresh temporary directory each (F-25), so tests never touch the
 * repository's records or each other's leftovers.
 */
export function resolveExecutiveStorageRoot(): string {
  const configured =
    process.env.KORELUMINA_EXECUTIVE_ROOT?.trim();

  if (configured) {
    return path.resolve(configured);
  }

  if (isNodeTestProcess()) {
    return isolatedTestStorageRoot("executive");
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
