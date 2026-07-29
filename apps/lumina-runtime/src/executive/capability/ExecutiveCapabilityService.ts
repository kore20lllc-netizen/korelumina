import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveCapability,
  type CreateExecutiveCapabilityInput,
  type ExecutiveCapability,
  type ExecutiveCapabilityStatus,
} from "./ExecutiveCapability.js";

export class ExecutiveCapabilityService {

  private readonly capabilities =
    new Map<
      string,
      ExecutiveCapability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveCapabilityInput,
  ): ExecutiveCapability {

    const capability =
      createExecutiveCapability(
        input,
      );

    this.capabilities.set(
      capability.id,
      capability,
    );

    this.timeline.record({
      id:
        `${capability.id}:created`,
      sessionId:
        "executive-capability",
      type:
        "runtime-event",
      actorId:
        capability.ownerId,
      source:
        "executive-capability",
      title:
        capability.name,
      summary:
        capability.description,
      payload: {
        capabilityId:
          capability.id,
        category:
          capability.category,
      },
    });

    return capability;
  }

  updateStatus(
    capabilityId: string,
    status:
      ExecutiveCapabilityStatus,
  ): ExecutiveCapability {

    const existing =
      this.capabilities.get(
        capabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive capability "${capabilityId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.capabilities.set(
      capabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${capabilityId}:${status}`,
      sessionId:
        "executive-capability",
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-capability",
      title:
        updated.name,
      summary:
        `Capability status changed to ${status}.`,
      payload: {
        capabilityId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.capabilities.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.capabilities.values(),
      ),
    );
  }

  clear(): void {
    this.capabilities.clear();
  }
}

export function
createExecutiveCapabilityService() {
  return new ExecutiveCapabilityService();
}
