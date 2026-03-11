import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const projectId = searchParams.get("projectId");
  const filePath = searchParams.get("path");

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

  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: "file not found", full }, { status: 404 });
  }

  const content = fs.readFileSync(full, "utf8");

  return NextResponse.json({ content });
}
