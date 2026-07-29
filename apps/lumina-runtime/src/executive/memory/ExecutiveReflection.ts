import type {
  ExecutiveEventConfidence,
  ExecutiveEventEvidence,
} from "../events/index.js";

export interface ExecutiveReflection {
  id: string;

  experienceId: string;

  observationIds:
    readonly string[];

  memoryRecordIds:
    readonly string[];

  summary: string;

  lessons:
    readonly string[];

  recommendations:
    readonly string[];

  evidence:
    readonly ExecutiveEventEvidence[];

  confidence:
    ExecutiveEventConfidence;

  createdBy: string;

  createdAt: number;
}

export interface CreateExecutiveReflectionInput {
  id: string;

  experienceId: string;

  observationIds?: readonly string[];

  memoryRecordIds?: readonly string[];

  summary: string;

  lessons?: readonly string[];

  recommendations?: readonly string[];

  evidence?:
    readonly ExecutiveEventEvidence[];

  confidence:
    ExecutiveEventConfidence;

  createdBy: string;

  createdAt?: number;
}

export function createExecutiveReflection(
  input:
    CreateExecutiveReflectionInput,
): ExecutiveReflection {
  return Object.freeze({
    ...input,

    observationIds:
      Object.freeze([
        ...new Set(
          input.observationIds ?? [],
        ),
      ]),

    memoryRecordIds:
      Object.freeze([
        ...new Set(
          input.memoryRecordIds ?? [],
        ),
      ]),

    lessons:
      Object.freeze([
        ...input.lessons ?? [],
      ]),

    recommendations:
      Object.freeze([
        ...input.recommendations ?? [],
      ]),

    evidence:
      Object.freeze(
        (input.evidence ?? []).map(
          (evidence) =>
            Object.freeze({
              ...evidence,
            }),
        ),
      ),

    createdAt:
      input.createdAt ??
      Date.now(),
  });
}
