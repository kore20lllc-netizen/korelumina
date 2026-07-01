import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  appendRuntimeLog,
  isPidAlive,
  markRuntimeStatus,
} from "../../../registry.js";

import {
  markRuntimeManualStop,
} from "../../../manualStop.js";

import {
  recordRuntimeEvent,
} from "../../../../knowledge/runtime/index.js";

import type {
  RuntimeShutdownInput,
  RuntimeShutdownState,
} from "../RuntimeShutdownContext.js";

function wait(
  ms: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(resolve, ms);
    },
  );
}

function killProcess(
  pid: number | undefined,
  signal: NodeJS.Signals,
): void {
  if (!pid) {
    return;
  }

  try {
    process.kill(pid, signal);
  } catch {
    // Process already exited.
  }
}

export const TerminateRuntimeStage: ExecutionStage<
  RuntimeShutdownInput,
  RuntimeShutdownState
> = {
  name: "terminate-runtime",

  async run(context) {
    const runtime =
      context.state.runtime!;

    const projectId =
      context.input.projectId;

    markRuntimeManualStop(projectId);

    markRuntimeStatus(
      projectId,
      "stopping",
    );

    recordRuntimeEvent({
      projectId,
      type: "runtime_stopping",
    });

    appendRuntimeLog(
      projectId,
      `[lumina-runtime] stopping runtime ${projectId}`,
    );

    try {
      if (runtime.pid) {
        process.kill(
          -runtime.pid,
          "SIGTERM",
        );
      } else {
        runtime.process?.kill(
          "SIGTERM",
        );
      }
    } catch {
      try {
        runtime.process?.kill(
          "SIGTERM",
        );
      } catch {
        // noop
      }
    }

    killProcess(
      runtime.pid,
      "SIGTERM",
    );

    await wait(1200);

    if (isPidAlive(runtime.pid)) {
      appendRuntimeLog(
        projectId,
        `[lumina-runtime] force killing runtime ${projectId}`,
      );

      try {
        if (runtime.pid) {
          process.kill(
            -runtime.pid,
            "SIGKILL",
          );
        }
      } catch {
        // noop
      }

      killProcess(
        runtime.pid,
        "SIGKILL",
      );
    }

    return {
      stage: "terminate-runtime",
      success: true,
      metadata: {
        projectId,
        pid: runtime.pid,
      },
    };
  },
};
