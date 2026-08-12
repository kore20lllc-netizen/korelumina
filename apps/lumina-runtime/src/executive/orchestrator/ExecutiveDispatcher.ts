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
    | "failed";

  message?: string;
}

export interface ExecutiveDispatchResult {
  eventId: string;

  records:
    readonly ExecutiveDispatchRecord[];

  successful: boolean;
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
