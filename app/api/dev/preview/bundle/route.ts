import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import * as esbuild from "esbuild";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const entry = searchParams.get("entry") || "app/page.tsx";

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId" }, { status: 400 });
    }

    const projectRoot = path.join(
      process.cwd(),
      "runtime/workspaces/default/projects",
      projectId
    );

    const entryPath = path.join(projectRoot, entry);

    try {
      await fs.access(entryPath);
    } catch {
      return NextResponse.json(
        { ok: false, error: `Entry not found: ${entry}` },
        { status: 404 }
      );
    }

    const result = await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      jsx: "automatic",
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
        ".js": "js",
        ".jsx": "jsx",
        ".css": "empty",
      },
      define: {
        "process.env.NODE_ENV": `"development"`,
      },
      external: ["react", "react-dom", "next/*"],
    });

    const code = result.outputFiles[0].text;

    return new NextResponse(code, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Build failed",
      },
      { status: 500 }
    );
  }
}
