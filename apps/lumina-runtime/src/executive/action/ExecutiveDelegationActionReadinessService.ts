import {
  ExecutiveDelegationService,
  type ExecutiveDelegation,
} from "../delegation/index.js";

import {
  ExecutiveActionService,
} from "./ExecutiveActionService.js";

import type {
  ExecutiveAction,
} from "./ExecutiveAction.js";

export interface AcceptDelegatedExecutiveActionInput {
  delegationId:
    string;

  actionId:
    string;

  actorId:
    string;
}

export interface ExecutiveDelegationActionReadinessResult {
  delegation:
    ExecutiveDelegation;

  action:
    ExecutiveAction;
}

export class ExecutiveDelegationActionReadinessService {
  constructor(
    private readonly delegationService:
      ExecutiveDelegationService,

    private readonly actionService:
      ExecutiveActionService,
  ) {}

  accept(
    input:
      AcceptDelegatedExecutiveActionInput,
  ): ExecutiveDelegationActionReadinessResult {
    const delegation =
      this.delegationService
        .get(
          input.delegationId,
        );

    if (
      !delegation
    ) {
      throw new Error(
        "executive_delegation_not_found",
      );
    }

    const action =
      this.actionService
        .get(
          input.actionId,
        );

    if (
      !action
    ) {
      throw new Error(
        "executive_action_not_found",
      );
    }

    if (
      delegation.status !==
      "assigned"
    ) {
      throw new Error(
        "executive_delegation_not_assigned",
      );
    }

    if (
      action.status !==
      "planned"
    ) {
      throw new Error(
        "executive_action_not_planned",
      );
    }

    if (
      action.delegationId !==
      delegation.id
    ) {
      throw new Error(
        "executive_action_delegation_mismatch",
      );
    }

    if (
      action.ownerId !==
      delegation.assignedTo
    ) {
      throw new Error(
        "executive_action_owner_mismatch",
      );
    }

    const actorId =
      input.actorId.trim();

    if (
      actorId.length ===
      0
    ) {
      throw new Error(
        "executive_delegation_acceptor_required",
      );
    }

    if (
      actorId !==
      delegation.assignedTo
    ) {
      throw new Error(
        "executive_delegation_acceptor_not_authorized",
      );
    }

    const acceptedDelegation =
      this.delegationService
        .updateStatus(
          delegation.id,
          "accepted",
        );

    const readyAction =
      this.actionService
        .updateStatus(
          action.id,
          "ready",
        );

    return {
      delegation:
        acceptedDelegation,

      action:
        readyAction,
    };
  }
}
