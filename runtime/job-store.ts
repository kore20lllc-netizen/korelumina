import fs from "fs";
import path from "path";

export interface JobRecord {
  id: string;
  workspaceId: string;
  projectId: string;
  type: "build" | "preview";
  status: "pending" | "running" | "success" | "failed";
  startedAt: number | null;
  finishedAt: number | null;
  pid: number | null;
  logPath: string | null;
  error: string | null;
}

const JOBS_FILE = path.join(process.cwd(), "runtime", "jobs.json");

function ensureFile() {
  if (!fs.existsSync(JOBS_FILE)) {
    fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
    fs.writeFileSync(JOBS_FILE, "[]", "utf8");
  }
}

export function readJobs(): JobRecord[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf8"));
}

export function writeJobs(jobs: JobRecord[]) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export function createJob(
  workspaceId: string,
  projectId: string,
  type: "build" | "preview"
): JobRecord {
  const job: JobRecord = {
    id: crypto.randomUUID(),
    workspaceId,
    projectId,
    type,
    status: "pending",
    startedAt: null,
    finishedAt: null,
    pid: null,
    logPath: null,
    error: null
  };

  const jobs = readJobs();
  jobs.push(job);
  writeJobs(jobs);

  return job;
}

export function updateJob(updated: JobRecord) {
  const jobs = readJobs().map(j =>
    j.id === updated.id ? updated : j
  );
  writeJobs(jobs);
}

export function updateJobStatus(
  id: string,
  status: JobRecord["status"],
  error?: string
) {
  const jobs = readJobs().map(j =>
    j.id === id
      ? {
          ...j,
          status,
          finishedAt: status === "success" || status === "failed" ? Date.now() : j.finishedAt,
          error: error ?? j.error
        }
      : j
  );

  writeJobs(jobs);
}

export function getLatestJobForProject(
  workspaceId: string,
  projectId: string
): JobRecord | null {
  const jobs = readJobs()
    .filter(j => j.workspaceId === workspaceId && j.projectId === projectId)
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));

  return jobs[0] ?? null;
}

export function createQueuedJob(
  workspaceId: string,
  projectId: string,
  type: "build" | "preview"
) {
  const job = createJob(workspaceId, projectId, type);

  job.status = "running";
  job.startedAt = Date.now();

  const jobs = readJobs().map(j =>
    j.id === job.id ? job : j
  );

  writeJobs(jobs);

  return job;
}

