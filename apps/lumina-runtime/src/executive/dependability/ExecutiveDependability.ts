export type ExecutiveDependabilityStatus =
  | "planned"
  | "trusted"
  | "degraded"
  | "improving"
  | "verified";

export interface ExecutiveDependability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveDependabilityStatus;

  readonly dependabilityScore: number;

  readonly trustScore: number;

  readonly faultTolerance: number;

  readonly consistency: number;

  readonly strengths:
    readonly string[];

  readonly weaknesses:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDependabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  dependabilityScore?: number;

  trustScore?: number;

  faultTolerance?: number;

  consistency?: number;

  status?: ExecutiveDependabilityStatus;

  strengths?: readonly string[];

  weaknesses?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDependability(
  input:
    CreateExecutiveDependabilityInput,
): ExecutiveDependability {

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

    dependabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.dependabilityScore ??
            100,
        ),
      ),

    trustScore:
      Math.max(
        0,
        Math.min(
          100,
          input.trustScore ??
            100,
        ),
      ),

    faultTolerance:
      Math.max(
        0,
        Math.min(
          100,
          input.faultTolerance ??
            100,
        ),
      ),

    consistency:
      Math.max(
        0,
        Math.min(
          100,
          input.consistency ??
            100,
        ),
      ),

    strengths:
      Object.freeze([
        ...(input.strengths ??
          []),
      ]),

    weaknesses:
      Object.freeze([
        ...(input.weaknesses ??
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
