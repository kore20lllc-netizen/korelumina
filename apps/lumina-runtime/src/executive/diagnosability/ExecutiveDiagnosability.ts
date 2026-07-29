export type ExecutiveDiagnosabilityStatus =
  | "planned"
  | "diagnosable"
  | "diagnosing"
  | "optimized"
  | "validated";

export interface ExecutiveDiagnosability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveDiagnosabilityStatus;

  readonly diagnosabilityScore: number;

  readonly faultIsolationScore: number;

  readonly rootCauseCoverage: number;

  readonly telemetryReadiness: number;

  readonly diagnosticCapabilities:
    readonly string[];

  readonly diagnosticArtifacts:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDiagnosabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  diagnosabilityScore?: number;

  faultIsolationScore?: number;

  rootCauseCoverage?: number;

  telemetryReadiness?: number;

  status?: ExecutiveDiagnosabilityStatus;

  diagnosticCapabilities?: readonly string[];

  diagnosticArtifacts?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDiagnosability(
  input:
    CreateExecutiveDiagnosabilityInput,
): ExecutiveDiagnosability {

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

    diagnosabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.diagnosabilityScore ??
            100,
        ),
      ),

    faultIsolationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.faultIsolationScore ??
            100,
        ),
      ),

    rootCauseCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.rootCauseCoverage ??
            100,
        ),
      ),

    telemetryReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.telemetryReadiness ??
            100,
        ),
      ),

    diagnosticCapabilities:
      Object.freeze([
        ...(input.diagnosticCapabilities ??
          []),
      ]),

    diagnosticArtifacts:
      Object.freeze([
        ...(input.diagnosticArtifacts ??
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
