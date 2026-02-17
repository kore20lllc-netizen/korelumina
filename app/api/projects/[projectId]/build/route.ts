import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "../../../../../runtime/job-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  // Temporary default workspace until auth layer is added
  const workspaceId = "default";

  const workspacePath = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(workspacePath);

  const job = createJob(projectId);

  return NextResponse.json({
    ok: true,
    workspaceId,
    projectId,
    jobId: job.id
  });
}
