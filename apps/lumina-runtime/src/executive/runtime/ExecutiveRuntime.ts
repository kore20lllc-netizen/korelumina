export interface ExecutiveCapabilitySummary {

  readonly capability: string;

  readonly score: number;

  readonly weight: number;
}

export interface ExecutiveRuntimeSnapshot {

  readonly id: string;

  readonly sessionId: string;

  readonly timestamp: number;

  readonly overallHealth: number;

  readonly executiveReadiness: number;

  readonly executiveConfidence: number;

  readonly executiveRisk: number;

  readonly executiveIntelligence: number;

  readonly executivePerformance: number;

  readonly executiveMaturity: number;

  readonly capabilities:
    readonly ExecutiveCapabilitySummary[];
}

export interface CreateExecutiveRuntimeSnapshotInput {

  id: string;

  sessionId: string;

  capabilities?:
    readonly ExecutiveCapabilitySummary[];

  timestamp?: number;
}

function weightedAverage(
  capabilities:
    readonly ExecutiveCapabilitySummary[],
) {

  if (
    capabilities.length === 0
  ) {
    return 100;
  }

  const totalWeight =
    capabilities.reduce(
      (sum, capability) =>
        sum + capability.weight,
      0,
    );

  if (totalWeight <= 0) {
    return 100;
  }

  const score =
    capabilities.reduce(
      (sum, capability) =>
        sum +
        capability.score *
          capability.weight,
      0,
    ) / totalWeight;

  return Math.round(score);
}

export function
createExecutiveRuntimeSnapshot(
  input:
    CreateExecutiveRuntimeSnapshotInput,
): ExecutiveRuntimeSnapshot {

  const capabilities =
    Object.freeze([
      ...(input.capabilities ?? []),
    ]);

  const health =
    weightedAverage(
      capabilities,
    );

  return Object.freeze({

    id:
      input.id,

    sessionId:
      input.sessionId,

    timestamp:
      input.timestamp ??
      Date.now(),

    overallHealth:
      health,

    executiveReadiness:
      health,

    executiveConfidence:
      health,

    executiveRisk:
      100 - health,

    executiveIntelligence:
      health,

    executivePerformance:
      health,

    executiveMaturity:
      health,

    capabilities,
  });
}
