import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveIntelligence,
  type CreateExecutiveIntelligenceInput,
  type ExecutiveIntelligence,
} from "./ExecutiveIntelligence.js";

export class ExecutiveIntelligenceService {

  private readonly intelligence =
    new Map<
      string,
      ExecutiveIntelligence
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveIntelligenceInput,
  ): ExecutiveIntelligence {

    const report =
      createExecutiveIntelligence(
        input,
      );

    this.intelligence.set(
      report.id,
      report,
    );

    this.timeline.record({
      id:
        `${report.id}:created`,
      sessionId:
        report.sessionId,
      type:
        "runtime-event",
      actorId:
        report.analystId,
      source:
        "executive-intelligence",
      title:
        report.title,
      summary:
        report.summary,
      payload: {
        intelligenceId:
          report.id,
        confidence:
          report.confidence,
        source:
          report.source,
      },
    });

    return report;
  }

  get(
    id: string,
  ) {
    return this.intelligence.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.intelligence.values(),
      ),
    );
  }

  clear(): void {
    this.intelligence.clear();
  }
}

export function
createExecutiveIntelligenceService() {
  return new ExecutiveIntelligenceService();
}
