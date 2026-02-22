import { NextRequest } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";
import { getActivePreview } from "@/runtime/preview-store";
import { getLatestJobForProject } from "@/runtime/job-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const manifest = ensureManifest(projectRoot, projectId);

  const preview = getActivePreview(workspaceId, projectId);
  const job = getLatestJobForProject(workspaceId, projectId);

  return Response.json({
    ok: true,
    workspaceId,
    projectId,
    manifest,
    preview,
    job,
  });
}
