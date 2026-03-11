import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { projectId, path: filePath, content } = body;

  if (!projectId || !filePath) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const full = path.join(root, filePath);

  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content ?? "", "utf8");

  return NextResponse.json({ ok: true });
}
