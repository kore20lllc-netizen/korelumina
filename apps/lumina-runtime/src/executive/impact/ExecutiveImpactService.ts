import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveImpact,
  type CreateExecutiveImpactInput,
  type ExecutiveImpact,
  type ExecutiveImpactStatus,
} from "./ExecutiveImpact.js";

export class ExecutiveImpactService {

  private readonly impacts =
    new Map<
      string,
      ExecutiveImpact
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveImpactInput,
  ): ExecutiveImpact {

    const impact =
      createExecutiveImpact(
        input,
      );

    this.impacts.set(
      impact.id,
      impact,
    );

    this.timeline.record({
      id:
        `${impact.id}:created`,
      sessionId:
        impact.sessionId,
      type:
        "runtime-event",
      actorId:
        impact.ownerId,
      source:
        "executive-impact",
      title:
        impact.title,
      summary:
        `Impact magnitude ${impact.magnitude}`,
      payload: {
        impactId:
          impact.id,
        category:
          impact.category,
        confidence:
          impact.confidence,
      },
    });

    return impact;
  }

  updateStatus(
    impactId: string,
    status:
      ExecutiveImpactStatus,
  ): ExecutiveImpact {

    const existing =
      this.impacts.get(
        impactId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive impact "${impactId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.impacts.set(
      impactId,
      updated,
    );

    this.timeline.record({
      id:
        `${impactId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-impact",
      title:
        updated.title,
      summary:
        `Impact status changed to ${status}.`,
      payload: {
        impactId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.impacts.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.impacts.values(),
      ),
    );
  }

  clear(): void {
    this.impacts.clear();
  }
}

export function
createExecutiveImpactService() {
  return new ExecutiveImpactService();
}
