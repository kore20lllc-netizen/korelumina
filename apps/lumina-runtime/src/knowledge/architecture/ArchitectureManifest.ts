import type { ArchitectureManifest } from "./types.js";

export function createArchitectureManifest(
  documents: ArchitectureManifest["documents"],
): ArchitectureManifest {
  return {
    documents,
  };
}
