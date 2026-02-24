import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import crypto from "crypto";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function safeWrite(stream: fs.WriteStream, chunk: any) {
  try {
    stream.write(chunk);
  } catch {
    // ignore write errors (e.g. stream closed)
  }
}

/**
 * Runs `npm run build` inside the project's runtime workspace directory and writes logs to:
 * - runtime/logs/<workspaceId>/<projectId>.log (rolling/latest)
 * - runtime/logs/<workspaceId>/<projectId>.<jobId>.log (per run)
 *
 * Returns { ok, jobId, logPath } where logPath is the per-run log file.
 */
export async function runBuild(workspaceId: string, projectId: string) {
  const root = process.cwd();
  const projectRoot = path.join(
    root,
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );

  if (!fs.existsSync(projectRoot)) {
    throw new Error(`Project not found: ${projectRoot}`);
  }

  const logsDir = path.join(root, "runtime", "logs", workspaceId);
  ensureDir(logsDir);

  const jobId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");

  const perRunLogPath = path.join(logsDir, `${projectId}.${jobId}.log`);
  const latestLogPath = path.join(logsDir, `${projectId}.log`);

  // open both logs in append mode (do not truncate)
  const perRun = fs.createWriteStream(perRunLogPath, { flags: "a" });
  const latest = fs.createWriteStream(latestLogPath, { flags: "a" });

  const header = `[${nowIso()}] build_start workspaceId=${workspaceId} projectId=${projectId} jobId=${jobId}\n`;
  safeWrite(perRun, header);
  safeWrite(latest, header);

  const child = spawn("npm", ["run", "build"], {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => {
    safeWrite(perRun, chunk);
    safeWrite(latest, chunk);
  });

  child.stderr?.on("data", (chunk) => {
    safeWrite(perRun, chunk);
    safeWrite(latest, chunk);
  });

  return await new Promise<{
    ok: boolean;
    jobId: string;
    logPath: string;
    code: number | null;
  }>((resolve) => {
    child.on("close", (code) => {
      const footer = `\n[${nowIso()}] build_end workspaceId=${workspaceId} projectId=${projectId} jobId=${jobId} code=${code}\n`;
      safeWrite(perRun, footer);
      safeWrite(latest, footer);

      try {
        perRun.end();
      } catch {}
      try {
        latest.end();
      } catch {}

      resolve({
        ok: code === 0,
        jobId,
        logPath: perRunLogPath,
        code: code ?? null,
      });
    });

    child.on("error", (err) => {
      const msg = `\n[${nowIso()}] build_error workspaceId=${workspaceId} projectId=${projectId} jobId=${jobId} error=${String(
        (err as any)?.message ?? err
      )}\n`;
      safeWrite(perRun, msg);
      safeWrite(latest, msg);

      try {
        perRun.end();
      } catch {}
      try {
        latest.end();
      } catch {}

      resolve({
        ok: false,
        jobId,
        logPath: perRunLogPath,
        code: null,
      });
    });
  });
}
