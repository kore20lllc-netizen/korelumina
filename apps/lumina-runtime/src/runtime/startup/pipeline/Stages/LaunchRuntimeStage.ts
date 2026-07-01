import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  launchRuntimeProcess,
} from "../../RuntimeProcessLauncher.js";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "../RuntimeStartupContext.js";

export const LaunchRuntimeStage: ExecutionStage<
  RuntimeStartupInput,
  RuntimeStartupState
> = {
  name: "launch-runtime",

  async run(context) {
    const launched =
      launchRuntimeProcess({
        projectId:
          context.input.projectId,
        framework:
          context.state.framework!,
        port:
          context.state.port!,
        projectPath:
          context.state.projectPath!,
        command:
          context.state.command!,
        isAutoRestart:
          context.input.isAutoRestart,
      });

    context.state.proc =
      launched.proc;
    context.state.runtime =
      launched.runtime;

    return {
      stage: "launch-runtime",
      success: true,
      metadata: {
        pid:
          launched.proc.pid,
        url:
          launched.runtime.url,
      },
    };
  },
};
