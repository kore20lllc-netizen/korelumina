import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest, resolveManifestCommand } from "@/lib/project-manifest";
import { createJob, appendJobLog } from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function POST(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const manifest = ensureManifest(projectRoot, projectId, {
    strict: process.env.NODE_ENV === "production",
  });

  const job = createJob(workspaceId, projectId);

  if (!job.logPath) {
    throw new Error("Job logPath missing");
  }

  ensureDir(path.dirname(job.logPath));
  fs.writeFileSync(job.logPath, "", "utf8");

  appendJobLog(job.id, `[build] starting ${projectId}`);

  const { cmd, args } = resolveManifestCommand(manifest, "build");
  appendJobLog(job.id, `[build] cmd=${cmd} args=${args.join(" ")}`);

  return NextResponse.json({
    ok: true,
    workspaceId,
    projectId,
    jobId: job.id,
  });
}
