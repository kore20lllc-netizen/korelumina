export type ExecutiveScenarioStatus =
  | "draft"
  | "active"
  | "validated"
  | "retired";

export interface ExecutiveScenario {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveScenarioStatus;

  readonly assumptions:
    readonly string[];

  readonly risks:
    readonly string[];

  readonly opportunities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveScenarioInput {

  id: string;

  sessionId: string;

  title: string;

  description: string;

  ownerId: string;

  status?: ExecutiveScenarioStatus;

  assumptions?: readonly string[];

  risks?: readonly string[];

  opportunities?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveScenario(
  input:
    CreateExecutiveScenarioInput,
): ExecutiveScenario {

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
      "draft",

    assumptions:
      Object.freeze([
        ...(input.assumptions ??
          []),
      ]),

    risks:
      Object.freeze([
        ...(input.risks ??
          []),
      ]),

    opportunities:
      Object.freeze([
        ...(input.opportunities ??
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
