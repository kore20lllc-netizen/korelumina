import { createQueuedJob, updateJobStatus } from "./job-store";
import { runBuild } from "./build-queue-runner";

export async function enqueueBuild(workspaceId: string, projectId: string) {
  const job = createQueuedJob(workspaceId, projectId, "build");

  try {
    const result = await runBuild(workspaceId, projectId);

    updateJobStatus(
      job.id,
      result.ok ? "success" : "failed",
      result.ok ? undefined : "Build failed"
    );

    return {
      ok: result.ok,
      jobId: job.id,
      logPath: result.logPath,
      code: result.code,
    };
  } catch (err: any) {
    updateJobStatus(job.id, "failed", err?.message ?? "Unknown error");
    return { ok: false, jobId: job.id, logPath: null, code: null };
  }
}
