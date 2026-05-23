import type { RepoProvider } from "@/providers/types";

export class MockRepoProvider implements RepoProvider {
  async listRepos(): Promise<any[]> {
    console.warn(
      "[KoreLumina] MockRepoProvider.listRepos used.",
    );

    return [];
  }

  async getRepo(): Promise<any> {
    console.warn(
      "[KoreLumina] MockRepoProvider.getRepo used.",
    );

    return null;
  }

  async importRepo(): Promise<{
    success: boolean;
    repoId?: string;
    error?: string;
  }> {
    console.warn(
      "[KoreLumina] MockRepoProvider.importRepo used.",
    );

    return {
      success: true,
      repoId: "mock-repo",
    };
  }
}
