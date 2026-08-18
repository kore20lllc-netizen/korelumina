export type ExecutiveMetricDirection =
  | "up"
  | "down"
  | "stable";

export interface ExecutiveMetric {

  readonly id: string;

  readonly sessionId: string;

  readonly name: string;

  readonly category: string;

  readonly value: number;

  readonly target: number;

  readonly unit: string;

  readonly direction:
    ExecutiveMetricDirection;

  readonly recordedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveMetricInput {

  id: string;

  sessionId: string;

  name: string;

  category: string;

  value: number;

  target: number;

  unit?: string;

  direction?:
    ExecutiveMetricDirection;

  recordedAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveMetric(
  input:
    CreateExecutiveMetricInput,
): ExecutiveMetric {

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    name:
      input.name.trim(),

    category:
      input.category.trim(),

    value:
      input.value,

    target:
      input.target,

    unit:
      input.unit ??
      "",

    direction:
      input.direction ??
      "stable",

    recordedAt:
      input.recordedAt ??
      Date.now(),

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
