export type ExecutiveEvolutionStatus =
  | "planned"
  | "evolving"
  | "evolved"
  | "optimized"
  | "validated";

export interface ExecutiveEvolution {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveEvolutionStatus;

  readonly evolutionScore: number;

  readonly maturityGrowth: number;

  readonly capabilityGrowth: number;

  readonly strategicAlignment: number;

  readonly evolutionMilestones:
    readonly string[];

  readonly evolutionOpportunities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveEvolutionInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  evolutionScore?: number;

  maturityGrowth?: number;

  capabilityGrowth?: number;

  strategicAlignment?: number;

  status?: ExecutiveEvolutionStatus;

  evolutionMilestones?:
    readonly string[];

  evolutionOpportunities?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveEvolution(
  input:
    CreateExecutiveEvolutionInput,
): ExecutiveEvolution {

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

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "planned",

    evolutionScore:
      Math.max(
        0,
        Math.min(
          100,
          input.evolutionScore ??
            100,
        ),
      ),

    maturityGrowth:
      Math.max(
        0,
        Math.min(
          100,
          input.maturityGrowth ??
            100,
        ),
      ),

    capabilityGrowth:
      Math.max(
        0,
        Math.min(
          100,
          input.capabilityGrowth ??
            100,
        ),
      ),

    strategicAlignment:
      Math.max(
        0,
        Math.min(
          100,
          input.strategicAlignment ??
            100,
        ),
      ),

    evolutionMilestones:
      Object.freeze([
        ...(input.evolutionMilestones ??
          []),
      ]),

    evolutionOpportunities:
      Object.freeze([
        ...(input.evolutionOpportunities ??
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
