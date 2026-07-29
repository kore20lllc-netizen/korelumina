export type ExecutivePerformanceStatus =
  | "on-track"
  | "at-risk"
  | "off-track"
  | "recovered";

export interface ExecutivePerformance {

  readonly id: string;

  readonly sessionId: string;

  readonly name: string;

  readonly ownerId: string;

  readonly status:
    ExecutivePerformanceStatus;

  readonly score: number;

  readonly target: number;

  readonly trend:
    | "up"
    | "down"
    | "stable";

  readonly observations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutivePerformanceInput {

  id: string;

  sessionId: string;

  name: string;

  ownerId: string;

  score: number;

  target: number;

  trend?:
    | "up"
    | "down"
    | "stable";

  status?: ExecutivePerformanceStatus;

  observations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutivePerformance(
  input:
    CreateExecutivePerformanceInput,
): ExecutivePerformance {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    name:
      input.name.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "on-track",

    score:
      input.score,

    target:
      input.target,

    trend:
      input.trend ??
      "stable",

    observations:
      Object.freeze([
        ...(input.observations ??
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
