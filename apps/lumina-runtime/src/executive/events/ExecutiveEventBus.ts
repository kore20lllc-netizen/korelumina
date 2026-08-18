import type {
  ExecutiveEvent,
} from "./ExecutiveEvent.js";

export type ExecutiveEventHandler = (
  event: ExecutiveEvent,
) => void | Promise<void>;

export type ExecutiveEventUnsubscribe =
  () => void;

export interface ExecutiveEventBus {
  publish(
    event: ExecutiveEvent,
  ): Promise<void>;

  subscribe(
    handler: ExecutiveEventHandler,
  ): ExecutiveEventUnsubscribe;

  subscribeToType(
    type: string,
    handler: ExecutiveEventHandler,
  ): ExecutiveEventUnsubscribe;
}

export class InMemoryExecutiveEventBus
  implements ExecutiveEventBus
{
  private readonly handlers =
    new Set<
      ExecutiveEventHandler
    >();

  private readonly typedHandlers =
    new Map<
      string,
      Set<ExecutiveEventHandler>
    >();

  async publish(
    event: ExecutiveEvent,
  ): Promise<void> {
    const globalHandlers =
      Array.from(
        this.handlers,
      );

    const eventTypeHandlers =
      Array.from(
        this.typedHandlers.get(
          event.type,
        ) ?? [],
      );

    const handlers =
      Array.from(
        new Set([
          ...globalHandlers,
          ...eventTypeHandlers,
        ]),
      );

    await Promise.all(
      handlers.map(
        async (handler) => {
          await handler(event);
        },
      ),
    );
  }

  subscribe(
    handler: ExecutiveEventHandler,
  ): ExecutiveEventUnsubscribe {
    this.handlers.add(
      handler,
    );

    return () => {
      this.handlers.delete(
        handler,
      );
    };
  }

  subscribeToType(
    type: string,
    handler: ExecutiveEventHandler,
  ): ExecutiveEventUnsubscribe {
    const handlers =
      this.typedHandlers.get(
        type,
      ) ??
      new Set<
        ExecutiveEventHandler
      >();

    handlers.add(
      handler,
    );

    this.typedHandlers.set(
      type,
      handlers,
    );

    return () => {
      const currentHandlers =
        this.typedHandlers.get(
          type,
        );

      if (!currentHandlers) {
        return;
      }

      currentHandlers.delete(
        handler,
      );

      if (
        currentHandlers.size === 0
      ) {
        this.typedHandlers.delete(
          type,
        );
      }
    };
  }
}
