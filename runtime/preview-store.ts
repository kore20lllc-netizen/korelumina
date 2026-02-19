import fs from "fs";
import path from "path";

export type PreviewStatus = "running" | "stopped" | "failed";

export type PreviewRecord = {
  workspaceId: string;
  projectId: string;
  status: PreviewStatus;
  pid: number | null;
  port: number | null;
  url: string | null;
  logPath: string | null;
  startedAt: number | null;
  stoppedAt: number | null;
  lastError: string | null;
};

const PREVIEWS_FILE = path.resolve(process.cwd(), "runtime", "previews.json");

function ensureFile() {
  const dir = path.dirname(PREVIEWS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PREVIEWS_FILE)) fs.writeFileSync(PREVIEWS_FILE, "[]", "utf8");
}

function readAll(): PreviewRecord[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(PREVIEWS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PreviewRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: PreviewRecord[]) {
  ensureFile();
  fs.writeFileSync(PREVIEWS_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export function getPreview(workspaceId: string, projectId: string) {
  return readAll().find((p) => p.workspaceId === workspaceId && p.projectId === projectId) ?? null;
}

export function upsertPreview(rec: PreviewRecord) {
  const all = readAll();
  const idx = all.findIndex((p) => p.workspaceId === rec.workspaceId && p.projectId === rec.projectId);
  if (idx >= 0) all[idx] = rec;
  else all.push(rec);
  writeAll(all);
  return rec;
}

// Optional helpers (safe to keep even if you don't use them yet)
export function markPreviewRunning(opts: {
  workspaceId: string;
  projectId: string;
  pid: number;
  port: number;
  url: string;
  logPath: string;
}) {
  const rec: PreviewRecord = {
    workspaceId: opts.workspaceId,
    projectId: opts.projectId,
    status: "running",
    pid: opts.pid,
    port: opts.port,
    url: opts.url,
    logPath: opts.logPath,
    startedAt: Date.now(),
    stoppedAt: null,
    lastError: null,
  };
  return upsertPreview(rec);
}

export function markPreviewStopped(opts: { workspaceId: string; projectId: string; reason: string }) {
  const cur = getPreview(opts.workspaceId, opts.projectId);
  const rec: PreviewRecord = {
    workspaceId: opts.workspaceId,
    projectId: opts.projectId,
    status: "stopped",
    pid: null,
    port: null,
    url: null,
    logPath: cur?.logPath ?? null,
    startedAt: cur?.startedAt ?? null,
    stoppedAt: Date.now(),
    lastError: opts.reason,
  };
  return upsertPreview(rec);
}

export function markPreviewFailed(opts: { workspaceId: string; projectId: string; reason: string }) {
  const cur = getPreview(opts.workspaceId, opts.projectId);
  const rec: PreviewRecord = {
    workspaceId: opts.workspaceId,
    projectId: opts.projectId,
    status: "failed",
    pid: null,
    port: null,
    url: null,
    logPath: cur?.logPath ?? null,
    startedAt: cur?.startedAt ?? null,
    stoppedAt: Date.now(),
    lastError: opts.reason,
  };
  return upsertPreview(rec);
}
