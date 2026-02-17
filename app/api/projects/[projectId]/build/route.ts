import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob, getRunningJobForProject } from "../../../../../runtime/job-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const workspaceId = "default";

  const workspacePath = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(workspacePath);

  const packageJsonPath = path.join(workspacePath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return NextResponse.json(
      { error: "No package.json found in project root" },
      { status: 400 }
    );
  }

  const existing = getRunningJobForProject(projectId);
  if (existing) {
    return NextResponse.json(
      { error: "Build already running for this project" },
      { status: 409 }
    );
  }

  const job = createJob(projectId);

  return NextResponse.json({
    ok: true,
    workspaceId,
    projectId,
    jobId: job.id
  });
}
