export type ExecutiveContinuousImprovementStatus =
  | "planned"
  | "improving"
  | "optimized"
  | "sustained"
  | "validated";

export interface ExecutiveContinuousImprovement {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveContinuousImprovementStatus;

  readonly continuousImprovementScore: number;

  readonly improvementVelocity: number;

  readonly innovationRate: number;

  readonly learningEffectiveness: number;

  readonly improvementInitiatives:
    readonly string[];

  readonly improvementMilestones:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveContinuousImprovementInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  continuousImprovementScore?: number;

  improvementVelocity?: number;

  innovationRate?: number;

  learningEffectiveness?: number;

  status?:
    ExecutiveContinuousImprovementStatus;

  improvementInitiatives?:
    readonly string[];

  improvementMilestones?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function
createExecutiveContinuousImprovement(
  input:
    CreateExecutiveContinuousImprovementInput,
): ExecutiveContinuousImprovement {

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

    continuousImprovementScore:
      Math.max(
        0,
        Math.min(
          100,
          input.continuousImprovementScore ??
            100,
        ),
      ),

    improvementVelocity:
      Math.max(
        0,
        Math.min(
          100,
          input.improvementVelocity ??
            100,
        ),
      ),

    innovationRate:
      Math.max(
        0,
        Math.min(
          100,
          input.innovationRate ??
            100,
        ),
      ),

    learningEffectiveness:
      Math.max(
        0,
        Math.min(
          100,
          input.learningEffectiveness ??
            100,
        ),
      ),

    improvementInitiatives:
      Object.freeze([
        ...(input.improvementInitiatives ??
          []),
      ]),

    improvementMilestones:
      Object.freeze([
        ...(input.improvementMilestones ??
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
