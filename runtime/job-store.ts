import fs from "fs";
import path from "path";

export type JobStatus = "pending" | "running" | "success" | "failed";
export type JobKind = "build" | "preview";

export type JobRecord = {
  id: string;
  workspaceId: string;
  projectId: string;
  kind: JobKind;
  status: JobStatus;

  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;

  pid: number | null;
  exitCode: number | null;

  logPath: string | null;
  lastError: string | null;
};

const RUNTIME_ROOT = path.resolve(process.cwd(), "runtime");
const JOBS_PATH = path.resolve(RUNTIME_ROOT, "jobs.json");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeParseArray(raw: string): any[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function readJobs(): JobRecord[] {
  try {
    if (!fs.existsSync(JOBS_PATH)) return [];
    const raw = fs.readFileSync(JOBS_PATH, "utf8");
    return safeParseArray(raw) as JobRecord[];
  } catch {
    return [];
  }
}

export function writeJobs(jobs: JobRecord[]) {
  ensureDir(path.dirname(JOBS_PATH));
  fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf8");
}

function uuid() {
  // good enough for local runtime; real UUID not required here
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function createJob(
  workspaceId: string,
  projectId: string,
  kind: JobKind = "build"
): JobRecord {
  const jobs = readJobs();

  const job: JobRecord = {
    id: uuid(),
    workspaceId,
    projectId,
    kind,
    status: "pending",
    createdAt: Date.now(),
    startedAt: Date.now(),
    finishedAt: null,
    pid: null,
    exitCode: null,
    logPath: null,
    lastError: null,
  };

  jobs.push(job);
  writeJobs(jobs);
  return job;
}

export function getRunningJobForProject(workspaceId: string, projectId: string) {
  const jobs = readJobs().filter(
    j => j.workspaceId === workspaceId && j.projectId === projectId
  );
  const latest = jobs.length ? jobs[jobs.length - 1] : null;
  if (!latest) return null;
  if (latest.status === "pending" || latest.status === "running") return latest;
  return null;
}

export function setJobPid(jobId: string, pid: number, logPath?: string) {
  const jobs = readJobs();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return;

  jobs[idx] = {
    ...jobs[idx],
    pid,
    status: "running",
    logPath: logPath ?? jobs[idx].logPath ?? null,
  };

  writeJobs(jobs);
}

export function appendJobLog(jobId: string, line: string) {
  const jobs = readJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job?.logPath) return;

  try {
    ensureDir(path.dirname(job.logPath));
    fs.appendFileSync(job.logPath, line.endsWith("\n") ? line : line + "\n", "utf8");
  } catch {
    // ignore log write failures (should not crash the API route)
  }
}

export function completeJob(jobId: string, exitCode: number) {
  const jobs = readJobs();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return;

  jobs[idx] = {
    ...jobs[idx],
    status: exitCode === 0 ? "success" : "failed",
    exitCode,
    finishedAt: Date.now(),
    lastError: exitCode === 0 ? null : `exit-${exitCode}`,
  };

  writeJobs(jobs);
}

export function failJob(jobId: string, reason: string) {
  const jobs = readJobs();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return;

  jobs[idx] = {
    ...jobs[idx],
    status: "failed",
    exitCode: jobs[idx].exitCode ?? 1,
    finishedAt: Date.now(),
    lastError: reason,
  };

  writeJobs(jobs);
}
