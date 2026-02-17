import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob } from "@/runtime/job-store";
import {
  acquireGlobalLock,
  releaseGlobalLock,
  heartbeatGlobal,
} from "@/runtime/global-lock";
import {
  acquireProjectLock,
  releaseProjectLock,
  heartbeatProject,
} from "@/runtime/project-lock";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function POST(req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  // 1. Validate project
  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  // 2. Create job
  const job = createJob(workspaceId, projectId);

  // 3. Acquire project lock
  const projectLock = acquireProjectLock(workspaceId, projectId, job.id);
  if (!projectLock.acquired) {
    return NextResponse.json(
      {
        error: "Project already building",
        runningJobId: projectLock.jobId,
      },
      { status: 409 }
    );
  }

  // 4. Acquire global lock
  const globalLock = acquireGlobalLock(job.id, workspaceId);
  if (!globalLock.acquired) {
    releaseProjectLock(workspaceId, projectId, job.id);

    return NextResponse.json(
      {
        error: "Another workspace is building",
        runningJobId: globalLock.jobId,
      },
      { status: 409 }
    );
  }

  // 5. Simulate build async (replace with real execution later)
  setTimeout(() => {
    releaseProjectLock(workspaceId, projectId, job.id);
    releaseGlobalLock(job.id);
  }, 5000);

  // 6. Heartbeat while running
  const heartbeat = setInterval(() => {
    heartbeatProject(workspaceId, projectId);
    heartbeatGlobal();
  }, 5000);

  setTimeout(() => clearInterval(heartbeat), 15000);

  return NextResponse.json({
    ok: true,
    workspaceId,
    projectId,
    jobId: job.id,
  });
}
