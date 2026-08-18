import {
  ExecutiveTimelineService,
} from "../../executive/timeline/index.js";

import type {
  ExecutiveRuntimeExecution,
} from "../../executive/runtime/index.js";

export class RuntimeExecutiveEventPublisher {

  private readonly timeline =
    new ExecutiveTimelineService();

  publish(
    evaluation:
      ExecutiveRuntimeExecution,
  ): void {

    const {
      result,
      executions,
    } = evaluation;

    this.timeline.record({

      id:
        `executive-runtime-${Date.now()}`,

      sessionId:
        "runtime",

      type:
        "runtime-event",

      actorId:
        "runtime-executive",

      source:
        "runtime-executive",

      title:
        "Executive Runtime Evaluation",

      summary:
        `Health ${result.health.overallHealth} · ${result.recommendations.length} recommendation(s) · ${executions.length} execution(s)`,

      payload: {

        health:
          result.health.overallHealth,

        readiness:
          result.health.executiveReadiness,

        confidence:
          result.health.executiveConfidence,

        risk:
          result.health.executiveRisk,

        recommendations:
          result.recommendations.length,

        executions:
          executions.length,
      },
    });
  }
}

export function
createRuntimeExecutiveEventPublisher() {

  return new RuntimeExecutiveEventPublisher();
}
