export type ExecutiveLearningStatus =
  | "planned"
  | "learning"
  | "adaptive"
  | "optimized"
  | "validated";

export interface ExecutiveLearning {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveLearningStatus;

  readonly learningScore: number;

  readonly knowledgeGrowth: number;

  readonly capabilityGrowth: number;

  readonly retentionScore: number;

  readonly learningObjectives:
    readonly string[];

  readonly learnedCapabilities:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveLearningInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  learningScore?: number;

  knowledgeGrowth?: number;

  capabilityGrowth?: number;

  retentionScore?: number;

  status?: ExecutiveLearningStatus;

  learningObjectives?:
    readonly string[];

  learnedCapabilities?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<
      Record<string, unknown>
    >;
}

export function createExecutiveLearning(
  input:
    CreateExecutiveLearningInput,
): ExecutiveLearning {

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

    learningScore:
      Math.max(
        0,
        Math.min(
          100,
          input.learningScore ??
            100,
        ),
      ),

    knowledgeGrowth:
      Math.max(
        0,
        Math.min(
          100,
          input.knowledgeGrowth ??
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

    retentionScore:
      Math.max(
        0,
        Math.min(
          100,
          input.retentionScore ??
            100,
        ),
      ),

    learningObjectives:
      Object.freeze([
        ...(input.learningObjectives ??
          []),
      ]),

    learnedCapabilities:
      Object.freeze([
        ...(input.learnedCapabilities ??
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
