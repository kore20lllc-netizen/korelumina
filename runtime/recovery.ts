import { readJobs, writeJobs } from "./job-store";
import { isPidRunning } from "./process-utils";

const STALE_MS = 15 * 60 * 1000; // 15 minutes

export function recoverStaleJobs() {
  const jobs = readJobs();
  const now = Date.now();
  let changed = false;

  for (const j of jobs) {
    if (j.status !== "pending" && j.status !== "running") continue;

    const age = j.startedAt ? now - j.startedAt : 0;
    const pidOk = j.pid ? isPidRunning(j.pid) : false;

    // If running but PID dead OR stale too long
    if ((j.status === "running" && !pidOk) || age > STALE_MS) {
      j.status = "failed";
      j.finishedAt = now;
      j.exitCode = j.exitCode ?? -1;
      changed = true;
    }
  }

  if (changed) {
    writeJobs(jobs);
  }
}
