export type ExecutivePortfolioStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export interface ExecutivePortfolio {

  readonly id: string;

  readonly sessionId: string;

  readonly name: string;

  readonly description: string;

  readonly ownerId: string;

  readonly status:
    ExecutivePortfolioStatus;

  readonly initiatives:
    readonly string[];

  readonly objectives:
    readonly string[];

  readonly budget: number;

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutivePortfolioInput {

  id: string;

  sessionId: string;

  name: string;

  description: string;

  ownerId: string;

  status?: ExecutivePortfolioStatus;

  initiatives?: readonly string[];

  objectives?: readonly string[];

  budget?: number;

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutivePortfolio(
  input:
    CreateExecutivePortfolioInput,
): ExecutivePortfolio {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    name:
      input.name.trim(),

    description:
      input.description.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "planning",

    initiatives:
      Object.freeze([
        ...(input.initiatives ??
          []),
      ]),

    objectives:
      Object.freeze([
        ...(input.objectives ??
          []),
      ]),

    budget:
      input.budget ??
      0,

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
