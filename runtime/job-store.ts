import fs from "fs";
import path from "path";
import crypto from "crypto";

export type JobStatus = "pending" | "running" | "success" | "failed";

export interface JobRecord {
  id: string;
  workspaceId: string;
  projectId: string;
  type: "build";
  status: JobStatus;
  pid: number | null;
  logPath: string | null;
  startedAt: number;
  finishedAt?: number;
}

const JOB_FILE = path.join(process.cwd(), "runtime", "jobs.json");

function readJobs(): JobRecord[] {
  if (!fs.existsSync(JOB_FILE)) return [];
  return JSON.parse(fs.readFileSync(JOB_FILE, "utf8"));
}

function writeJobs(jobs: JobRecord[]) {
  fs.mkdirSync(path.dirname(JOB_FILE), { recursive: true });
  fs.writeFileSync(JOB_FILE, JSON.stringify(jobs, null, 2));
}

export function createJob(
  workspaceId: string,
  projectId: string,
  type: "build"
): JobRecord {
  const id = crypto.randomUUID();

  const logPath = path.join(
    process.cwd(),
    "runtime",
    "logs",
    workspaceId,
    `${projectId}.${id}.log`
  );

  const job: JobRecord = {
    id,
    workspaceId,
    projectId,
    type,
    status: "pending",
    pid: null,
    logPath,
    startedAt: Date.now(),
  };

  const jobs = readJobs();
  jobs.push(job);
  writeJobs(jobs);

  return job;
}

export function updateJobStatus(
  jobId: string,
  status: JobStatus,
  pid?: number | null
) {
  const jobs = readJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;

  job.status = status;

  if (typeof pid !== "undefined") {
    job.pid = pid;
  }

  if (status === "success" || status === "failed") {
    job.finishedAt = Date.now();
  }

  writeJobs(jobs);
}

export function getLatestJobForProject(
  workspaceId: string,
  projectId: string
): JobRecord | null {
  const jobs = readJobs()
    .filter(
      (j) => j.workspaceId === workspaceId && j.projectId === projectId
    )
    .sort((a, b) => b.startedAt - a.startedAt);

  return jobs[0] ?? null;
}
