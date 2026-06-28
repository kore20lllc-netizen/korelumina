import type { ReasoningProvider } from "./ReasoningProvider.js";

export class ReasoningProviderRegistry {
  private readonly providers = new Map<string, ReasoningProvider>();

  registerReasoningProvider(provider: ReasoningProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(
        `Reasoning provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(provider.id, provider);
  }

  getReasoningProvider(providerId: string): ReasoningProvider | undefined {
    return this.providers.get(providerId);
  }

  listReasoningProviders(): readonly ReasoningProvider[] {
    return Array.from(this.providers.values());
  }
}

export const reasoningProviderRegistry =
  new ReasoningProviderRegistry();
