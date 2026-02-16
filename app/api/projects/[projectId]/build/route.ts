import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import {
  acquireLock,
  releaseLock,
  isLocked,
  clearStaleLocks
} from "@/runtime/build-lock";
import {
  createJob,
  updateJob,
  appendLog
} from "@/runtime/jobs";

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  clearStaleLocks();

  if (isLocked(projectId)) {
    return NextResponse.json(
      { error: "Build already running" },
      { status: 409 }
    );
  }

  if (!acquireLock(projectId)) {
    return NextResponse.json(
      { error: "Could not acquire lock" },
      { status: 500 }
    );
  }

  const root = path.join(process.cwd(), "runtime", "projects", projectId);

  if (!fs.existsSync(root)) {
    releaseLock(projectId);
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const jobId = createJob(projectId);
  updateJob(jobId, { status: "running" });

  const child = spawn("npm", ["run", "build"], {
    cwd: root,
    shell: true
  });

  child.stdout.on("data", (data) => {
    appendLog(jobId, data.toString());
  });

  child.stderr.on("data", (data) => {
    appendLog(jobId, data.toString());
  });

  child.on("close", (code) => {
    if (code === 0) {
      updateJob(jobId, { status: "completed" });
    } else {
      updateJob(jobId, { status: "failed" });
    }

    releaseLock(projectId);
  });

  child.on("error", (err) => {
    appendLog(jobId, err.message);
    updateJob(jobId, { status: "failed" });
    releaseLock(projectId);
  });

  return NextResponse.json({ jobId });
}
