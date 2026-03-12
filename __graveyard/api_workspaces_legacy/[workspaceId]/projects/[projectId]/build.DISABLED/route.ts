import { NextResponse } from "next/server";
import { enqueueBuild } from "@/runtime/build-queue";

export async function POST(
  _req: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const result = await enqueueBuild(workspaceId, projectId);

  return NextResponse.json({
    ok: result.ok,
    workspaceId,
    projectId,
    jobId: result.jobId,
    logPath: result.logPath,
    code: result.code,
  });
}
