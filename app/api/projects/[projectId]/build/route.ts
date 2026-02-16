import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { acquireLock, releaseLock, ensureDir } from "@/lib/build-locks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProjectIdFromUrl(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // /api/projects/:projectId/build
  const idx = parts.indexOf("projects");
  return idx >= 0 ? parts[idx + 1] : undefined;
}

export async function POST(req: Request) {
  const projectId = getProjectIdFromUrl(req);
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const repoRoot = process.cwd();
  const runtimeRoot = path.join(repoRoot, "runtime");
  const projectsRoot = path.join(repoRoot, "projects");
  const projectRoot = path.join(projectsRoot, projectId);

  // Allow building only if the project folder exists
  if (!fs.existsSync(projectRoot)) {
    return NextResponse.json(
      { error: "Project folder not found", projectId, expected: projectRoot },
      { status: 404 }
    );
  }

  // Hard requirement: project must have package.json
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return NextResponse.json(
      { error: "No package.json in project root", root: projectRoot },
      { status: 400 }
    );
  }

  // Locks directory
  const locksDir = path.join(runtimeRoot, "locks");
  ensureDir(locksDir);

  // GLOBAL lock (PID + TTL recovery)
  const globalLockPath = path.join(locksDir, "global.lock.json");
  const GLOBAL_TTL_MS = 10 * 60 * 1000; // 10 min

  const global = acquireLock({
    lockPath: globalLockPath,
    kind: "global",
    ttlMs: GLOBAL_TTL_MS,
  });

  if (!global.ok) {
    return NextResponse.json(
      { error: "Build already running (global)", lock: global.existing },
      { status: 409 }
    );
  }

  // PROJECT lock (PID + TTL recovery)
  const projectLockPath = path.join(locksDir, `project.${projectId}.lock.json`);
  const PROJECT_TTL_MS = 15 * 60 * 1000; // 15 min

  const projectLock = acquireLock({
    lockPath: projectLockPath,
    kind: "project",
    ttlMs: PROJECT_TTL_MS,
    projectId,
  });

  if (!projectLock.ok) {
    // release global if project is locked
    releaseLock(globalLockPath);

    return NextResponse.json(
      { error: "Build already running (project)", projectId, lock: projectLock.existing },
      { status: 409 }
    );
  }

  // Build log
  const projectRuntimeDir = path.join(runtimeRoot, "projects", projectId);
  ensureDir(projectRuntimeDir);

  const logPath = path.join(projectRuntimeDir, "build.log");
  fs.writeFileSync(logPath, `=== Build Started (${new Date().toISOString()}) ===\n`, "utf8");

  const scriptPath = path.join(repoRoot, "scripts", "build-project.sh");
  if (!fs.existsSync(scriptPath)) {
    // release locks
    releaseLock(projectLockPath);
    releaseLock(globalLockPath);

    return NextResponse.json(
      { error: "Missing scripts/build-project.sh" },
      { status: 500 }
    );
  }

  // Spawn build
  const child = spawn("bash", [scriptPath, projectId], {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (buf) => {
    fs.appendFileSync(logPath, buf.toString(), "utf8");
  });

  child.stderr.on("data", (buf) => {
    fs.appendFileSync(logPath, buf.toString(), "utf8");
  });

  child.on("close", (code) => {
    fs.appendFileSync(
      logPath,
      `\n=== Build Finished with code ${code ?? "null"} (${new Date().toISOString()}) ===\n`,
      "utf8"
    );

    // release locks no matter what
    releaseLock(projectLockPath);
    releaseLock(globalLockPath);
  });

  return NextResponse.json({
    ok: true,
    projectId,
    pid: child.pid ?? null,
    logPath,
    locks: {
      global: global.lock,
      project: projectLock.lock,
    },
  });
}
