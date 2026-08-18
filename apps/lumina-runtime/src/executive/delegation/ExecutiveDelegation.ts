export type ExecutiveDelegationStatus =
  | "assigned"
  | "accepted"
  | "in-progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExecutiveDelegation {

  readonly id: string;

  readonly sessionId: string;

  readonly decisionId?: string;

  readonly assignedBy: string;

  readonly assignedTo: string;

  readonly title: string;

  readonly description: string;

  readonly status:
    ExecutiveDelegationStatus;

  readonly priority:
    "low"
    | "normal"
    | "high"
    | "critical";

  readonly dueAt?: number;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDelegationInput {

  id: string;

  sessionId: string;

  decisionId?: string;

  assignedBy: string;

  assignedTo: string;

  title: string;

  description: string;

  priority?:
    | "low"
    | "normal"
    | "high"
    | "critical";

  dueAt?: number;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDelegation(
  input:
    CreateExecutiveDelegationInput,
): ExecutiveDelegation {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    decisionId:
      input.decisionId,

    assignedBy:
      input.assignedBy.trim(),

    assignedTo:
      input.assignedTo.trim(),

    title:
      input.title.trim(),

    description:
      input.description.trim(),

    status:
      "assigned",

    priority:
      input.priority ??
      "normal",

    dueAt:
      input.dueAt,

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
