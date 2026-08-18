export type ExecutivePortabilityStatus =
  | "planned"
  | "portable"
  | "migrating"
  | "optimized"
  | "validated";

export interface ExecutivePortability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutivePortabilityStatus;

  readonly portabilityScore: number;

  readonly platformCoverage: number;

  readonly migrationReadiness: number;

  readonly deploymentFlexibility: number;

  readonly supportedPlatforms:
    readonly string[];

  readonly migrationPaths:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutivePortabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  portabilityScore?: number;

  platformCoverage?: number;

  migrationReadiness?: number;

  deploymentFlexibility?: number;

  status?: ExecutivePortabilityStatus;

  supportedPlatforms?: readonly string[];

  migrationPaths?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutivePortability(
  input:
    CreateExecutivePortabilityInput,
): ExecutivePortability {

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

    portabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.portabilityScore ??
            100,
        ),
      ),

    platformCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.platformCoverage ??
            100,
        ),
      ),

    migrationReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.migrationReadiness ??
            100,
        ),
      ),

    deploymentFlexibility:
      Math.max(
        0,
        Math.min(
          100,
          input.deploymentFlexibility ??
            100,
        ),
      ),

    supportedPlatforms:
      Object.freeze([
        ...(input.supportedPlatforms ??
          []),
      ]),

    migrationPaths:
      Object.freeze([
        ...(input.migrationPaths ??
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
