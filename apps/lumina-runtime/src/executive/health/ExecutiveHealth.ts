export type ExecutiveHealthStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "recovering"
  | "verified";

export interface ExecutiveHealth {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveHealthStatus;

  readonly healthScore: number;

  readonly availability: number;

  readonly stability: number;

  readonly indicators:
    readonly string[];

  readonly issues:
    readonly string[];

  readonly actions:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveHealthInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  healthScore?: number;

  availability?: number;

  stability?: number;

  status?: ExecutiveHealthStatus;

  indicators?: readonly string[];

  issues?: readonly string[];

  actions?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveHealth(
  input:
    CreateExecutiveHealthInput,
): ExecutiveHealth {

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
      "healthy",

    healthScore:
      Math.max(
        0,
        Math.min(
          100,
          input.healthScore ??
            100,
        ),
      ),

    availability:
      Math.max(
        0,
        Math.min(
          100,
          input.availability ??
            100,
        ),
      ),

    stability:
      Math.max(
        0,
        Math.min(
          100,
          input.stability ??
            100,
        ),
      ),

    indicators:
      Object.freeze([
        ...(input.indicators ??
          []),
      ]),

    issues:
      Object.freeze([
        ...(input.issues ??
          []),
      ]),

    actions:
      Object.freeze([
        ...(input.actions ??
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
