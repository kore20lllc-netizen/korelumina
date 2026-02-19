import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";
import { readJobs } from "@/runtime/job-store";
import { getPreview } from "@/runtime/preview-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

function tailFile(filePath: string, maxLines = 200): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  return lines.slice(-maxLines);
}

export async function GET(_req: Request, context: Ctx) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const manifest = ensureManifest(projectRoot, projectId, {
    strict: process.env.NODE_ENV === "production",
  });

  const jobs = readJobs().filter(
    j => j.workspaceId === workspaceId && j.projectId === projectId
  );

  const latestJob = jobs.length ? jobs[jobs.length - 1] : null;

  const isBuilding =
    latestJob?.status === "running" ||
    latestJob?.status === "pending";

  const lastSuccess = [...jobs]
    .reverse()
    .find(j => j.status === "success" || j.status === "completed");

  const lastSuccessAt = lastSuccess?.finishedAt || null;

  const logExists =
    latestJob?.logPath ? fs.existsSync(latestJob.logPath) : false;

  const logs =
    logExists && latestJob?.logPath
      ? tailFile(path.resolve(latestJob.logPath))
      : [];

  let health: "idle" | "building" | "error" | "ready" = "idle";

  if (isBuilding) health = "building";
  else if (latestJob?.status === "failed") health = "error";
  else if (lastSuccessAt) health = "ready";

  const canBuild = !isBuilding;

  const preview = getPreview(workspaceId, projectId);
  const previewRunning = preview?.status === "running";

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
    logs,
    preview: preview ?? null,
    previewRunning,
    previewUrl: preview?.url ?? null,
    previewPort: preview?.port ?? null,
    previewError: preview?.lastError ?? null,
  });
}
