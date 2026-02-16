import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const RUNTIME_ROOT = path.join(process.cwd(), "runtime", "projects");
const JOBS_FILE = path.join(process.cwd(), "runtime", "jobs.json");

function getProjectRoot(projectId: string) {
  return path.join(RUNTIME_ROOT, projectId);
}

function readJobs() {
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
}

function writeJobs(data: any) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(data, null, 2));
}

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const root = getProjectRoot(projectId);

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const jobId = crypto.randomUUID();
  const jobs = readJobs();

  jobs[jobId] = {
    projectId,
    status: "running",
    logs: [],
  };

  writeJobs(jobs);

  const child = spawn(
    "bash",
    ["-c", "echo Building... && sleep 2 && echo Done"],
    { cwd: root }
  );

  child.stdout.on("data", (data) => {
    const jobs = readJobs();
    jobs[jobId].logs.push(data.toString());
    writeJobs(jobs);
  });

  child.stderr.on("data", (data) => {
    const jobs = readJobs();
    jobs[jobId].logs.push("ERROR: " + data.toString());
    writeJobs(jobs);
  });

  child.on("close", () => {
    const jobs = readJobs();
    jobs[jobId].status = "completed";
    writeJobs(jobs);
  });

  return NextResponse.json({ jobId });
}
