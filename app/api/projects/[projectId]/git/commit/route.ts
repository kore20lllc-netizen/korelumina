import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const running: Record<
  string,
  { port: number; pid: number }
> = {};

function getProjectRoot(projectId: string) {
  return path.join(process.cwd(), "projects", projectId);
}

function getFreePort(base = 4500) {
  return base + Math.floor(Math.random() * 500);
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;

  // Already running?
  if (running[projectId]) {
    return NextResponse.json(running[projectId]);
  }

  const root = getProjectRoot(projectId);

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const port = getFreePort();

  const script = path.join(
    process.cwd(),
    "scripts",
    "run-preview-universal.sh"
  );

  const proc = spawn(
    "bash",
    [script, projectId, root, String(port)],
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
    pid: proc.pid ?? -1,
  };

  proc.on("exit", () => {
    delete running[projectId];
  });

  return NextResponse.json(running[projectId]);
}
