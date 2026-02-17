import fs from "fs";
import path from "path";

const JOB_FILE = path.join(process.cwd(), "runtime", "jobs.json");

function readJobs() {
  if (!fs.existsSync(JOB_FILE)) {
    fs.writeFileSync(JOB_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(JOB_FILE, "utf8"));
}

function writeJobs(data: any) {
  fs.writeFileSync(JOB_FILE, JSON.stringify(data, null, 2));
}

export function createJob(projectId: string) {
  const jobs = readJobs();
  const jobId = crypto.randomUUID();

  jobs[jobId] = {
    projectId,
    status: "queued",
    logs: [],
    createdAt: Date.now(),
  };

  writeJobs(jobs);
  return jobId;
}

export function updateJob(jobId: string, update: any) {
  const jobs = readJobs();
  if (!jobs[jobId]) return;

  jobs[jobId] = { ...jobs[jobId], ...update };
  writeJobs(jobs);
}

export function appendLog(jobId: string, line: string) {
  const jobs = readJobs();
  if (!jobs[jobId]) return;

  jobs[jobId].logs.push(line);
  writeJobs(jobs);
}

export function getJob(jobId: string) {
  const jobs = readJobs();
  return jobs[jobId];
}
