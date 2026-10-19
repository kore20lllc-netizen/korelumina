import type {
  ExecutiveContext,
} from "../context/index.js";

import type {
  ExecutiveEvent,
} from "../events/index.js";
import type {
  ExecutiveDestination,
  ExecutiveRoute,
} from "./ExecutiveRouter.js";

export interface ExecutiveDispatchContext {
  event: ExecutiveEvent;

  route: ExecutiveRoute;

  context: ExecutiveContext;
}

export interface ExecutiveDispatchRecord {
  destination:
    ExecutiveDestination;

  status:
    | "handled"
    | "unhandled"
    | "skipped"
    | "refused"
    | "failed";

  message?: string;
}

export interface ExecutiveDispatchResult {
  eventId: string;

  records:
    readonly ExecutiveDispatchRecord[];

  successful: boolean;
}

/*
 * A destination may decline to act by governance (for example, the Chief
 * Agent before activation, ADR-0041). A refusal is an expected, recorded
 * outcome, not a failure: the event still completes and stays on record.
 */
export class ExecutiveDestinationRefusal
  extends Error {
  readonly executiveRefusal =
    true as const;

  constructor(
    code:
      string,
  ) {
    super(code);
    this.name =
      "ExecutiveDestinationRefusal";
  }
}

/*
 * KO-6 (F-21): a destination may also have nothing to do for an event (for
 * example, Chief Agent reasoning for an event raised by a system process).
 * A skip says so plainly instead of reporting the event as handled.
 */
export class ExecutiveDestinationSkip
  extends Error {
  readonly executiveSkip =
    true as const;

  constructor(
    code:
      string,
  ) {
    super(code);
    this.name =
      "ExecutiveDestinationSkip";
  }
}

function isExecutiveDestinationSkip(
  error:
    unknown,
): error is ExecutiveDestinationSkip {
  return (
    error instanceof Error &&
    (error as {
      executiveSkip?: unknown;
    }).executiveSkip === true
  );
}

function isExecutiveDestinationRefusal(
  error:
    unknown,
): error is ExecutiveDestinationRefusal {
  return (
    error instanceof Error &&
    (error as {
      executiveRefusal?: unknown;
    }).executiveRefusal === true
  );
}

export type ExecutiveDestinationHandler =
  (
    context:
      ExecutiveDispatchContext,
  ) =>
    void | Promise<void>;

export interface ExecutiveDispatcher {
  dispatch(
    context:
      ExecutiveDispatchContext,
  ): Promise<ExecutiveDispatchResult>;
}

export class RegistryExecutiveDispatcher
  implements ExecutiveDispatcher
{
  private readonly handlers =
    new Map<
      ExecutiveDestination,
      ExecutiveDestinationHandler
    >();

  register(
    destination:
      ExecutiveDestination,
    handler:
      ExecutiveDestinationHandler,
  ): () => void {
    this.handlers.set(
      destination,
      handler,
    );

    return () => {
      const current =
        this.handlers.get(
          destination,
        );

      if (current === handler) {
        this.handlers.delete(
          destination,
        );
      }
    };
  }

  async dispatch(
    context:
      ExecutiveDispatchContext,
  ): Promise<ExecutiveDispatchResult> {
    const records:
      ExecutiveDispatchRecord[] = [];

    for (
      const destination
      of context.route.destinations
    ) {
      if (destination === "none") {
        records.push({
          destination,
          status: "unhandled",
          message:
            "No executive destination was assigned.",
        });

        continue;
      }

      const handler =
        this.handlers.get(
          destination,
        );

      if (!handler) {
        records.push({
          destination,
          status: "unhandled",
          message:
            `No handler is registered for "${destination}".`,
        });

        continue;
      }

      try {
        await handler(context);

        records.push({
          destination,
          status: "handled",
        });
      } catch (error) {
        if (
          isExecutiveDestinationSkip(
            error,
          )
        ) {
          records.push({
            destination,
            status: "skipped",
            message:
              error.message,
          });

          continue;
        }

        if (
          isExecutiveDestinationRefusal(
            error,
          )
        ) {
          records.push({
            destination,
            status: "refused",
            message:
              error.message,
          });

          continue;
        }

        records.push({
          destination,
          status: "failed",
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    return {
      eventId:
        context.event.id,

      records,

      successful:
        records.every(
          (record) =>
            record.status !==
            "failed",
        ),
    };
  }
}
