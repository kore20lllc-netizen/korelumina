export type ExecutiveQualityStatus =
  | "planned"
  | "baseline"
  | "improving"
  | "excellent"
  | "degraded";

export interface ExecutiveQuality {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveQualityStatus;

  readonly score: number;

  readonly target: number;

  readonly dimensions:
    readonly string[];

  readonly findings:
    readonly string[];

  readonly recommendations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveQualityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  score?: number;

  target?: number;

  status?: ExecutiveQualityStatus;

  dimensions?: readonly string[];

  findings?: readonly string[];

  recommendations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveQuality(
  input:
    CreateExecutiveQualityInput,
): ExecutiveQuality {

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

    score:
      Math.max(
        0,
        Math.min(
          100,
          input.score ??
            0,
        ),
      ),

    target:
      Math.max(
        0,
        Math.min(
          100,
          input.target ??
            100,
        ),
      ),

    dimensions:
      Object.freeze([
        ...(input.dimensions ??
          []),
      ]),

    findings:
      Object.freeze([
        ...(input.findings ??
          []),
      ]),

    recommendations:
      Object.freeze([
        ...(input.recommendations ??
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
