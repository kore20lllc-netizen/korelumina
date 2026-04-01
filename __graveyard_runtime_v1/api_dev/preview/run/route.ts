export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest){

  const { searchParams } = new URL(req.url)

  const projectId = searchParams.get("projectId")

  if(!projectId){
    return new NextResponse("missing projectId",{ status:400 })
  }

  const runtimePage = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app",
    "page.tsx"
  )

  let code = ""

  try{
    code = await fs.readFile(runtimePage,"utf8")
  }catch{
    return new NextResponse("no runtime page",{ status:404 })
  }

  return new NextResponse(`
    <html>
      <body style="font-family:sans-serif;padding:30px">
        <div style="font-weight:bold;margin-bottom:10px">
          Runtime Source Preview
        </div>
        <pre style="
          background:#111;
          color:#0f0;
          padding:20px;
          overflow:auto;
          border-radius:8px;
        ">${code.replace(/</g,"&lt;")}</pre>
      </body>
    </html>
  `,{
    headers:{ "content-type":"text/html" }
  })
}
