import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const JOBS_FILE = path.resolve(process.cwd(), "runtime/jobs.json");

function readJobs() {
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: any[]) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

function isProcessAlive(pid?: number) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function GET(req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const jobs = readJobs();

  const projectJobs = jobs
    .filter(
      (j: any) =>
        j.workspaceId === workspaceId &&
        j.projectId === projectId
    )
    .sort((a: any, b: any) => b.startedAt - a.startedAt);

  const latest = projectJobs[0];

  if (!latest) {
    return NextResponse.json({
      workspaceId,
      projectId,
      status: "idle",
      running: false,
      lastJob: null,
    });
  }

  // 🧠 AUTO-RECOVERY: If marked running but process is dead → fix it
  if (latest.status === "running" && !isProcessAlive(latest.pid)) {
    latest.status = "failed";
    latest.exitCode = -1;
    latest.finishedAt = Date.now();
    writeJobs(jobs);
  }

  const running = latest.status === "running";

  return NextResponse.json({
    workspaceId,
    projectId,
    status: latest.status,
    running,
    lastJob: {
      id: latest.id,
      startedAt: latest.startedAt,
      finishedAt: latest.finishedAt || null,
      exitCode: latest.exitCode ?? null,
      logPath: latest.logPath ?? null,
      pid: latest.pid ?? null,
    },
  });
}
