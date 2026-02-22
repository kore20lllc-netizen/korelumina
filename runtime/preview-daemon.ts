import http from "http";
import path from "path";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import {
  startPreviewProcess,
  stopPreviewProcess,
  getActivePreview,
  cleanupDeadPreviews
} from "./preview-store";
import { findFreePort } from "./port-utils";

const HOST = "127.0.0.1";
const PORT = 3101;

function send(res: http.ServerResponse, status: number, payload: any) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

cleanupDeadPreviews();
console.log("[previewd] cleaned stale previews");

const server = http.createServer(async (req, res) => {
  if (!req.url) return send(res, 404, { error: "not found" });

  if (req.method === "POST" && req.url === "/preview/start") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);

        const existing = getActivePreview(workspaceId, projectId);
        if (existing) {
          return send(res, 200, {
            ok: true,
            workspaceId,
            projectId,
            port: existing.port,
            pid: existing.pid
          });
        }

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

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`previewd running on ${HOST}:${PORT}`);
});
