import { BuiltInCapabilityProvider } from "./BuiltInCapabilityProvider.js";
import { registerCapabilityProvider } from "./registerCapabilityProvider.js";

let registered = false;

export function registerBuiltinCapabilityProviders() {
  if (registered) {
    return;
  }

  registerCapabilityProvider(
    new BuiltInCapabilityProvider(),
  );

  registered = true;
}
