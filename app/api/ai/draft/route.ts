<<<<<<< HEAD
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { projectId, workspaceId, spec } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // simple demo AI: modify app/page.tsx
    const projectRoot = path.join(
      process.cwd(),
      "runtime",
      "workspaces",
      workspaceId || "default",
      "projects",
      projectId
    );

    const filePath = path.join(projectRoot, "app/page.tsx");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const current = fs.readFileSync(filePath, "utf8");

    // simple transformation (replace text inside JSX)
    const updated = current.replace(
      /AI:.*<\/div>/,
      `AI: ${spec}</div>`
    );

    return NextResponse.json({
      files: [
        {
          path: "app/page.tsx",
          content: updated,
        },
      ],
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
=======
import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function POST(req:NextRequest){

  const body = await req.json()

  const projectId = body.projectId
  const prompt = body.prompt || ""

  const draftId = "draft-" + Date.now()

  const draftRoot = path.join(
    process.cwd(),
    ".kore_runtime",
    "drafts",
    projectId,
    draftId
  )

  await fs.mkdir(path.join(draftRoot, "app", "components"), { recursive:true })

  const pageContent = `import GeneratedNote from "./components/GeneratedNote"

export default function Draft(){
  return (
    <div style={{padding:24,fontFamily:"sans-serif"}}>
      <h1>AI Draft</h1>
      <GeneratedNote />
    </div>
  )
}
`

  const componentContent = `export default function GeneratedNote(){
  return (
    <div style={{marginTop:12,padding:12,border:"1px solid #ddd"}}>
      AI Draft: ${prompt}
    </div>
  )
}
`

  await fs.writeFile(
    path.join(draftRoot, "app", "page.tsx"),
    pageContent,
    "utf8"
  )

  await fs.writeFile(
    path.join(draftRoot, "app", "components", "GeneratedNote.tsx"),
    componentContent,
    "utf8"
  )

  return NextResponse.json({
    ok:true,
    draftId
  })
>>>>>>> origin/main
}
