import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function getProjectRoot(projectId: string) {
  return path.join(process.cwd(), "runtime", "projects", projectId);
}

function getJobsDir() {
  return path.join(process.cwd(), "runtime", "jobs");
}

function getLocksDir() {
  return path.join(process.cwd(), "runtime", "locks");
}

function getLockFile(projectId: string) {
  return path.join(getLocksDir(), `${projectId}.lock`);
}

export async function POST(_req: Request, context: RouteContext) {
  const { projectId } = await context.params;

  const root = getProjectRoot(projectId);
  if (!fs.existsSync(root)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  fs.mkdirSync(getJobsDir(), { recursive: true });
  fs.mkdirSync(getLocksDir(), { recursive: true });

  const lockFile = getLockFile(projectId);

  if (fs.existsSync(lockFile)) {
    return NextResponse.json(
      { error: "Build already running for this project" },
      { status: 409 }
    );
  }

  fs.writeFileSync(lockFile, Date.now().toString());

  const jobId = crypto.randomUUID();
  const jobFile = path.join(getJobsDir(), `${jobId}.json`);

  const job = {
    jobId,
    projectId,
    status: "running",
    logs: ["Build started"],
    createdAt: Date.now(),
  };

  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  // Simulate async build
  setTimeout(() => {
    const updated = {
      ...job,
      status: "completed",
      logs: [...job.logs, "Build completed"],
      finishedAt: Date.now(),
    };

    fs.writeFileSync(jobFile, JSON.stringify(updated, null, 2));
    fs.unlinkSync(lockFile);
  }, 3000);

  return NextResponse.json({ ok: true, jobId });
}
