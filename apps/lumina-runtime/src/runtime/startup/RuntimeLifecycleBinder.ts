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

export function attachRuntimeLifecycle({
  proc,
  runtime,
  projectId,
  restartProject,
  removeRuntime,
  appendRuntimeLog,
  markRuntimeStatus,
  isRuntimeManualStop,
  clearRuntimeManualStop,
  shouldAutoRestart,
  recordRestartHistory,
  autoRestartDelayMs,
}: RuntimeLifecycleOptions): void {
  proc.on(
    "error",
    (error) => {
      runtime.status =
        "error";

      runtime.lastError =
        error.message;

      appendRuntimeLog(
        projectId,
        `[spawn error] ${error.message}`,
      );

      removeRuntime(
        projectId,
      );
    },
  );

  proc.on(
    "exit",
    (
      code,
      signal,
    ) => {
      runtime.status =
        "exited";

      runtime.exitedAt =
        Date.now();

      runtime.lastError =
        `process_exit code=${code} signal=${signal}`;

      appendRuntimeLog(
        projectId,
        `[exit] code=${code} signal=${signal}`,
      );

      console.log(
        "[runtime/exit]",
        {
          projectId,
          code,
          signal,
          pid: runtime.pid,
          status: runtime.status,
        },
      );

      if (
        isRuntimeManualStop(projectId)
      ) {
        clearRuntimeManualStop(projectId);

        removeRuntime(
          projectId,
        );

        return;
      }

      const intentionalStop =
        signal ===
          "SIGTERM" ||
        signal ===
          "SIGKILL";

      if (
        intentionalStop
      ) {
        removeRuntime(
          projectId,
        );

        return;
      }

      if (
        !shouldAutoRestart(
          projectId,
        )
      ) {
        markRuntimeStatus(
          projectId,
          "error",
          {
            lastError:
              "auto_restart_limit_reached",
          },
        );

        runtime.lastError =
          "auto_restart_limit_reached";

        appendRuntimeLog(
          projectId,
          "[lumina-runtime] auto-restart disabled: limit reached",
        );

        return;
      }

      recordRestartHistory(
        projectId,
        "auto-recovery",
      );

      appendRuntimeLog(
        projectId,
        `[lumina-runtime] auto-restart scheduled in ${autoRestartDelayMs}ms`,
      );

      setTimeout(() => {
        void restartProject(
          projectId,
        );
      }, autoRestartDelayMs).unref();
    },
  );
}
