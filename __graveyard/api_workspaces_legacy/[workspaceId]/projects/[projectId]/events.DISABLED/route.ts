import { NextRequest } from "next/server";
import { getLatestJobForProject } from "@/runtime/job-store";
import { getActivePreview } from "@/runtime/preview-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const encoder = new TextEncoder();
  let closed = false;
  let interval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: any) => {
        if (closed) return;

        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          closed = true;
          clearInterval(interval);
        }
      };

      interval = setInterval(() => {
        if (closed) return;

        const job = getLatestJobForProject(workspaceId, projectId);
        const preview = getActivePreview(workspaceId, projectId);

        if (job) send("build", job);
        if (preview) send("preview", preview);
      }, 1000);
    },

    cancel() {
      closed = true;
      clearInterval(interval);
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
