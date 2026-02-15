import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getProjectRoot(id: string) {
  return path.join(process.cwd(), "projects", id);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    const root = getProjectRoot(projectId);

    if (!fs.existsSync(root)) {
      return NextResponse.json([], { status: 404 });
    }

    const results: string[] = [];

    function walk(dir: string) {
      let list: string[] = [];

      try {
        list = fs.readdirSync(dir);
      } catch {
        return;
      }

      for (const file of list) {
        const filePath = path.join(dir, file);

        let stat;
        try {
          stat = fs.statSync(filePath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          if (file === "node_modules" || file === ".git") continue;
          walk(filePath);
        } else {
          results.push(filePath.replace(root + "/", ""));
        }
      }
    }

    walk(root);

    return NextResponse.json(results.map((p) => ({ path: p })));
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to read files" },
      { status: 500 }
    );
  }
}
