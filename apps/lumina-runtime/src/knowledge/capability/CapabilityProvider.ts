import type { CapabilityInput } from "./CapabilityInput.js";
import type { CapabilityFinding } from "./CapabilityFinding.js";
import type { CapabilityRecommendation } from "./CapabilityRecommendation.js";

export interface CapabilityProviderResult {
  findings: CapabilityFinding[];
  recommendations: CapabilityRecommendation[];
}

export interface CapabilityProvider {
  id: string;
  reason(input: CapabilityInput): Promise<CapabilityProviderResult>;
}
