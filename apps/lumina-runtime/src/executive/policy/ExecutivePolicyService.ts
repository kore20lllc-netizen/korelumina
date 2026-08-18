import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutivePolicy,
  type CreateExecutivePolicyInput,
  type ExecutivePolicy,
  type ExecutivePolicyStatus,
} from "./ExecutivePolicy.js";

export class ExecutivePolicyService {

  private readonly policies =
    new Map<
      string,
      ExecutivePolicy
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutivePolicyInput,
  ): ExecutivePolicy {

    const policy =
      createExecutivePolicy(
        input,
      );

    this.policies.set(
      policy.id,
      policy,
    );

    this.timeline.record({
      id:
        `${policy.id}:created`,
      sessionId:
        "executive-policy",
      type:
        "runtime-event",
      actorId:
        policy.ownerId,
      source:
        "executive-policy",
      title:
        policy.title,
      summary:
        policy.description,
      payload: {
        policyId:
          policy.id,
      },
    });

    return policy;
  }

  updateStatus(
    policyId: string,
    status:
      ExecutivePolicyStatus,
  ): ExecutivePolicy {

    const existing =
      this.policies.get(
        policyId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive policy "${policyId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.policies.set(
      policyId,
      updated,
    );

    this.timeline.record({
      id:
        `${policyId}:${status}`,
      sessionId:
        "executive-policy",
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-policy",
      title:
        updated.title,
      summary:
        `Policy status changed to ${status}.`,
      payload: {
        policyId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.policies.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.policies.values(),
      ),
    );
  }

  clear(): void {
    this.policies.clear();
  }
}

export function
createExecutivePolicyService() {
  return new ExecutivePolicyService();
}
