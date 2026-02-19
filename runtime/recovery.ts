import { readJobs, writeJobs, JobRecord } from "./job-store";
import { cleanupExpiredLocks } from "./locks";

function isPidRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function recoverStaleJobs(opts?: { staleAfterMs?: number }) {
  const staleAfterMs = opts?.staleAfterMs ?? 2 * 60_000; // 2 minutes default
  const now = Date.now();

  const jobs = readJobs();
  let changed = false;

  for (const j of jobs) {
    if (j.status !== "pending" && j.status !== "running") continue;

    const age = (j.startedAt ?? j.createdAt) ? now - (j.startedAt ?? j.createdAt) : 0;
    const pidOk = j.pid ? isPidRunning(j.pid) : false;

    // Stale rules:
    // - if it has a pid and pid is dead -> stale
    // - if no pid and too old -> stale
    if ((j.pid && !pidOk) || (!j.pid && age > staleAfterMs)) {
      (j as JobRecord).status = "failed";
      (j as JobRecord).exitCode = (j as JobRecord).exitCode ?? 1;
      (j as JobRecord).finishedAt = now;
      (j as JobRecord).lastError = j.pid
        ? "stale-pid-dead"
        : "stale-no-pid-timeout";
      changed = true;
    }
  }

  if (changed) writeJobs(jobs);
  cleanupExpiredLocks();
}
