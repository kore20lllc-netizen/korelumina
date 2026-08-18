import type { CapabilityProvider } from "./CapabilityProvider.js";

export class CapabilityProviderRegistry {
  private readonly providers = new Map<string, CapabilityProvider>();

  registerCapabilityProvider(provider: CapabilityProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(
        `Capability provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(provider.id, provider);
  }

  getCapabilityProvider(providerId: string): CapabilityProvider | undefined {
    return this.providers.get(providerId);
  }

  listCapabilityProviders(): readonly CapabilityProvider[] {
    return Array.from(this.providers.values());
  }
}

export const capabilityProviderRegistry =
  new CapabilityProviderRegistry();
