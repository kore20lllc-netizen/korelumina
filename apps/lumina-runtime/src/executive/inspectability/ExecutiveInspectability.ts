export type ExecutiveInspectabilityStatus =
  | "planned"
  | "inspectable"
  | "inspecting"
  | "optimized"
  | "validated";

export interface ExecutiveInspectability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveInspectabilityStatus;

  readonly inspectabilityScore: number;

  readonly transparencyScore: number;

  readonly diagnosticCoverage: number;

  readonly introspectionReadiness: number;

  readonly inspectionEndpoints:
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

export interface CreateExecutiveInspectabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  inspectabilityScore?: number;

  transparencyScore?: number;

  diagnosticCoverage?: number;

  introspectionReadiness?: number;

  status?: ExecutiveInspectabilityStatus;

  inspectionEndpoints?: readonly string[];

  diagnosticArtifacts?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveInspectability(
  input:
    CreateExecutiveInspectabilityInput,
): ExecutiveInspectability {

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

    inspectabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.inspectabilityScore ??
            100,
        ),
      ),

    transparencyScore:
      Math.max(
        0,
        Math.min(
          100,
          input.transparencyScore ??
            100,
        ),
      ),

    diagnosticCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.diagnosticCoverage ??
            100,
        ),
      ),

    introspectionReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.introspectionReadiness ??
            100,
        ),
      ),

    inspectionEndpoints:
      Object.freeze([
        ...(input.inspectionEndpoints ??
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
