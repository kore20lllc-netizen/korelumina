export type ExecutiveCoordinationStatus =
  | "pending"
  | "coordinating"
  | "blocked"
  | "completed";

export interface ExecutiveCoordination {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly objective: string;

  readonly coordinatorId: string;

  readonly participants:
    readonly string[];

  readonly status:
    ExecutiveCoordinationStatus;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveCoordinationInput {

  id: string;

  sessionId: string;

  title: string;

  objective: string;

  coordinatorId: string;

  participants?: readonly string[];

  status?: ExecutiveCoordinationStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveCoordination(
  input:
    CreateExecutiveCoordinationInput,
): ExecutiveCoordination {

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

    objective:
      input.objective.trim(),

    coordinatorId:
      input.coordinatorId.trim(),

    participants:
      Object.freeze([
        ...(input.participants ??
          []),
      ]),

    status:
      input.status ??
      "pending",

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
