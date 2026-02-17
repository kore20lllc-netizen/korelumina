import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { createJob, completeJob } from "@/runtime/job-store";
import {
  acquireGlobalLock,
  releaseGlobalLock,
} from "@/runtime/global-lock";
import {
  acquireProjectLock,
  releaseProjectLock,
} from "@/runtime/project-lock";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function POST(req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const job = createJob(workspaceId, projectId);

  const projectLock = acquireProjectLock(workspaceId, projectId, job.id);
  if (!projectLock.acquired) {
    return NextResponse.json(
      { error: "Project already building" },
      { status: 409 }
    );
  }

  const globalLock = acquireGlobalLock(job.id, workspaceId);
  if (!globalLock.acquired) {
    releaseProjectLock(workspaceId, projectId, job.id);
    return NextResponse.json(
      { error: "Another workspace is building" },
      { status: 409 }
    );
  }

  const logDir = path.join(process.cwd(), "runtime", "logs", workspaceId);
  fs.mkdirSync(logDir, { recursive: true });

  const logPath = path.join(logDir, `${projectId}.log`);
  fs.writeFileSync(logPath, "=== Build Started ===\n");

  const child = spawn("npm", ["run", "build"], {
    cwd: projectRoot,
    shell: true,
  });

  child.stdout.on("data", (data) => {
    fs.appendFileSync(logPath, data.toString());
  });

  child.stderr.on("data", (data) => {
    fs.appendFileSync(logPath, data.toString());
  });

  child.on("close", (code) => {
    fs.appendFileSync(logPath, `\n=== Build Finished (${code}) ===\n`);

    completeJob(job.id, code === 0);

    releaseProjectLock(workspaceId, projectId, job.id);
    releaseGlobalLock(job.id);
  });

  return NextResponse.json({
    ok: true,
    workspaceId,
    projectId,
    jobId: job.id,
  });
}
