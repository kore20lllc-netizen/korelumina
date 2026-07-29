export type ExecutiveAssurabilityStatus =
  | "planned"
  | "assured"
  | "assessing"
  | "optimized"
  | "validated";

export interface ExecutiveAssurability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAssurabilityStatus;

  readonly assurabilityScore: number;

  readonly confidenceScore: number;

  readonly evidenceCompleteness: number;

  readonly assuranceReadiness: number;

  readonly assuranceArtifacts:
    readonly string[];

  readonly assuranceControls:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAssurabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  assurabilityScore?: number;

  confidenceScore?: number;

  evidenceCompleteness?: number;

  assuranceReadiness?: number;

  status?: ExecutiveAssurabilityStatus;

  assuranceArtifacts?: readonly string[];

  assuranceControls?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAssurability(
  input:
    CreateExecutiveAssurabilityInput,
): ExecutiveAssurability {

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

    assurabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.assurabilityScore ??
            100,
        ),
      ),

    confidenceScore:
      Math.max(
        0,
        Math.min(
          100,
          input.confidenceScore ??
            100,
        ),
      ),

    evidenceCompleteness:
      Math.max(
        0,
        Math.min(
          100,
          input.evidenceCompleteness ??
            100,
        ),
      ),

    assuranceReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.assuranceReadiness ??
            100,
        ),
      ),

    assuranceArtifacts:
      Object.freeze([
        ...(input.assuranceArtifacts ??
          []),
      ]),

    assuranceControls:
      Object.freeze([
        ...(input.assuranceControls ??
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
