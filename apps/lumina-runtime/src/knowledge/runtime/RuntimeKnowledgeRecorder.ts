import { randomUUID } from "node:crypto";

import {
  saveRuntimeEvent,
} from "./RuntimeEventStore.js";

import type {
  RuntimeEvent,
  RuntimeEventType,
} from "./RuntimeEvent.js";

export interface RecordRuntimeEventInput {
  projectId: string;

  type: RuntimeEventType;

  metadata?: Record<
    string,
    unknown
  >;

  timestamp?: number;
}

export function recordRuntimeEvent(
  input: RecordRuntimeEventInput,
): RuntimeEvent {
  const event: RuntimeEvent = {
    id: randomUUID(),

    projectId:
      input.projectId,

    type: input.type,

    timestamp:
      input.timestamp ??
      Date.now(),

    metadata:
      input.metadata ?? {},
  };

  saveRuntimeEvent(event);

  return event;
}
