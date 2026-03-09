import fs from "fs";
import path from "path";

function resolveProjectRoot(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const workspaceId = searchParams.get("workspaceId");
  const projectId = searchParams.get("projectId");
  const filePath = searchParams.get("path");

  if (!workspaceId || !projectId || !filePath) {
    return new Response("Missing parameters", { status: 400 });
  }

  const root = resolveProjectRoot(workspaceId, projectId);
  const fullPath = path.join(root, filePath);

  if (!fs.existsSync(fullPath)) {
    return new Response("", { status: 404 });
  }

  const content = fs.readFileSync(fullPath, "utf8");

  return new Response(content);
}
