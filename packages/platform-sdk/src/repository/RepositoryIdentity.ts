export interface RepositoryIdentity {
  repositoryId: string;

  provider: "github";

  remoteUrl: string;

  owner: string;

  name: string;

  defaultBranch?: string;
}

export function createRepositoryId(
  provider: string,
  owner: string,
  name: string,
): string {
  return `${provider}:${owner}/${name}`.toLowerCase();
}
