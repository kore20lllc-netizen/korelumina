export interface ProjectManifest {
  id: string;

  projectId: string;

  repositoryId: string;

  name: string;

  framework: string;

  workspace: string;

  runtimeRoot: string;

  sourceUrl?: string;

  createdAt: number;

  updatedAt: number;
}
