import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = path.join(
    process.cwd(),
    "runtime/workspaces/default/projects/demo-project/app/page.tsx"
  );

  let content = "";
  let exists = false;

  try {
    exists = fs.existsSync(file);
    if (exists) content = fs.readFileSync(file, "utf8").slice(0, 200);
  } catch {}

  return Response.json({ exists, file, content });
}
