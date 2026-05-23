import { MockDeployProvider } from "@/providers/deploy/MockDeployProvider";
import { VercelDeployProvider } from "@/providers/deploy/VercelDeployProvider";
import type { DeployProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProd =
  env.PROD === true ||
  env.MODE === "production";

const allowMockInProd =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function useRealDeploy(): boolean {
  return env.VITE_USE_REAL_DEPLOY === "true";
}

function createDeployProvider(): DeployProvider {
  const real = useRealDeploy();

  if (
    isProd &&
    !real &&
    !allowMockInProd
  ) {
    console.warn(
      "[KoreLumina] Deploy provider fallback: MockDeployProvider",
    );
  }

  return real
    ? new VercelDeployProvider()
    : new MockDeployProvider();
}

export const deploy = createDeployProvider();
