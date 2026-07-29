import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveMetric,
  type CreateExecutiveMetricInput,
  type ExecutiveMetric,
} from "./ExecutiveMetric.js";

export class ExecutiveMetricService {

  private readonly metrics =
    new Map<
      string,
      ExecutiveMetric
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  record(
    input:
      CreateExecutiveMetricInput,
  ): ExecutiveMetric {

    const metric =
      createExecutiveMetric(
        input,
      );

    this.metrics.set(
      metric.id,
      metric,
    );

    this.timeline.record({
      id:
        `${metric.id}:recorded`,
      sessionId:
        metric.sessionId,
      type:
        "runtime-event",
      actorId:
        "executive-metrics",
      source:
        "executive-metrics",
      title:
        metric.name,
      summary:
        `${metric.value} ${metric.unit}`,
      payload: {
        metricId:
          metric.id,
        category:
          metric.category,
        value:
          metric.value,
        target:
          metric.target,
      },
    });

    return metric;
  }

  get(
    id: string,
  ) {
    return this.metrics.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.metrics.values(),
      ),
    );
  }

  byCategory(
    category: string,
  ) {
    return Object.freeze(
      this.list().filter(
        (metric) =>
          metric.category ===
          category,
      ),
    );
  }

  clear(): void {
    this.metrics.clear();
  }
}

export function
createExecutiveMetricService() {
  return new ExecutiveMetricService();
}
