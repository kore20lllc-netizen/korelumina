import type { CapabilityProvider } from "./CapabilityProvider.js";
import { capabilityProviderRegistry } from "./CapabilityProviderRegistry.js";

export function getCapabilityProvider(
  providerId: string,
): CapabilityProvider | undefined {
  return capabilityProviderRegistry.getCapabilityProvider(providerId);
}
