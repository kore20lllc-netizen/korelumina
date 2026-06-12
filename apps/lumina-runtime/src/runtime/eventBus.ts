import type { Response } from "express";

export type RuntimeEvent =
  | {
      type: "runtime:log";
      projectId?: string;
      message: string;
      timestamp?: number;
    }
  | {
      type: "runtime:state";
      projectId?: string;
      state: string;
      timestamp?: number;
    }
  | {
      type: "runtime:error";
      projectId?: string;
      error: string;
      timestamp?: number;
    }
  | {
      type: "runtime:file-changed";
      projectId: string;
      file: string;
      sha256?: string;
      timestamp: number;
    };

type Listener =
  (event: RuntimeEvent) => void;

const listeners =
  new Set<Listener>();

export function publishRuntimeEvent(
  event: RuntimeEvent,
) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error(
        "[runtime-eventBus]",
        error,
      );
    }
  }
}

export function subscribeRuntimeEvents(
  listener: Listener,
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function attachRuntimeEventStream(
  res: Response,
) {
  res.setHeader(
    "Content-Type",
    "text/event-stream",
  );

  res.setHeader(
    "Cache-Control",
    "no-cache",
  );

  res.setHeader(
    "Connection",
    "keep-alive",
  );

  res.flushHeaders?.();

  res.write(
    ": connected\n\n",
  );

  const unsubscribe =
    subscribeRuntimeEvents(
      (event) => {
        res.write(
          `data: ${JSON.stringify(event)}\n\n`,
        );
      },
    );

  const heartbeat =
    setInterval(
      () => {
        res.write(
          ": heartbeat\n\n",
        );
      },
      15000,
    );

  res.on(
    "close",
    () => {
      clearInterval(
        heartbeat,
      );

      unsubscribe();
    },
  );
}

export function getRuntimeEventClientCount() {
  return listeners.size;
}
