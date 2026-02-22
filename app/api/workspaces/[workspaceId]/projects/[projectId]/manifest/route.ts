import { NextRequest } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const projectRoot = resolveWorkspacePath(workspaceId, projectId);
  assertProjectExists(projectRoot);

  const manifest = ensureManifest(projectRoot, projectId);

  return Response.json(manifest);
}
