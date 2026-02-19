import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";
import { readJobs } from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const manifest = ensureManifest(projectRoot, projectId, {
    strict: process.env.NODE_ENV === "production",
  });

  const jobs = readJobs().filter(
    (j) => j.workspaceId === workspaceId && j.projectId === projectId
  );

  const latestJob = jobs.length ? jobs[jobs.length - 1] : null;

  const isBuilding =
    latestJob?.status === "running" ||
    latestJob?.status === "pending";

  const lastSuccess = [...jobs]
    .reverse()
    .find((j) => j.status === "success");

  const lastSuccessAt = lastSuccess?.finishedAt ?? null;

  const logExists =
    latestJob?.logPath ? fs.existsSync(path.resolve(latestJob.logPath)) : false;

  let health: "idle" | "building" | "error" | "ready" = "idle";

  if (isBuilding) health = "building";
  else if (latestJob?.status === "failed") health = "error";
  else if (lastSuccessAt) health = "ready";

  const canBuild = !isBuilding;

  return NextResponse.json({
    projectId,
    workspaceId,
    manifest,
    latestJob,
    lastSuccessAt,
    isBuilding,
    canBuild,
    logExists,
    health,
    previewUrl: null,
  });
}
