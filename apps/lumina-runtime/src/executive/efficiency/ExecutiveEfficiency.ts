export type ExecutiveEfficiencyStatus =
  | "planned"
  | "efficient"
  | "optimizing"
  | "optimized"
  | "validated";

export interface ExecutiveEfficiency {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveEfficiencyStatus;

  readonly efficiencyScore: number;

  readonly resourceEfficiency: number;

  readonly timeEfficiency: number;

  readonly costEfficiency: number;

  readonly optimizationInitiatives:
    readonly string[];

  readonly efficiencyMetrics:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveEfficiencyInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  efficiencyScore?: number;

  resourceEfficiency?: number;

  timeEfficiency?: number;

  costEfficiency?: number;

  status?: ExecutiveEfficiencyStatus;

  optimizationInitiatives?: readonly string[];

  efficiencyMetrics?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveEfficiency(
  input:
    CreateExecutiveEfficiencyInput,
): ExecutiveEfficiency {

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

    efficiencyScore:
      Math.max(
        0,
        Math.min(
          100,
          input.efficiencyScore ??
            100,
        ),
      ),

    resourceEfficiency:
      Math.max(
        0,
        Math.min(
          100,
          input.resourceEfficiency ??
            100,
        ),
      ),

    timeEfficiency:
      Math.max(
        0,
        Math.min(
          100,
          input.timeEfficiency ??
            100,
        ),
      ),

    costEfficiency:
      Math.max(
        0,
        Math.min(
          100,
          input.costEfficiency ??
            100,
        ),
      ),

    optimizationInitiatives:
      Object.freeze([
        ...(input.optimizationInitiatives ??
          []),
      ]),

    efficiencyMetrics:
      Object.freeze([
        ...(input.efficiencyMetrics ??
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
