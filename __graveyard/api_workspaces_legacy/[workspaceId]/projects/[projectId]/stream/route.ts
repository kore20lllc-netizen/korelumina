import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { readJobs } from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const jobs = readJobs().filter(
    (j) => j.workspaceId === workspaceId && j.projectId === projectId
  );

  const latestJob = jobs.length ? jobs[jobs.length - 1] : null;
  const logPath = latestJob?.logPath ? path.resolve(latestJob.logPath) : null;

  if (!latestJob || !logPath) {
    return NextResponse.json({ error: "No job log available" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastSize = 0;

      const push = () => {
        if (!fs.existsSync(logPath)) return;

        const stats = fs.statSync(logPath);
        if (stats.size <= lastSize) return;

        const fd = fs.openSync(logPath, "r");
        try {
          const buf = Buffer.alloc(stats.size - lastSize);
          fs.readSync(fd, buf, 0, buf.length, lastSize);
          lastSize = stats.size;
          controller.enqueue(encoder.encode(buf.toString("utf8")));
        } finally {
          fs.closeSync(fd);
        }
      };

      // initial push
      push();

      const interval = setInterval(push, 500);

      // keepalive
      const keepalive = setInterval(() => {
        controller.enqueue(encoder.encode(""));
      }, 15_000);

      const cleanup = () => {
        clearInterval(interval);
        clearInterval(keepalive);
      };

      // stop streaming when job finishes
      const stopCheck = setInterval(() => {
        const refreshed = readJobs().filter(
          (j) => j.workspaceId === workspaceId && j.projectId === projectId
        );
        const cur = refreshed.length ? refreshed[refreshed.length - 1] : null;

        if (!cur || (cur.status !== "running" && cur.status !== "pending")) {
          clearInterval(stopCheck);
          cleanup();
          controller.close();
        }
      }, 500);

      (controller as any).cleanup = () => {
        clearInterval(stopCheck);
        cleanup();
      };
    },
    cancel(controller) {
      (controller as any).cleanup?.();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
