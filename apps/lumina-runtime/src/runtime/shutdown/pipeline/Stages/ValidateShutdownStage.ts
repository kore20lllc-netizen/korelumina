import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeShutdownInput,
  RuntimeShutdownState,
} from "../RuntimeShutdownContext.js";

export const ValidateShutdownStage: ExecutionStage<
  RuntimeShutdownInput,
  RuntimeShutdownState
> = {
  name: "validate-shutdown",

  async run(context) {
    return {
      stage: "validate-shutdown",
      success: Boolean(context.state.runtime),
    };
  },
};
