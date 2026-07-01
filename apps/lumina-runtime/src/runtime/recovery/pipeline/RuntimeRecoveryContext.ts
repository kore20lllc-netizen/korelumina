import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

import type {
  PersistedRuntime,
} from "../../persistence.js";

import type {
  PublicRuntimeRecord,
} from "../../registry.js";

export interface RuntimeRecoveryInput {
  projectId: string;
  record: PersistedRuntime;
  reason?: string;
}

export interface RuntimeRecoveryState
  extends Record<string, unknown> {
  runtime?: PublicRuntimeRecord;
  recovered?: boolean;
  recoveryReason?: string;
}

export type RuntimeRecoveryContext =
  ExecutionContext<
    RuntimeRecoveryInput,
    RuntimeRecoveryState
  >;
