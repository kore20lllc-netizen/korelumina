import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "../../../../runtime/job-store";

export async function POST(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const projectRoot = resolveWorkspacePath(projectId);
    assertProjectExists(projectRoot);

    const job = createJob(projectId);

    return NextResponse.json({
      ok: true,
      projectId,
      jobId: job.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Build failed" },
      { status: 400 }
    );
  }
}
