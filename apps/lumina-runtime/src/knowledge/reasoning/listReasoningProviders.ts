import type { ReasoningProvider } from "./ReasoningProvider.js";
import { reasoningProviderRegistry } from "./ReasoningProviderRegistry.js";

export function listReasoningProviders(): readonly ReasoningProvider[] {
  return reasoningProviderRegistry.listReasoningProviders();
}
