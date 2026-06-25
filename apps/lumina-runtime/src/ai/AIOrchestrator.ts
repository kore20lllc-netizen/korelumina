import { AnthropicProvider } from "./providers/AnthropicProvider.js";
import { GeminiProvider } from "./providers/GeminiProvider.js";
import { MockProvider } from "./providers/MockProvider.js";
import { OllamaProvider } from "./providers/OllamaProvider.js";
import { OpenAIProvider } from "./providers/OpenAIProvider.js";
import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "./AIProvider.js";

function configuredProviderName(): string {
  return (
    process.env.LUMINA_AI_PROVIDER ??
    process.env.AI_PROVIDER ??
    "mock"
  ).trim().toLowerCase();
}

function resolveProvider(): AIProvider {
  const provider = configuredProviderName();

  switch (provider) {
    case "openai":
      return new OpenAIProvider();

    case "anthropic":
    case "claude":
      return new AnthropicProvider();

    case "gemini":
    case "google":
      return new GeminiProvider();

    case "ollama":
    case "local":
      return new OllamaProvider();

    case "mock":
    case "rule":
    case "rule-based":
      return new MockProvider();

    default:
      throw new Error(
        `unsupported_ai_provider:${provider}`,
      );
  }
}

export async function generateAIDraft(
  input: GenerateDraftInput,
): Promise<GenerateDraftResult> {
  const provider = resolveProvider();

  return provider.generateDraft(
    input,
  );
}
