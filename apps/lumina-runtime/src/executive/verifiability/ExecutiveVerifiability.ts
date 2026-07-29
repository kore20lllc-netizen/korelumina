export type ExecutiveVerifiabilityStatus =
  | "planned"
  | "verifiable"
  | "verifying"
  | "optimized"
  | "validated";

export interface ExecutiveVerifiability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveVerifiabilityStatus;

  readonly verifiabilityScore: number;

  readonly evidenceCoverage: number;

  readonly traceabilityScore: number;

  readonly validationReadiness: number;

  readonly verificationArtifacts:
    readonly string[];

  readonly evidenceSources:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveVerifiabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  verifiabilityScore?: number;

  evidenceCoverage?: number;

  traceabilityScore?: number;

  validationReadiness?: number;

  status?: ExecutiveVerifiabilityStatus;

  verificationArtifacts?: readonly string[];

  evidenceSources?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveVerifiability(
  input:
    CreateExecutiveVerifiabilityInput,
): ExecutiveVerifiability {

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

    verifiabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.verifiabilityScore ??
            100,
        ),
      ),

    evidenceCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.evidenceCoverage ??
            100,
        ),
      ),

    traceabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.traceabilityScore ??
            100,
        ),
      ),

    validationReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.validationReadiness ??
            100,
        ),
      ),

    verificationArtifacts:
      Object.freeze([
        ...(input.verificationArtifacts ??
          []),
      ]),

    evidenceSources:
      Object.freeze([
        ...(input.evidenceSources ??
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
