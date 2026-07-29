import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAnalytics,
  type CreateExecutiveAnalyticsInput,
  type ExecutiveAnalytics,
  type ExecutiveAnalyticsStatus,
} from "./ExecutiveAnalytics.js";

export class ExecutiveAnalyticsService {

  private readonly analytics =
    new Map<
      string,
      ExecutiveAnalytics
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAnalyticsInput,
  ): ExecutiveAnalytics {

    const analytics =
      createExecutiveAnalytics(
        input,
      );

    this.analytics.set(
      analytics.id,
      analytics,
    );

    this.timeline.record({
      id:
        `${analytics.id}:created`,
      sessionId:
        analytics.sessionId,
      type:
        "runtime-event",
      actorId:
        analytics.ownerId,
      source:
        "executive-analytics",
      title:
        analytics.name,
      summary:
        analytics.description,
      payload: {
        analyticsId:
          analytics.id,
        metrics:
          analytics.metrics,
      },
    });

    return analytics;
  }

  updateStatus(
    analyticsId: string,
    status:
      ExecutiveAnalyticsStatus,
  ): ExecutiveAnalytics {

    const existing =
      this.analytics.get(
        analyticsId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive analytics "${analyticsId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.analytics.set(
      analyticsId,
      updated,
    );

    this.timeline.record({
      id:
        `${analyticsId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-analytics",
      title:
        updated.name,
      summary:
        `Analytics status changed to ${status}.`,
      payload: {
        analyticsId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.analytics.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.analytics.values(),
      ),
    );
  }

  clear(): void {
    this.analytics.clear();
  }
}

export function
createExecutiveAnalyticsService() {
  return new ExecutiveAnalyticsService();
}
