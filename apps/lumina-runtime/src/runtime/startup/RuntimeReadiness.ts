import {
  appendRuntimeLog,
  markRuntimeStatus,
  serializeRuntime,
  type RuntimeRecord,
  type PublicRuntimeRecord,
} from "../registry.js";

import { waitForRuntime } from "../waitForRuntime.js";
import { watchWorkspace } from "../workspaceWatcher.js";

import {
  recordRuntimeEvent,
} from "../../knowledge/runtime/index.js";

import {
  clearRestartState,
  getRestartHistory,
} from "./RuntimeRestartPolicy.js";

const START_TIMEOUT_MS = 45_000;

type RuntimeReadinessOptions = {
  projectId: string;
  projectPath: string;
  runtime: RuntimeRecord;
};

export async function finalizeRuntimeStartup({
  projectId,
  projectPath,
  runtime,
}: RuntimeReadinessOptions): Promise<PublicRuntimeRecord> {
  await waitForRuntime(
    runtime.url,
    START_TIMEOUT_MS,
  );

  markRuntimeStatus(
    projectId,
    "running",
  );

  recordRuntimeEvent({
    projectId,
    type: "runtime_started",
  });

  const history =
    getRestartHistory(
      projectId,
    );

  if (history) {
    history.lastRecoveredAt =
      Date.now();
  }

  clearRestartState(
    projectId,
  );

  watchWorkspace(
    projectId,
    projectPath,
  );

  appendRuntimeLog(
    projectId,
    `[lumina-runtime] ready ${runtime.url}`,
  );

  recordRuntimeEvent({
    projectId,
    type: "runtime_ready",
    metadata: {
      url: runtime.url,
      port: runtime.port,
    },
  });

  return serializeRuntime(
    runtime,
  );
}
