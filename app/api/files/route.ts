import fs from "fs";
import path from "path";

function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.env.KORE_RUNTIME_ROOT!,
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

function walk(dir: string, base = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let files: string[] = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.join(base, e.name);

    if (e.isDirectory()) {
      files = files.concat(walk(full, rel));
    } else {
      files.push(rel);
    }
  }

  return files;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const workspaceId = searchParams.get("workspaceId");
  const projectId = searchParams.get("projectId");

  if (!workspaceId || !projectId) {
    return new Response("Missing params", { status: 400 });
  }

  const root = resolveProjectRoot(workspaceId, projectId);

  const src = path.join(root, "src");

  if (!fs.existsSync(src)) {
    return Response.json({ files: [] });
  }

  const files = walk(src).map((f) => `src/${f}`);

  return Response.json({ files });
}
