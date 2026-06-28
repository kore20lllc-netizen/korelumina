import type { ReasoningInput } from "./ReasoningInput.js";

export interface ReasoningLearningAdapterInput {
  requestId: string;
  learningOutputId: string;
  summary: string;
  references: string[];
}

export function adaptLearningOutputToReasoningInput(
  input: ReasoningLearningAdapterInput,
): ReasoningInput {
  return {
    requestId: input.requestId,
    learningOutputId: input.learningOutputId,
    summary: input.summary,
    references: input.references,
  };
}
