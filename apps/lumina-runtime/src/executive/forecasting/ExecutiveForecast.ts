export type ExecutiveForecastConfidence =
  | "low"
  | "medium"
  | "high";

export interface ExecutiveForecast {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly horizon: string;

  readonly ownerId: string;

  readonly confidence:
    ExecutiveForecastConfidence;

  readonly assumptions:
    readonly string[];

  readonly outcomes:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveForecastInput {

  id: string;

  sessionId: string;

  title: string;

  horizon: string;

  ownerId: string;

  confidence?:
    ExecutiveForecastConfidence;

  assumptions?: readonly string[];

  outcomes?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveForecast(
  input:
    CreateExecutiveForecastInput,
): ExecutiveForecast {

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

    horizon:
      input.horizon.trim(),

    ownerId:
      input.ownerId.trim(),

    confidence:
      input.confidence ??
      "medium",

    assumptions:
      Object.freeze([
        ...(input.assumptions ??
          []),
      ]),

    outcomes:
      Object.freeze([
        ...(input.outcomes ??
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
