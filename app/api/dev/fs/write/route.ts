import fs from "fs";
import path from "path";

function unwrap(s: string) {
  try {
    const p = JSON.parse(s);
    if (p?.content) return p.content;
  } catch {}
  return s;
}

// 🔥 CRITICAL: remove duplicate exports
function sanitize(code: string) {
  const lines = code.split("\n");

  let seenDefault = false;

  return lines.filter(line => {
    if (line.includes("export default")) {
      if (seenDefault) return false;
      seenDefault = true;
      return true;
    }
    return true;
  }).join("\n");
}

export async function POST(req: Request) {
  const body = await req.json();

  const projectId = body.projectId || "demo-project";
  const relFile = (body.file || "app/page.tsx").replace(/^\/+/, "");
  const raw = body.content || "";

  const clean = sanitize(unwrap(raw));

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const full = path.join(root, relFile);

  fs.mkdirSync(path.dirname(full), { recursive: true });

  // overwrite only
  fs.writeFileSync(full, clean, "utf8");

  // journal
  const journalPath = path.join(root, "journal.json");

  let entries: any[] = [];
  try {
    if (fs.existsSync(journalPath)) {
      entries = JSON.parse(fs.readFileSync(journalPath, "utf8"));
    }
  } catch {}

  entries.unshift({
    t: Date.now(),
    op: "write",
    path: relFile,
  });

  fs.writeFileSync(journalPath, JSON.stringify(entries.slice(0, 50), null, 2));

  return Response.json({ ok: true });
}
