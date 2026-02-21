import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

import { ensureManifest, resolveManifestCommand } from "@/lib/project-manifest";
import { createJob, updateJobStatus } from "@/runtime/job-store";

function ensureDir(p: string) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const manifest = ensureManifest(workspaceId, projectId);
  const { cmd, args } = resolveManifestCommand(manifest, "build");

  const job = createJob(workspaceId, projectId, "build");

  if (!job.logPath) {
    return NextResponse.json({ error: "Job logPath missing" }, { status: 500 });
  }

  ensureDir(path.dirname(job.logPath));
  fs.writeFileSync(job.logPath, "", "utf8");

  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );

  const child = spawn(cmd, args, {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (d) =>
    fs.appendFileSync(job.logPath!, String(d))
  );

  child.stderr.on("data", (d) =>
    fs.appendFileSync(job.logPath!, String(d))
  );

  child.on("exit", (code) => {
    updateJobStatus(job.id, code === 0 ? "success" : "failed");
  });

  return NextResponse.json({ ok: true });
}
