import { MockRepoProvider } from "@/providers/repo/MockRepoProvider";
import { GitHubRepoProvider } from "@/providers/repo/GitHubRepoProvider";
import type { RepoProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProd =
  env.PROD === true ||
  env.MODE === "production";

const allowMockInProd =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function useRealRepo(): boolean {
  return env.VITE_USE_REAL_REPO === "true";
}

function createRepoProvider(): RepoProvider {
  const real = useRealRepo();

  if (
    isProd &&
    !real &&
    !allowMockInProd
  ) {
    console.warn(
      "[KoreLumina] Repo provider fallback: MockRepoProvider",
    );
  }

  return real
    ? new GitHubRepoProvider()
    : new MockRepoProvider();
}

export const repo = createRepoProvider();
