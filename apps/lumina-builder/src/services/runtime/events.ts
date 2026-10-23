import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

import type {
  RuntimeEvent,
} from "@/services/runtimeService";

/*
 * F-47: Runtime sends each subscriber only the events of projects it may
 * see, so the stream must say who is listening. EventSource cannot send
 * the sign-in token, so the stream is read with fetch instead.
 *
 * Runtime writes plain `data:` messages; the old EventSource client
 * listened for named events that were never sent, so no live event ever
 * reached the interface. Every message is now parsed.
 *
 * The connection reopens after a dropped or refused stream, a few seconds
 * later, until the caller closes it.
 */

const RECONNECT_MS = 3_000;

function normalize(raw: string): RuntimeEvent | null {
  try {
    const parsed = JSON.parse(raw) as RuntimeEvent & {
      message?: string;
      state?: string;
      line?: string;
      status?: string;
    };
    if (parsed.type === "runtime:log") {
      return { ...parsed, line: parsed.line ?? parsed.message ?? "" } as RuntimeEvent;
    }
    if (parsed.type === "runtime:state") {
      return { ...parsed, status: parsed.status ?? parsed.state ?? "unknown" } as RuntimeEvent;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function connectRuntimeEvents(
  onEvent: (
    event: RuntimeEvent,
  ) => void,
  onError?: (
    error: Event,
  ) => void,
) {
  let closed = false;
  let controller: AbortController | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const fail = () => {
    if (closed) return;
    onError?.(new Event("error"));
    retry = setTimeout(open, RECONNECT_MS);
  };

  async function open() {
    if (closed) return;
    controller = new AbortController();
    try {
      const response = await fetch(`${RUNTIME_API}/api/runtime/events`, {
        headers: getRuntimeCallerHeaders({ Accept: "text/event-stream" }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        fail();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const data = block
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).replace(/^ /, ""))
            .join("\n");
          if (data) {
            const event = normalize(data);
            if (event) onEvent(event);
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
      fail();
    } catch {
      fail();
    }
  }

  void open();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    controller?.abort();
  };
}
