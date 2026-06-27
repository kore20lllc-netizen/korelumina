import {
  analyzeProject,
} from "./ProjectAnalyzer.js";

import {
  saveProjectManifest,
} from "./ProjectManifestStore.js";

import type {
  ProjectManifest,
} from "./ProjectManifest.js";

import type {
  ProjectAnalysisInput,
} from "./ProjectAnalyzer.js";

export async function recordProjectKnowledge(
  input: ProjectAnalysisInput,
): Promise<ProjectManifest> {
  const manifest =
    analyzeProject(
      input,
    );

  saveProjectManifest(
    manifest,
  );

  return manifest;
}
