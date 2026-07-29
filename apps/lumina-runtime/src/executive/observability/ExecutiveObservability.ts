export type ExecutiveObservabilityStatus =
  | "planned"
  | "monitoring"
  | "observable"
  | "optimized"
  | "validated";

export interface ExecutiveObservability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveObservabilityStatus;

  readonly observabilityScore: number;

  readonly visibilityScore: number;

  readonly telemetryCoverage: number;

  readonly traceabilityScore: number;

  readonly monitoredCapabilities:
    readonly string[];

  readonly telemetrySources:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<Record<string, unknown>>;
}

export interface CreateExecutiveObservabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  observabilityScore?: number;

  visibilityScore?: number;

  telemetryCoverage?: number;

  traceabilityScore?: number;

  status?:
    ExecutiveObservabilityStatus;

  monitoredCapabilities?:
    readonly string[];

  telemetrySources?:
    readonly string[];

  createdAt?: number;

  metadata?:
    Readonly<Record<string, unknown>>;
}

export function createExecutiveObservability(
  input: CreateExecutiveObservabilityInput,
): ExecutiveObservability {

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

    observabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.observabilityScore ??
            100,
        ),
      ),

    visibilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.visibilityScore ??
            100,
        ),
      ),

    telemetryCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.telemetryCoverage ??
            100,
        ),
      ),

    traceabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.traceabilityScore ??
            100,
        ),
      ),

    monitoredCapabilities:
      Object.freeze([
        ...(input.monitoredCapabilities ?? []),
      ]),

    telemetrySources:
      Object.freeze([
        ...(input.telemetrySources ?? []),
      ]),

    createdAt:
      now,

    updatedAt:
      now,

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}
