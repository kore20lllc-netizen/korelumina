import type {
  CapabilityInput,
} from "./CapabilityInput.js";

import type {
  CapabilityProvider,
  CapabilityProviderResult,
} from "./CapabilityProvider.js";

export class BuiltInCapabilityProvider
  implements CapabilityProvider
{
  readonly id = "builtin";

  readonly displayName =
    "Built-in Capability Provider";

  async reason(
    _input: CapabilityInput,
  ): Promise<CapabilityProviderResult> {
    return {
      findings: [],
      recommendations: [],
    };
  }
}
