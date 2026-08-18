export type ExecutiveActionStatus =
  | "planned"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExecutiveAction {

  readonly id: string;

  readonly sessionId: string;

  readonly delegationId?: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveActionStatus;

  readonly startedAt?: number;

  readonly completedAt?: number;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveActionInput {

  id: string;

  sessionId: string;

  delegationId?: string;

  title: string;

  description: string;

  ownerId: string;

  status?: ExecutiveActionStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveAction(
  input:
    CreateExecutiveActionInput,
): ExecutiveAction {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    delegationId:
      input.delegationId,

    title:
      input.title.trim(),

    description:
      input.description.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "planned",

    startedAt:
      undefined,

    completedAt:
      undefined,

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
