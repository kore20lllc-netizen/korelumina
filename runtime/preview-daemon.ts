import { cleanupDeadPreviews } from "./preview-store";
import http from "http";
import { getFreePort } from "./port-utils";
import { startPreviewProcess } from "./preview-store";
import { resolveWorkspacePath } from "../lib/workspace-jail";
import { monitorPreviews } from "./health-monitor";

const HOST = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
const PORT = Number(process.env.KORELUMINA_PREVIEWD_PORT || 3101);

function send(res: http.ServerResponse, status: number, payload: any) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return send(res, 404, { error: "Not found" });

  if (req.method === "POST" && req.url === "/preview/start") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);

        const projectRoot = resolveWorkspacePath(workspaceId, projectId);
        const preview = startPreviewProcess(
          workspaceId,
          projectId,
          projectRoot,
          port,
          "npm",
          ["run","dev","--","--host","0.0.0.0","--port",String(port)]
        );

        return send(res, 200, {
          ok: true,
          workspaceId,
          projectId,
          preview
        });
        const port = await getFreePort();

        const preview = startPreviewProcess(
          workspaceId,
          projectId,
          projectRoot,
          port,
          "npm",
          ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(port)]
        );

        send(res, 200, {
          ok: true,
          workspaceId,
          projectId,
          preview
        });
      } catch (e: any) {
        send(res, 500, { error: e?.message ?? "start failed" });
      }
    });
    return;
  }

  send(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`previewd running on ${HOST}:${PORT}`);
cleanupDeadPreviews();
console.log("[previewd] cleaned stale previews");
});

/* Health monitor loop */
setInterval(() => {
  monitorPreviews().catch(console.error);
}, 5000);
