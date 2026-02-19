import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { readJobs } from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

function tailFile(filePath: string, maxLines = 200): string[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  return lines.slice(-maxLines);
}

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const jobs = readJobs().filter(
    j => j.workspaceId === workspaceId && j.projectId === projectId
  );

  if (!jobs.length) {
    return NextResponse.json({ logs: [], message: "No jobs yet" });
  }

  const latest = jobs[jobs.length - 1];

  if (!latest.logPath) {
    return NextResponse.json({ logs: [], message: "No log file" });
  }

  const safeLogPath = path.resolve(latest.logPath);
  const logs = tailFile(safeLogPath);

  return NextResponse.json({
    projectId,
    workspaceId,
    jobId: latest.id,
    status: latest.status,
    logs,
  });
}
