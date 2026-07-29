import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDecision,
  type CreateExecutiveDecisionInput,
  type ExecutiveDecision,
} from "./ExecutiveDecision.js";

export class ExecutiveDecisionService {

  private readonly decisions =
    new Map<
      string,
      ExecutiveDecision
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDecisionInput,
  ): ExecutiveDecision {

    const decision =
      createExecutiveDecision(
        input,
      );

    this.decisions.set(
      decision.id,
      decision,
    );

    this.timeline.record({
      id:
        `${decision.id}:requested`,
      sessionId:
        decision.sessionId,
      type:
        "decision-requested",
      actorId:
        decision.requestedBy,
      source:
        "executive-decision",
      title:
        decision.title,
      summary:
        decision.rationale,
      payload: {
        decisionId:
          decision.id,
      },
    });

    return decision;
  }

  approve(
    decisionId: string,
    approverId: string,
  ): ExecutiveDecision {

    const existing =
      this.decisions.get(
        decisionId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive decision "${decisionId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        approvedBy:
          approverId,
        status:
          "approved" as const,
        updatedAt:
          Date.now(),
      });

    this.decisions.set(
      decisionId,
      updated,
    );

    this.timeline.record({
      id:
        `${decisionId}:approved`,
      sessionId:
        updated.sessionId,
      type:
        "decision-approved",
      actorId:
        approverId,
      source:
        "executive-decision",
      title:
        updated.title,
      summary:
        "Decision approved.",
      payload: {
        decisionId,
      },
    });

    return updated;
  }

  reject(
    decisionId: string,
    actorId: string,
    reason: string,
  ): ExecutiveDecision {

    const existing =
      this.decisions.get(
        decisionId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive decision "${decisionId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status:
          "rejected" as const,
        updatedAt:
          Date.now(),
      });

    this.decisions.set(
      decisionId,
      updated,
    );

    this.timeline.record({
      id:
        `${decisionId}:rejected`,
      sessionId:
        updated.sessionId,
      type:
        "decision-rejected",
      actorId,
      source:
        "executive-decision",
      title:
        updated.title,
      summary:
        reason,
      payload: {
        decisionId,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.decisions.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.decisions.values(),
      ),
    );
  }

  clear(): void {
    this.decisions.clear();
  }
}

export function
createExecutiveDecisionService() {
  return new ExecutiveDecisionService();
}
