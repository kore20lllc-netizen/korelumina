import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, files } = body;

    if (!projectId || !files) {
      return NextResponse.json(
        { error: "Missing projectId or files" },
        { status: 400 }
      );
    }

    const baseDir = path.join(process.cwd(), "runtime/workspaces/default/projects", projectId);

    for (const file of files) {
      const filePath = path.join(baseDir, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content, "utf-8");
    }

    return NextResponse.json({ ok: true, mode: "draft", files: files.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Draft failed" },
      { status: 500 }
    );
  }
}
