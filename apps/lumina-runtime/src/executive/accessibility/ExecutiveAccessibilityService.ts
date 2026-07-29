import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAccessibility,
  type CreateExecutiveAccessibilityInput,
  type ExecutiveAccessibility,
  type ExecutiveAccessibilityStatus,
} from "./ExecutiveAccessibility.js";

export class ExecutiveAccessibilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveAccessibility
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAccessibilityInput,
  ): ExecutiveAccessibility {

    const record =
      createExecutiveAccessibility(
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
        "executive-accessibility",
      title:
        record.title,
      summary:
        `Accessibility score ${record.accessibilityScore}`,
      payload: {
        accessibilityId:
          record.id,
        accessibilityScore:
          record.accessibilityScore,
        complianceScore:
          record.complianceScore,
        usabilityScore:
          record.usabilityScore,
        inclusivityScore:
          record.inclusivityScore,
      },
    });

    return record;
  }

  updateStatus(
    accessibilityId: string,
    status:
      ExecutiveAccessibilityStatus,
  ): ExecutiveAccessibility {

    const existing =
      this.records.get(
        accessibilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive accessibility "${accessibilityId}".`,
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
      accessibilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${accessibilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-accessibility",
      title:
        updated.title,
      summary:
        `Accessibility status changed to ${status}.`,
      payload: {
        accessibilityId,
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
createExecutiveAccessibilityService() {
  return new ExecutiveAccessibilityService();
}
