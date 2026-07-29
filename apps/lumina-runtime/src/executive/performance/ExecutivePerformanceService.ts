import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutivePerformance,
  type CreateExecutivePerformanceInput,
  type ExecutivePerformance,
  type ExecutivePerformanceStatus,
} from "./ExecutivePerformance.js";

export class ExecutivePerformanceService {

  private readonly performances =
    new Map<
      string,
      ExecutivePerformance
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutivePerformanceInput,
  ): ExecutivePerformance {

    const performance =
      createExecutivePerformance(
        input,
      );

    this.performances.set(
      performance.id,
      performance,
    );

    this.timeline.record({
      id:
        `${performance.id}:created`,
      sessionId:
        performance.sessionId,
      type:
        "runtime-event",
      actorId:
        performance.ownerId,
      source:
        "executive-performance",
      title:
        performance.name,
      summary:
        `Performance score ${performance.score}/${performance.target}`,
      payload: {
        performanceId:
          performance.id,
        score:
          performance.score,
        target:
          performance.target,
        trend:
          performance.trend,
      },
    });

    return performance;
  }

  updateStatus(
    performanceId: string,
    status:
      ExecutivePerformanceStatus,
  ): ExecutivePerformance {

    const existing =
      this.performances.get(
        performanceId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive performance "${performanceId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.performances.set(
      performanceId,
      updated,
    );

    this.timeline.record({
      id:
        `${performanceId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-performance",
      title:
        updated.name,
      summary:
        `Performance status changed to ${status}.`,
      payload: {
        performanceId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.performances.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.performances.values(),
      ),
    );
  }

  clear(): void {
    this.performances.clear();
  }
}

export function
createExecutivePerformanceService() {
  return new ExecutivePerformanceService();
}
