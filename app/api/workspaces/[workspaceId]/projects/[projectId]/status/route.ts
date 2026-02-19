import fs from "fs";
import { NextResponse } from "next/server";
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

  const jobs = readJobs();
  const related = jobs.filter(
    j => j.workspaceId === workspaceId && j.projectId === projectId
  );

  const latest = related.length
    ? related[related.length - 1]
    : null;

  const logExists = latest?.logPath
    ? fs.existsSync(latest.logPath)
    : false;

  return NextResponse.json({
    projectId,
    workspaceId,
    framework: manifest.framework,
    outputDir: manifest.outputDir,
    rootDir: manifest.rootDir,
    latestJob: latest,
    logExists,
    hasManifest: true,
  });
}
