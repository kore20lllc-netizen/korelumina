import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveValue,
  type CreateExecutiveValueInput,
  type ExecutiveValue,
  type ExecutiveValueStatus,
} from "./ExecutiveValue.js";

export class ExecutiveValueService {

  private readonly values =
    new Map<
      string,
      ExecutiveValue
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveValueInput,
  ): ExecutiveValue {

    const value =
      createExecutiveValue(
        input,
      );

    this.values.set(
      value.id,
      value,
    );

    this.timeline.record({
      id:
        `${value.id}:created`,
      sessionId:
        value.sessionId,
      type:
        "runtime-event",
      actorId:
        value.ownerId,
      source:
        "executive-value",
      title:
        value.title,
      summary:
        `Expected ${value.expectedValue} ${value.currency}`,
      payload: {
        valueId:
          value.id,
        expectedValue:
          value.expectedValue,
        realizedValue:
          value.realizedValue,
      },
    });

    return value;
  }

  updateStatus(
    valueId: string,
    status:
      ExecutiveValueStatus,
  ): ExecutiveValue {

    const existing =
      this.values.get(
        valueId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive value "${valueId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.values.set(
      valueId,
      updated,
    );

    this.timeline.record({
      id:
        `${valueId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-value",
      title:
        updated.title,
      summary:
        `Value status changed to ${status}.`,
      payload: {
        valueId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.values.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.values.values(),
      ),
    );
  }

  clear(): void {
    this.values.clear();
  }
}

export function
createExecutiveValueService() {
  return new ExecutiveValueService();
}
