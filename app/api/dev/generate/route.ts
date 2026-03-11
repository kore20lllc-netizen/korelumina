import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const { projectId, schema } = await req.json();

  if (!projectId || !schema) {
    return NextResponse.json({ error: "Missing projectId or schema" }, { status: 400 });
  }

  // Very simple first-pass generator (deterministic, no AI yet)
  const content = `export default function Generated() {
  return (
    <main>
      <h1>Generated from Designer</h1>
      <pre>{JSON.stringify(${JSON.stringify(schema)}, null, 2)}</pre>
    </main>
  );
}`;

  const outDir = path.join(process.cwd(), "projects", projectId, "app", "generated");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "Designer.generated.tsx");
  fs.writeFileSync(outFile, content, "utf8");

  return NextResponse.json({ ok: true, file: "app/generated/Designer.generated.tsx" });
}
