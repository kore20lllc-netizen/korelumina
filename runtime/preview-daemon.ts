import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import {
  getPreview,
  markPreviewRunning,
  markPreviewStopped,
  startPreviewProcess,
} from "./preview-store";

const HOST = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
const PORT = Number(process.env.KORELUMINA_PREVIEWD_PORT || 3101);

function send(res: http.ServerResponse, status: number, payload: any) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function isPidRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return send(res, 404, { error: "Not found" });

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && req.url === "/preview/start") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);

        const existing = getPreview(workspaceId, projectId);
        if (existing?.pid && isPidRunning(existing.pid)) {
          return send(res, 200, { ok: true, workspaceId, projectId, preview: existing });
        }

        // stale record (pid dead) -> allow restart
        const projectRoot = resolveWorkspacePath(workspaceId, projectId);
        const port = 4100;

        console.log("[previewd] framework=vite port=" + port);
        console.log("[previewd] cwd=" + projectRoot);

        // Prefer using preview-store's process runner (logs + state)
        const cmd = "npm";
        const args = ["run", "dev", "--", "--host", "0.0.0.0", "--port", "$PORT"];

        const preview = startPreviewProcess(
          workspaceId,
          projectId,
          projectRoot,
          port,
          cmd,
          args
        );

        console.log("[previewd] listening " + preview.url);

        return send(res, 200, { ok: true, workspaceId, projectId, preview });
      } catch (e: any) {
        console.error(e);
        return send(res, 500, { error: e?.message ?? "start failed" });
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/preview/stop") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);
        const existing = getPreview(workspaceId, projectId);

        if (existing?.pid) {
          try {
            process.kill(existing.pid, "SIGTERM");
          } catch {}
        }

        markPreviewStopped(workspaceId, projectId);
        return send(res, 200, { ok: true, workspaceId, projectId });
      } catch (e: any) {
        console.error(e);
        return send(res, 500, { error: e?.message ?? "stop failed" });
      }
    });
    return;
  }

  return send(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`previewd running on ${HOST}:${PORT}`);
});
