import { readPreviews, startPreviewProcess } from "./preview-store";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import { findFreePort } from "./port-utils";

function isPidAlive(pid: number | null) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function recoverStalePreviews() {
  const previews = readPreviews();

  for (const p of previews) {
    if (!isPidAlive(p.pid)) {
      const cwd = resolveWorkspacePath(p.workspaceId, p.projectId);
      const port = await findFreePort(4100);

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
