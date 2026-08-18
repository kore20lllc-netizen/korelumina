export type ExecutiveDecidabilityStatus =
  | "planned"
  | "decidable"
  | "evaluating"
  | "optimized"
  | "validated";

export interface ExecutiveDecidability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveDecidabilityStatus;

  readonly decidabilityScore: number;

  readonly optionClarity: number;

  readonly ambiguityReduction: number;

  readonly recommendationStrength: number;

  readonly candidateDecisions:
    readonly string[];

  readonly decisionCriteria:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDecidabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  decidabilityScore?: number;

  optionClarity?: number;

  ambiguityReduction?: number;

  recommendationStrength?: number;

  status?: ExecutiveDecidabilityStatus;

  candidateDecisions?: readonly string[];

  decisionCriteria?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDecidability(
  input:
    CreateExecutiveDecidabilityInput,
): ExecutiveDecidability {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({

    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    title:
      input.title.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "planned",

    decidabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.decidabilityScore ??
            100,
        ),
      ),

    optionClarity:
      Math.max(
        0,
        Math.min(
          100,
          input.optionClarity ??
            100,
        ),
      ),

    ambiguityReduction:
      Math.max(
        0,
        Math.min(
          100,
          input.ambiguityReduction ??
            100,
        ),
      ),

    recommendationStrength:
      Math.max(
        0,
        Math.min(
          100,
          input.recommendationStrength ??
            100,
        ),
      ),

    candidateDecisions:
      Object.freeze([
        ...(input.candidateDecisions ??
          []),
      ]),

    decisionCriteria:
      Object.freeze([
        ...(input.decisionCriteria ??
          []),
      ]),

    createdAt:
      now,

    updatedAt:
      now,

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
