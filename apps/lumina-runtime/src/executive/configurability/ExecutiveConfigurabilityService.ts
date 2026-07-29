import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveConfigurability,
  type CreateExecutiveConfigurabilityInput,
  type ExecutiveConfigurability,
  type ExecutiveConfigurabilityStatus,
} from "./ExecutiveConfigurability.js";

export class ExecutiveConfigurabilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveConfigurability
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveConfigurabilityInput,
  ): ExecutiveConfigurability {

    const record =
      createExecutiveConfigurability(
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
        "executive-configurability",
      title:
        record.title,
      summary:
        `Configurability score ${record.configurabilityScore}`,
      payload: {
        configurabilityId:
          record.id,
        configurabilityScore:
          record.configurabilityScore,
        flexibilityScore:
          record.flexibilityScore,
        policyCoverage:
          record.policyCoverage,
        automationReadiness:
          record.automationReadiness,
      },
    });

    return record;
  }

  updateStatus(
    configurabilityId: string,
    status:
      ExecutiveConfigurabilityStatus,
  ): ExecutiveConfigurability {

    const existing =
      this.records.get(
        configurabilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive configurability "${configurabilityId}".`,
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
      configurabilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${configurabilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-configurability",
      title:
        updated.title,
      summary:
        `Configurability status changed to ${status}.`,
      payload: {
        configurabilityId,
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
createExecutiveConfigurabilityService() {
  return new ExecutiveConfigurabilityService();
}
