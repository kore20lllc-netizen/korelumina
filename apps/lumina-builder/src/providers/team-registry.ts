import { MockTeamProvider } from "@/providers/team/MockTeamProvider";
import { SupabaseTeamProvider } from "@/providers/team/SupabaseTeamProvider";
import type { TeamProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProd =
  env.PROD === true ||
  env.MODE === "production";

const allowMockInProd =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function useRealTeam(): boolean {
  return env.VITE_USE_REAL_TEAM === "true";
}

function createTeamProvider(): TeamProvider {
  const real = useRealTeam();

  if (
    isProd &&
    !real &&
    !allowMockInProd
  ) {
    console.warn(
      "[KoreLumina] Team provider fallback: MockTeamProvider",
    );
  }

  return real
    ? new SupabaseTeamProvider()
    : new MockTeamProvider();
}

export const team = createTeamProvider();
