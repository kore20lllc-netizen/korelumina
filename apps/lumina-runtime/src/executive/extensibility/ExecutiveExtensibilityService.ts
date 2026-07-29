import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveExtensibility,
  type CreateExecutiveExtensibilityInput,
  type ExecutiveExtensibility,
  type ExecutiveExtensibilityStatus,
} from "./ExecutiveExtensibility.js";

export class ExecutiveExtensibilityService {

  private readonly records =
    new Map<
      string,
      ExecutiveExtensibility
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveExtensibilityInput,
  ): ExecutiveExtensibility {

    const record =
      createExecutiveExtensibility(
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
        "executive-extensibility",
      title:
        record.title,
      summary:
        `Extensibility score ${record.extensibilityScore}`,
      payload: {
        extensibilityId:
          record.id,
        extensibilityScore:
          record.extensibilityScore,
        pluginCoverage:
          record.pluginCoverage,
        apiExtensibility:
          record.apiExtensibility,
        customizationScore:
          record.customizationScore,
      },
    });

    return record;
  }

  updateStatus(
    extensibilityId: string,
    status:
      ExecutiveExtensibilityStatus,
  ): ExecutiveExtensibility {

    const existing =
      this.records.get(
        extensibilityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive extensibility "${extensibilityId}".`,
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
      extensibilityId,
      updated,
    );

    this.timeline.record({
      id:
        `${extensibilityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-extensibility",
      title:
        updated.title,
      summary:
        `Extensibility status changed to ${status}.`,
      payload: {
        extensibilityId,
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
createExecutiveExtensibilityService() {
  return new ExecutiveExtensibilityService();
}
