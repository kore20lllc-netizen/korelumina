import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest, resolveManifestCommand } from "@/lib/project-manifest";

import { createJob, completeJob, failJob, getRunningJobForProject, setJobPid, appendJobLog } from "@/runtime/job-store";
import { acquireGlobalLock, releaseGlobalLock } from "@/runtime/global-lock";
import { acquireProjectLock, releaseProjectLock } from "@/runtime/locks";

import { isPidRunning } from "@/lib/pid";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export async function POST(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const releaseProject = acquireProjectLock(workspaceId, projectId);
  const releaseGlobal = acquireGlobalLock();
  try {
    const projectRoot = resolveWorkspacePath(workspaceId, projectId);
    assertProjectExists(projectRoot);

    const manifest = ensureManifest(projectRoot, projectId, {
      strict: process.env.NODE_ENV === "production",
    });

    // If a job is marked running, verify PID. If PID is dead, allow rebuild.
    const existing = getRunningJobForProject(workspaceId, projectId);
    if (existing?.pid && isPidRunning(existing.pid)) {
      return NextResponse.json({ error: "Project already building" }, { status: 409 });
    }

    const job = createJob(workspaceId, projectId);

    const { cmd, args } = resolveManifestCommand(manifest, "build");

    ensureDir(path.dirname(job.logPath));
    fs.writeFileSync(job.logPath, "", "utf8");
    appendJobLog(job.id, `[build] starting ${projectId}`);
    appendJobLog(job.id, `[build] cmd=${cmd} args=${args.join(" ")}`);

    const child = spawn(cmd, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        KORELUMINA_BUILD: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (!child.pid) {
      failJob(job.id, "failed-to-spawn-build");
      return NextResponse.json({ error: "Failed to start build" }, { status: 500 });
    }

    setJobPid(job.id, child.pid);

    child.stdout.on("data", d => appendJobLog(job.id, String(d)));
    child.stderr.on("data", d => appendJobLog(job.id, String(d)));

    child.on("exit", code => {
      if (code === 0) completeJob(job.id, 0);
      else failJob(job.id, `exit-${code ?? "null"}`, code ?? 1);
    });

    return NextResponse.json({ ok: true, workspaceId, projectId, jobId: job.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Build failed" }, { status: 500 });
  } finally {
    releaseGlobalLock(releaseGlobal);
    releaseProjectLock(releaseProject);
  }
}
