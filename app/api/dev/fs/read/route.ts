import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const projectId = searchParams.get("projectId") || "demo-project";
  const file = (searchParams.get("file") || "app/page.tsx").replace(/^\/+/, "");

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const full = path.join(root, file);

  let content = "";
  let exists = false;

  try {
    exists = fs.existsSync(full);
    if (exists) {
      content = fs.readFileSync(full, "utf8");
    }
  } catch {}

  // 🔥 CRITICAL: return RAW content (no wrapping)
  return new Response(content, {
    headers: { "Content-Type": "text/plain" },
  });
}
