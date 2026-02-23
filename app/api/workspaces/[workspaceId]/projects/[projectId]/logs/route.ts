import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function resolveLogPath(
  workspaceId: string,
  projectId: string,
  kind: string
) {
  const base = path.join(
    process.cwd(),
    "runtime",
    "logs",
    workspaceId
  );

  if (kind === "preview") {
    return path.join(base, `${projectId}.preview.log`);
  }

  if (!fs.existsSync(base)) return null;

  const files = fs.readdirSync(base);

  const buildLogs = files
    .filter(
      (f) =>
        f.startsWith(`${projectId}.`) &&
        f.endsWith(".log") &&
        !f.endsWith(".preview.log")
    )
    .sort()
    .reverse();

  if (buildLogs.length === 0) return null;

  return path.join(base, buildLogs[0]);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "preview";
  const follow = searchParams.get("follow") === "1";

  const logPath = resolveLogPath(
    workspaceId,
    projectId,
    kind
  );

  if (!logPath || !fs.existsSync(logPath)) {
    return Response.json({
      logs: [],
      message: "No log file"
    });
  }

  if (!follow) {
    const content = fs.readFileSync(logPath, "utf8");
    return Response.json({
      logs: content.split("\n")
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(
          encoder.encode(`data: ${data}\n\n`)
        );
      };

      let position = 0;

      const interval = setInterval(() => {
        if (!fs.existsSync(logPath)) return;

        const content = fs.readFileSync(logPath, "utf8");
        const newContent = content.slice(position);

        if (newContent.length > 0) {
          position = content.length;
          send(newContent);
        }
      }, 500);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
