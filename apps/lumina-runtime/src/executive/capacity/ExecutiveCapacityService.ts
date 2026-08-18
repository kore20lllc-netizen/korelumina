import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveCapacity,
  type CreateExecutiveCapacityInput,
  type ExecutiveCapacity,
  type ExecutiveCapacityStatus,
} from "./ExecutiveCapacity.js";

export class ExecutiveCapacityService {

  private readonly capacities =
    new Map<
      string,
      ExecutiveCapacity
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveCapacityInput,
  ): ExecutiveCapacity {

    const capacity =
      createExecutiveCapacity(
        input,
      );

    this.capacities.set(
      capacity.id,
      capacity,
    );

    this.timeline.record({
      id:
        `${capacity.id}:created`,
      sessionId:
        capacity.sessionId,
      type:
        "runtime-event",
      actorId:
        capacity.ownerId,
      source:
        "executive-capacity",
      title:
        capacity.name,
      summary:
        `Capacity utilization ${capacity.utilization}%`,
      payload: {
        capacityId:
          capacity.id,
        available:
          capacity.available,
        allocated:
          capacity.allocated,
        reserved:
          capacity.reserved,
      },
    });

    return capacity;
  }

  updateStatus(
    capacityId: string,
    status:
      ExecutiveCapacityStatus,
  ): ExecutiveCapacity {

    const existing =
      this.capacities.get(
        capacityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive capacity "${capacityId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.capacities.set(
      capacityId,
      updated,
    );

    this.timeline.record({
      id:
        `${capacityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-capacity",
      title:
        updated.name,
      summary:
        `Capacity status changed to ${status}.`,
      payload: {
        capacityId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.capacities.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.capacities.values(),
      ),
    );
  }

  clear(): void {
    this.capacities.clear();
  }
}

export function
createExecutiveCapacityService() {
  return new ExecutiveCapacityService();
}
