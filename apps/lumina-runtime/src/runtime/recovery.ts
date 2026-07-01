import http from "node:http";
import https from "node:https";

import {
  isPidAlive,
} from "./registry.js";

import {
  listPersistedRuntimes,
  removeRuntimeState,
} from "./persistence.js";

import {
  runRuntimeRecoveryPipeline,
  ResolveRuntimeStage,
  ValidateRecoveryStage,
  RestoreRuntimeStage,
  PublishRecoveryStage,
  ReportStage,
} from "./recovery/pipeline/index.js";

function isRecoverableStatus(
  status: string | undefined,
): boolean {
  return status === "running";
}

function canReachUrl(
  url: string,
): Promise<boolean> {
  return new Promise(
    (resolve) => {
      const client =
        url.startsWith("https://")
          ? https
          : http;

      const req =
        client.get(
          url,
          (res) => {
            res.resume();
            resolve(
              (res.statusCode ?? 500) <
                500,
            );
          },
        );

      req.setTimeout(
        1500,
        () => {
          req.destroy();
          resolve(false);
        },
      );

      req.on(
        "error",
        () => {
          resolve(false);
        },
      );
    },
  );
}

async function isRecoverableRuntime(
  record: ReturnType<
    typeof listPersistedRuntimes
  >[number],
) {
  return (
    isRecoverableStatus(
      record.status,
    ) &&
    Boolean(record.pid) &&
    isPidAlive(record.pid) &&
    (await canReachUrl(record.url))
  );
}

export async function recoverPersistedRuntimes() {
  const persisted =
    listPersistedRuntimes();

  for (const record of persisted) {
    if (
      !(await isRecoverableRuntime(
        record,
      ))
    ) {
      console.log(
        `[lumina-runtime] removing stale runtime record ${record.projectId}`,
      );

      removeRuntimeState(
        record.projectId,
      );

      continue;
    }

    await runRuntimeRecoveryPipeline(
      {
        projectId:
          record.projectId,
        record,
        reason:
          "runtime-startup-recovery",
      },
      [
        ResolveRuntimeStage,
        ValidateRecoveryStage,
        RestoreRuntimeStage,
        PublishRecoveryStage,
        ReportStage,
      ],
    );
  }
}
