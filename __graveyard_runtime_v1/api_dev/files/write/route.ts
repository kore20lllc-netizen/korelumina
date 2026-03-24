import { ensureProjectRoot } from "@/runtime/fs/ensureProjectRoot";
import { NextRequest, NextResponse } from "next/server"
import { pushPatch } from "@/runtime/preview-patches";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const projectId = body?.projectId;
    const filePath = body?.path;
    const content = body?.content;

    if (!projectId || !filePath) {
      return NextResponse.json(
        { ok: false, error: "missing params" },
        { status: 400 }
      );
    }

    const baseDir = path.join(process.cwd(), "projects", projectId);
    const fullPath = path.join(baseDir, filePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content ?? "", "utf8");

    
pushPatch(projectId,{
  type:"file-update",
  path,
  ts: Date.now()
})

return NextResponse.json({ ok:true })
;

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
