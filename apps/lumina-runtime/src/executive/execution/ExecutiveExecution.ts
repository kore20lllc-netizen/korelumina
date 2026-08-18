export type ExecutiveExecutionStatus =
  | "planned"
  | "running"
  | "blocked"
  | "completed"
  | "cancelled";

export interface ExecutiveExecution {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveExecutionStatus;

  readonly progress: number;

  readonly dependencies:
    readonly string[];

  readonly blockers:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveExecutionInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  ownerId: string;

  status?: ExecutiveExecutionStatus;

  progress?: number;

  dependencies?: readonly string[];

  blockers?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveExecution(
  input:
    CreateExecutiveExecutionInput,
): ExecutiveExecution {

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

    status:
      input.status ??
      "planned",

    progress:
      Math.max(
        0,
        Math.min(
          100,
          input.progress ??
            0,
        ),
      ),

    dependencies:
      Object.freeze([
        ...(input.dependencies ??
          []),
      ]),

    blockers:
      Object.freeze([
        ...(input.blockers ??
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
