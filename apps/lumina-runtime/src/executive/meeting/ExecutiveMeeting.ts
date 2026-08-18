export type ExecutiveMeetingStatus =
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled";

export interface ExecutiveMeeting {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly objective: string;

  readonly facilitatorId: string;

  readonly participants:
    readonly string[];

  readonly status:
    ExecutiveMeetingStatus;

  readonly startedAt?: number;

  readonly endedAt?: number;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveMeetingInput {

  id: string;

  sessionId: string;

  title: string;

  objective: string;

  facilitatorId: string;

  participants?: readonly string[];

  status?: ExecutiveMeetingStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveMeeting(
  input:
    CreateExecutiveMeetingInput,
): ExecutiveMeeting {

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

    facilitatorId:
      input.facilitatorId.trim(),

    participants:
      Object.freeze([
        ...(input.participants ??
          []),
      ]),

    status:
      input.status ??
      "scheduled",

    startedAt:
      undefined,

    endedAt:
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
