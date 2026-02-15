import { getLogs } from "@/runtime/job-logs";
import { getJob } from "@/runtime/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseLine(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;

  const encoder = new TextEncoder();
  let cursor = 0;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) =>
        controller.enqueue(encoder.encode(chunk));

      const initial = getLogs(jobId);
      cursor = initial.length;
      send(sseLine("logs", initial));

      const interval = setInterval(() => {
        const logs = getLogs(jobId);
        const job = getJob(jobId);

        if (logs.length > cursor) {
          const next = logs.slice(cursor);
          cursor = logs.length;
          send(sseLine("logs", next));
        }

        if (job && (job.status === "completed" || job.status === "failed")) {
          send(
            sseLine("done", {
              status: job.status,
              error: job.error,
              result: job.result,
            })
          );
          clearInterval(interval);
          controller.close();
        }
      }, 500);

      req.signal?.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
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
