export type ExecutiveDecisionabilityStatus =
  | "planned"
  | "decision-ready"
  | "deciding"
  | "optimized"
  | "validated";

export interface ExecutiveDecisionability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveDecisionabilityStatus;

  readonly decisionabilityScore: number;

  readonly evidenceQuality: number;

  readonly optionCoverage: number;

  readonly decisionConfidence: number;

  readonly decisionOptions:
    readonly string[];

  readonly supportingEvidence:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDecisionabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  decisionabilityScore?: number;

  evidenceQuality?: number;

  optionCoverage?: number;

  decisionConfidence?: number;

  status?: ExecutiveDecisionabilityStatus;

  decisionOptions?: readonly string[];

  supportingEvidence?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDecisionability(
  input:
    CreateExecutiveDecisionabilityInput,
): ExecutiveDecisionability {

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

    decisionabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.decisionabilityScore ??
            100,
        ),
      ),

    evidenceQuality:
      Math.max(
        0,
        Math.min(
          100,
          input.evidenceQuality ??
            100,
        ),
      ),

    optionCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.optionCoverage ??
            100,
        ),
      ),

    decisionConfidence:
      Math.max(
        0,
        Math.min(
          100,
          input.decisionConfidence ??
            100,
        ),
      ),

    decisionOptions:
      Object.freeze([
        ...(input.decisionOptions ??
          []),
      ]),

    supportingEvidence:
      Object.freeze([
        ...(input.supportingEvidence ??
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
