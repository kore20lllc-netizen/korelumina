import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveBenefit,
  type CreateExecutiveBenefitInput,
  type ExecutiveBenefit,
  type ExecutiveBenefitStatus,
} from "./ExecutiveBenefit.js";

export class ExecutiveBenefitService {

  private readonly benefits =
    new Map<
      string,
      ExecutiveBenefit
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveBenefitInput,
  ): ExecutiveBenefit {

    const benefit =
      createExecutiveBenefit(
        input,
      );

    this.benefits.set(
      benefit.id,
      benefit,
    );

    this.timeline.record({
      id:
        `${benefit.id}:created`,
      sessionId:
        benefit.sessionId,
      type:
        "runtime-event",
      actorId:
        benefit.ownerId,
      source:
        "executive-benefit",
      title:
        benefit.title,
      summary:
        benefit.description,
      payload: {
        benefitId:
          benefit.id,
        expectedValue:
          benefit.expectedValue,
        realizedValue:
          benefit.realizedValue,
      },
    });

    return benefit;
  }

  updateStatus(
    benefitId: string,
    status:
      ExecutiveBenefitStatus,
  ): ExecutiveBenefit {

    const existing =
      this.benefits.get(
        benefitId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive benefit "${benefitId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.benefits.set(
      benefitId,
      updated,
    );

    this.timeline.record({
      id:
        `${benefitId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-benefit",
      title:
        updated.title,
      summary:
        `Benefit status changed to ${status}.`,
      payload: {
        benefitId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.benefits.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.benefits.values(),
      ),
    );
  }

  clear(): void {
    this.benefits.clear();
  }
}

export function
createExecutiveBenefitService() {
  return new ExecutiveBenefitService();
}
