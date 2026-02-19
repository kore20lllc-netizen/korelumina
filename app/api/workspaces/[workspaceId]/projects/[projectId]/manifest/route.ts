import { NextResponse } from "next/server";
import { resolveWorkspacePath, assertProjectExists } from "@/lib/workspace-jail";
import { ensureManifest } from "@/lib/project-manifest";

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

  return NextResponse.json(manifest);
}
