import { spawn } from "node:child_process";

import {
  isPidAlive,
  setRuntime,
} from "./registry.js";
import {
  listPersistedRuntimes,
  removeRuntimeState,
} from "./persistence.js";

export function recoverPersistedRuntimes() {
  const persisted = listPersistedRuntimes();

  for (const record of persisted) {
    if (!record.pid || !isPidAlive(record.pid)) {
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
      process: spawn(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)"], {
        stdio: "ignore",
      }),
    });

    console.log(
      `[lumina-runtime] restored runtime ${record.projectId} pid=${record.pid}`,
    );
  }
}
