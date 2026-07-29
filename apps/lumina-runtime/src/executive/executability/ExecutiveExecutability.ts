export type ExecutiveExecutabilityStatus =
  | "planned"
  | "executable"
  | "executing"
  | "optimized"
  | "validated";

export interface ExecutiveExecutability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveExecutabilityStatus;

  readonly executabilityScore: number;

  readonly implementationReadiness: number;

  readonly dependencyReadiness: number;

  readonly executionConfidence: number;

  readonly executionSteps:
    readonly string[];

  readonly executionDependencies:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveExecutabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  executabilityScore?: number;

  implementationReadiness?: number;

  dependencyReadiness?: number;

  executionConfidence?: number;

  status?: ExecutiveExecutabilityStatus;

  executionSteps?: readonly string[];

  executionDependencies?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveExecutability(
  input:
    CreateExecutiveExecutabilityInput,
): ExecutiveExecutability {

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

    executabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.executabilityScore ??
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

    dependencyReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.dependencyReadiness ??
            100,
        ),
      ),

    executionConfidence:
      Math.max(
        0,
        Math.min(
          100,
          input.executionConfidence ??
            100,
        ),
      ),

    executionSteps:
      Object.freeze([
        ...(input.executionSteps ??
          []),
      ]),

    executionDependencies:
      Object.freeze([
        ...(input.executionDependencies ??
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
