import type { ReasoningProvider } from "./ReasoningProvider.js";
import { reasoningProviderRegistry } from "./ReasoningProviderRegistry.js";

export function getReasoningProvider(
  providerId: string,
): ReasoningProvider | undefined {
  return reasoningProviderRegistry.getReasoningProvider(providerId);
}
