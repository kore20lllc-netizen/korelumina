export type ExecutiveModularityStatus =
  | "planned"
  | "modular"
  | "refactoring"
  | "optimized"
  | "validated";

export interface ExecutiveModularity {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveModularityStatus;

  readonly modularityScore: number;

  readonly cohesionScore: number;

  readonly couplingScore: number;

  readonly boundaryIntegrity: number;

  readonly modules:
    readonly string[];

  readonly dependencies:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveModularityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  modularityScore?: number;

  cohesionScore?: number;

  couplingScore?: number;

  boundaryIntegrity?: number;

  status?: ExecutiveModularityStatus;

  modules?: readonly string[];

  dependencies?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveModularity(
  input:
    CreateExecutiveModularityInput,
): ExecutiveModularity {

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

    modularityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.modularityScore ??
            100,
        ),
      ),

    cohesionScore:
      Math.max(
        0,
        Math.min(
          100,
          input.cohesionScore ??
            100,
        ),
      ),

    couplingScore:
      Math.max(
        0,
        Math.min(
          100,
          input.couplingScore ??
            0,
        ),
      ),

    boundaryIntegrity:
      Math.max(
        0,
        Math.min(
          100,
          input.boundaryIntegrity ??
            100,
        ),
      ),

    modules:
      Object.freeze([
        ...(input.modules ??
          []),
      ]),

    dependencies:
      Object.freeze([
        ...(input.dependencies ??
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
