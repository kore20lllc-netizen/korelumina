export type ExecutiveCertifiabilityStatus =
  | "planned"
  | "certifiable"
  | "certifying"
  | "optimized"
  | "validated";

export interface ExecutiveCertifiability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveCertifiabilityStatus;

  readonly certifiabilityScore: number;

  readonly complianceReadiness: number;

  readonly evidenceCoverage: number;

  readonly certificationReadiness: number;

  readonly certifications:
    readonly string[];

  readonly certificationEvidence:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveCertifiabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  certifiabilityScore?: number;

  complianceReadiness?: number;

  evidenceCoverage?: number;

  certificationReadiness?: number;

  status?: ExecutiveCertifiabilityStatus;

  certifications?: readonly string[];

  certificationEvidence?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveCertifiability(
  input:
    CreateExecutiveCertifiabilityInput,
): ExecutiveCertifiability {

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

    certifiabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.certifiabilityScore ??
            100,
        ),
      ),

    complianceReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.complianceReadiness ??
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

    certificationReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.certificationReadiness ??
            100,
        ),
      ),

    certifications:
      Object.freeze([
        ...(input.certifications ??
          []),
      ]),

    certificationEvidence:
      Object.freeze([
        ...(input.certificationEvidence ??
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
