import { readJobs, writeJobs, JobRecord } from "./job-store";

export function recoverInterruptedJobs() {
  const jobs = readJobs();
  const now = Date.now();
  let changed = false;

  for (const j of jobs) {
    if (j.status === "running") {
      j.status = "failed";
      j.finishedAt = now;
      changed = true;
    }
  }

  if (changed) {
    writeJobs(jobs);
  }

  return changed;
}
