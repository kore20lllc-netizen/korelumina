import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveProductivity,
  type CreateExecutiveProductivityInput,
  type ExecutiveProductivity,
  type ExecutiveProductivityStatus,
} from "./ExecutiveProductivity.js";

export class ExecutiveProductivityService {

  private readonly records =
    new Map<
      string,
      ExecutiveProductivity
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveProductivityInput,
  ): ExecutiveProductivity {

    const record =
      createExecutiveProductivity(
        input,
      );

    this.records.set(
      record.id,
      record,
    );

    this.timeline.record({
      id:
        `${record.id}:created`,
      sessionId:
        record.sessionId,
      type:
        "runtime-event",
      actorId:
        record.ownerId,
      source:
        "executive-productivity",
      title:
        record.title,
      summary:
        `Productivity score ${record.productivityScore}`,
      payload: {
        productivityId:
          record.id,
        productivityScore:
          record.productivityScore,
        throughputScore:
          record.throughputScore,
        focusScore:
          record.focusScore,
        deliveryVelocity:
          record.deliveryVelocity,
      },
    });

    return record;
  }

  updateStatus(
    productivityId: string,
    status:
      ExecutiveProductivityStatus,
  ): ExecutiveProductivity {

    const existing =
      this.records.get(
        productivityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive productivity "${productivityId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.records.set(
      productivityId,
      updated,
    );

    this.timeline.record({
      id:
        `${productivityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-productivity",
      title:
        updated.title,
      summary:
        `Productivity status changed to ${status}.`,
      payload: {
        productivityId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.records.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.records.values(),
      ),
    );
  }

  clear(): void {
    this.records.clear();
  }
}

export function
createExecutiveProductivityService() {
  return new ExecutiveProductivityService();
}
