import fs from "fs";
import path from "path";
import crypto from "crypto";

export type JobStatus = "queued" | "running" | "success" | "failed";

export type JobRecord = {
  id: string;
  workspaceId: string;
  projectId: string;
  status: JobStatus;
  startedAt?: number;
  finishedAt?: number;
  pid?: number;
  exitCode?: number | null;
  error?: string;
  logPath?: string;
};

const RUNTIME_DIR = path.resolve(process.cwd(), "runtime");
const JOBS_PATH = path.join(RUNTIME_DIR, "jobs.json");
const LOGS_DIR = path.join(RUNTIME_DIR, "logs");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function readJobs(): JobRecord[] {
  try {
    if (!fs.existsSync(JOBS_PATH)) return [];
    const raw = fs.readFileSync(JOBS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JobRecord[]) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: JobRecord[]) {
  ensureDir(path.dirname(JOBS_PATH));
  fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf8");
}

function now() {
  return Date.now();
}

export function getRunningJobForProject(workspaceId: string, projectId: string) {
  const jobs = readJobs();
  return (
    jobs.find(
      (j) =>
        j.workspaceId === workspaceId &&
        j.projectId === projectId &&
        (j.status === "queued" || j.status === "running")
    ) || null
  );
}

export function createJob(workspaceId: string, projectId: string): JobRecord {
  const jobs = readJobs();

  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${now()}-${Math.random().toString(16).slice(2)}`;

  const logPath = path.join(LOGS_DIR, workspaceId, `${projectId}.log`);
  ensureDir(path.dirname(logPath));

  const job: JobRecord = {
    id,
    workspaceId,
    projectId,
    status: "running",
    startedAt: now(),
    logPath,
  };

  jobs.push(job);
  writeJobs(jobs);
  return job;
}

export function setJobPid(jobId: string, pid: number) {
  const jobs = readJobs();
  const j = jobs.find((x) => x.id === jobId);
  if (!j) return;
  j.pid = pid;
  writeJobs(jobs);
}

export function completeJob(jobId: string, exitCode: number | null) {
  const jobs = readJobs();
  const j = jobs.find((x) => x.id === jobId);
  if (!j) return;

  j.exitCode = exitCode;
  j.finishedAt = now();
  j.status = exitCode === 0 ? "success" : "failed";

  writeJobs(jobs);
}

export function failJob(jobId: string, error: string) {
  const jobs = readJobs();
  const j = jobs.find((x) => x.id === jobId);
  if (!j) return;

  j.status = "failed";
  j.error = error;
  j.finishedAt = now();

  writeJobs(jobs);
}

export function appendJobLog(jobId: string, line: string) {
  const jobs = readJobs();
  const j = jobs.find((x) => x.id === jobId);
  if (!j?.logPath) return;

  ensureDir(path.dirname(j.logPath));
  fs.appendFileSync(j.logPath, line.endsWith("\n") ? line : line + "\n", "utf8");
}
