export type ExecutiveOutcomeStatus =
  | "planned"
  | "achieved"
  | "partial"
  | "missed";

export interface ExecutiveOutcome {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveOutcomeStatus;

  readonly successScore: number;

  readonly objectives:
    readonly string[];

  readonly lessonsLearned:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveOutcomeInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  ownerId: string;

  status?: ExecutiveOutcomeStatus;

  successScore?: number;

  objectives?: readonly string[];

  lessonsLearned?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveOutcome(
  input:
    CreateExecutiveOutcomeInput,
): ExecutiveOutcome {

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

    successScore:
      Math.max(
        0,
        Math.min(
          100,
          input.successScore ??
            0,
        ),
      ),

    objectives:
      Object.freeze([
        ...(input.objectives ??
          []),
      ]),

    lessonsLearned:
      Object.freeze([
        ...(input.lessonsLearned ??
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
