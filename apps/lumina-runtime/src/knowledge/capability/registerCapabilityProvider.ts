import type { CapabilityProvider } from "./CapabilityProvider.js";
import { capabilityProviderRegistry } from "./CapabilityProviderRegistry.js";

export function registerCapabilityProvider(
  provider: CapabilityProvider,
): void {
  capabilityProviderRegistry.registerCapabilityProvider(provider);
}
