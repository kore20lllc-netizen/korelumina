import type { ExecutionStage } from "@korelumina/platform-sdk";

import { ensureProjectIsolation } from "../../../ensureProjectIsolation.js";
import { runLayoutSafetyEngine } from "../../../layoutSafetyEngine.js";
import { assertProjectReady } from "../../RuntimeStartupValidator.js";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "../RuntimeStartupContext.js";

export const ValidateProjectStage: ExecutionStage<
  RuntimeStartupInput,
  RuntimeStartupState
> = {
  name: "validate-project",
  async run(context) {
    const projectPath = context.state.projectPath!;

    ensureProjectIsolation(projectPath);
    runLayoutSafetyEngine(
      context.input.projectId,
      projectPath,
    );
    assertProjectReady(projectPath);

    return {
      stage: "validate-project",
      success: true,
    };
  },
};
