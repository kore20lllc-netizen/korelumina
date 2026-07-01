import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  appendRuntimeLog,
  markRuntimeStatus,
  removeRuntime,
} from "../../../registry.js";

import {
  clearRuntimeManualStop,
  isRuntimeManualStop,
} from "../../../manualStop.js";

import {
  attachRuntimeLifecycle,
} from "../../RuntimeLifecycleBinder.js";

import {
  AUTO_RESTART_DELAY_MS,
  recordRestartHistory,
  shouldAutoRestart,
} from "../../RuntimeRestartPolicy.js";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "../RuntimeStartupContext.js";

export const BindLifecycleStage: ExecutionStage<
  RuntimeStartupInput,
  RuntimeStartupState
> = {
  name: "bind-lifecycle",

  async run(context) {
    attachRuntimeLifecycle({
      proc:
        context.state.proc!,
      runtime:
        context.state.runtime!,
      projectId:
        context.input.projectId,
      restartProject:
        context.input.restartProject,
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

    return {
      stage: "bind-lifecycle",
      success: true,
    };
  },
};
