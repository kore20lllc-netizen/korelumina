import type {
  ExecutiveEvent,
} from "../events/index.js";

export type ExecutiveLifecycleStage =
  | "received"
  | "validated"
  | "context-updated"
  | "routed"
  | "dispatched"
  | "completed"
  | "rejected"
  | "failed";

export interface ExecutiveLifecycleTransition {
  stage: ExecutiveLifecycleStage;

  timestamp: number;

  message?: string;
}

export interface ExecutiveLifecycle {
  eventId: string;

  eventType: string;

  stage: ExecutiveLifecycleStage;

  startedAt: number;

  completedAt?: number;

  transitions:
    readonly ExecutiveLifecycleTransition[];

  error?: string;
}

export function createExecutiveLifecycle(
  event: ExecutiveEvent,
  timestamp = Date.now(),
): ExecutiveLifecycle {
  return {
    eventId: event.id,

    eventType: event.type,

    stage: "received",

    startedAt: timestamp,

    transitions: [
      {
        stage: "received",
        timestamp,
      },
    ],
  };
}

export function transitionExecutiveLifecycle(
  lifecycle: ExecutiveLifecycle,
  stage: ExecutiveLifecycleStage,
  options: {
    timestamp?: number;
    message?: string;
    error?: string;
  } = {},
): ExecutiveLifecycle {
  const timestamp =
    options.timestamp ??
    Date.now();

  const terminal =
    stage === "completed" ||
    stage === "rejected" ||
    stage === "failed";

  return {
    ...lifecycle,

    stage,

    completedAt:
      terminal
        ? timestamp
        : lifecycle.completedAt,

    transitions: [
      ...lifecycle.transitions,
      {
        stage,
        timestamp,
        message: options.message,
      },
    ],

    error:
      options.error ??
      lifecycle.error,
  };
}
