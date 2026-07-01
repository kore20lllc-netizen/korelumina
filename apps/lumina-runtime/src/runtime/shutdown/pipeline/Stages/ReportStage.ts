import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeShutdownInput,
  RuntimeShutdownState,
} from "../RuntimeShutdownContext.js";

export const ReportStage: ExecutionStage<
  RuntimeShutdownInput,
  RuntimeShutdownState
> = {
  name: "report",

  async run(context) {
    return {
      stage: "report",
      success: true,
      metadata: {
        stopped:
          context.state.stopped ?? false,
      },
    };
  },
};
