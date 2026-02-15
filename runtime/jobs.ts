export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  logs: string[];
  result?: any;
  error?: string;
}

const jobs = new Map<string, Job>();

export function createJob(id: string) {
  const job: Job = { id, status: "queued", logs: [] };
  jobs.set(id, job);
  return job;
}

export function updateJob(id: string, data: Partial<Job>) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, ...data });
}

export function appendLog(id: string, line: string) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, logs: [...job.logs, line] });
}

export function getJob(id: string) {
  return jobs.get(id);
}
