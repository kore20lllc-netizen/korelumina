import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { isPidRunning } from "@/lib/pid";
import {
  createJob,
  getRunningJobForProject,
  setJobPid,
  completeJob,
  failJob,
  appendJobLog,
} from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

function safeWrite(jobId: string, msg: string) {
  try {
    appendJobLog(jobId, msg);
  } catch {}
}

function hasScript(projectRoot: string, script: string) {
  try {
    const pkgPath = path.join(projectRoot, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return Boolean(pkg?.scripts?.[script]);
  } catch {
    return false;
  }
}

function runCmd(
  jobId: string,
  cwd: string,
  cmd: string,
  args: string[],
  onPid?: (pid: number) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      env: {
        ...process.env,
        // Make installs quieter + deterministic in CI-like environments
        npm_config_loglevel: "warn",
      },
    });

    if (child.pid && onPid) onPid(child.pid);

    child.stdout.on("data", (b) => safeWrite(jobId, String(b)));
    child.stderr.on("data", (b) => safeWrite(jobId, String(b)));

    child.on("error", (err) => reject(err));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

export async function POST(req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  // If a job is marked running, verify PID. If PID is dead, allow rebuild.
  const existing = getRunningJobForProject(workspaceId, projectId);
  if (existing?.pid) {
    if (isPidRunning(existing.pid)) {
      return NextResponse.json(
        { error: "Project already building", jobId: existing.id },
        { status: 409 }
      );
    }
    // PID dead -> finish as failed (stale)
    completeJob(existing.id, 1);
  } else if (existing) {
    // No pid recorded yet; treat as running to be safe.
    return NextResponse.json(
      { error: "Project already building", jobId: existing.id },
      { status: 409 }
    );
  }

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const job = createJob(workspaceId, projectId);

  safeWrite(job.id, `== build start ==`);
  safeWrite(job.id, `workspace=${workspaceId}`);
  safeWrite(job.id, `project=${projectId}`);
  safeWrite(job.id, `root=${projectRoot}`);

  // Fire-and-forget build process, API returns immediately.
  (async () => {
    try {
      // Install
      safeWrite(job.id, `\n== npm install ==\n`);
      let pidCaptured = false;

      const installCode = await runCmd(
        job.id,
        projectRoot,
        "npm",
        ["install", "--no-audit", "--no-fund"],
        (pid) => {
          if (!pidCaptured) {
            setJobPid(job.id, pid);
            pidCaptured = true;
          }
        }
      );

      if (installCode !== 0) {
        safeWrite(job.id, `\n== install failed (code ${installCode}) ==\n`);
        completeJob(job.id, installCode);
        return;
      }

      // Build
      const buildScript = hasScript(projectRoot, "build")
        ? "build"
        : hasScript(projectRoot, "build:dev")
        ? "build:dev"
        : null;

      if (!buildScript) {
        safeWrite(job.id, `\n== no build script found in package.json ==\n`);
        failJob(job.id, "No build script found");
        return;
      }

      safeWrite(job.id, `\n== npm run ${buildScript} ==\n`);
      const buildCode = await runCmd(job.id, projectRoot, "npm", ["run", buildScript]);

      safeWrite(job.id, `\n== build finished (code ${buildCode}) ==\n`);
      completeJob(job.id, buildCode);
    } catch (e: any) {
      safeWrite(job.id, `\n== build crashed ==\n${String(e?.stack || e)}\n`);
      failJob(job.id, String(e?.message || e));
    }
  })();

  return NextResponse.json(
    { ok: true, workspaceId, projectId, jobId: job.id, logPath: job.logPath },
    { status: 200 }
  );
}
