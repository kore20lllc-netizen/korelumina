import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { generateDiffPreview } from "@/lib/ai/diff";

export const dynamic = "force-dynamic";

function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

type Body = {
  workspaceId: string;
  projectId: string;
  files: { path: string; content: string }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const workspaceId = body?.workspaceId;
    const projectId = body?.projectId;
    const files = Array.isArray(body?.files) ? body.files : [];

    if (!workspaceId || !projectId || files.length === 0) {
      return NextResponse.json(
        { error: "workspaceId, projectId, files[] are required" },
        { status: 400 }
      );
    }

    // ✅ CORRECT manifest gate usage
    enforceManifestGate({
      workspaceId,
      projectId,
      paths: files.map(f => f.path),
    });

    const projectRoot = resolveProjectRoot(workspaceId, projectId);

    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const diffs = generateDiffPreview(projectRoot, files);

    return NextResponse.json({
      ok: true,
      workspaceId,
      projectId,
      diffs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Diff error" },
      { status: 500 }
    );
  }
}
