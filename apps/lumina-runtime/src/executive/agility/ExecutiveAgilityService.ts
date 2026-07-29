import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAgility,
  type CreateExecutiveAgilityInput,
  type ExecutiveAgility,
  type ExecutiveAgilityStatus,
} from "./ExecutiveAgility.js";

export class ExecutiveAgilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAgility
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAgilityInput,
  ): ExecutiveAgility {

    const record =
      createExecutiveAgility(
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
        "executive-agility",
      title:
        record.title,
      summary:
        `Agility score ${record.agilityScore}`,
      payload: {
        agilityId:
          record.id,
        agilityScore:
          record.agilityScore,
        responsivenessScore:
          record.responsivenessScore,
        decisionVelocity:
          record.decisionVelocity,
        deliveryVelocity:
          record.deliveryVelocity,
      },
    });

    return record;
  }

  updateStatus(
    agilityId: string,
    status:
      ExecutiveAgilityStatus,
  ): ExecutiveAgility {

    const existing =
      this.records.get(
        agilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive agility "${agilityId}".`,
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
      agilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${agilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-agility",
      title:
        updated.title,
      summary:
        `Agility status changed to ${status}.`,
      payload: {
        agilityId,
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
createExecutiveAgilityService() {
  return new ExecutiveAgilityService();
}
