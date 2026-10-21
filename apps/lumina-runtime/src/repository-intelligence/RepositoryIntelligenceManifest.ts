import { createHash } from "node:crypto";

import type { RepositoryInventory } from "./RepositoryInventory.js";
import type { RepositorySnapshot } from "./RepositorySnapshot.js";

/*
 * MS-2026-0012 (Release Plan V1 Milestone 2): the Repository Manifest
 * every imported repository produces. Its identity is the snapshot it
 * was derived from, so the same commit always yields the same manifest;
 * only analyzedAt records when it was produced.
 */

export const REPOSITORY_INTELLIGENCE_MANIFEST_VERSION = "repository-intelligence-manifest:v1";

export interface RepositoryIntelligenceManifest {
  version: typeof REPOSITORY_INTELLIGENCE_MANIFEST_VERSION;
  manifestId: string;
  projectId: string;
  snapshotFingerprint: string;
  commit: string | null;
  skippedDirectories: readonly string[];
  inventory: RepositoryInventory;
  analyzedAt: number;
}

export function createRepositoryIntelligenceManifest(input: {
  projectId: string;
  snapshot: RepositorySnapshot;
  inventory: RepositoryInventory;
  analyzedAt: number;
}): RepositoryIntelligenceManifest {
  return {
    version: REPOSITORY_INTELLIGENCE_MANIFEST_VERSION,
    manifestId: `repository-manifest:${createHash("sha256")
      .update(`${REPOSITORY_INTELLIGENCE_MANIFEST_VERSION}\0${input.projectId}\0${input.snapshot.fingerprint}`)
      .digest("hex")}`,
    projectId: input.projectId,
    snapshotFingerprint: input.snapshot.fingerprint,
    commit: input.snapshot.commit,
    skippedDirectories: input.snapshot.skippedDirectories,
    inventory: input.inventory,
    analyzedAt: input.analyzedAt,
  };
}
