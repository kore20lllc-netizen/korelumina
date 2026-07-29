export type ExecutiveMonitorabilityStatus =
  | "planned"
  | "monitorable"
  | "monitoring"
  | "optimized"
  | "validated";

export interface ExecutiveMonitorability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveMonitorabilityStatus;

  readonly monitorabilityScore: number;

  readonly observabilityCoverage: number;

  readonly alertingReadiness: number;

  readonly telemetryCompleteness: number;

  readonly monitoringEndpoints:
    readonly string[];

  readonly alertPolicies:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveMonitorabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  monitorabilityScore?: number;

  observabilityCoverage?: number;

  alertingReadiness?: number;

  telemetryCompleteness?: number;

  status?: ExecutiveMonitorabilityStatus;

  monitoringEndpoints?: readonly string[];

  alertPolicies?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveMonitorability(
  input:
    CreateExecutiveMonitorabilityInput,
): ExecutiveMonitorability {

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

    monitorabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.monitorabilityScore ??
            100,
        ),
      ),

    observabilityCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.observabilityCoverage ??
            100,
        ),
      ),

    alertingReadiness:
      Math.max(
        0,
        Math.min(
          100,
          input.alertingReadiness ??
            100,
        ),
      ),

    telemetryCompleteness:
      Math.max(
        0,
        Math.min(
          100,
          input.telemetryCompleteness ??
            100,
        ),
      ),

    monitoringEndpoints:
      Object.freeze([
        ...(input.monitoringEndpoints ??
          []),
      ]),

    alertPolicies:
      Object.freeze([
        ...(input.alertPolicies ??
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
