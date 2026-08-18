export type ExecutiveEffectivenessStatus =
  | "planned"
  | "effective"
  | "improving"
  | "optimized"
  | "validated";

export interface ExecutiveEffectiveness {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveEffectivenessStatus;

  readonly effectivenessScore: number;

  readonly outcomeAchievement: number;

  readonly executionEfficiency: number;

  readonly valueRealization: number;

  readonly achievedOutcomes:
    readonly string[];

  readonly improvementActions:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveEffectivenessInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  effectivenessScore?: number;

  outcomeAchievement?: number;

  executionEfficiency?: number;

  valueRealization?: number;

  status?: ExecutiveEffectivenessStatus;

  achievedOutcomes?: readonly string[];

  improvementActions?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveEffectiveness(
  input:
    CreateExecutiveEffectivenessInput,
): ExecutiveEffectiveness {

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

    effectivenessScore:
      Math.max(
        0,
        Math.min(
          100,
          input.effectivenessScore ??
            100,
        ),
      ),

    outcomeAchievement:
      Math.max(
        0,
        Math.min(
          100,
          input.outcomeAchievement ??
            100,
        ),
      ),

    executionEfficiency:
      Math.max(
        0,
        Math.min(
          100,
          input.executionEfficiency ??
            100,
        ),
      ),

    valueRealization:
      Math.max(
        0,
        Math.min(
          100,
          input.valueRealization ??
            100,
        ),
      ),

    achievedOutcomes:
      Object.freeze([
        ...(input.achievedOutcomes ??
          []),
      ]),

    improvementActions:
      Object.freeze([
        ...(input.improvementActions ??
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
