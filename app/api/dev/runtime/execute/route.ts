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

  const ROOT = path.join(
    process.cwd(),
    ".kore_runtime",
    "workspaces",
    "default",
    "projects",
    projectId,
    "app"
  )

  let files:string[] = []

  async function walk(dir:string){
    const list = await fs.readdir(dir,{ withFileTypes:true })
    for(const f of list){
      const p = path.join(dir,f.name)
      if(f.isDirectory()) await walk(p)
      else if(f.name.endsWith(".tsx")) files.push(p)
    }
  }

  try{
    await walk(ROOT)
  }catch{
    return new NextResponse("no runtime",{ status:404 })
  }

  const result = files
    .map(f=>f.replace(ROOT,""))
    .join("<br/>")

  return new NextResponse(`
    <html>
      <body style="font-family:sans-serif;padding:30px">
        <h2>Runtime Renderer V3</h2>
        ${result}
      </body>
    </html>
  `,{
    headers:{ "content-type":"text/html" }
  })

}
