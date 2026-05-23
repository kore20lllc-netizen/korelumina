import type { RepoProvider } from "@/providers/types";

export class GitHubRepoProvider implements RepoProvider {
  async listRepos(): Promise<any[]> {
    console.warn(
      "[KoreLumina] GitHubRepoProvider placeholder active.",
    );

    return [];
  }

  async getRepo(): Promise<any> {
    console.warn(
      "[KoreLumina] GitHubRepoProvider.getRepo placeholder active.",
    );

    return null;
  }

  async importRepo(): Promise<{
    success: boolean;
    repoId?: string;
    error?: string;
  }> {
    console.warn(
      "[KoreLumina] GitHubRepoProvider.importRepo placeholder active.",
    );

    return {
      success: true,
      repoId: "github-repo",
    };
  }
}
