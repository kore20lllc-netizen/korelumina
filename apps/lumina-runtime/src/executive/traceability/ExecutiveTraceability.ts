export type ExecutiveTraceabilityStatus =
  | "planned"
  | "traceable"
  | "tracing"
  | "optimized"
  | "validated";

export interface ExecutiveTraceability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveTraceabilityStatus;

  readonly traceabilityScore: number;

  readonly lineageCoverage: number;

  readonly auditLinkageScore: number;

  readonly provenanceScore: number;

  readonly traceArtifacts:
    readonly string[];

  readonly lineageRecords:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveTraceabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  traceabilityScore?: number;

  lineageCoverage?: number;

  auditLinkageScore?: number;

  provenanceScore?: number;

  status?: ExecutiveTraceabilityStatus;

  traceArtifacts?: readonly string[];

  lineageRecords?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveTraceability(
  input:
    CreateExecutiveTraceabilityInput,
): ExecutiveTraceability {

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

    traceabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.traceabilityScore ??
            100,
        ),
      ),

    lineageCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.lineageCoverage ??
            100,
        ),
      ),

    auditLinkageScore:
      Math.max(
        0,
        Math.min(
          100,
          input.auditLinkageScore ??
            100,
        ),
      ),

    provenanceScore:
      Math.max(
        0,
        Math.min(
          100,
          input.provenanceScore ??
            100,
        ),
      ),

    traceArtifacts:
      Object.freeze([
        ...(input.traceArtifacts ??
          []),
      ]),

    lineageRecords:
      Object.freeze([
        ...(input.lineageRecords ??
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
