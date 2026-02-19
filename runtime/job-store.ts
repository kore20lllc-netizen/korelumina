import fs from "fs";
import path from "path";
import crypto from "crypto";

export type JobStatus = "pending" | "running" | "success" | "failed";

export type JobRecord = {
  id: string;
  workspaceId: string;
  projectId: string;
  status: JobStatus;
  startedAt: number;
  finishedAt: number | null;
  logPath: string;
  pid: number | null;
  exitCode: number | null;
};

const ROOT = process.cwd();
const JOBS_FILE = path.resolve(ROOT, "runtime", "jobs.json");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function ensureJobsFile() {
  ensureDir(path.dirname(JOBS_FILE));
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, "[]", "utf8");
  }
}

export function readJobs(): JobRecord[] {
  ensureJobsFile();
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeJobs(jobs: JobRecord[]) {
  ensureJobsFile();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf8");
}

function buildLogPath(workspaceId: string, projectId: string, jobId: string) {
  const dir = path.resolve(ROOT, "runtime", "logs", workspaceId);
  ensureDir(dir);
  return path.join(dir, `${projectId}.${jobId}.log`);
}

export function createJob(workspaceId: string, projectId: string): JobRecord {
  const jobs = readJobs();
  const id = crypto.randomUUID();
  const logPath = buildLogPath(workspaceId, projectId, id);

  const job: JobRecord = {
    id,
    workspaceId,
    projectId,
    status: "pending",
    startedAt: Date.now(),
    finishedAt: null,
    logPath,
    pid: null,
    exitCode: null,
  };

  jobs.push(job);
  writeJobs(jobs);
  return job;
}

export function getJobById(jobId: string): JobRecord | null {
  return readJobs().find(j => j.id === jobId) ?? null;
}

export function getRunningJobForProject(
  workspaceId: string,
  projectId: string
): JobRecord | null {
  return (
    readJobs().find(
      j =>
        j.workspaceId === workspaceId &&
        j.projectId === projectId &&
        (j.status === "running" || j.status === "pending")
    ) ?? null
  );
}

export function updateJob(jobId: string, patch: Partial<JobRecord>) {
  const jobs = readJobs();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return null;

  jobs[idx] = { ...jobs[idx], ...patch };
  writeJobs(jobs);
  return jobs[idx];
}

export function appendJobLog(jobId: string, line: string) {
  const job = getJobById(jobId);
  if (!job) return;

  fs.appendFileSync(job.logPath, line + "\n", "utf8");
}
