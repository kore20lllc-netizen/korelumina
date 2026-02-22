import { NextRequest } from "next/server";
import { getActivePreview } from "@/runtime/preview-store";
import { getLatestJobForProject } from "@/runtime/job-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await context.params;

  const preview = getActivePreview(workspaceId, projectId);
  const job = getLatestJobForProject(workspaceId, projectId);

  return Response.json({
    preview,
    job
  });
}
