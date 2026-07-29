export type ExecutiveObjectiveStatus =
  | "proposed"
  | "approved"
  | "active"
  | "completed"
  | "cancelled";

export interface ExecutiveObjective {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly priority: number;

  readonly status:
    ExecutiveObjectiveStatus;

  readonly successCriteria:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveObjectiveInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  ownerId: string;

  priority?: number;

  status?: ExecutiveObjectiveStatus;

  successCriteria?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveObjective(
  input:
    CreateExecutiveObjectiveInput,
): ExecutiveObjective {

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

    description:
      input.description.trim(),

    ownerId:
      input.ownerId.trim(),

    priority:
      input.priority ?? 50,

    status:
      input.status ??
      "proposed",

    successCriteria:
      Object.freeze([
        ...(input.successCriteria ??
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
