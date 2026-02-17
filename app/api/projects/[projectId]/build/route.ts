import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "@/runtime/job-store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const workspaceId = "default"; // Replace with real workspace binding later

    const projectRoot = resolveWorkspacePath(workspaceId, projectId);
    assertProjectExists(projectRoot);

    const job = createJob(projectId);

    return NextResponse.json({
      ok: true,
      projectId,
      jobId: job.id
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
