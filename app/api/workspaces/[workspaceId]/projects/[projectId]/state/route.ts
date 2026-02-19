import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";
import { readJobs } from "@/runtime/job-store";

type Ctx = {
  params: Promise<{ workspaceId: string; projectId: string }>;
};

type PreviewRecord = {
  workspaceId: string;
  projectId: string;
  status: "running" | "stopped" | "failed";
  pid: number | null;
  port: number | null;
  url: string | null;
  logPath: string | null;
  startedAt: number | null;
  stoppedAt: number | null;
  lastError: string | null;
};

function readPreviews(): PreviewRecord[] {
  const p = path.resolve(process.cwd(), "runtime", "previews.json");
  try {
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf8").trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as PreviewRecord[]) : [];
  } catch {
    return [];
  }
}

function tailFile(filePath: string, maxLines = 200): string[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/);
    return lines.slice(-maxLines).filter(Boolean);
  } catch {
    return [];
  }
}

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
    latestJob?.status === "running" || latestJob?.status === "pending";

  const lastSuccess = [...jobs]
    .reverse()
    .find((j) => j.status === "success" || j.status === "completed");

  const lastSuccessAt = lastSuccess?.finishedAt ?? null;

  const jobLogExists = latestJob?.logPath ? fs.existsSync(latestJob.logPath) : false;
  const jobLogs =
    jobLogExists && latestJob?.logPath
      ? tailFile(path.resolve(latestJob.logPath), 200)
      : [];

  const preview = readPreviews().find(
    (p) => p.workspaceId === workspaceId && p.projectId === projectId
  ) ?? null;

  const previewUrl = preview?.url ?? null;
  const previewStatus = preview?.status ?? "stopped";

  const previewLogExists = preview?.logPath ? fs.existsSync(preview.logPath) : false;
  const previewLogs =
    previewLogExists && preview?.logPath
      ? tailFile(path.resolve(preview.logPath), 200)
      : [];

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
    health,

    // Build logs
    logExists: jobLogExists,
    logs: jobLogs,

    // Preview state
    preview,
    previewUrl,
    previewStatus,
    previewLogExists,
    previewLogs,
  });
}
