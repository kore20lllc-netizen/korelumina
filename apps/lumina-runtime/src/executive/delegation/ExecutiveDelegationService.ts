import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveDelegation,
  type CreateExecutiveDelegationInput,
  type ExecutiveDelegation,
} from "./ExecutiveDelegation.js";

export class ExecutiveDelegationService {

  private readonly delegations =
    new Map<
      string,
      ExecutiveDelegation
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveDelegationInput,
  ): ExecutiveDelegation {

    const delegation =
      createExecutiveDelegation(
        input,
      );

    this.delegations.set(
      delegation.id,
      delegation,
    );

    this.timeline.record({
      id:
        `${delegation.id}:assigned`,
      sessionId:
        delegation.sessionId,
      type:
        "delegation",
      actorId:
        delegation.assignedBy,
      source:
        "executive-delegation",
      title:
        delegation.title,
      summary:
        delegation.description,
      payload: {
        delegationId:
          delegation.id,
        assignedTo:
          delegation.assignedTo,
        decisionId:
          delegation.decisionId,
      },
    });

    return delegation;
  }

  updateStatus(
    delegationId: string,
    status:
      ExecutiveDelegation["status"],
  ): ExecutiveDelegation {

    const existing =
      this.delegations.get(
        delegationId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive delegation "${delegationId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.delegations.set(
      delegationId,
      updated,
    );

    this.timeline.record({
      id:
        `${delegationId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "delegation",
      actorId:
        updated.assignedTo,
      source:
        "executive-delegation",
      title:
        updated.title,
      summary:
        `Delegation status changed to ${status}.`,
      payload: {
        delegationId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.delegations.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.delegations.values(),
      ),
    );
  }

  clear(): void {
    this.delegations.clear();
  }
}

export function
createExecutiveDelegationService() {
  return new ExecutiveDelegationService();
}
