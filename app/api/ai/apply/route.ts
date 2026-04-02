import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { projectId, drafts } = await req.json();

  const baseDir = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects",
    projectId
  );

  for (const d of drafts) {
    const filePath = path.join(baseDir, d.file);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, d.code);
  }

  return Response.json({ ok: true });
}
