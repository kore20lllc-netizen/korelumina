import type { ExecutionStage } from "@korelumina/platform-sdk";
import { getProjectPath } from "../../../../projects/getProjectPath.js";
import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "../RuntimeStartupContext.js";

export const ResolveProjectStage: ExecutionStage<
  RuntimeStartupInput,
  RuntimeStartupState
> = {
  name: "resolve-project",
  async run(context) {
    context.state.projectPath = getProjectPath(
      context.input.projectId,
    );

    return {
      stage: "resolve-project",
      success: true,
    };
  },
};
