import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { projectId, workspaceId, spec } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // simple demo AI: modify app/page.tsx
    const projectRoot = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      workspaceId || "default",
      "projects",
      projectId
    );

    const filePath = path.join(projectRoot, "app/page.tsx");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const current = fs.readFileSync(filePath, "utf8");

    // simple transformation (replace text inside JSX)
    const updated = current.replace(
      /AI:.*<\/div>/,
      `AI: ${spec}</div>`
    );

    return NextResponse.json({
      files: [
        {
          path: "app/page.tsx",
          content: updated,
        },
      ],
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
