import type {
  ChildProcess,
} from "node:child_process";

import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

import type {
  PublicRuntimeRecord,
  RuntimeRecord,
} from "../../registry.js";

export interface RuntimeStartupInput {
  projectId: string;
  isAutoRestart: boolean;
  restartProject: (
    projectId: string,
  ) => Promise<void>;
}

export interface RuntimeStartupState
  extends Record<string, unknown> {
  projectPath?: string;
  framework?: string;
  port?: number;
  command?: string[];
  proc?: ChildProcess;
  runtime?: RuntimeRecord;
  result?: PublicRuntimeRecord;
}

export type RuntimeStartupContext =
  ExecutionContext<
    RuntimeStartupInput,
    RuntimeStartupState
  >;
