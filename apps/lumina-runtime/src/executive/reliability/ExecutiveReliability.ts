export type ExecutiveReliabilityStatus =
  | "unknown"
  | "stable"
  | "degraded"
  | "recovering"
  | "verified";

export interface ExecutiveReliability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveReliabilityStatus;

  readonly availability: number;

  readonly consistency: number;

  readonly incidentCount: number;

  readonly serviceLevel: number;

  readonly dependencies:
    readonly string[];

  readonly incidents:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveReliabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  availability?: number;

  consistency?: number;

  incidentCount?: number;

  serviceLevel?: number;

  status?: ExecutiveReliabilityStatus;

  dependencies?: readonly string[];

  incidents?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveReliability(
  input:
    CreateExecutiveReliabilityInput,
): ExecutiveReliability {

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
      "unknown",

    availability:
      Math.max(
        0,
        Math.min(
          100,
          input.availability ??
            100,
        ),
      ),

    consistency:
      Math.max(
        0,
        Math.min(
          100,
          input.consistency ??
            100,
        ),
      ),

    incidentCount:
      Math.max(
        0,
        input.incidentCount ??
          0,
      ),

    serviceLevel:
      Math.max(
        0,
        Math.min(
          100,
          input.serviceLevel ??
            100,
        ),
      ),

    dependencies:
      Object.freeze([
        ...(input.dependencies ??
          []),
      ]),

    incidents:
      Object.freeze([
        ...(input.incidents ??
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
