export type ExecutiveActionabilityStatus =
  | "planned"
  | "actionable"
  | "executing"
  | "optimized"
  | "validated";

export interface ExecutiveActionability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveActionabilityStatus;

  readonly actionabilityScore: number;

  readonly implementationReadiness: number;

  readonly prioritizationScore: number;

  readonly executionReadiness: number;

  readonly recommendedActions:
    readonly string[];

  readonly executionPlans:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveActionabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  actionabilityScore?: number;

  implementationReadiness?: number;

  prioritizationScore?: number;

  executionReadiness?: number;

  status?: ExecutiveActionabilityStatus;

  recommendedActions?: readonly string[];

  executionPlans?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveActionability(
  input:
    CreateExecutiveActionabilityInput,
): ExecutiveActionability {

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

    actionabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.actionabilityScore ??
            100,
        ),
      ),

    implementationReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.implementationReadiness ??
            100,
        ),
      ),

    prioritizationScore:
      Math.max(
        0,
        Math.min(
          100,
          input.prioritizationScore ??
            100,
        ),
      ),

    executionReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.executionReadiness ??
            100,
        ),
      ),

    recommendedActions:
      Object.freeze([
        ...(input.recommendedActions ??
          []),
      ]),

    executionPlans:
      Object.freeze([
        ...(input.executionPlans ??
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
