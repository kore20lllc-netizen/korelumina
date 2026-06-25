import http from "node:http";
import https from "node:https";

import {
  isPidAlive,
  setRuntime,
} from "./registry.js";
import {
  listPersistedRuntimes,
  removeRuntimeState,
} from "./persistence.js";

function isRecoverableStatus(status: string | undefined): boolean {
  return status === "running";
}

function canReachUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = url.startsWith("https://") ? https : http;

    const req = client.get(url, (res) => {
      res.resume();
      resolve((res.statusCode ?? 500) < 500);
    });

    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => {
      resolve(false);
    });
  });
}

export async function recoverPersistedRuntimes() {
  const persisted = listPersistedRuntimes();

  for (const record of persisted) {
    if (
      !isRecoverableStatus(record.status) ||
      !record.pid ||
      !isPidAlive(record.pid) ||
      !(await canReachUrl(record.url))
    ) {
      console.log(
        `[lumina-runtime] removing stale runtime record ${record.projectId}`,
      );

      removeRuntimeState(record.projectId);
      continue;
    }

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

    console.log(
      `[lumina-runtime] restored runtime ${record.projectId} pid=${record.pid}`,
    );
  }
}
