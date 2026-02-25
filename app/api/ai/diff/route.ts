import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { generateDiffPreview, type DiffFile } from "@/lib/ai/diff";

export const dynamic = "force-dynamic";

type Body = {
  workspaceId?: string;
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
};

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

function validateFiles(files: any): DiffFile[] {
  if (!Array.isArray(files) || files.length === 0) return [];
  const out: DiffFile[] = [];

  for (const f of files) {
    const p = f?.path;
    const c = f?.content;
    if (typeof p !== "string" || typeof c !== "string") continue;
    out.push({ path: p, content: c });
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const workspaceId = body?.workspaceId;
    const projectId = body?.projectId;
    const files = validateFiles(body?.files);

    if (!workspaceId || !projectId || files.length === 0) {
      return NextResponse.json(
        { error: "workspaceId, projectId, files[] are required" },
        { status: 400 }
      );
    }

    // manifest gate (workspace/project scoped)
    enforceManifestGate({ workspaceId, projectId });

    const projectRoot = resolveProjectRoot(workspaceId, projectId);
    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // v1: also hard-require src/ only for diff preview consistency with scaffold rules
    for (const f of files) {
      if (!f.path.startsWith("src/")) {
        return NextResponse.json(
          { error: `Path not allowed (diff preview only supports src/): ${f.path}` },
          { status: 400 }
        );
      }
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
