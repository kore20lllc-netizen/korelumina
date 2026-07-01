import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

import type {
  RuntimeRecord,
} from "../../registry.js";

export interface RuntimeShutdownInput {
  projectId: string;
}

export interface RuntimeShutdownState
  extends Record<string, unknown> {
  runtime?: RuntimeRecord;
  stopped?: boolean;
}

export type RuntimeShutdownContext =
  ExecutionContext<
    RuntimeShutdownInput,
    RuntimeShutdownState
  >;
