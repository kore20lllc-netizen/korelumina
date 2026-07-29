export type ExecutiveOptimizationStatus =
  | "planned"
  | "optimizing"
  | "optimized"
  | "sustained"
  | "validated";

export interface ExecutiveOptimization {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveOptimizationStatus;

  readonly optimizationScore: number;

  readonly performanceGain: number;

  readonly efficiencyGain: number;

  readonly automationGain: number;

  readonly optimizationInitiatives:
    readonly string[];

  readonly optimizationRecommendations:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveOptimizationInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  optimizationScore?: number;

  performanceGain?: number;

  efficiencyGain?: number;

  automationGain?: number;

  status?: ExecutiveOptimizationStatus;

  optimizationInitiatives?: readonly string[];

  optimizationRecommendations?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveOptimization(
  input:
    CreateExecutiveOptimizationInput,
): ExecutiveOptimization {

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

    optimizationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.optimizationScore ??
            100,
        ),
      ),

    performanceGain:
      Math.max(
        0,
        Math.min(
          100,
          input.performanceGain ??
            100,
        ),
      ),

    efficiencyGain:
      Math.max(
        0,
        Math.min(
          100,
          input.efficiencyGain ??
            100,
        ),
      ),

    automationGain:
      Math.max(
        0,
        Math.min(
          100,
          input.automationGain ??
            100,
        ),
      ),

    optimizationInitiatives:
      Object.freeze([
        ...(input.optimizationInitiatives ??
          []),
      ]),

    optimizationRecommendations:
      Object.freeze([
        ...(input.optimizationRecommendations ??
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
