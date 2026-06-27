import {
  analyzeRepository,
} from "./RepositoryAnalyzer.js";

import {
  saveRepositoryManifest,
} from "./RepositoryManifestStore.js";

import type {
  RepositoryManifest,
} from "./RepositoryManifest.js";

export function recordRepositoryKnowledge(
  projectId: string,
  projectPath: string,
): RepositoryManifest {
  const manifest =
    analyzeRepository(
      projectId,
      projectPath,
    );

  saveRepositoryManifest(
    manifest,
  );

  return manifest;
}
