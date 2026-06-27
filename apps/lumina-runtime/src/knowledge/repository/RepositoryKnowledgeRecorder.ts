import {
  analyzeRepository,
} from "./RepositoryAnalyzer.js";

import {
  saveRepositoryManifest,
} from "./RepositoryManifestStore.js";

import type {
  RepositoryManifest,
} from "./RepositoryManifest.js";

export type RepositoryKnowledgeInput = {
  projectId: string;
  projectPath: string;
  repoUrl: string;
  owner: string;
  repo: string;
  framework: string;
};

export async function recordRepositoryKnowledge(
  input: RepositoryKnowledgeInput,
): Promise<RepositoryManifest> {
  const manifest =
    analyzeRepository(
      input,
    );

  saveRepositoryManifest(
    manifest,
  );

  return manifest;
}
