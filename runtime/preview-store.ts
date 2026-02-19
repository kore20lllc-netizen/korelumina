import fs from "fs";
import path from "path";
import net from "net";

export type PreviewStatus = "running" | "stopped" | "failed";

export type PreviewRecord = {
  workspaceId: string;
  projectId: string;
  status: PreviewStatus;
  pid: number | null;
  port: number | null;
  url: string | null;
  startedAt: number | null;
  stoppedAt: number | null;
  logPath: string | null;
  lastError?: string | null;
};

const FILE_PATH = path.resolve(process.cwd(), "runtime", "previews.json");
const PORT_MIN = 4100;
const PORT_MAX = 4999;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readPreviews(): PreviewRecord[] {
  return readJson<PreviewRecord[]>(FILE_PATH, []);
}

function writePreviews(items: PreviewRecord[]) {
  ensureDir(path.dirname(FILE_PATH));
  fs.writeFileSync(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
}

export function getPreview(workspaceId: string, projectId: string) {
  return readPreviews().find(
    p => p.workspaceId === workspaceId && p.projectId === projectId
  ) ?? null;
}

export function upsertPreview(record: PreviewRecord) {
  const items = readPreviews();
  const idx = items.findIndex(
    p => p.workspaceId === record.workspaceId && p.projectId === record.projectId
  );
  if (idx >= 0) items[idx] = record;
  else items.push(record);
  writePreviews(items);
}

async function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "127.0.0.1");
  });
}

export async function allocatePort(workspaceId: string) {
  const items = readPreviews();
  const used = new Set<number>();

  for (const p of items) {
    if (p.workspaceId === workspaceId && p.status === "running" && p.port) {
      used.add(p.port);
    }
  }

  for (let port = PORT_MIN; port <= PORT_MAX; port++) {
    if (used.has(port)) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }

  throw new Error("No preview ports available");
}

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
  upsertPreview(rec);
  return rec;
}

export function markPreviewStopped(opts: {
  workspaceId: string;
  projectId: string;
  reason?: string;
}) {
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
    lastError: opts.reason ?? null,
  };

  upsertPreview(rec);
  return rec;
}

export function markPreviewFailed(opts: {
  workspaceId: string;
  projectId: string;
  reason: string;
}) {
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

  upsertPreview(rec);
  return rec;
}


export function previewLogPath(workspaceId: string, projectId: string) {
  const dir = path.resolve(
    process.cwd(),
    "runtime",
    "logs",
    workspaceId
  );

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return path.resolve(dir, `${projectId}.preview.log`);
}
