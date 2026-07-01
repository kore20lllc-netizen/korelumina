import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

import type {
  PublicRuntimeRecord,
} from "../../registry.js";

export interface RuntimeStartupInput {
  projectId: string;
  isAutoRestart: boolean;
}

export interface RuntimeStartupState
  extends Record<string, unknown> {
  projectPath?: string;
  framework?: string;
  port?: number;
  command?: string[];
  runtime?: PublicRuntimeRecord;
}

export type RuntimeStartupContext =
  ExecutionContext<
    RuntimeStartupInput,
    RuntimeStartupState
  >;
