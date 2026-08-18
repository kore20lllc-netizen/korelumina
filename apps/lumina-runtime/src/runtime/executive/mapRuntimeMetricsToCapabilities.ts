import type {
  RuntimeCapabilityMetrics,
} from "../../executive/runtime/index.js";

export interface RuntimeMetricsSnapshot {

  readonly memory: {

    readonly rssMb: number;

    readonly heapUsedMb: number;

  };

  readonly cpu: {

    readonly usagePercent: number;

  };

  readonly runtime: {

    readonly runningProjects: number;

    readonly registeredProjects: number;

    readonly watcherCount: number;

  };
}

function clamp(
  value: number,
): number {

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

export function
mapRuntimeMetricsToCapabilities(
  metrics:
    RuntimeMetricsSnapshot,
): RuntimeCapabilityMetrics {

  const runtimeHealth =
    clamp(
      100 -
      metrics.cpu.usagePercent,
    );

  const runtimePerformance =
    clamp(
      100 -
      metrics.cpu.usagePercent,
    );

  const runtimeReliability =
    metrics.runtime.registeredProjects === 0
      ? 100
      : clamp(
          metrics.runtime.runningProjects /
            metrics.runtime.registeredProjects *
            100,
        );

  const runtimeObservability =
    metrics.runtime.watcherCount > 0
      ? 100
      : 50;

  const runtimeScalability =
    clamp(
      100 -
      metrics.memory.heapUsedMb /
        20,
    );

  const runtimeSecurity =
    100;

  return Object.freeze({

    runtimeHealth,

    runtimePerformance,

    runtimeReliability,

    runtimeObservability,

    runtimeScalability,

    runtimeSecurity,
  });
}
