import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || "demo-project";

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  function walk(dir: string, base = ""): string[] {
    let results: string[] = [];

    if (!fs.existsSync(dir)) return [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === ".git") continue;

      const full = path.join(dir, entry.name);
      const rel = path.join(base, entry.name);

      if (entry.isDirectory()) {
        results = results.concat(walk(full, rel));
      } else {
        results.push(rel.replace(/\\/g, "/"));
      }
    }

    return results;
  }

  const files = walk(root);

  return Response.json({
    ok: true,
    files,
  });
}
