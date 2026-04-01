<<<<<<< HEAD
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { runCompileGuard } from "@/lib/ai/compile-guard";

interface FileChange {
  path: string;
  content: string;
}

interface ApplyRequest {
  workspaceId: string;
  projectId: string;
  files: FileChange[];
}

function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
=======
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { applyPatch } from "@/runtime/patch/applyPatch"

export async function POST(req:NextRequest){

  const body = await req.json()

  const { projectId, patches } = body

  if(!projectId || !patches){
    return NextResponse.json({ ok:false,error:"missing" })
  }

  const root = path.join(
>>>>>>> origin/main
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
<<<<<<< HEAD
    projectId
  );
}

function backupFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function restoreFile(filePath: string, content: string | null) {
  if (content === null) return;
  fs.writeFileSync(filePath, content, "utf8");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyRequest;
    const { workspaceId, projectId, files } = body;

    if (!workspaceId || !projectId || !files?.length) {
      return NextResponse.json(
        { error: "Invalid apply payload" },
        { status: 400 }
      );
    }

    const projectRoot = resolveProjectRoot(workspaceId, projectId);

    if (!fs.existsSync(projectRoot)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const backups: Record<string, string | null> = {};

    // Backup + apply
    for (const change of files) {
      const fullPath = path.join(projectRoot, change.path);

      backups[fullPath] = backupFile(fullPath);

      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, change.content, "utf8");
    }

    // ✅ STRICT TSC GUARD (NO NEXT BUILD)
    const guard = await runCompileGuard(projectRoot);

    if (!guard.ok) {
      for (const filePath of Object.keys(backups)) {
        restoreFile(filePath, backups[filePath]);
      }

      return NextResponse.json(
        {
          ok: false,
          rolledBack: true,
          error: guard.output ?? "TypeScript compile failed"
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      compiled: true
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Apply error" },
      { status: 500 }
    );
  }
=======
    projectId,
    "app"
  )

  for(const p of patches){

    await applyPatch(
      root,
      p.path,
      p.content
    )

  }

  return NextResponse.json({ ok:true })

>>>>>>> origin/main
}
