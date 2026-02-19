import fs from "fs";
import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { readJobs } from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const jobs = readJobs().filter(
    j => j.workspaceId === workspaceId && j.projectId === projectId
  );

  const latestJob = jobs.length ? jobs[jobs.length - 1] : null;

  if (!latestJob?.logPath || !fs.existsSync(latestJob.logPath)) {
    return NextResponse.json({ error: "No active build" }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(`data: ${data}\n\n`);
      };

      let lastSize = 0;

      const interval = setInterval(() => {
        if (!fs.existsSync(latestJob.logPath)) return;

        const stats = fs.statSync(latestJob.logPath);
        if (stats.size > lastSize) {
          const fd = fs.openSync(latestJob.logPath, "r");
          const buffer = Buffer.alloc(stats.size - lastSize);
          fs.readSync(fd, buffer, 0, buffer.length, lastSize);
          fs.closeSync(fd);

          lastSize = stats.size;
          send(buffer.toString());
        }

        const updatedJobs = readJobs();
        const updated = updatedJobs.find(j => j.id === latestJob.id);

        if (updated?.status === "success" || updated?.status === "failed") {
          send("[BUILD_COMPLETE]");
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
