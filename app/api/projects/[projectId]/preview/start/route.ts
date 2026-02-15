import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const running: Record<string, { port: number; pid: number }> = {};

function getProjectRoot(id: string) {
  return path.join(process.cwd(), "projects", id);
}

function getFreePort(base = 4000) {
  return base + Math.floor(Math.random() * 1000);
}

function isVite(root: string) {
  return fs.existsSync(path.join(root, "vite.config.ts")) ||
         fs.existsSync(path.join(root, "vite.config.js"));
}

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  if (running[projectId]) {
    return NextResponse.json(running[projectId]);
  }

  const root = getProjectRoot(projectId);

  if (!fs.existsSync(root)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const port = getFreePort();

  const vite = isVite(root);

  const command = vite
    ? `npm install && npm run dev -- --port ${port}`
    : `npm install && npm run dev`;

  const proc = spawn(
    "bash",
    ["-lc", command],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(port),
      },
    }
  );

  running[projectId] = {
    port,
    pid: proc.pid!,
  };

  return NextResponse.json(running[projectId]);
}