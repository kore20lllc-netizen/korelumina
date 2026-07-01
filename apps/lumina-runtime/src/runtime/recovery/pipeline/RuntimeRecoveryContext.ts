import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

import type {
  PublicRuntimeRecord,
} from "../../registry.js";

export interface RuntimeRecoveryInput {
  projectId: string;
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
