import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { isLockedFile } from "@/lib/guardrails/builder-lock";

function resolveSafePath(projectId: string, filePath: string) {
  const projectRoot = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const fullPath = path.join(projectRoot, filePath);

  if (!fullPath.startsWith(projectRoot)) {
    throw new Error("Invalid path");
  }

  return { fullPath };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("[FS WRITE BODY]", body);

    const projectId = body.projectId;
    const filePath = body.filePath || body.file;
    const content = body.content;

    if (!projectId || !filePath) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId or filePath" },
        { status: 400 }
      );
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { ok: false, error: "Content must be string" },
        { status: 400 }
      );
    }

    const { fullPath } = resolveSafePath(projectId, filePath);

if (isLockedFile(filePath)) {
  return NextResponse.json(
    {
      ok: false,
      error: "Protected system file (builder/master-os locked)",
      file: filePath,
    },
    { status: 403 }
  );
}
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    await fs.writeFile(fullPath, content, "utf-8");

    return NextResponse.json({
      ok: true,
      projectId,
      filePath,
    });
  } catch (err: any) {
    console.error("[FS WRITE ERROR]", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Write failed",
      },
      { status: 500 }
    );
  }
}
