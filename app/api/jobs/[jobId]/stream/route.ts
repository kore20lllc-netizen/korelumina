import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Log = {
  message: string;
  timestamp?: number;
};

type Job = {
  logs?: Log[];
};

function safeParse<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

function getJobFile(jobId: string) {
  return path.join(process.cwd(), "runtime", "jobs", `${jobId}.json`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  let lastLength = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const interval = setInterval(() => {
        try {
          const filePath = getJobFile(jobId);

          if (!fs.existsSync(filePath)) {
            send({ type: "waiting" });
            return;
          }

          const raw = fs.readFileSync(filePath, "utf-8");
          const job = safeParse<Job>(raw, { logs: [] });

          const logs = job.logs ?? [];

          if (logs.length > lastLength) {
            const newLogs = logs.slice(lastLength);
            lastLength = logs.length;

            send({ type: "logs", data: newLogs });
          }
        } catch {
          send({
            type: "error",
            message: "stream failure",
          });
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
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
