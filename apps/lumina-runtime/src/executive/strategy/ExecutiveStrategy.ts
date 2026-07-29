export type ExecutiveStrategyStatus =
  | "draft"
  | "approved"
  | "active"
  | "completed"
  | "retired";

export interface ExecutiveStrategy {

  readonly id: string;

  readonly title: string;

  readonly mission: string;

  readonly ownerId: string;

  readonly objectives:
    readonly string[];

  readonly principles:
    readonly string[];

  readonly status:
    ExecutiveStrategyStatus;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveStrategyInput {

  id: string;

  title: string;

  mission: string;

  ownerId: string;

  objectives?: readonly string[];

  principles?: readonly string[];

  status?: ExecutiveStrategyStatus;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveStrategy(
  input:
    CreateExecutiveStrategyInput,
): ExecutiveStrategy {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    title:
      input.title.trim(),

    mission:
      input.mission.trim(),

    ownerId:
      input.ownerId.trim(),

    objectives:
      Object.freeze([
        ...(input.objectives ??
          []),
      ]),

    principles:
      Object.freeze([
        ...(input.principles ??
          []),
      ]),

    status:
      input.status ??
      "draft",

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
