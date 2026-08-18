export type ExecutiveReplaceabilityStatus =
  | "planned"
  | "replaceable"
  | "replacing"
  | "optimized"
  | "validated";

export interface ExecutiveReplaceability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveReplaceabilityStatus;

  readonly replaceabilityScore: number;

  readonly interchangeabilityScore: number;

  readonly dependencyIsolation: number;

  readonly migrationSafety: number;

  readonly replaceableComponents:
    readonly string[];

  readonly replacementStrategies:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveReplaceabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  replaceabilityScore?: number;

  interchangeabilityScore?: number;

  dependencyIsolation?: number;

  migrationSafety?: number;

  status?: ExecutiveReplaceabilityStatus;

  replaceableComponents?: readonly string[];

  replacementStrategies?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveReplaceability(
  input:
    CreateExecutiveReplaceabilityInput,
): ExecutiveReplaceability {

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

    replaceabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.replaceabilityScore ??
            100,
        ),
      ),

    interchangeabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.interchangeabilityScore ??
            100,
        ),
      ),

    dependencyIsolation:
      Math.max(
        0,
        Math.min(
          100,
          input.dependencyIsolation ??
            100,
        ),
      ),

    migrationSafety:
      Math.max(
        0,
        Math.min(
          100,
          input.migrationSafety ??
            100,
        ),
      ),

    replaceableComponents:
      Object.freeze([
        ...(input.replaceableComponents ??
          []),
      ]),

    replacementStrategies:
      Object.freeze([
        ...(input.replacementStrategies ??
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
