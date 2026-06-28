import type { ReasoningProvider } from "./ReasoningProvider.js";
import { reasoningProviderRegistry } from "./ReasoningProviderRegistry.js";

export function registerReasoningProvider(
  provider: ReasoningProvider,
): void {
  reasoningProviderRegistry.registerReasoningProvider(provider);
}
