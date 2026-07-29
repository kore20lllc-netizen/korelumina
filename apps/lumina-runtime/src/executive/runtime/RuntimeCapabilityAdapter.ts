import type {
  ExecutiveCapabilitySummary,
} from "./ExecutiveRuntime.js";

export interface RuntimeCapabilityMetrics {

  readonly runtimeHealth: number;

  readonly runtimePerformance: number;

  readonly runtimeReliability: number;

  readonly runtimeObservability: number;

  readonly runtimeScalability: number;

  readonly runtimeSecurity: number;
}

export class RuntimeCapabilityAdapter {

  adapt(
    metrics: RuntimeCapabilityMetrics,
  ): readonly ExecutiveCapabilitySummary[] {

    return Object.freeze([

      Object.freeze({
        capability: "health",
        score: metrics.runtimeHealth,
        weight: 5,
      }),

      Object.freeze({
        capability: "performance",
        score: metrics.runtimePerformance,
        weight: 5,
      }),

      Object.freeze({
        capability: "reliability",
        score: metrics.runtimeReliability,
        weight: 4,
      }),

      Object.freeze({
        capability: "observability",
        score: metrics.runtimeObservability,
        weight: 3,
      }),

      Object.freeze({
        capability: "scalability",
        score: metrics.runtimeScalability,
        weight: 3,
      }),

      Object.freeze({
        capability: "security",
        score: metrics.runtimeSecurity,
        weight: 5,
      }),

    ]);
  }
}

export function
createRuntimeCapabilityAdapter() {

  return new RuntimeCapabilityAdapter();
}
