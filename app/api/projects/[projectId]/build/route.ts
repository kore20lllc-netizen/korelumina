import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

function getProjectRoot(projectId: string) {
  return path.join(process.cwd(), "projects", projectId);
}

function getLockPath(projectId: string) {
  return path.join(process.cwd(), "runtime", "locks", `${projectId}.lock`);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  const root = getProjectRoot(projectId);
  const lockPath = getLockPath(projectId);

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  ensureDir(path.dirname(lockPath));

  // 🔒 HARD LOCK CHECK
  if (fs.existsSync(lockPath)) {
    return NextResponse.json(
      { error: "Build already running" },
      { status: 409 }
    );
  }

  // 🔒 CREATE LOCK IMMEDIATELY
  fs.writeFileSync(
    lockPath,
    JSON.stringify({
      pid: process.pid,
      startedAt: Date.now()
    }),
    "utf8"
  );

  const logPath = path.join(
    process.cwd(),
    "runtime",
    "projects",
    projectId,
    "build.log"
  );

  ensureDir(path.dirname(logPath));

  const out = fs.createWriteStream(logPath, { flags: "a" });

  const child = spawn("bash", ["scripts/build-project.sh", projectId], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", d => out.write(d));
  child.stderr.on("data", d => out.write(d));

  child.on("close", () => {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
    out.end();
  });

  return NextResponse.json({
    ok: true,
    projectId
  });
}
