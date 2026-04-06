import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getContentType(file: string) {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".gif")) return "image/gif";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const file = searchParams.get("file");

  if (!projectId || !file) {
    return new NextResponse("Missing params", { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId,
    "public",
    file
  );

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const contentType = getContentType(file);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
    },
  });
}
