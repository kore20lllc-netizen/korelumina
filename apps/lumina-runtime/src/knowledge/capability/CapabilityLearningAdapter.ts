import type { CapabilityInput } from "./CapabilityInput.js";

export interface CapabilityLearningAdapterInput {
  requestId: string;
  learningOutputId: string;
  summary: string;
  references: string[];
}

export function adaptLearningOutputToCapabilityInput(
  input: CapabilityLearningAdapterInput,
): CapabilityInput {
  return {
    requestId: input.requestId,
    learningOutputId: input.learningOutputId,
    summary: input.summary,
    references: input.references,
  };
}
