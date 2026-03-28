import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "demo-project";

  const file = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "journal.json"
  );

  let entries: any[] = [];

  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      entries = JSON.parse(raw);
    }
  } catch {}

  return Response.json({ entries });
}
