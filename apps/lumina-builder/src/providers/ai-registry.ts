import type { AIProvider } from "@/providers/types";

class MockAIProvider implements AIProvider {
  async chat(): Promise<string> {
    console.warn(
      "[KoreLumina] MockAIProvider.chat placeholder active.",
    );

    return "AI response placeholder";
  }
}

const env =
  (import.meta as {
    env?: Record<string, string | boolean | undefined>;
  }).env ?? {};

const isProd =
  env.PROD === true ||
  env.MODE === "production";

const allowMockInProd =
  env.VITE_ALLOW_MOCK_PROVIDERS === "true";

function createAIProvider(): AIProvider {
  if (
    isProd &&
    !allowMockInProd
  ) {
    console.warn(
      "[KoreLumina] AI provider fallback: MockAIProvider",
    );
  }

  return new MockAIProvider();
}

export const ai = createAIProvider();
