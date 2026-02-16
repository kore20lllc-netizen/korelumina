import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

function getJobFile(jobId: string) {
  return path.join(process.cwd(), "runtime", "jobs", `${jobId}.json`);
}

export async function GET(
  _req: Request,
  context: RouteContext
) {
  const { jobId } = await context.params;
  const jobFile = getJobFile(jobId);

  if (!fs.existsSync(jobFile)) {
    return new NextResponse("Job not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastLength = 0;

      const interval = setInterval(() => {
        if (!fs.existsSync(jobFile)) {
          controller.close();
          clearInterval(interval);
          return;
        }

        const raw = fs.readFileSync(jobFile, "utf-8");
        const job = JSON.parse(raw);

        const logs = job.logs || [];

        if (logs.length > lastLength) {
          const newLogs = logs.slice(lastLength);
          newLogs.forEach((log: string) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ log })}\n\n`)
            );
          });
          lastLength = logs.length;
        }

        if (job.status === "completed" || job.status === "failed") {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: job.status })}\n\n`
            )
          );
          controller.close();
          clearInterval(interval);
        }
      }, 1000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
