import { NextRequest } from "next/server";
import fs from "fs";
import { readJobs } from "@/runtime/job-store";
import { getPreview } from "@/runtime/preview-store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastBuildSize = 0;
      let lastPreviewSize = 0;

      const interval = setInterval(() => {
        const jobs = readJobs().filter(
          (j) =>
            j.workspaceId === workspaceId &&
            j.projectId === projectId
        );

        const latestJob = jobs.length
          ? jobs[jobs.length - 1]
          : null;

        const preview = getPreview(workspaceId, projectId);

        // BUILD LOG
        if (latestJob?.logPath && fs.existsSync(latestJob.logPath)) {
          const stats = fs.statSync(latestJob.logPath);
          if (stats.size > lastBuildSize) {
            const content = fs
              .readFileSync(latestJob.logPath, "utf8")
              .slice(lastBuildSize);

            lastBuildSize = stats.size;

            controller.enqueue(
              encoder.encode(
                `event: build\ndata: ${JSON.stringify(content)}\n\n`
              )
            );
          }
        }

        // PREVIEW LOG
        if (preview?.logPath && fs.existsSync(preview.logPath)) {
          const stats = fs.statSync(preview.logPath);
          if (stats.size > lastPreviewSize) {
            const content = fs
              .readFileSync(preview.logPath, "utf8")
              .slice(lastPreviewSize);

            lastPreviewSize = stats.size;

            controller.enqueue(
              encoder.encode(
                `event: preview\ndata: ${JSON.stringify(content)}\n\n`
              )
            );
          }
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
