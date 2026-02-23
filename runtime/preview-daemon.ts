import http from "http";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import {
  readPreviews,
  startPreviewProcess,
  stopPreviewProcess,
  cleanupDeadPreviews
} from "./preview-store";
import { findFreePort } from "./port-utils";

const HOST = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
const PORT = Number(process.env.KORELUMINA_PREVIEWD_PORT || 3101);

function send(res: http.ServerResponse, status: number, payload: any) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function isPidAlive(pid: number | null) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function autoRecoverPreviews() {
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

cleanupDeadPreviews();
autoRecoverPreviews();

const server = http.createServer((req, res) => {
  if (!req.url) return send(res, 404, { error: "not found" });

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && req.url === "/preview/start") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);

        const cwd = resolveWorkspacePath(workspaceId, projectId);
        const port = await findFreePort(4100);

        const record = startPreviewProcess(
          workspaceId,
          projectId,
          cwd,
          port,
          "npm",
          ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(port)]
        );

        return send(res, 200, {
          ok: true,
          workspaceId,
          projectId,
          port: record.port,
          pid: record.pid
        });
      } catch (e: any) {
        return send(res, 500, { error: e?.message });
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/preview/stop") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);
        const result = stopPreviewProcess(workspaceId, projectId);
        return send(res, 200, result);
      } catch (e: any) {
        return send(res, 500, { error: e?.message });
      }
    });
    return;
  }

  return send(res, 404, { error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[previewd] running on ${HOST}:${PORT}`);
});
