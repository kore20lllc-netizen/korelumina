import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveTransformation,
  type CreateExecutiveTransformationInput,
  type ExecutiveTransformation,
  type ExecutiveTransformationStatus,
} from "./ExecutiveTransformation.js";

export class ExecutiveTransformationService {

  private readonly records =
    new Map<
      string,
      ExecutiveTransformation
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveTransformationInput,
  ): ExecutiveTransformation {

    const record =
      createExecutiveTransformation(
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
        "executive-transformation",
      title:
        record.title,
      summary:
        `Transformation score ${record.transformationScore}`,
      payload: {
        transformationId:
          record.id,
        transformationScore:
          record.transformationScore,
        changeReadiness:
          record.changeReadiness,
        adoptionScore:
          record.adoptionScore,
        innovationImpact:
          record.innovationImpact,
      },
    });

    return record;
  }

  updateStatus(
    transformationId: string,
    status:
      ExecutiveTransformationStatus,
  ): ExecutiveTransformation {

    const existing =
      this.records.get(
        transformationId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive transformation "${transformationId}".`,
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
      transformationId,
      updated,
    );

    this.timeline.record({
      id:
        `${transformationId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-transformation",
      title:
        updated.title,
      summary:
        `Transformation status changed to ${status}.`,
      payload: {
        transformationId,
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
createExecutiveTransformationService() {
  return new ExecutiveTransformationService();
}
