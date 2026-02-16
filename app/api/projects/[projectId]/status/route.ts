import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getJob } from "@/runtime/job-store";

export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const root = path.join(process.cwd(), "runtime", "projects", projectId);
  const logPath = path.join(root, "build.log");

  const job = getJob(projectId);

  const logSize = fs.existsSync(logPath)
    ? fs.statSync(logPath).size
    : 0;

  return NextResponse.json({
    projectId,
    running: job?.running ?? false,
    exitCode: job?.exitCode ?? null,
    logPath,
    logSize
  });
}
