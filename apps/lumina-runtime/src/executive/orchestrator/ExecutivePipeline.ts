import type {
  ExecutiveContext,
} from "../context/index.js";
import type {
  ExecutiveEvent,
} from "../events/index.js";
import type {
  ExecutiveKernel,
} from "../kernel/index.js";
import type {
  ExecutiveDispatchResult,
  ExecutiveDispatcher,
} from "./ExecutiveDispatcher.js";
import {
  createExecutiveLifecycle,
  transitionExecutiveLifecycle,
  type ExecutiveLifecycle,
} from "./ExecutiveLifecycle.js";
import type {
  ExecutiveRoute,
  ExecutiveRouter,
} from "./ExecutiveRouter.js";

export interface ExecutiveEventValidation {
  valid: boolean;

  reasons:
    readonly string[];
}

export interface ExecutiveEventValidator {
  validate(
    event: ExecutiveEvent,
  ): ExecutiveEventValidation;
}

export interface ExecutiveContextReducer {
  reduce(
    current:
      ExecutiveContext,
    event:
      ExecutiveEvent,
  ):
    | ExecutiveContext
    | Promise<ExecutiveContext>;
}

export interface ExecutivePipelineResult {
  event: ExecutiveEvent;

  lifecycle:
    ExecutiveLifecycle;

  context:
    ExecutiveContext;

  route?: ExecutiveRoute;

  dispatch?: ExecutiveDispatchResult;
}

export class StructuralExecutiveEventValidator
  implements ExecutiveEventValidator
{
  validate(
    event: ExecutiveEvent,
  ): ExecutiveEventValidation {
    const reasons:
      string[] = [];

    if (!event.id.trim()) {
      reasons.push(
        "Executive event id is required.",
      );
    }

    if (!event.type.trim()) {
      reasons.push(
        "Executive event type is required.",
      );
    }

    if (!event.source.trim()) {
      reasons.push(
        "Executive event source is required.",
      );
    }

    if (!event.actor.id.trim()) {
      reasons.push(
        "Executive event actor id is required.",
      );
    }

    if (
      !Number.isFinite(
        event.timestamp,
      ) ||
      event.timestamp <= 0
    ) {
      reasons.push(
        "Executive event timestamp must be valid.",
      );
    }

    return {
      valid:
        reasons.length === 0,

      reasons,
    };
  }
}

export class DefaultExecutiveContextReducer
  implements ExecutiveContextReducer
{
  reduce(
    current:
      ExecutiveContext,
    event:
      ExecutiveEvent,
  ): ExecutiveContext {
    const activeAgents =
      event.actor.type ===
        "specialized-agent" ||
      event.actor.type ===
        "chief-agent"
        ? [
            ...current.activeAgents.filter(
              (agent) =>
                agent.id !==
                event.actor.id,
            ),
            {
              id:
                event.actor.id,

              label:
                event.actor.label,

              metadata: {
                actorType:
                  event.actor.type,

                lastEventType:
                  event.type,

                lastObservedAt:
                  event.timestamp,
              },
            },
          ]
        : current.activeAgents;

    return {
      ...current,

      project:
        event.projectId
          ? {
              id:
                event.projectId,
            }
          : current.project,

      workspace:
        event.workspace
          ? {
              id:
                event.workspace,

              label:
                event.workspace,
            }
          : current.workspace,

      mission:
        event.missionId
          ? {
              id:
                event.missionId,
            }
          : current.mission,

      runtime:
        event.category ===
        "runtime"
          ? {
              id:
                event.source,

              label:
                event.type,

              metadata: {
                eventId:
                  event.id,

                confidence:
                  event.confidence,
              },
            }
          : current.runtime,

      activeAgents,

      observedAt:
        event.timestamp,
    };
  }
}

export interface ExecutivePipelineDependencies {
  kernel:
    ExecutiveKernel;

  validator:
    ExecutiveEventValidator;

  contextReducer:
    ExecutiveContextReducer;

  router:
    ExecutiveRouter;

  dispatcher:
    ExecutiveDispatcher;
}

export class ExecutivePipeline {
  constructor(
    private readonly dependencies:
      ExecutivePipelineDependencies,
  ) {}

  async process(
    event: ExecutiveEvent,
  ): Promise<ExecutivePipelineResult> {
    let lifecycle =
      createExecutiveLifecycle(
        event,
      );

    try {
      const validation =
        this.dependencies
          .validator
          .validate(event);

      if (!validation.valid) {
        lifecycle =
          transitionExecutiveLifecycle(
            lifecycle,
            "rejected",
            {
              message:
                validation.reasons.join(
                  " ",
                ),
            },
          );

        return {
          event,

          lifecycle,

          context:
            this.dependencies
              .kernel
              .getContext(),
        };
      }

      lifecycle =
        transitionExecutiveLifecycle(
          lifecycle,
          "validated",
        );

      const context =
        await this.dependencies
          .contextReducer
          .reduce(
            this.dependencies
              .kernel
              .getContext(),
            event,
          );

      this.dependencies
        .kernel
        .replaceContext(
          context,
        );

      lifecycle =
        transitionExecutiveLifecycle(
          lifecycle,
          "context-updated",
        );

      const route =
        this.dependencies
          .router
          .route(event);

      lifecycle =
        transitionExecutiveLifecycle(
          lifecycle,
          "routed",
          {
            message:
              route.reason,
          },
        );

      const dispatch =
        await this.dependencies
          .dispatcher
          .dispatch({
            event,
            route,
          });

      if (!dispatch.successful) {
        lifecycle =
          transitionExecutiveLifecycle(
            lifecycle,
            "failed",
            {
              message:
                "One or more executive destinations failed.",
              error:
                dispatch.records
                  .filter(
                    (record) =>
                      record.status ===
                      "failed",
                  )
                  .map(
                    (record) =>
                      record.message,
                  )
                  .filter(
                    (
                      message,
                    ): message is string =>
                      Boolean(message),
                  )
                  .join(" "),
            },
          );

        return {
          event,

          lifecycle,

          context,

          route,

          dispatch,
        };
      }

      lifecycle =
        transitionExecutiveLifecycle(
          lifecycle,
          "dispatched",
        );

      lifecycle =
        transitionExecutiveLifecycle(
          lifecycle,
          "completed",
        );

      return {
        event,

        lifecycle,

        context,

        route,

        dispatch,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      lifecycle =
        transitionExecutiveLifecycle(
          lifecycle,
          "failed",
          {
            message,
            error: message,
          },
        );

      return {
        event,

        lifecycle,

        context:
          this.dependencies
            .kernel
            .getContext(),
      };
    }
  }
}
