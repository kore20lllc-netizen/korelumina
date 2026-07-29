import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveRisk,
  type CreateExecutiveRiskInput,
  type ExecutiveRisk,
  type ExecutiveRiskStatus,
} from "./ExecutiveRisk.js";

export class ExecutiveRiskService {

  private readonly risks =
    new Map<
      string,
      ExecutiveRisk
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveRiskInput,
  ): ExecutiveRisk {

    const risk =
      createExecutiveRisk(
        input,
      );

    this.risks.set(
      risk.id,
      risk,
    );

    this.timeline.record({
      id:
        `${risk.id}:created`,
      sessionId:
        risk.sessionId,
      type:
        "runtime-event",
      actorId:
        risk.ownerId,
      source:
        "executive-risk",
      title:
        risk.title,
      summary:
        risk.description,
      payload: {
        riskId:
          risk.id,
        level:
          risk.level,
      },
    });

    return risk;
  }

  updateStatus(
    riskId: string,
    status:
      ExecutiveRiskStatus,
  ): ExecutiveRisk {

    const existing =
      this.risks.get(
        riskId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive risk "${riskId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.risks.set(
      riskId,
      updated,
    );

    this.timeline.record({
      id:
        `${riskId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-risk",
      title:
        updated.title,
      summary:
        `Risk status changed to ${status}.`,
      payload: {
        riskId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.risks.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.risks.values(),
      ),
    );
  }

  clear(): void {
    this.risks.clear();
  }
}

export function
createExecutiveRiskService() {
  return new ExecutiveRiskService();
}
