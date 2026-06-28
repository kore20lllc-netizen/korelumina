import type {
  ReasoningFinding,
} from "../reasoning/ReasoningFinding.js";

import type {
  ReasoningRecommendation,
} from "../reasoning/ReasoningRecommendation.js";

import type {
  PlanningInput,
} from "./PlanningInput.js";

export interface PlanningReasoningAdapterInput {
  requestId: string;

  reasoningOutputId: string;

  findings: ReasoningFinding[];

  recommendations: ReasoningRecommendation[];

  references: string[];
}

export function adaptReasoningOutputToPlanningInput(
  input: PlanningReasoningAdapterInput,
): PlanningInput {
  return {
    requestId:
      input.requestId,

    reasoningOutputId:
      input.reasoningOutputId,

    findings:
      input.findings.map(
        (finding) =>
          finding.id,
      ),

    recommendations:
      input.recommendations.map(
        (
          recommendation,
        ) =>
          recommendation.id,
      ),

    references:
      input.references,
  };
}
