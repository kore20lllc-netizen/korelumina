import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const JOBS_FILE = path.join(process.cwd(), "runtime", "jobs.json");

export type JobStatus = "queued" | "running" | "success" | "failed";

export interface Job {
  id: string;
  projectId: string;
  status: JobStatus;
  createdAt: number;
  finishedAt?: number;
  logPath?: string;
}

function ensureFile() {
  if (!fs.existsSync(JOBS_FILE)) {
    fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
    fs.writeFileSync(JOBS_FILE, JSON.stringify({ jobs: [] }, null, 2));
  }
}

function readStore(): { jobs: Job[] } {
  ensureFile();
  return JSON.parse(fs.readFileSync(JOBS_FILE, "utf8"));
}

function writeStore(data: { jobs: Job[] }) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(data, null, 2));
}

export function createJob(projectId: string): Job {
  const store = readStore();

  const job: Job = {
    id: randomUUID(),
    projectId,
    status: "queued",
    createdAt: Date.now(),
  };

  store.jobs.push(job);
  writeStore(store);

  return job;
}

export function updateJob(id: string, patch: Partial<Job>) {
  const store = readStore();
  const job = store.jobs.find(j => j.id === id);
  if (!job) return null;

  Object.assign(job, patch);
  writeStore(store);
  return job;
}

export function getJob(id: string) {
  const store = readStore();
  return store.jobs.find(j => j.id === id) || null;
}

export function getRunningJobForProject(projectId: string) {
  const storePath = path.join(process.cwd(), "runtime", "jobs.json");

  if (!fs.existsSync(storePath)) return null;

  const raw = fs.readFileSync(storePath, "utf8");
  if (!raw) return null;

  const state = JSON.parse(raw);

  if (!state.jobs) return null;

  const running = state.jobs.find(
    (j: any) => j.projectId === projectId && j.status === "running"
  );

  return running || null;
}

