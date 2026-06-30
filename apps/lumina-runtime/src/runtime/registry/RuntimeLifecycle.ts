import {
  appendRuntimeLog,
  getRuntime,
  isPidAlive,
  listRuntimes,
  markRuntimeStatus,
  removeRuntime,
} from "../registry.js";

import {
  markRuntimeManualStop,
} from "../manualStop.js";

import {
  recordRuntimeEvent,
} from "../../knowledge/runtime/index.js";

function wait(
  ms: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        ms,
      );
    },
  );
}

function killProcess(
  pid:
    | number
    | undefined,
  signal: NodeJS.Signals,
): void {
  if (!pid) {
    return;
  }

  try {
    process.kill(
      pid,
      signal,
    );
  } catch {
    // Process already exited.
  }
}

export async function stopRuntime(
  projectId: string,
): Promise<boolean> {
  const runtime =
    getRuntime(
      projectId,
    );

  if (!runtime) {
    return false;
  }

  markRuntimeManualStop(projectId);

  markRuntimeStatus(
    projectId,
    "stopping",
  );

  recordRuntimeEvent({
    projectId,
    type:
      "runtime_stopping",
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

  if (
    isPidAlive(
      runtime.pid,
    )
  ) {
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

  recordRuntimeEvent({
    projectId,
    type:
      "runtime_stopped",
  });

  markRuntimeStatus(
    projectId,
    "exited",
    {
      exitedAt:
        Date.now(),
    },
  );

  removeRuntime(projectId);

  return true;
}

export async function stopAllRuntimes(): Promise<void> {
  const runtimes =
    listRuntimes();

  await Promise.all(
    runtimes.map(
      (runtime) =>
        stopRuntime(
          runtime.projectId,
        ),
    ),
  );
}
