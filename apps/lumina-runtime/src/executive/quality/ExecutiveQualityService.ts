import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveQuality,
  type CreateExecutiveQualityInput,
  type ExecutiveQuality,
  type ExecutiveQualityStatus,
} from "./ExecutiveQuality.js";

export class ExecutiveQualityService {

  private readonly qualities =
    new Map<
      string,
      ExecutiveQuality
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveQualityInput,
  ): ExecutiveQuality {

    const quality =
      createExecutiveQuality(
        input,
      );

    this.qualities.set(
      quality.id,
      quality,
    );

    this.timeline.record({
      id:
        `${quality.id}:created`,
      sessionId:
        quality.sessionId,
      type:
        "runtime-event",
      actorId:
        quality.ownerId,
      source:
        "executive-quality",
      title:
        quality.title,
      summary:
        `Quality score ${quality.score}/${quality.target}`,
      payload: {
        qualityId:
          quality.id,
        score:
          quality.score,
        target:
          quality.target,
      },
    });

    return quality;
  }

  updateStatus(
    qualityId: string,
    status:
      ExecutiveQualityStatus,
  ): ExecutiveQuality {

    const existing =
      this.qualities.get(
        qualityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive quality "${qualityId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.qualities.set(
      qualityId,
      updated,
    );

    this.timeline.record({
      id:
        `${qualityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-quality",
      title:
        updated.title,
      summary:
        `Quality status changed to ${status}.`,
      payload: {
        qualityId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.qualities.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.qualities.values(),
      ),
    );
  }

  clear(): void {
    this.qualities.clear();
  }
}

export function
createExecutiveQualityService() {
  return new ExecutiveQualityService();
}
