import http from "http";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import net from "net";

const HOST = process.env.KORELUMINA_PREVIEWD_HOST || "127.0.0.1";
const PORT = Number(process.env.KORELUMINA_PREVIEWD_PORT || 3101);

function json(res: http.ServerResponse, code: number, data: any) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isPidAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function waitForPort(host: string, port: number, timeoutMs: number) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      const sock = new net.Socket();
      sock.setTimeout(500);
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("timeout", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error("port-timeout"));
        else setTimeout(tick, 150);
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error("port-timeout"));
        else setTimeout(tick, 150);
      });
      sock.connect(port, host);
    };
    tick();
  });
}

function tailFile(filePath: string, maxLines: number) {
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    const lines = txt.split("\n");
    return lines.slice(Math.max(0, lines.length - maxLines)).join("\n");
  } catch {
    return "";
  }
}

function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.resolve(process.cwd(), "runtime", "workspaces", workspaceId, "projects", projectId);
}

function detectFramework(projectRoot: string): "vite" | "next" {
  // 1) Prefer korelumina.manifest.json if present at project root
  const manifestPath = path.join(projectRoot, "korelumina.manifest.json");
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (m?.framework === "next") return "next";
      return "vite";
    } catch {}
  }

  // 2) Fallback: package.json dependency sniff
  const pkgPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next) return "next";
    } catch {}
  }

  return "vite";
}

type PreviewRec = {
  workspaceId: string;
  projectId: string;
  status: "running" | "failed" | "stopped";
  pid: number | null;
  port: number | null;
  url: string | null;
  logPath: string;
  startedAt: number | null;
  stoppedAt: number | null;
  lastError: string | null;
};

const PREVIEWS_PATH = path.resolve(process.cwd(), "runtime", "previews.json");

function readPreviews(): PreviewRec[] {
  try {
    if (!fs.existsSync(PREVIEWS_PATH)) return [];
    const v = JSON.parse(fs.readFileSync(PREVIEWS_PATH, "utf8"));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writePreviews(list: PreviewRec[]) {
  ensureDir(path.dirname(PREVIEWS_PATH));
  fs.writeFileSync(PREVIEWS_PATH, JSON.stringify(list, null, 2), "utf8");
}

function upsertPreview(rec: PreviewRec) {
  const list = readPreviews();
  const idx = list.findIndex(p => p.workspaceId === rec.workspaceId && p.projectId === rec.projectId);
  if (idx >= 0) list[idx] = rec;
  else list.push(rec);
  writePreviews(list);
}

function getPreview(workspaceId: string, projectId: string) {
  return readPreviews().find(p => p.workspaceId === workspaceId && p.projectId === projectId) || null;
}

function previewLogPath(workspaceId: string, projectId: string) {
  return path.resolve(process.cwd(), "runtime", "logs", workspaceId, `${projectId}.preview.log`);
}

function appendLine(fp: string, line: string) {
  fs.appendFileSync(fp, line.endsWith("\n") ? line : line + "\n", "utf8");
}

async function startPreview(workspaceId: string, projectId: string) {
  const projectRoot = resolveProjectRoot(workspaceId, projectId);
  if (!fs.existsSync(projectRoot)) throw new Error("Project not found");

  const framework = detectFramework(projectRoot);
  const port = 4100; // keep deterministic for now
  const url = `http://localhost:${port}`;

  const logPath = previewLogPath(workspaceId, projectId);
  ensureDir(path.dirname(logPath));
  fs.writeFileSync(logPath, "", "utf8");
  appendLine(logPath, `[previewd] framework=${framework} port=${port}`);
  appendLine(logPath, `[previewd] cwd=${projectRoot}`);

  // If already running and port is up, return it
  const cur = getPreview(workspaceId, projectId);
  if (cur?.status === "running" && cur.pid && isPidAlive(cur.pid)) {
    try {
      await waitForPort("127.0.0.1", cur.port || port, 1000);
      return cur;
    } catch {
      // fall through -> restart
    }
  }

  const extraArgs =
    framework === "next"
      ? ["-p", String(port)]
      : ["--host", "0.0.0.0", "--port", String(port)];

  // IMPORTANT: pass args after `--` so Vite/Next gets them
  const child = spawn("npm", ["run", "dev", "--", ...extraArgs], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port), KORELUMINA_PREVIEW: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    shell: false,
  });

  if (!child.pid) throw new Error("failed-to-spawn");

  child.stdout.on("data", d => appendLine(logPath, String(d)));
  child.stderr.on("data", d => appendLine(logPath, String(d)));

  const rec: PreviewRec = {
    workspaceId,
    projectId,
    status: "running",
    pid: child.pid,
    port,
    url,
    logPath,
    startedAt: Date.now(),
    stoppedAt: null,
    lastError: null,
  };

  upsertPreview(rec);

  // Only return OK if port becomes reachable
  try {
    await waitForPort("127.0.0.1", port, 6000);
    appendLine(logPath, `[previewd] listening ${url}`);
    return rec;
  } catch {
    const msg = "preview-port-never-opened";
    const failed: PreviewRec = {
      ...rec,
      status: "failed",
      stoppedAt: Date.now(),
      lastError: msg,
    };
    upsertPreview(failed);
    throw new Error(`${msg}\n--- last logs ---\n${tailFile(logPath, 80)}`);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/preview/start") {
    const body = await parseBody(req);
    const { workspaceId, projectId } = body;

    if (!workspaceId || !projectId) {
      return json(res, 400, { error: "Missing workspaceId or projectId" });
    }

    try {
      const rec = await startPreview(workspaceId, projectId);
      return json(res, 200, { ok: true, workspaceId, projectId, preview: rec });
    } catch (e: any) {
      return json(res, 500, { error: e?.message || "preview failed" });
    }
  }

  return json(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`previewd running on ${HOST}:${PORT}`);
});
