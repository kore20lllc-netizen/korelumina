export type ExecutiveOversightStatus =
  | "monitoring"
  | "attention-required"
  | "escalated"
  | "resolved";

export interface ExecutiveOversight {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly scope: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveOversightStatus;

  readonly observations:
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

export interface CreateExecutiveOversightInput {

  id: string;

  sessionId: string;

  title: string;

  scope: string;

  ownerId: string;

  status?: ExecutiveOversightStatus;

  observations?: readonly string[];

  actions?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveOversight(
  input:
    CreateExecutiveOversightInput,
): ExecutiveOversight {

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

    scope:
      input.scope.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "monitoring",

    observations:
      Object.freeze([
        ...(input.observations ??
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
