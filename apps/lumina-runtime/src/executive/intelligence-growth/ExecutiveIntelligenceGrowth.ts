export type ExecutiveIntelligenceGrowthStatus =
  | "planned"
  | "learning"
  | "growing"
  | "optimized"
  | "validated";

export interface ExecutiveIntelligenceGrowth {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveIntelligenceGrowthStatus;

  readonly intelligenceGrowthScore: number;

  readonly reasoningGrowth: number;

  readonly knowledgeExpansion: number;

  readonly decisionImprovement: number;

  readonly learningArtifacts:
    readonly string[];

  readonly intelligenceCapabilities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveIntelligenceGrowthInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  intelligenceGrowthScore?: number;

  reasoningGrowth?: number;

  knowledgeExpansion?: number;

  decisionImprovement?: number;

  status?:
    ExecutiveIntelligenceGrowthStatus;

  learningArtifacts?:
    readonly string[];

  intelligenceCapabilities?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function
createExecutiveIntelligenceGrowth(
  input:
    CreateExecutiveIntelligenceGrowthInput,
): ExecutiveIntelligenceGrowth {

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

    intelligenceGrowthScore:
      Math.max(
        0,
        Math.min(
          100,
          input.intelligenceGrowthScore ??
            100,
        ),
      ),

    reasoningGrowth:
      Math.max(
        0,
        Math.min(
          100,
          input.reasoningGrowth ??
            100,
        ),
      ),

    knowledgeExpansion:
      Math.max(
        0,
        Math.min(
          100,
          input.knowledgeExpansion ??
            100,
        ),
      ),

    decisionImprovement:
      Math.max(
        0,
        Math.min(
          100,
          input.decisionImprovement ??
            100,
        ),
      ),

    learningArtifacts:
      Object.freeze([
        ...(input.learningArtifacts ??
          []),
      ]),

    intelligenceCapabilities:
      Object.freeze([
        ...(input.intelligenceCapabilities ??
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
