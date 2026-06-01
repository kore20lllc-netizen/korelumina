const RUNTIME_API =
  "http://localhost:4100";

export type RuntimeEvent =
  | {
      type: "runtime:log";
      projectId: string;
      line: string;
      timestamp: number;
    }
  | {
      type: "runtime:state";
      projectId: string;
      status: string;
      timestamp: number;
    }
  | {
      type: "runtime:error";
      projectId: string;
      error: string;
      timestamp: number;
    };

export function connectRuntimeEvents(
  onEvent: (event: RuntimeEvent) => void,
  onError?: (error: Event) => void,
) {
  const source = new EventSource(
    `${RUNTIME_API}/api/runtime/events`,
  );

  const handleEvent = (raw: MessageEvent) => {
    try {
      const event = JSON.parse(
        raw.data,
      ) as RuntimeEvent;

      onEvent(event);
    } catch {
      // Ignore malformed runtime event payloads.
    }
  };

  source.addEventListener(
    "runtime:log",
    handleEvent,
  );

  source.addEventListener(
    "runtime:state",
    handleEvent,
  );

  source.addEventListener(
    "runtime:error",
    handleEvent,
  );

  source.onerror = (error) => {
    onError?.(error);
  };

  return () => {
    source.close();
  };
}
