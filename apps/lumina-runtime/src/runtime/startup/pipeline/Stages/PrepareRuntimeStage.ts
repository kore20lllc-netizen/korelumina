import getPort from "get-port";

import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  detectFramework,
} from "../../../../detect/detectFramework.js";

import {
  buildRuntimeCommand,
} from "../../RuntimeCommandBuilder.js";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "../RuntimeStartupContext.js";

export const PrepareRuntimeStage: ExecutionStage<
  RuntimeStartupInput,
  RuntimeStartupState
> = {
  name: "prepare-runtime",

  async run(context) {
    const framework =
      detectFramework(
        context.state.projectPath!,
      );

    if (framework === "unknown") {
      throw new Error(
        "unsupported_framework",
      );
    }

    const port =
      await getPort({
        port: Array.from(
          { length: 200 },
          (_, index) =>
            4200 + index,
        ),
      });

    const command =
      buildRuntimeCommand(
        framework,
        port,
      );

    context.state.framework =
      framework;
    context.state.port =
      port;
    context.state.command =
      command;

    console.log(
      "[runtime/start]",
      {
        projectId:
          context.input.projectId,
        framework,
        port,
        projectPath:
          context.state.projectPath,
        autoRestart:
          context.input.isAutoRestart,
        command: [
          "npm",
          ...command,
        ].join(" "),
      },
    );

    return {
      stage: "prepare-runtime",
      success: true,
    };
  },
};
