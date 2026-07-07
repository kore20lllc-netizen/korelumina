import {
  RUNTIME_API,
} from "@/services/runtime/client";

import type {
  RuntimeEvent,
} from "@/services/runtimeService";

export function connectRuntimeEvents(
  onEvent: (
    event: RuntimeEvent,
  ) => void,
  onError?: (
    error: Event,
  ) => void,
) {
  const source =
    new EventSource(
      `${RUNTIME_API}/api/runtime/events`,
    );

  const handleEvent =
    (
      raw: MessageEvent,
    ) => {
      try {
        const parsed =
          JSON.parse(
            raw.data,
          ) as RuntimeEvent & {
            message?: string;
            state?: string;
          };

        const event =
          parsed.type === "runtime:log"
            ? {
                ...parsed,
                line:
                  parsed.line ??
                  parsed.message ??
                  "",
              }
            : parsed.type === "runtime:state"
              ? {
                  ...parsed,
                  status:
                    parsed.status ??
                    parsed.state ??
                    "unknown",
                }
              : parsed;

        onEvent(
          event as RuntimeEvent,
        );
      } catch {
        // ignore malformed event payloads
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

  source.addEventListener(
    "runtime:file-changed",
    handleEvent,
  );

  source.onerror =
    (
      error,
    ) => {
      onError?.(
        error,
      );
    };

  return () => {
    source.close();
  };
}
