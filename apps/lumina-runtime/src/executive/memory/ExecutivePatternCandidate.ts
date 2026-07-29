import type {
  ExecutiveEventConfidence,
  ExecutiveEventEvidence,
} from "../events/index.js";

export type ExecutivePatternCandidateStatus =
  | "proposed"
  | "observing"
  | "validated"
  | "rejected"
  | "superseded";

export interface ExecutivePatternCandidate {
  id: string;

  title: string;

  statement: string;

  reflectionIds:
    readonly string[];

  experienceIds:
    readonly string[];

  evidence:
    readonly ExecutiveEventEvidence[];

  occurrenceCount: number;

  confidence:
    ExecutiveEventConfidence;

  status:
    ExecutivePatternCandidateStatus;

  tags:
    readonly string[];

  createdAt: number;

  updatedAt: number;
}

export interface CreateExecutivePatternCandidateInput {
  id: string;

  title: string;

  statement: string;

  reflectionIds?:
    readonly string[];

  experienceIds?:
    readonly string[];

  evidence?:
    readonly ExecutiveEventEvidence[];

  occurrenceCount?: number;

  confidence:
    ExecutiveEventConfidence;

  status?:
    ExecutivePatternCandidateStatus;

  tags?: readonly string[];

  createdAt?: number;

  updatedAt?: number;
}

export function createExecutivePatternCandidate(
  input:
    CreateExecutivePatternCandidateInput,
): ExecutivePatternCandidate {
  const createdAt =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    ...input,

    reflectionIds:
      Object.freeze([
        ...new Set(
          input.reflectionIds ?? [],
        ),
      ]),

    experienceIds:
      Object.freeze([
        ...new Set(
          input.experienceIds ?? [],
        ),
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

    occurrenceCount:
      input.occurrenceCount ??
      1,

    status:
      input.status ??
      "proposed",

    tags:
      Object.freeze([
        ...new Set(
          input.tags ?? [],
        ),
      ]),

    createdAt,

    updatedAt:
      input.updatedAt ??
      createdAt,
  });
}
