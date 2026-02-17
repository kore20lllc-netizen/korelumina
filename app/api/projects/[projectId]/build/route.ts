import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "../../../../../runtime/job-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const workspacePath = resolveWorkspacePath(projectId);
  assertProjectExists(workspacePath);

  const job = createJob(projectId);

  return NextResponse.json({
    ok: true,
    projectId,
    jobId: job.id
  });
}
