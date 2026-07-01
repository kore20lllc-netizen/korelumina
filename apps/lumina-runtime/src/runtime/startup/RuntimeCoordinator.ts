import getPort from "get-port";

import { detectFramework } from "../../detect/detectFramework.js";
import { getProjectPath } from "../../projects/getProjectPath.js";
import { ensureProjectIsolation } from "../ensureProjectIsolation.js";
import { runLayoutSafetyEngine } from "../layoutSafetyEngine.js";

import {
  appendRuntimeLog,
  markRuntimeStatus,
  removeRuntime,
  type PublicRuntimeRecord,
} from "../registry.js";

import {
  clearRuntimeManualStop,
  isRuntimeManualStop,
} from "../manualStop.js";

import {
  assertProjectReady,
} from "./RuntimeStartupValidator.js";

import {
  buildRuntimeCommand,
} from "./RuntimeCommandBuilder.js";

import {
  launchRuntimeProcess,
} from "./RuntimeProcessLauncher.js";

import {
  attachRuntimeLifecycle,
} from "./RuntimeLifecycleBinder.js";

import {
  finalizeRuntimeStartup,
} from "./RuntimeReadiness.js";

import {
  AUTO_RESTART_DELAY_MS,
  recordRestartHistory,
  shouldAutoRestart,
} from "./RuntimeRestartPolicy.js";

export type RuntimeCoordinatorOptions = {
  projectId: string;
  isAutoRestart: boolean;
  restartProject: (
    projectId: string,
  ) => Promise<void>;
};

export async function coordinateRuntimeStartup({
  projectId,
  isAutoRestart,
  restartProject,
}: RuntimeCoordinatorOptions): Promise<PublicRuntimeRecord> {
  const projectPath =
    getProjectPath(
      projectId,
    );

  ensureProjectIsolation(
    projectPath,
  );

  runLayoutSafetyEngine(
    projectId,
    projectPath,
  );

  assertProjectReady(
    projectPath,
  );

  const framework =
    detectFramework(
      projectPath,
    );

  if (
    framework ===
    "unknown"
  ) {
    throw new Error(
      "unsupported_framework",
    );
  }

  const port =
    await getPort({
      port: Array.from(
        {
          length: 200,
        },
        (_, index) =>
          4200 + index,
      ),
    });

  const command =
    buildRuntimeCommand(
      framework,
      port,
    );

  console.log(
    "[runtime/start]",
    {
      projectId,
      framework,
      port,
      projectPath,
      autoRestart:
        isAutoRestart,
      command: [
        "npm",
        ...command,
      ].join(" "),
    },
  );

  const {
    proc,
    runtime,
  } =
    launchRuntimeProcess({
      projectId,
      framework,
      port,
      projectPath,
      command,
      isAutoRestart,
    });

  attachRuntimeLifecycle({
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
    autoRestartDelayMs:
      AUTO_RESTART_DELAY_MS,
  });

  return finalizeRuntimeStartup({
    projectId,
    projectPath,
    proc,
    runtime,
  });
}
