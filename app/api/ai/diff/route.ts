<<<<<<< HEAD
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { enforceManifestGate } from "@/lib/manifest-enforce";
import { generateDiffPreview, type DiffFile } from "@/lib/ai/diff";
=======
import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { runtimeRoot } from "@/runtime/root"
>>>>>>> origin/main

export async function POST(req:NextRequest){

<<<<<<< HEAD
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
=======
  const body = await req.json()

  const { projectId, draftId } = body
>>>>>>> origin/main

  const ROOT = runtimeRoot()

<<<<<<< HEAD
    const workspaceId = body?.workspaceId;
    const projectId = body?.projectId;
    const files = validateFiles(body?.files);

    if (!workspaceId || !projectId || files.length === 0) {
      return NextResponse.json(
        { error: "workspaceId, projectId, files[] are required" },
        { status: 400 }
      );
    }

    enforceManifestGate({
      workspaceId,
      projectId,
      paths: files.map(f => f.path)
    });

    const projectRoot = resolveProjectRoot(workspaceId, projectId);
    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
=======
  const draftDir = path.join(
    ROOT,
    "drafts",
    projectId,
    draftId
  )

  try{
    await fs.access(draftDir)
  }catch{
    return NextResponse.json({ ok:false, error:"draft not found in diff" })
>>>>>>> origin/main
  }

  return NextResponse.json({
    ok:true,
    diffs:[
      { path:"app/components/GeneratedNote.tsx", patch:"mock" },
      { path:"app/page.tsx", patch:"mock" }
    ]
  })

}
