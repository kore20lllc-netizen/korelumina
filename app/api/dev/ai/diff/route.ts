import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, file, prompt } = body;

  const root = path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    "default",
    "projects",
    projectId
  );

  const full = path.join(root, file);

  let current = "";
  try {
    current = fs.readFileSync(full, "utf8");
  } catch {}

  // 🔥 MOCK DIFF (replace with AI later)
  const updated = `
export default function Page() {
  return <div style={{padding:40,fontSize:40}}>
    DIFF APPLIED: ${prompt}
  </div>
}
`;

  return Response.json({
    ok: true,
    current,
    updated,
  });
}
