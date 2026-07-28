import type { CapabilityProvider } from "./CapabilityProvider.js";
import { capabilityProviderRegistry } from "./CapabilityProviderRegistry.js";

export function listCapabilityProviders(): readonly CapabilityProvider[] {
  return capabilityProviderRegistry.listCapabilityProviders();
}
