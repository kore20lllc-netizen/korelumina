import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveResource,
  type CreateExecutiveResourceInput,
  type ExecutiveResource,
  type ExecutiveResourceStatus,
} from "./ExecutiveResource.js";

export class ExecutiveResourceService {

  private readonly resources =
    new Map<
      string,
      ExecutiveResource
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveResourceInput,
  ): ExecutiveResource {

    const resource =
      createExecutiveResource(
        input,
      );

    this.resources.set(
      resource.id,
      resource,
    );

    this.timeline.record({
      id:
        `${resource.id}:created`,
      sessionId:
        resource.sessionId,
      type:
        "runtime-event",
      actorId:
        resource.ownerId,
      source:
        "executive-resource",
      title:
        resource.name,
      summary:
        resource.category,
      payload: {
        resourceId:
          resource.id,
        capacity:
          resource.capacity,
        utilization:
          resource.utilization,
      },
    });

    return resource;
  }

  updateStatus(
    resourceId: string,
    status:
      ExecutiveResourceStatus,
  ): ExecutiveResource {

    const existing =
      this.resources.get(
        resourceId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive resource "${resourceId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.resources.set(
      resourceId,
      updated,
    );

    this.timeline.record({
      id:
        `${resourceId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-resource",
      title:
        updated.name,
      summary:
        `Resource status changed to ${status}.`,
      payload: {
        resourceId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.resources.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.resources.values(),
      ),
    );
  }

  clear(): void {
    this.resources.clear();
  }
}

export function
createExecutiveResourceService() {
  return new ExecutiveResourceService();
}
