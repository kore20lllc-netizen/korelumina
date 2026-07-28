import type { CapabilityFinding } from "./CapabilityFinding.js";
import type { CapabilityInput } from "./CapabilityInput.js";
import type { CapabilityRecommendation } from "./CapabilityRecommendation.js";
import { listCapabilityProviders } from "./listCapabilityProviders.js";

export interface CapabilityPipelineResult {
  findings: CapabilityFinding[];
  recommendations: CapabilityRecommendation[];
}

export async function runCapabilityPipeline(
  input: CapabilityInput,
): Promise<CapabilityPipelineResult> {
  const providers = listCapabilityProviders();

  const providerResults = await Promise.all(
    providers.map((provider) => provider.reason(input)),
  );

  return {
    findings: providerResults.flatMap((result) => result.findings),
    recommendations: providerResults.flatMap(
      (result) => result.recommendations,
    ),
  };
}
