import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveOptimization,
  type CreateExecutiveOptimizationInput,
  type ExecutiveOptimization,
  type ExecutiveOptimizationStatus,
} from "./ExecutiveOptimization.js";

export class ExecutiveOptimizationService {

  private readonly records =
    new Map<
      string,
      ExecutiveOptimization
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveOptimizationInput,
  ): ExecutiveOptimization {

    const record =
      createExecutiveOptimization(
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
        "executive-optimization",
      title:
        record.title,
      summary:
        `Optimization score ${record.optimizationScore}`,
      payload: {
        optimizationId:
          record.id,
        optimizationScore:
          record.optimizationScore,
        performanceGain:
          record.performanceGain,
        efficiencyGain:
          record.efficiencyGain,
        automationGain:
          record.automationGain,
      },
    });

    return record;
  }

  updateStatus(
    optimizationId: string,
    status:
      ExecutiveOptimizationStatus,
  ): ExecutiveOptimization {

    const existing =
      this.records.get(
        optimizationId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive optimization "${optimizationId}".`,
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
      optimizationId,
      updated,
    );

    this.timeline.record({
      id:
        `${optimizationId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-optimization",
      title:
        updated.title,
      summary:
        `Optimization status changed to ${status}.`,
      payload: {
        optimizationId,
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
createExecutiveOptimizationService() {
  return new ExecutiveOptimizationService();
}
