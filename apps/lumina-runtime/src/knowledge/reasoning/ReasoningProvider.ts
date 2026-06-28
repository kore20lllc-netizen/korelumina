import type { ReasoningInput } from "./ReasoningInput.js";
import type { ReasoningFinding } from "./ReasoningFinding.js";
import type { ReasoningRecommendation } from "./ReasoningRecommendation.js";

export interface ReasoningProviderResult {
  findings: ReasoningFinding[];
  recommendations: ReasoningRecommendation[];
}

export interface ReasoningProvider {
  id: string;
  reason(input: ReasoningInput): Promise<ReasoningProviderResult>;
}
