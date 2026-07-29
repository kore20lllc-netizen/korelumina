export type ExecutiveInnovationStatus =
  | "planned"
  | "innovating"
  | "innovative"
  | "optimized"
  | "validated";

export interface ExecutiveInnovation {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveInnovationStatus;

  readonly innovationScore: number;

  readonly creativityScore: number;

  readonly experimentationScore: number;

  readonly innovationImpact: number;

  readonly innovationInitiatives:
    readonly string[];

  readonly innovationOpportunities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveInnovationInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  innovationScore?: number;

  creativityScore?: number;

  experimentationScore?: number;

  innovationImpact?: number;

  status?: ExecutiveInnovationStatus;

  innovationInitiatives?: readonly string[];

  innovationOpportunities?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveInnovation(
  input:
    CreateExecutiveInnovationInput,
): ExecutiveInnovation {

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

    innovationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.innovationScore ??
            100,
        ),
      ),

    creativityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.creativityScore ??
            100,
        ),
      ),

    experimentationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.experimentationScore ??
            100,
        ),
      ),

    innovationImpact:
      Math.max(
        0,
        Math.min(
          100,
          input.innovationImpact ??
            100,
        ),
      ),

    innovationInitiatives:
      Object.freeze([
        ...(input.innovationInitiatives ??
          []),
      ]),

    innovationOpportunities:
      Object.freeze([
        ...(input.innovationOpportunities ??
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
