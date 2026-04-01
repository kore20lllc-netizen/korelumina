import { ensureProjectRoot } from "@/runtime/fs/ensureProjectRoot";
import fs from "fs";
import path from "path";
import { bumpPreviewVersion } from "@/runtime/preview-version"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return new Response("missing projectId", { status: 400 });
  }

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      let lastSent = 0;
      let timeout: NodeJS.Timeout | null = null;
      let pendingFile = "";

      const shouldIgnore = (file?: string | null) => {
        if (!file) return true;
        if (file.startsWith(".")) return true;
        if (file.includes(".preview-stamp")) return true;
        if (file.includes(".DS_Store")) return true;
        return false;
      };

      const emitChange = (file: string) => {
        const now = Date.now();

        if (now - lastSent < 600) {
          if (timeout) clearTimeout(timeout);
          pendingFile = file;
          timeout = setTimeout(() => {
            lastSent = Date.now();
            bumpPreviewVersion(projectId)

            send({
              type: "fs-change",
              file: pendingFile,
              ts: lastSent,
            });
          }, 650);
          return;
        }

        lastSent = now;
        bumpPreviewVersion(projectId)

          send({
          type: "fs-change",
          file,
          ts: now,
        });
      };

      const watcher = fs.watch(
        projectRoot,
        { recursive: true },
        (_eventType, filename) => {
          const file = filename?.toString() || "";

          if (shouldIgnore(file)) return;

          emitChange(file);
        }
      );

      req.signal.addEventListener("abort", () => {
        watcher.close();
        if (timeout) clearTimeout(timeout);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}