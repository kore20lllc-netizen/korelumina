export type ExecutiveAnalyticsStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface ExecutiveAnalytics {

  readonly id: string;

  readonly sessionId: string;

  readonly name: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveAnalyticsStatus;

  readonly metrics:
    Readonly<
      Record<string, number>
    >;

  readonly insights:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveAnalyticsInput {

  id: string;

  sessionId: string;

  name: string;

  description: string;

  ownerId: string;

  status?: ExecutiveAnalyticsStatus;

  metrics?: Readonly<
    Record<string, number>
  >;

  insights?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAnalytics(
  input:
    CreateExecutiveAnalyticsInput,
): ExecutiveAnalytics {

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

    description:
      input.description.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "pending",

    metrics:
      Object.freeze({
        ...(input.metrics ??
          {}),
      }),

    insights:
      Object.freeze([
        ...(input.insights ??
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
