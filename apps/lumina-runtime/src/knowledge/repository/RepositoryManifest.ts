export interface RepositoryManifest {
  id: string;

  repositoryUrl?: string;

  projectId: string;

  framework: string;

  packageManager?: string;

  languages: string[];

  rootFiles: string[];

  analyzedAt: number;
}
