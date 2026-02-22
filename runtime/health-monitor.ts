import fs from "fs";
import { readPreviews, startPreviewProcess } from "./preview-store";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import { getFreePort } from "./port-utils";

function isPidAlive(pid: number | null) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function monitorPreviews() {
  const previews = readPreviews();

  for (const p of previews) {
    if (p.status !== "running") continue;

    const alive = isPidAlive(p.pid);

    if (!alive) {
      console.log(`[monitor] Restarting ${p.projectId}`);

      const cwd = resolveWorkspacePath(p.workspaceId, p.projectId);
      const port = await getFreePort();

      startPreviewProcess(
        p.workspaceId,
        p.projectId,
        cwd,
        port,
        "npm",
        ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(port)]
      );
    }
  }
}
