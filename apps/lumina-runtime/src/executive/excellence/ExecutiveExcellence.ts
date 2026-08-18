export type ExecutiveExcellenceStatus =
  | "planned"
  | "advancing"
  | "excellent"
  | "sustained"
  | "validated";

export interface ExecutiveExcellence {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveExcellenceStatus;

  readonly excellenceScore: number;

  readonly qualityScore: number;

  readonly consistencyScore: number;

  readonly innovationScore: number;

  readonly excellencePractices:
    readonly string[];

  readonly continuousImprovements:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveExcellenceInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  excellenceScore?: number;

  qualityScore?: number;

  consistencyScore?: number;

  innovationScore?: number;

  status?: ExecutiveExcellenceStatus;

  excellencePractices?: readonly string[];

  continuousImprovements?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveExcellence(
  input:
    CreateExecutiveExcellenceInput,
): ExecutiveExcellence {

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

    excellenceScore:
      Math.max(
        0,
        Math.min(
          100,
          input.excellenceScore ??
            100,
        ),
      ),

    qualityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.qualityScore ??
            100,
        ),
      ),

    consistencyScore:
      Math.max(
        0,
        Math.min(
          100,
          input.consistencyScore ??
            100,
        ),
      ),

    innovationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.innovationScore ??
            100,
        ),
      ),

    excellencePractices:
      Object.freeze([
        ...(input.excellencePractices ??
          []),
      ]),

    continuousImprovements:
      Object.freeze([
        ...(input.continuousImprovements ??
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
