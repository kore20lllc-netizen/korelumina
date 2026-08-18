import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveIntelligenceGrowth,
  type CreateExecutiveIntelligenceGrowthInput,
  type ExecutiveIntelligenceGrowth,
  type ExecutiveIntelligenceGrowthStatus,
} from "./ExecutiveIntelligenceGrowth.js";

export class
ExecutiveIntelligenceGrowthService {

  private readonly records =
    new Map<
      string,
      ExecutiveIntelligenceGrowth
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveIntelligenceGrowthInput,
  ): ExecutiveIntelligenceGrowth {

    const record =
      createExecutiveIntelligenceGrowth(
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
        "executive-intelligence-growth",
      title:
        record.title,
      summary:
        `Intelligence growth score ${record.intelligenceGrowthScore}`,
      payload: {
        intelligenceGrowthId:
          record.id,
        intelligenceGrowthScore:
          record.intelligenceGrowthScore,
        reasoningGrowth:
          record.reasoningGrowth,
        knowledgeExpansion:
          record.knowledgeExpansion,
        decisionImprovement:
          record.decisionImprovement,
      },
    });

    return record;
  }

  updateStatus(
    intelligenceGrowthId: string,
    status:
      ExecutiveIntelligenceGrowthStatus,
  ): ExecutiveIntelligenceGrowth {

    const existing =
      this.records.get(
        intelligenceGrowthId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive intelligence growth "${intelligenceGrowthId}".`,
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
      intelligenceGrowthId,
      updated,
    );

    this.timeline.record({
      id:
        `${intelligenceGrowthId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-intelligence-growth",
      title:
        updated.title,
      summary:
        `Intelligence growth status changed to ${status}.`,
      payload: {
        intelligenceGrowthId,
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
createExecutiveIntelligenceGrowthService() {
  return new ExecutiveIntelligenceGrowthService();
}
