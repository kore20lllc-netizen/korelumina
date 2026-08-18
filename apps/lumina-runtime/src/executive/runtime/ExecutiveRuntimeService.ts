import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveRuntimeSnapshot,
  type CreateExecutiveRuntimeSnapshotInput,
  type ExecutiveRuntimeSnapshot,
} from "./ExecutiveRuntime.js";

export class ExecutiveRuntimeService {

  private readonly timeline =
    new ExecutiveTimelineService();

  private snapshot:
    ExecutiveRuntimeSnapshot | null =
      null;

  update(
    input:
      CreateExecutiveRuntimeSnapshotInput,
  ) {

    this.snapshot =
      createExecutiveRuntimeSnapshot(
        input,
      );

    this.timeline.record({

      id:
        `${this.snapshot.id}:runtime`,

      sessionId:
        this.snapshot.sessionId,

      type:
        "runtime-event",

      actorId:
        "executive-runtime",

      source:
        "executive-runtime",

      title:
        "Executive Runtime",

      summary:
        `Executive health ${this.snapshot.overallHealth}`,

      payload: {
        snapshotId:
          this.snapshot.id,
        overallHealth:
          this.snapshot.overallHealth,
        executiveReadiness:
          this.snapshot.executiveReadiness,
        executiveConfidence:
          this.snapshot.executiveConfidence,
        executiveRisk:
          this.snapshot.executiveRisk,
        executiveIntelligence:
          this.snapshot.executiveIntelligence,
        executivePerformance:
          this.snapshot.executivePerformance,
        executiveMaturity:
          this.snapshot.executiveMaturity,
        capabilityCount:
          this.snapshot.capabilities.length,
      },
    });

    return this.snapshot;
  }

  current() {
    return this.snapshot;
  }

  clear() {
    this.snapshot = null;
  }
}

export function createExecutiveRuntimeService() {
  return new ExecutiveRuntimeService();
}
