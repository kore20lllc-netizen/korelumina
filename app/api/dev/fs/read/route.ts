import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get("projectId");
    const fileParam = searchParams.get("file");

    if (!projectId || !fileParam) {
      return new Response(
        JSON.stringify({ error: "Missing projectId or file" }),
        { status: 400 }
      );
    }

    const file = fileParam.replace(/^\/+/, "");

    const root = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      "default",
      "projects",
      projectId
    );

    const full = path.join(root, file);

    if (!fs.existsSync(full)) {
      return new Response(
        JSON.stringify({ error: "File not found", file }),
        { status: 404 }
      );
    }

    const content = fs.readFileSync(full, "utf8");

    return new Response(content, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "FS read failed",
        details: err?.message || err,
      }),
      { status: 500 }
    );
  }
}
