import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  setRuntime,
  serializeRuntime,
} from "../../../registry.js";

import type {
  RuntimeRecoveryInput,
  RuntimeRecoveryState,
} from "../RuntimeRecoveryContext.js";

export const RestoreRuntimeStage: ExecutionStage<
  RuntimeRecoveryInput,
  RuntimeRecoveryState
> = {
  name: "restore-runtime",

  async run(context) {
    const record =
      context.input.record;

    const runtime =
      setRuntime({
        projectId: record.projectId,
        framework: record.framework,
        port: record.port,
        pid: record.pid,
        startedAt: record.startedAt,
        exitedAt: record.exitedAt,
        lastError: record.lastError,
        url: record.url,
        status: record.status,
        logs: [
          `[lumina-runtime] restored persisted runtime ${record.projectId}`,
        ],
      });

    context.state.runtime =
      serializeRuntime(runtime);

    context.state.recovered =
      true;

    return {
      stage: "restore-runtime",
      success: true,
      metadata: {
        projectId: record.projectId,
        pid: record.pid,
        url: record.url,
      },
    };
  },
};
