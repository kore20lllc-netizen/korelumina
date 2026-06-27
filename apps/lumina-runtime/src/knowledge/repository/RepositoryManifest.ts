export interface RepositoryManifest {
  id: string;

  projectId: string;

  repoUrl: string;

  repoOwner: string;

  repoName: string;

  framework: string;

  packageManager?: string;

  languages: string[];

  rootFiles: string[];

  analyzedAt: number;
}
