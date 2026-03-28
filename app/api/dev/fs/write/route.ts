import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function unwrap(input: any): string {
  let s = typeof input === "string" ? input : "";

  for (let i = 0; i < 10; i++) {
    try {
      const p = JSON.parse(s);
      if (p?.content) {
        s = p.content;
        continue;
      }
    } catch {}
    break;
  }

  return s
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const projectId = body.projectId || "demo-project";
  const relFile = (body.file || "app/page.tsx").replace(/^\/+/, "");
  const raw = body.content || "";

  const clean = unwrap(raw);

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
  fs.writeFileSync(full, clean, "utf8");

  // 🔥 WRITE JOURNAL ENTRY (PERSISTENT)
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

  return Response.json({
    ok: true,
    written: relFile,
  });
}
