import type {
  ProjectManifest,
} from "./ProjectManifest.js";

export type ProjectAnalysisInput = {
  projectId: string;
  repositoryId: string;
  name: string;
  framework: string;
  workspace: string;
  runtimeRoot: string;
  sourceUrl?: string;
};

export function analyzeProject(
  input: ProjectAnalysisInput,
): ProjectManifest {
  const now = Date.now();

  return {
    id: input.projectId,
    projectId: input.projectId,
    repositoryId: input.repositoryId,
    name: input.name,
    framework: input.framework,
    workspace: input.workspace,
    runtimeRoot: input.runtimeRoot,
    sourceUrl: input.sourceUrl,
    createdAt: now,
    updatedAt: now,
  };
}
