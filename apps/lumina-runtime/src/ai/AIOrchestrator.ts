import { AnthropicProvider } from "./providers/AnthropicProvider.js";
import { MockProvider } from "./providers/MockProvider.js";
import { OpenAIProvider } from "./providers/OpenAIProvider.js";
import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "./AIProvider.js";

/*
 * MS-2026-0011: which model drafts changes. LUMINA_AI_PROVIDER chooses
 * explicitly; without it, Claude is used when ANTHROPIC_API_KEY is set,
 * otherwise the rule-based drafts, which the interface labels as such.
 * Gemini and Ollama had only placeholders that threw; they are no longer
 * offered until they are written.
 */

export type AIProviderName = "anthropic" | "openai" | "rule-based";

export interface AIProviderStatus {
  provider: AIProviderName | null;
  ready: boolean;
  model: string | null;
  problem: string | null;
}

function configuredName(env: NodeJS.ProcessEnv): string {
  const explicit = (env.LUMINA_AI_PROVIDER ?? env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (explicit) return explicit;
  return env.ANTHROPIC_API_KEY ? "anthropic" : "rule-based";
}

function canonical(name: string): AIProviderName | null {
  if (name === "anthropic" || name === "claude") return "anthropic";
  if (name === "openai") return "openai";
  if (name === "mock" || name === "rule" || name === "rule-based") return "rule-based";
  return null;
}

export function aiProviderStatus(env: NodeJS.ProcessEnv = process.env): AIProviderStatus {
  const name = configuredName(env);
  const provider = canonical(name);

  if (!provider) {
    return { provider: null, ready: false, model: null, problem: `unsupported_ai_provider:${name}` };
  }
  if (provider === "anthropic") {
    return {
      provider,
      ready: Boolean(env.ANTHROPIC_API_KEY),
      model: env.LUMINA_ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5",
      problem: env.ANTHROPIC_API_KEY ? null : "missing_ANTHROPIC_API_KEY",
    };
  }
  if (provider === "openai") {
    return {
      provider,
      ready: Boolean(env.OPENAI_API_KEY),
      model: env.LUMINA_OPENAI_MODEL?.trim() || env.OPENAI_MODEL?.trim() || "gpt-5.5",
      problem: env.OPENAI_API_KEY ? null : "missing_OPENAI_API_KEY",
    };
  }
  return { provider, ready: true, model: null, problem: null };
}

function resolveProvider(): AIProvider {
  const status = aiProviderStatus();
  if (!status.provider) throw new Error(status.problem ?? "unsupported_ai_provider");
  if (status.provider === "anthropic") return new AnthropicProvider();
  if (status.provider === "openai") return new OpenAIProvider();
  return new MockProvider();
}

export async function generateAIDraft(
  input: GenerateDraftInput,
): Promise<GenerateDraftResult> {
  return resolveProvider().generateDraft(input);
}
