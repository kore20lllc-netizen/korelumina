import { MockUsageProvider } from "@/providers/usage/MockUsageProvider";
import type { UsageProvider } from "@/providers/types";

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProd =
  env.PROD === true ||
  env.MODE === "production";

const allowMockInProd =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function createUsageProvider(): UsageProvider {
  if (
    isProd &&
    !allowMockInProd
  ) {
    console.warn(
      "[KoreLumina] Usage provider fallback: MockUsageProvider",
    );
  }

  return new MockUsageProvider();
}

export const usage = createUsageProvider();
