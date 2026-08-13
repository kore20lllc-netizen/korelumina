import {
  ExecutiveAuditService,
} from "../audit/index.js";

import {
  ExecutiveDelegationService,
} from "../delegation/index.js";

import type {
  ExecutiveActionExecutionOperation,
} from "./ExecutiveActionExecutionOperation.js";

import {
  ExecutiveActionExecutionAuthorizationService,
} from "./ExecutiveActionExecutionAuthorizationService.js";

import {
  ExecutiveActionExecutionOutcomeService,
} from "./ExecutiveActionExecutionOutcomeService.js";

import {
  ExecutiveActionExecutorPolicyRegistry,
} from "./ExecutiveActionExecutorPolicyRegistry.js";

import {
  ExecutiveActionExecutorRegistry,
} from "./ExecutiveActionExecutorRegistry.js";

import {
  ExecutiveActionExecutorService,
  type ExecutiveActionExecutorServiceResult,
} from "./ExecutiveActionExecutorService.js";

import {
  ExecutiveActionService,
} from "./ExecutiveActionService.js";

export interface DispatchExecutiveActionExecutionInput {
  actionId:
    string;

  actorId:
    string;

  authorizationId:
    string;

  startAuditId:
    string;

  operation:
    ExecutiveActionExecutionOperation;
}

export class ExecutiveActionExecutionDispatcher {
  constructor(
    private readonly actionService:
      ExecutiveActionService,

    private readonly delegationService:
      ExecutiveDelegationService,

    private readonly authorizationService:
      ExecutiveActionExecutionAuthorizationService,

    private readonly auditService:
      ExecutiveAuditService,

    private readonly outcomeService:
      ExecutiveActionExecutionOutcomeService,

    private readonly policyRegistry:
      ExecutiveActionExecutorPolicyRegistry,

    private readonly executorRegistry:
      ExecutiveActionExecutorRegistry,
  ) {}

  async dispatch(
    input:
      DispatchExecutiveActionExecutionInput,
  ): Promise<
    ExecutiveActionExecutorServiceResult
  > {
    const executor =
      this.executorRegistry.resolve(
        input.operation,
      );

    const service =
      new ExecutiveActionExecutorService(
        this.actionService,
        this.delegationService,
        this.authorizationService,
        this.auditService,
        this.outcomeService,
        this.policyRegistry,
        executor,
      );

    return service.execute({
      actionId:
        input.actionId,

      actorId:
        input.actorId,

      authorizationId:
        input.authorizationId,

      startAuditId:
        input.startAuditId,

      operation:
        input.operation,
    });
  }
}
