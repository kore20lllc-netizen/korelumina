import type { ReasoningFinding } from "./ReasoningFinding.js";
import type { ReasoningInput } from "./ReasoningInput.js";
import type { ReasoningRecommendation } from "./ReasoningRecommendation.js";
import { listReasoningProviders } from "./listReasoningProviders.js";

export interface ReasoningPipelineResult {
  findings: ReasoningFinding[];
  recommendations: ReasoningRecommendation[];
}

export async function runReasoningPipeline(
  input: ReasoningInput,
): Promise<ReasoningPipelineResult> {
  const providers = listReasoningProviders();

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
