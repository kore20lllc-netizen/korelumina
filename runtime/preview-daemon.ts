import http from "http";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import {
  getActivePreview,
  startPreviewProcess,
  cleanupDeadPreviews,
  findFreePort
} from "./preview-store";

const HOST = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
const PORT = Number(process.env.KORELUMINA_PREVIEWD_PORT || 3101);

cleanupDeadPreviews();
console.log("[previewd] cleaned stale previews");

function send(res: http.ServerResponse, status: number, payload: any) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (!req.url) return send(res, 404, { error: "Not found" });

  if (req.method === "POST" && req.url === "/preview/start") {
    let body = "";

    req.on("data", chunk => (body += chunk));

    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);

        if (!workspaceId || !projectId) {
          return send(res, 400, { error: "workspaceId and projectId required" });
        }

        const existing = getActivePreview(workspaceId, projectId);
        if (existing) {
          return send(res, 200, {
            ok: true,
            workspaceId,
            projectId,
            preview: existing
          });
        }

        const projectRoot = resolveWorkspacePath(workspaceId, projectId);

        const port = await findFreePort(4100, 4200);

        const preview = startPreviewProcess(
          workspaceId,
          projectId,
          projectRoot,
          port,
          "npm",
          ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(port)]
        );

        return send(res, 200, {
          ok: true,
          workspaceId,
          projectId,
          preview
        });
      } catch (e: any) {
        return send(res, 500, { error: e?.message ?? "start failed" });
      }
    });

    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "Unknown route" });
});

server.listen(PORT, HOST, () => {
  console.log(`previewd running on ${HOST}:${PORT}`);
});
