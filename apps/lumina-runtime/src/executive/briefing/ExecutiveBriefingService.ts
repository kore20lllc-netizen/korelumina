import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveBriefing,
  type CreateExecutiveBriefingInput,
  type ExecutiveBriefing,
} from "./ExecutiveBriefing.js";

export class ExecutiveBriefingService {

  private readonly briefings =
    new Map<
      string,
      ExecutiveBriefing
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveBriefingInput,
  ): ExecutiveBriefing {

    const briefing =
      createExecutiveBriefing(
        input,
      );

    this.briefings.set(
      briefing.id,
      briefing,
    );

    this.timeline.record({
      id:
        `${briefing.id}:timeline`,
      sessionId:
        briefing.sessionId,
      type:
        "briefing-started",
      actorId:
        "chief-agent",
      source:
        "executive-briefing",
      title:
        briefing.title,
      summary:
        briefing.summary,
      payload: {
        briefingId:
          briefing.id,
      },
    });

    return briefing;
  }

  get(
    id: string,
  ) {
    return this.briefings.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.briefings.values(),
      ),
    );
  }

  clear(): void {
    this.briefings.clear();
  }
}

export function
createExecutiveBriefingService() {
  return new ExecutiveBriefingService();
}
