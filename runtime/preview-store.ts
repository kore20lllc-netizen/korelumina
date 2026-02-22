import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export interface PreviewRecord {
  workspaceId: string;
  projectId: string;
  status: "running" | "stopped";
  pid: number | null;
  port: number;
  url: string;
  logPath: string;
  startedAt: number | null;
  stoppedAt: number | null;
  lastError: string | null;
}

const PREVIEWS_FILE = path.join(process.cwd(), "runtime", "previews.json");

function ensureFile() {
  if (!fs.existsSync(PREVIEWS_FILE)) {
    fs.mkdirSync(path.dirname(PREVIEWS_FILE), { recursive: true });
    fs.writeFileSync(PREVIEWS_FILE, "[]", "utf8");
  }
}

export function readPreviews(): PreviewRecord[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(PREVIEWS_FILE, "utf8"));
}

export function writePreviews(previews: PreviewRecord[]) {
  fs.writeFileSync(PREVIEWS_FILE, JSON.stringify(previews, null, 2));
}

export function getActivePreview(workspaceId: string, projectId: string) {
  const previews = readPreviews();
  const preview = previews.find(
    p => p.workspaceId === workspaceId && p.projectId === projectId
  );

  if (!preview) return null;

  try {
    if (preview.pid) process.kill(preview.pid, 0);
    return preview;
  } catch {
    const cleaned = previews.filter(
      p => !(p.workspaceId === workspaceId && p.projectId === projectId)
    );
    writePreviews(cleaned);
    return null;
  }
}

export function startPreviewProcess(
  workspaceId: string,
  projectId: string,
  cwd: string,
  port: number,
  cmd: string,
  args: string[]
) {
  const logPath = path.join(
    process.cwd(),
    "runtime",
    "logs",
    workspaceId,
    `${projectId}.preview.log`
  );

  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env, PORT: String(port) },
    shell: true,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.unref();

  const stream = fs.createWriteStream(logPath, { flags: "a" });
  child.stdout?.pipe(stream);
  child.stderr?.pipe(stream);

  const record: PreviewRecord = {
    workspaceId,
    projectId,
    status: "running",
    pid: child.pid ?? null,
    port,
    url: `http://localhost:${port}`,
    logPath,
    startedAt: Date.now(),
    stoppedAt: null,
    lastError: null
  };

  const previews = readPreviews().filter(
    p => !(p.workspaceId === workspaceId && p.projectId === projectId)
  );

  previews.push(record);
  writePreviews(previews);

  return record;
}

export function stopPreviewProcess(workspaceId: string, projectId: string) {
  const previews = readPreviews();
  const preview = previews.find(
    p => p.workspaceId === workspaceId && p.projectId === projectId
  );

  if (!preview || !preview.pid) {
    return { ok: true, stopped: false };
  }

  try {
    process.kill(-preview.pid, "SIGTERM");
  } catch {
    return { ok: true, stopped: false };
  }

  const timeout = Date.now() + 5000;

  while (Date.now() < timeout) {
    try {
      process.kill(preview.pid, 0);
    } catch {
      break;
    }
  }

  try {
    process.kill(-preview.pid, "SIGKILL");
  } catch {}

  const cleaned = previews.filter(
    p => !(p.workspaceId === workspaceId && p.projectId === projectId)
  );

  writePreviews(cleaned);

  return { ok: true, stopped: true };
}

export function cleanupDeadPreviews() {
  const previews = readPreviews();

  const alive = previews.filter(p => {
    if (!p.pid) return false;
    try {
      process.kill(p.pid, 0);
      return true;
    } catch {
      return false;
    }
  });

  writePreviews(alive);
  return alive.length;
}
