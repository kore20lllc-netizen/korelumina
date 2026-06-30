import type {
  ChildProcess,
} from "node:child_process";

import type {
  RuntimeRecord,
  RuntimeStatus,
} from "../registry.js";

export type RuntimeLifecycleOptions = {
  proc: ChildProcess;

  runtime: RuntimeRecord;

  projectId: string;

  restartProject: (
    projectId: string,
  ) => Promise<void>;

  removeRuntime: (
    projectId: string,
  ) => void;

  appendRuntimeLog: (
    projectId: string,
    line: string,
  ) => void;

  markRuntimeStatus: (
    projectId: string,
    status: RuntimeStatus,
    options?: {
      exitedAt?: number;
      lastError?: string;
    },
  ) => unknown;

  isRuntimeManualStop: (
    projectId: string,
  ) => boolean;

  clearRuntimeManualStop: (
    projectId: string,
  ) => void;

  shouldAutoRestart: (
    projectId: string,
  ) => boolean;

  recordRestartHistory: (
    projectId: string,
    reason: "manual" | "auto-recovery",
  ) => void;

  autoRestartDelayMs: number;
};

export function attachRuntimeLifecycle(
  _options: RuntimeLifecycleOptions,
): void {
  // Phase 029:
  // Move the existing proc.on("error")
  // and proc.on("exit") handlers here
  // without changing behavior.
}
