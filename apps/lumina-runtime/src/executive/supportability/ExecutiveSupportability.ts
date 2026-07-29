export type ExecutiveSupportabilityStatus =
  | "planned"
  | "supportable"
  | "supporting"
  | "optimized"
  | "validated";

export interface ExecutiveSupportability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveSupportabilityStatus;

  readonly supportabilityScore: number;

  readonly serviceabilityScore: number;

  readonly maintenanceReadiness: number;

  readonly incidentResponseReadiness: number;

  readonly supportChannels:
    readonly string[];

  readonly supportArtifacts:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveSupportabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  supportabilityScore?: number;

  serviceabilityScore?: number;

  maintenanceReadiness?: number;

  incidentResponseReadiness?: number;

  status?: ExecutiveSupportabilityStatus;

  supportChannels?: readonly string[];

  supportArtifacts?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveSupportability(
  input:
    CreateExecutiveSupportabilityInput,
): ExecutiveSupportability {

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

    supportabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.supportabilityScore ??
            100,
        ),
      ),

    serviceabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.serviceabilityScore ??
            100,
        ),
      ),

    maintenanceReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.maintenanceReadiness ??
            100,
        ),
      ),

    incidentResponseReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.incidentResponseReadiness ??
            100,
        ),
      ),

    supportChannels:
      Object.freeze([
        ...(input.supportChannels ??
          []),
      ]),

    supportArtifacts:
      Object.freeze([
        ...(input.supportArtifacts ??
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
