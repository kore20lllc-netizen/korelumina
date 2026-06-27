import type {
  ArchitectureChange,
  ArchitectureChangeSet,
  ArchitectureDocument,
  ArchitectureManifest,
} from "./types.js";

export function detectArchitectureChanges(
  current: ArchitectureDocument[],
  manifest: ArchitectureManifest,
): ArchitectureChangeSet {
  const changes: ArchitectureChange[] = [];

  const previous = new Map(
    manifest.documents.map((doc) => [
      doc.relativePath,
      doc,
    ]),
  );

  for (const document of current) {
    const existing =
      previous.get(
        document.relativePath,
      );

    if (!existing) {
      changes.push({
        type: "new",
        document,
      });
      continue;
    }

    previous.delete(
      document.relativePath,
    );

    changes.push({
      type:
        existing.checksum ===
        document.checksum
          ? "unchanged"
          : "modified",
      document,
    });
  }

  for (const document of previous.values()) {
    changes.push({
      type: "deleted",
      document,
    });
  }

  return {
    changes,
  };
}
